#!/usr/bin/env node
/**
 * template.js — writes the standalone index.html that Chromium will drive.
 *
 * The generated page is completely self-contained: it holds the resolved plan
 * (as `window.__PLAN__`) and inlines lib/engine.js, which does the drawing.
 * There is no build tool, no bundler and no framework — one file in, one MP4
 * out. Regenerate it any time; it is a build artefact, not a source file.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { cfg } = require('./config');
const { resolveTimeline, assetList, ROOT } = require('./timeline');
const planner = require('./plan-audio');

function build(config) {
  let tl = resolveTimeline(config);

  /* Ask the audio planner whether any voice-over line needs more room. If it
     does, the scene is lengthened and the timeline is resolved again — so the
     picture and the audio always agree on the total length. */
  let plan = null;
  if (config.audio && config.audio.enabled) {
    plan = planner.plan(config, tl);
    if (Object.keys(plan.extensions).length) {
      tl = resolveTimeline(config, plan.extensions);
      plan = planner.plan(config, tl);
    }
  }

  const total = tl.total;
  const scenes = tl.scenes.map((s) => ({
    id: s.id,
    kind: s.kind,
    start: s.start,
    end: s.end,
    duration: s.duration,
    designDuration: s.designDuration,
    animSpan: s.animSpan,
    fadeIn: s.fadeIn,
    fadeOut: s.fadeOut,
    headlines: s.headlines,
    props: s.props,
  }));

  const payload = {
    width: config.video.width,
    height: config.video.height,
    fps: config.video.fps,
    total,
    frames: tl.frames,
    theme: config.theme,
    type: config.type,
    logoScale: tl.logoScale,
    scenes,
    transitions: tl.transitions,
  };

  let engine = fs.readFileSync(path.join(ROOT, 'lib', 'engine.js'), 'utf8');
  /* The engine is inside a template literal in this script, so guard against
     accidentally ending the HTML <script> block. */
  engine = engine.replace(/<\/script>/gi, '<\\/script>');

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${config.video.outputName}</title>
</head>
<body>
<div id="stage">
  <div id="bg"><div class="orb g" id="orbG"></div><div class="orb y" id="orbY"></div><div class="orb m" id="orbM"></div><div class="vig"></div></div>
  <div id="flash"></div>
  <div id="sweepFrame"><div id="sweepFrameBand"></div></div>
</div>
<script>window.__PLAN__ = ${JSON.stringify(payload)};</script>
<script>${engine}</script>
</body>
</html>
`;

  const out = path.join(ROOT, 'index.html');
  fs.writeFileSync(out, html);
  return { out, tl, plan, total };
}

if (require.main === module) {
  const config = cfg();
  const r = build(config);
  console.log('wrote index.html  total ' + r.total.toFixed(3) + 's  (' + r.tl.frames + ' frames)');
  const missing = assetList(config).filter((a) => !fs.existsSync(path.join(ROOT, a)));
  if (missing.length) {
    console.error('MISSING ASSETS: ' + missing.join(', '));
    process.exit(1);
  }
  console.log('all ' + assetList(config).length + ' referenced assets present');
}

module.exports = { build };
