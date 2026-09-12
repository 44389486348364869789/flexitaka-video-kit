/* ============================================================================
 *  plan-audio.js — the auto-timing brain
 * ============================================================================
 *
 *  Given the resolved picture timeline and the voice-over clips, this works out
 *  exactly where every line is placed on the audio timeline so that
 *  NOTHING IS CUT OFF AND NOTHING OVERLAPS.
 *
 *  For each scene with a `vo` block it:
 *
 *    1. asks ffprobe how long the trimmed clip really is (no guessing from
 *       character counts — the synthesised audio is the source of truth);
 *    2. works out the target window: from (scene start + cue) to
 *       (scene end − tailGap);
 *    3. tries to fit the line by, in order of preference:
 *         a. placing it exactly where the config asked;
 *         b. sliding it earlier — never more than `spillBefore` seconds before
 *            the scene starts, and never before the previous line ends;
 *         c. speeding the clip up — but never past `maxSpeed`;
 *         d. asking for the scene to be LENGTHENED (returned as `extensions`,
 *            which the caller feeds back into resolveTimeline);
 *    4. reports what it did so the render log shows any compromise.
 *
 *  Because the video length is just the sum of the scene lengths, this is what
 *  makes the kit work for ANY duration rather than only 10 seconds.
 * ========================================================================== */

'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* -------------------------------------------------------------- measuring -- */

function durationOf(file) {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', abs,
  ], { encoding: 'utf8' }).trim();
  const d = parseFloat(out);
  if (!isFinite(d) || d <= 0) throw new Error('could not read a duration for ' + file);
  return d;
}

/**
 * Trimmed speech length of a clip: total length minus the leading and trailing
 * silence, minus a little kept tail. This is what actually has to fit in a
 * scene — not the raw file length.
 */
function speechLength(file, voCfg) {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  /* NB: use spawnSync, not execFileSync — silencedetect writes its report to
     stderr and exits 0, and execFileSync only returns stdout. Reading stdout
     here silently yields "" and every clip looks untrimmed. */
  const r = require('child_process').spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', abs,
    '-af', 'silencedetect=noise=' + voCfg.noiseDb + 'dB:d=0.04',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const err = ((r.stderr || '') + (r.stdout || ''));
  const total = durationOf(abs);
  const starts = [...err.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map((m) => parseFloat(m[1]));
  const ends = [...err.matchAll(/silence_end:\s*(-?[\d.]+)/g)].map((m) => parseFloat(m[1]));

  /* leading silence: a silence_start at ~0 */
  let t0 = 0;
  for (const s of starts) { if (s <= 0.001) { t0 = ends.length ? ends[0] : Math.min(total, 0.05); } }
  if (!starts.length) t0 = 0;
  /* trailing silence: a silence_start with no matching end */
  let t1 = total;
  if (starts.length && starts[starts.length - 1] > (ends.length ? ends[ends.length - 1] : 0)) {
    t1 = starts[starts.length - 1] + (voCfg.tailPad || 0);
  }
  t0 = Math.max(0, t0 - 0.05);            // keep a touch of the attack
  t1 = Math.min(total, t1);
  if (t1 - t0 < 0.2) { t0 = 0; t1 = total; }   // detection failed — use the whole clip
  return { start: round3(t0), end: round3(t1), len: round3(t1 - t0), total: round3(total) };
}

const round3 = (x) => Math.round(x * 1000) / 1000;

/* ---------------------------------------------------------------- planning -- */

function plan(config, timeline) {
  const a = config.audio || {};
  if (!a.enabled) return { vo: [], music: null, extensions: {}, total: timeline.total };

  const voCfg = a.vo || {};
  const leadIn = voCfg.leadIn == null ? 0.18 : voCfg.leadIn;
  const tailGap = voCfg.tailGap == null ? 0.05 : voCfg.tailGap;
  const maxSpeed = voCfg.maxSpeed == null ? 1.18 : voCfg.maxSpeed;

  const out = [];
  const extensions = {};
  let prevEnd = -Infinity;

  timeline.scenes.forEach((scene) => {
    const vo = scene.vo;
    if (!vo || !vo.file) return;

    const s = speechLength(vo.file, voCfg);

    /* Where the line would like to start, and the earliest it may. */
    const requested = scene.start + (vo.cue == null ? leadIn : vo.cue);
    const spillBefore = vo.spillBefore || 0;
    const floor = Math.max(0, scene.start - spillBefore, prevEnd + 0.02);

    /* The line must finish before the scene ends (leaving tailGap). */
    const deadline = scene.end - tailGap;

    let speed = 1;
    let start = requested;
    let len = s.len;
    let end = start + len;
    let spills = false;

    /* A tolerance of a few milliseconds keeps rounding from being mistaken for
       a genuine overflow (which would otherwise ask for a 0.000s extension and
       re-resolve the whole timeline for nothing). */
    const EPS = 0.004;

    if (end > deadline + EPS) {
      /* (b) slide earlier, as far as the floor allows */
      const latestStart = deadline - len;
      start = Math.max(floor, Math.min(requested, latestStart));
      end = start + len;
    }

    if (end > deadline + EPS) {
      /* (c) speak slightly faster — but only up to maxSpeed */
      const available = deadline - start;
      const needed = len / Math.max(available, 0.05);
      speed = Math.min(maxSpeed, Math.max(1, needed));
      len = s.len / speed;
      end = start + len;
    }

    if (end > deadline + EPS) {
      /* (d) still too long: ask for a longer scene. The caller re-resolves the
         timeline with these extensions, so picture and audio stay in step. */
      const extra = round3(end + tailGap - scene.end);
      if (extra > 0.01) {
        extensions[scene.id] = Math.max(extensions[scene.id] || 0, extra);
        spills = true;
      }
    }

    out.push({
      sceneId: scene.id,
      sceneStart: scene.start,
      sceneEnd: scene.end,
      file: vo.file,
      text: vo.text || '',
      trimStart: s.start,
      trimEnd: s.end,
      rawLength: s.len,
      speed: round3(speed),
      start: round3(start),
      end: round3(end),
      spills,
    });

    prevEnd = end;
  });

  const music = a.music ? {
    file: a.music.file,
    gainDb: a.music.gainDb,
    fadeIn: a.music.fadeIn,
    fadeOut: a.music.fadeOut,
  } : null;

  return { vo: out, music, extensions, total: timeline.total };
}

module.exports = { plan, speechLength, durationOf };
