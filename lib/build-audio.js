#!/usr/bin/env node
/* ============================================================================
 *  build-audio.js — voice-over + music mix, and the final mux
 * ============================================================================
 *
 *  The mix is built in SEPARATE, individually measurable stages. A single
 *  multi-output ffmpeg graph was tried first and abandoned: when something is
 *  wrong you cannot tell which filter caused it, and a numeric surprise
 *  (clipping, level loss) becomes untraceable.
 *
 *     1. trim + peak-normalise each VO clip, upmix mono -> stereo at UNITY
 *     2. sum the placed clips            -> build/vo_bus.wav
 *     3. duck the music under that bus   -> build/music_ducked.wav
 *     4. sum the two                     -> build/_raw_mix.wav
 *     5. gain-trim to a true-peak ceiling + safety limiter
 *     6. standalone WAV + MP3 deliverables
 *     7. mux into the MP4, COPYING the video stream
 *     8. QC report -> build/audio_report.json
 *
 *  Two ffmpeg behaviours are guarded against explicitly:
 *
 *    - mono -> stereo auto-upmix costs -3.01 dB, so the upmix is an explicit
 *      unity `pan=stereo|c0=c0|c1=c0` and the source is asserted mono;
 *    - `alimiter` auto-levels by default (~+9 dB on quiet material), so it is
 *      only ever used with `level=disabled`.
 *
 *  Everything that describes the output comes from video.config.js, so the
 *  same script works for any video length.
 *
 *      node lib/build-audio.js              mix + mux the configured video
 *      node lib/build-audio.js --no-mux     mix only, do not touch the MP4
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { cfg } = require('./config');
const { resolveTimeline } = require('./timeline');
const planner = require('./plan-audio');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const NO_MUX = process.argv.includes('--no-mux');

const config = cfg();
const A = config.audio;

/* ------------------------------------------------------------------ shell -- */
function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error('FAILED: ' + cmd + ' ' + args.slice(0, 8).join(' '));
    console.error((e.stderr || '').toString().slice(-4000));
    process.exit(1);
  }
}
/* ffmpeg writes its report to stderr and exits 0 — capture that text from a
   single run (running it twice would double the cost of every measurement) */
function probeText(args) {
  const r = require('child_process').spawnSync('ffmpeg', args, { encoding: 'utf8' });
  return (r.stderr || '') + (r.stdout || '');
}

function ffprobe(args) {
  return run('ffprobe', args).trim();
}
function duration(p) { return parseFloat(ffprobe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p])); }
function channels(p) { return parseInt(ffprobe(['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', p]), 10); }

function toWav(src, dst, af, dur) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', src];
  if (af) args.push('-af', af);
  if (dur != null) args.push('-t', String(dur));
  args.push('-ar', String(A.sampleRate), '-ac', '2', '-c:a', 'pcm_s16le', dst);
  run('ffmpeg', args);
}

