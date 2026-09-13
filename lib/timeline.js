/**
 * timeline.js — turns video.config.js into a concrete, resolved timeline.
 *
 * The config gives each scene a `duration`. This module walks the scenes in
 * order, works out each one's absolute start/end on the video clock, and
 * derives everything else from those numbers:
 *
 *   - the total video length       (sum of durations — NOT fixed)
 *   - each scene's animation clock (shortening a scene compresses its
 *                                   animation instead of cutting it off)
 *   - headline appear/exit times   (expressed as fractions of that scene)
 *   - transition anchors           (their `at` is relative to a scene start)
 *
 * Nothing here depends on audio, so it can run before the audio planner, and
 * run again afterwards if the planner had to lengthen a scene.
 */

'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const KNOWN_KINDS = ['transferCard', 'simCard', 'counterBars', 'flowToWallet', 'logoReveal', 'operatorGrid',
  'splitCompare', 'twoSidedMatch', 'appStep'];

/* ------------------------------------------------------------------- load -- */

function loadConfig(configPath) {
  const file = configPath || path.join(ROOT, 'video.config.js');
  delete require.cache[require.resolve(file)];   // allow re-running in-process
  const cfg = require(file);
  validate(cfg);
  return cfg;
}

function validate(cfg) {
  const fail = (m) => { throw new Error('video.config.js: ' + m); };
  if (!cfg.video) fail('missing the `video` block');
  if (!cfg.scenes || !cfg.scenes.length) fail('`scenes` must contain at least one scene');
  if (!(cfg.video.fps > 0)) fail('video.fps must be greater than 0');
  if (!cfg.type) fail('missing the `type` block');
  if (!cfg.theme) fail('missing the `theme` block');

  const seen = new Set();
  cfg.scenes.forEach((s, i) => {
    const where = s.id ? 'scene "' + s.id + '"' : 'scene ' + i;
    if (!s.id) fail(where + ' has no id');
    if (seen.has(s.id)) fail('duplicate scene id "' + s.id + '" - ids must be unique');
    seen.add(s.id);
    if (!s.kind) fail(where + ' has no kind');
    if (KNOWN_KINDS.indexOf(s.kind) === -1) {
      fail(where + ': unknown kind "' + s.kind + '" (known: ' + KNOWN_KINDS.join(', ') + ')');
    }
    if (!(s.duration > 0)) fail(where + ' needs duration greater than 0');

    (s.headlines || []).forEach((h, j) => {
      if (typeof h.text !== 'string') {
        fail(where + ' headline ' + j + ': text must be a string');
      }
      if (h.exit != null && !(h.exit > (h.appear == null ? 0.06 : h.appear))) {
        fail(where + ' headline ' + j + ': exit must come after appear');
      }
    });
  });

  (cfg.transitions || []).forEach((t, i) => {
    if (!seen.has(t.anchor)) {
      fail('transition ' + i + ' anchors on "' + t.anchor + '", which is not a scene id');
    }
    if (['flash', 'sweepFrame'].indexOf(t.type) === -1) {
      fail('transition ' + i + ': unknown type "' + t.type + '" (known: flash, sweepFrame)');
    }
  });

  if (cfg.audio && cfg.audio.music) {
    const m = cfg.audio.music;
    if (m.fadeIn + m.fadeOut < 0) fail('audio.music fades cannot be negative');
  }
}

/* -------------------------------------------------------------- resolution -- */

const round = (x, n = 4) => Math.round(x * 10 ** n) / 10 ** n;

/**
 * @param {object} cfg         loaded config
 * @param {object} extensions  optional { sceneId: extraSeconds } added by the audio planner
 */
