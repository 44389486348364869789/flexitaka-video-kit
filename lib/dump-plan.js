#!/usr/bin/env node
/**
 * dump-plan.js — prints the resolved timeline exactly as the renderer will see
 * it, plus the audio plan. Run this after editing video.config.js: it is the
 * fastest way to confirm the video is the length you wanted and that no
 * voice-over line runs past the end of its scene.
 *
 *   node lib/dump-plan.js
 */
'use strict';
const { cfg } = require('./config');
const { resolveTimeline, fmt } = require('./timeline');
const planner = require('./plan-audio');

const config = cfg();
let tl = resolveTimeline(config);
let plan = config.audio && config.audio.enabled ? planner.plan(config, tl) : null;
if (plan && Object.keys(plan.extensions).length) {
  tl = resolveTimeline(config, plan.extensions);
  plan = planner.plan(config, tl);
}

const line = (n) => '-'.repeat(n);
console.log('\n' + line(74));
console.log('  TIMELINE  —  ' + config.video.width + 'x' + config.video.height +
            ' @ ' + config.video.fps + 'fps');
console.log(line(74));
console.log('  total      ' + fmt(tl.total) + '   (' + tl.frames + ' frames)');
console.log(line(74));
console.log('  #  id      kind            start     end       dur    anim');

tl.scenes.forEach((s) => {
  console.log(
    '  ' + String(s.index + 1).padEnd(3) +
    s.id.padEnd(8) +
    s.kind.padEnd(16) +
    fmt(s.start).padStart(8) + '  ' +
    fmt(s.end).padStart(8) + '  ' +
    fmt(s.duration).padStart(6) + '  ' +
    fmt(s.animSpan).padStart(6)
  );
  s.headlines.forEach((h) => {
    const exit = h.exit == null ? 'hold' : fmt(h.exit);
    console.log('        headline  "' + h.text.replace(/\{[^}]*\}/g, (m) => m.slice(1, -1)) +
                '"  ' + h.size + 'px  appear ' + fmt(h.appear) + ' -> ' + exit);
  });
});
console.log(line(74));

tl.transitions.forEach((t) => {
  console.log('  transition  ' + t.type.padEnd(11) + ' at ' + fmt(t.at) +
              '  for ' + t.dur + 's');
});

if (plan) {
  console.log(line(74));
  console.log('  AUDIO PLAN');
  console.log(line(74));
  console.log('  voice-over placement');
  plan.vo.forEach((v) => {
    const flag = v.spills ? '  <-- EXTENDS SCENE' : '';
    console.log('    ' + v.sceneId.padEnd(5) + 'scene ' + fmt(v.sceneStart).padStart(8) +
                '   line ' + fmt(v.start).padStart(8) + ' -> ' + fmt(v.end).padStart(8) +
                '  speed x' + v.speed.toFixed(3) + flag);
  });
  const over = plan.vo.filter((v) => v.spills);
  console.log('  ' + (over.length
    ? over.length + ' line(s) needed extra room — those scenes were lengthened.'
    : 'every voice-over line fits inside its own scene.'));
  if (Object.keys(plan.extensions).length) {
    console.log('  scene extensions: ' + JSON.stringify(plan.extensions));
  }
  console.log('  music bed ' + plan.music.file + '  gain ' + plan.music.gainDb + ' dB' +
              '  fades ' + plan.music.fadeIn + 's / ' + plan.music.fadeOut + 's');
} else {
  console.log(line(74));
  console.log('  AUDIO: disabled — the render will produce a silent video.');
}

console.log(line(74) + '\n');