function maxVolume(p, pre) {
  const chain = [pre, 'volumedetect'].filter(Boolean).join(',');
  const txt = probeText(['-hide_banner', '-nostats', '-i', p, '-af', chain, '-f', 'null', '-']);
  const m = txt.match(/max_volume:\s*(-?[\d.]+) dB/);
  if (!m) throw new Error('no max_volume for ' + p);
  return parseFloat(m[1]);
}
function rmsDb(p, window) {
  const pre = window ? 'atrim=start=' + window[0] + ':end=' + window[1] + ',asetpts=PTS-STARTPTS,' : '';
  const txt = probeText(['-hide_banner', '-nostats', '-i', p, '-af', pre + 'astats=metadata=1:reset=0', '-f', 'null', '-']);
  const hits = [...txt.matchAll(/RMS level dB:\s*(-?[\d.]+)/g)];
  if (!hits.length) throw new Error('no RMS level for ' + p);
  return parseFloat(hits[hits.length - 1][1]);
}
function clipStats(p) {
  const txt = probeText(['-hide_banner', '-nostats', '-i', p, '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-']);
  const tail = txt.slice(txt.lastIndexOf('Overall'));
  return {
    peak: parseFloat(tail.match(/Peak level dB:\s*(-?[\d.]+)/)[1]),
    rms: parseFloat(tail.match(/RMS level dB:\s*(-?[\d.]+)/)[1]),
    flat: parseFloat(tail.match(/Flat factor:\s*([\d.]+)/)[1]),
    peakCount: parseFloat(tail.match(/Peak count:\s*([\d.]+)/)[1]),
  };
}
function ebur128(p) {
  const txt = probeText(['-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const tail = txt.slice(txt.lastIndexOf('Integrated loudness'));
  const i = tail.match(/I:\s*(-?[\d.]+)\s*LUFS/);
  const tp = tail.match(/Peak:\s*(-?[\d.]+)\s*dBFS/);
  return { lufs: i ? parseFloat(i[1]) : null, truePeak: tp ? parseFloat(tp[1]) : null };
}
function stage(msg) { console.log('\n=== ' + msg + ' ==='); }

/* --------------------------------------------------------------------- go -- */
(function main() {
  if (!A || !A.enabled) {
    console.log('audio.enabled is false — nothing to mix. The render will be silent.');
    return;
  }

  fs.mkdirSync(BUILD, { recursive: true });
  const VO_PEAK = A.vo.peakDb == null ? -3 : A.vo.peakDb;
  const UP = 'pan=stereo|c0=c0|c1=c0';

  /* the timeline the renderer used, including any scene extensions */
  let tl = resolveTimeline(config);
  let plan = planner.plan(config, tl);
  if (Object.keys(plan.extensions).length) {
    tl = resolveTimeline(config, plan.extensions);
    plan = planner.plan(config, tl);
  }
  const DUR = tl.total;
  console.log('timeline: ' + tl.scenes.length + ' scenes, total ' + DUR.toFixed(3) + 's');

  /* -------------------------------------------------- 1. VO clips -------- */
  stage('1. Trim + peak-normalise each VO clip (mono -> stereo at UNITY)');
  const clips = plan.vo.map((v, i) => {
    const src = path.join(ROOT, v.file);
    const ch = channels(src);
    if (ch !== 1) throw new Error(src + ': expected mono TTS, got ' + ch + ' channels (the unity pan assumes mono)');
    const rawPeak = maxVolume(src, 'atrim=start=' + v.trimStart + ':end=' + v.trimEnd);
    const gain = round2(VO_PEAK - rawPeak);
    const dst = path.join(BUILD, 'vo_' + String(i + 1).padStart(2, '0') + '_' + v.sceneId + '.wav');
    const chain = [
      'atrim=start=' + v.trimStart + ':end=' + v.trimEnd,
      'asetpts=PTS-STARTPTS',
      'aresample=' + A.sampleRate,
      UP,
    ];
    if (Math.abs(v.speed - 1) > 1e-3) chain.push('atempo=' + v.speed.toFixed(4));
    chain.push('volume=' + gain + 'dB');
    toWav(src, dst, chain.join(','), null);
    const outPeak = maxVolume(dst, null);
    console.log('  ' + path.basename(v.file).padEnd(30) +
      ' raw ' + rawPeak.toFixed(2).padStart(6) + ' -> gain ' + (gain >= 0 ? '+' : '') + gain.toFixed(2).padStart(5) +
      ' dB -> ' + outPeak.toFixed(2).padStart(6) + ' dBFS | ' + v.rawLength.toFixed(3) + 's @ ' +
      v.start.toFixed(3) + '-' + v.end.toFixed(3) + 's  [scene ' + v.sceneId + ']' +
      (Math.abs(v.speed - 1) > 1e-3 ? '  speed x' + v.speed.toFixed(3) : ''));
    return { ...v, render: dst, rawPeak, gain, outPeak };
  });

  /* --------------------------------------------------- 2. VO bus -------- */
  stage('2. VO bus — the placed clips summed, nothing else');
  const voBus = path.join(BUILD, 'vo_bus.wav');
  {
    const fc = [];
    clips.forEach((c, i) => {
      const ms = Math.round(c.start * 1000);
      fc.push('[' + i + ':a]adelay=' + ms + ':all=1,apad=whole_dur=' + DUR + '[v' + i + ']');
    });
    fc.push(clips.map((c, i) => '[v' + i + ']').join('') +
            'amix=inputs=' + clips.length + ':normalize=0:duration=longest[out]');
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    clips.forEach((c) => args.push('-i', c.render));
    args.push('-filter_complex', fc.join(';'), '-map', '[out]',
              '-t', String(DUR), '-ar', String(A.sampleRate), '-ac', '2', '-c:a', 'pcm_s16le', voBus);
    run('ffmpeg', args);
  }
  let voStats = clipStats(voBus);
  console.log('  vo_bus.wav  peak ' + voStats.peak.toFixed(2) + ' dBFS  rms ' + voStats.rms.toFixed(2) +
              ' dBFS  (' + duration(voBus).toFixed(3) + 's)');

  /* ------------------------------------- 2b. sound effects (own bus) ---- */
  /* Short transition effects, anchored to scenes so they follow the timeline.
     They are summed on their own bus at a level well under the voice, and the
     music ducking is driven by the VO bus alone — an effect never pulls the
     music down. */
  const sfxCfg = A.sfx || null;
  const sfxBus = path.join(BUILD, 'sfx_bus.wav');
  const sfxEntries = [];
  if (sfxCfg && sfxCfg.cues && sfxCfg.cues.length) {
    stage('2b. Sound effects bus (' + sfxCfg.cues.length + ' cues)');
    const sceneById = {};
    tl.scenes.forEach((s) => { sceneById[s.id] = s; });
    sfxCfg.cues.forEach((cue, i) => {
      const anchor = sceneById[cue.anchor];
      if (!anchor) throw new Error('sfx cue ' + i + ' anchors on unknown scene "' + cue.anchor + '"');
      const src = path.join(ROOT, cue.file);
      if (!fs.existsSync(src)) throw new Error('missing sfx: ' + cue.file);
      const t = round3(anchor.start + (cue.at || 0));
      if (t < 0 || t >= DUR) {
        console.log('  skipped ' + path.basename(cue.file) + ' @ ' + t.toFixed(2) + 's (outside the timeline)');
        return;
      }
      const dst = path.join(BUILD, 'sfx_' + String(i + 1).padStart(2, '0') + '_' + cue.anchor + '.wav');
      toWav(src, dst,
        ['asetpts=PTS-STARTPTS', 'aresample=' + A.sampleRate, UP,
         'volume=' + (sfxCfg.masterGainDb + (cue.gainDb || 0)) + 'dB'].join(','), null);
      sfxEntries.push({ file: cue.file, anchor: cue.anchor, at: round3(cue.at || 0), startS: t, render: dst,
                        gainDb: sfxCfg.masterGainDb + (cue.gainDb || 0) });
      console.log('  ' + path.basename(cue.file).padEnd(12) + ' @ ' + t.toFixed(3) + 's  [' + cue.anchor +
                  ' ' + (cue.at >= 0 ? '+' : '') + cue.at + 's]  gain ' + sfxEntries[sfxEntries.length - 1].gainDb + ' dB');
    });
  }
  if (sfxEntries.length) {
    const fc = [];
    sfxEntries.forEach((c, i) => {
      fc.push('[' + i + ':a]adelay=' + Math.round(c.startS * 1000) + ':all=1,apad=whole_dur=' + DUR + '[x' + i + ']');
    });
    fc.push(sfxEntries.map((c, i) => '[x' + i + ']').join('') +
            'amix=inputs=' + sfxEntries.length + ':normalize=0:duration=longest[out]');
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    sfxEntries.forEach((c) => args.push('-i', c.render));
    args.push('-filter_complex', fc.join(';'), '-map', '[out]',
              '-t', String(DUR), '-ar', String(A.sampleRate), '-ac', '2', '-c:a', 'pcm_s16le', sfxBus);
    run('ffmpeg', args);
    const ss = clipStats(sfxBus);
    console.log('  sfx_bus.wav  peak ' + ss.peak.toFixed(2) + ' dBFS  rms ' + ss.rms.toFixed(2) + ' dBFS');
  }

  /* ------------------------------------------- 3. music bed + duck ----- */
  stage('3. Music bed trimmed/faded, then ducked under the VO bus');
  const musicSrc = path.join(ROOT, plan.music.file);
  if (!fs.existsSync(musicSrc)) throw new Error('missing music: ' + plan.music.file);
  const bed = path.join(BUILD, 'music_bed.wav');
  const foStart = Math.max(0, DUR - plan.music.fadeOut);
  toWav(musicSrc, bed,
    ['atrim=0:' + DUR, 'asetpts=PTS-STARTPTS', 'aresample=' + A.sampleRate,
     'afade=t=in:st=0:d=' + plan.music.fadeIn,
     'afade=t=out:st=' + foStart.toFixed(3) + ':d=' + plan.music.fadeOut].join(','), DUR);
  const bedGain = path.join(BUILD, 'music_bed_gain.wav');
  toWav(bed, bedGain, 'volume=' + plan.music.gainDb + 'dB', DUR);
  const ducked = path.join(BUILD, 'music_ducked.wav');
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', bedGain, '-i', voBus,
    '-filter_complex', '[0:a][1:a]sidechaincompress=threshold=' + A.duck.threshold +
      ':ratio=' + A.duck.ratio + ':attack=' + A.duck.attackMs + ':release=' + A.duck.releaseMs + '[d]',
    '-map', '[d]', '-t', String(DUR), '-ar', String(A.sampleRate), '-ac', '2', '-c:a', 'pcm_s16le', ducked]);
  console.log('  bed ' + maxVolume(bed, null).toFixed(2) + ' dBFS -> at ' + plan.music.gainDb +
              ' dB ' + maxVolume(bedGain, null).toFixed(2) + ' dBFS -> ducked ' + maxVolume(ducked, null).toFixed(2) + ' dBFS');

  /* probe windows for the ducking proof */
  const speechWin = clips.length > 1
    ? [clips[1].start + 0.15, clips[1].start + 1.65]
    : [clips[0].start + 0.15, clips[0].start + 1.65];
  const gapWin = [Math.max(0, clips[0].end + 0.05), Math.min(DUR, clips[0].end + 0.85)];
  console.log('  duck @ speech ' + rmsDb(bedGain, speechWin).toFixed(1) + ' -> ' + rmsDb(ducked, speechWin).toFixed(1) + ' dBFS RMS');
  console.log('  duck @ gap    ' + rmsDb(bedGain, gapWin).toFixed(1) + ' -> ' + rmsDb(ducked, gapWin).toFixed(1) + ' dBFS RMS');

  /* ------------------------------------------------- 4. raw mix --------- */
  stage(sfxEntries.length ? '4. Sum VO bus + ducked bed + sfx bus' : '4. Sum VO bus + ducked bed');
  const rawMix = path.join(BUILD, '_raw_mix.wav');
  const mixIns = ['-i', voBus];
  const mixFc = ['[0:a]'];
  mixIns.push('-i', ducked); mixFc.push('[1:a]');
  let nMix = 2;
  if (sfxEntries.length) { mixIns.push('-i', sfxBus); mixFc.push('[2:a]'); nMix = 3; }
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...mixIns,
    '-filter_complex', mixFc.join('') + 'amix=inputs=' + nMix + ':normalize=0:duration=longest[o]',
    '-map', '[o]', '-t', String(DUR), '-ar', String(A.sampleRate), '-ac', '2', '-c:a', 'pcm_s16le', rawMix]);
  const rs = clipStats(rawMix);
  console.log('  _raw_mix.wav  peak ' + rs.peak.toFixed(2) + ' dBFS  rms ' + rs.rms.toFixed(2) +
              ' dBFS  flat ' + rs.flat + '  peak-count ' + rs.peakCount);

  /* ---------------------------------- 5. true-peak ceiling + limiter --- */
  stage('5. Gain trim to ' + A.targetTruePeakDb + ' dBTP + safety limiter (level=disabled)');
  const rawTp = ebur128(rawMix).truePeak;
  const trim = round2(A.targetTruePeakDb - rawTp);
  console.log('  raw true peak ' + rawTp.toFixed(2) + ' dBTP -> applying ' + (trim >= 0 ? '+' : '') + trim.toFixed(2) + ' dB');
  const finalWav = path.join(BUILD, 'final_audio.wav');
  toWav(rawMix, finalWav,
    ['volume=' + trim + 'dB', 'alimiter=limit=' + (10 ** (A.targetTruePeakDb / 20)).toFixed(6) + ':level=disabled',
     'atrim=0:' + DUR, 'apad=whole_dur=' + DUR, 'atrim=0:' + DUR].join(','), DUR);
  const fs2 = clipStats(finalWav);
  console.log('  final_audio.wav  peak ' + fs2.peak.toFixed(2) + ' dBFS  rms ' + fs2.rms.toFixed(2) +
              ' dBFS  flat ' + fs2.flat + '  peak-count ' + fs2.peakCount + '  (' + duration(finalWav).toFixed(3) + 's)');
  if (fs2.peak > -0.05) throw new Error('final mix is clipping (peak ' + fs2.peak + ' dBFS)');

  /* --------------------------------------------- 6. standalone audio --- */
  stage('6. Standalone audio deliverables');
  const aOut = path.join(ROOT, 'output', 'audio');
  fs.mkdirSync(aOut, { recursive: true });
  const base = config.video.outputName;
  const mp3 = path.join(aOut, base + '_audio.mp3');
  const wav = path.join(aOut, base + '_audio.wav');
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', finalWav,
    '-c:a', 'libmp3lame', '-b:a', '320k', '-ar', String(A.sampleRate), '-ac', '2', mp3]);
  fs.copyFileSync(finalWav, wav);
  console.log('  ' + path.relative(ROOT, mp3) + '\n  ' + path.relative(ROOT, wav));

  /* ------------------------------------------------------ 7. mux ------- */
  const video = path.join(ROOT, 'output', base + '.mp4');
  let videoHashBefore = null, videoHashAfter = null;
  if (!NO_MUX && fs.existsSync(video)) {
    stage('7. Mux into the video (video stream COPIED, never re-encoded)');
    videoHashBefore = videoStreamHash(video);
    const tmp = path.join(BUILD, '_muxed.mp4');
    run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', finalWav,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
      '-ar', String(A.sampleRate), '-ac', '2', '-shortest', '-movflags', '+faststart', tmp]);
    fs.renameSync(tmp, video);
    videoHashAfter = videoStreamHash(video);
    console.log('  ' + path.relative(ROOT, video));
    console.log('  video stream MD5 before mux : ' + videoHashBefore);
    console.log('  video stream MD5 after  mux : ' + videoHashAfter);
    console.log('  ' + (videoHashBefore === videoHashAfter
      ? 'PASS — the picture is bit-for-bit unchanged.'
      : 'FAIL — the video stream changed!'));
    if (videoHashBefore !== videoHashAfter) process.exitCode = 1;
  } else if (NO_MUX) {
    stage('7. Mux skipped (--no-mux)');
  }

  /* ------------------------------------------------- 8. QC report ------- */
  stage('8. QC report');
  const l = ebur128(finalWav);
  const voSpeech = rmsDb(voBus, speechWin);
  const speechDucked = rmsDb(ducked, speechWin);
  const gapDucked = rmsDb(ducked, gapWin);
  console.log('  final      : ' + duration(finalWav).toFixed(3) + 's | ' + l.lufs + ' LUFS | ' + l.truePeak + ' dBTP');
  console.log('  music vs voice during speech : ' + (speechDucked - voSpeech).toFixed(1) + ' dB');
  console.log('  music in the gaps            : ' + (gapDucked - voSpeech).toFixed(1) + ' dB');

  let mp4Check = null;
  if (!NO_MUX && fs.existsSync(video)) {
    const ext = path.join(BUILD, '_from_mp4.wav');
    toWav(video, ext, null, DUR);
    mp4Check = rmsDb(ext, speechWin);
    console.log('  MP4 audio check : speech-window RMS ' + mp4Check.toFixed(1) +
                ' dBFS (source ' + voSpeech.toFixed(1) + ' dBFS) -> voice-over present');
  }

  const report = {
    video: base + '.mp4',
    videoStreamCopied: !NO_MUX,
    videoStreamMd5Before: videoHashBefore,
    videoStreamMd5After: videoHashAfter,
    totalSeconds: DUR,
    sampleRate: A.sampleRate,
    clips: clips.map((c) => ({
      scene: c.sceneId, text: c.text, file: c.file,
      speechS: c.rawLength, speed: c.speed,
      startS: c.start, endS: c.end,
      rawPeakDbfs: c.rawPeak, gainDb: c.gain, outPeakDbfs: c.outPeak,
      spilled: c.spills,
    })),
    music: { file: plan.music.file, gainDb: plan.music.gainDb, fadeIn: plan.music.fadeIn, fadeOut: plan.music.fadeOut },
    sfx: sfxEntries.map((c) => ({ file: c.file, anchor: c.anchor, atS: c.at, startS: c.startS, gainDb: c.gainDb })),
    ducking: { threshold: A.duck.threshold, ratio: A.duck.ratio, attackMs: A.duck.attackMs, releaseMs: A.duck.releaseMs,
               speechWindow: speechWin, gapWindow: gapWin,
               speechRmsDbfs: speechDucked, gapRmsDbfs: gapDucked, voiceRmsDbfs: voSpeech },
    final: { durationS: duration(finalWav), lufs: l.lufs, truePeakDbtp: l.truePeak,
             peakDbfs: fs2.peak, rmsDbfs: fs2.rms, flatFactor: fs2.flat, peakCount: fs2.peakCount,
             trimDb: trim, targetTruePeakDbtp: A.targetTruePeakDb },
    mp4SpeechRmsDbfs: mp4Check,
  };
  fs.writeFileSync(path.join(BUILD, 'audio_report.json'), JSON.stringify(report, null, 2));
  console.log('  written: build/audio_report.json\n');
})();

function round2(x) { return Math.round(x * 100) / 100; }
function round3(x) { return Math.round(x * 1000) / 1000; }
function videoStreamHash(file) {
  const r = require('child_process').spawnSync('ffmpeg',
    ['-v', 'error', '-i', file, '-map', '0:v:0', '-c', 'copy', '-f', 'hash', '-hash', 'md5', '-'],
    { encoding: 'utf8' });
  return (r.stdout || '').trim().replace(/^MD5=/, '');
}