function resolveTimeline(cfg, extensions) {
  const ext = extensions || {};
  let clock = 0;

  const scenes = cfg.scenes.map((raw, index) => {
    const duration = round(raw.duration + (ext[raw.id] || 0), 3);
    const designDuration = raw.designDuration || raw.duration;

    /* Animation clock.
       A scene shortened below its design length gets its animation compressed
       to fit, so nothing is ever left half-drawn or clipped at the cut.
       A scene longer than its design simply holds its final frame. */
    const animSpan = round(Math.min(designDuration, duration), 3);

    const start = round(clock, 3);
    const end = round(clock + duration, 3);
    clock = end;

    /* The final scene must HOLD. A fade-out on the last scene would dim the
       end card over the closing frames — the logo would never appear at full
       strength on the last frame of the video. */
    const isLast = index === cfg.scenes.length - 1;

    const headlines = (raw.headlines || []).map((h, i) => ({
      idx: i,
      text: h.text,
      size: h.size || cfg.type.headline,
      top: h.top == null ? 104 : h.top,
      appear: round((h.appear == null ? 0.06 : h.appear) * animSpan, 3),
      exit: h.exit == null ? null : round(h.exit * animSpan, 3),
      glow: !!h.glow,
      logo: h.logo || null,
    }));

    return {
      id: raw.id,
      kind: raw.kind,
      index,
      start,
      end,
      duration,
      designDuration,
      animSpan,
      fadeIn: round(Math.min(0.26, duration * 0.34), 3),
      fadeOut: isLast ? 0 : round(Math.min(0.26, duration * 0.34), 3),
      headlines,
      props: raw.props || {},
      vo: raw.vo || null,
    };
  });

  const transitions = (cfg.transitions || []).map((tr) => {
    const anchor = scenes.filter((s) => s.id === tr.anchor)[0];
    const at = round(anchor.start + tr.at, 3);
    return {
      type: tr.type,
      at,
      dur: tr.dur == null ? 0.3 : tr.dur,
      strength: tr.strength == null ? 0.34 : tr.strength,
    };
  });

  /* The end card is composed for its designDuration; if that scene runs longer
     or shorter the whole card is scaled so the frame still feels filled. */
  const logoScene = scenes.filter((s) => s.kind === 'logoReveal')[0];
  const logoScale = logoScene
    ? round(Math.max(0.8, Math.min(1.3, logoScene.duration / (logoScene.designDuration || 1))), 3)
    : 1;

  return {
    scenes,
    transitions,
    total: round(clock, 3),
    frames: Math.round(clock * cfg.video.fps),
    fps: cfg.video.fps,
    logoScale,
  };
}

/* ------------------------------------------------------------------ helpers -- */

/** "1.234s" readout, used by the planner output and the reports. */
function fmt(t) {
  return Number(t).toFixed(3) + 's';
}

/** Build the CSS custom-property block from cfg.theme. */
function themeVars(theme) {
  return Object.keys(theme)
    .map((k) => '  --' + k + ':' + theme[k] + ';')
    .join('\n');
}

/** Every asset the generated page will request — used by the font self-test. */
function assetList(cfg) {
  const out = [
    'fonts/HindSiliguri-Regular.ttf',
    'fonts/HindSiliguri-SemiBold.ttf',
    'fonts/HindSiliguri-Bold.ttf',
    'fonts/Poppins-SemiBold.ttf',
    'fonts/Poppins-Bold.ttf',
    'assets/logo_trimmed.png',
  ];
  cfg.scenes.forEach((s) => {
    if (s.kind === 'logoReveal' && s.props && s.props.logo) out.push(s.props.logo);
    if (s.kind === 'transferCard' && s.props && s.props.headLogo) out.push(s.props.headLogo);
    if (s.kind === 'operatorGrid' && s.props && s.props.operators) {
      s.props.operators.forEach((o) => { if (o.file) out.push(o.file); });
    }
    if (s.kind === 'appStep' && s.props && s.props.rows) {
      s.props.rows.forEach((r) => { if (r.logo) out.push(r.logo); });
    }
    (s.headlines || []).forEach((h) => { if (h.logo) out.push(h.logo); });
  });
  return out;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

module.exports = {
  loadConfig,
  resolveTimeline,
  fmt,
  themeVars,
  assetList,
  exists,
  round,
  ROOT,
  KNOWN_KINDS,
};
