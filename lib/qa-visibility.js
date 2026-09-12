#!/usr/bin/env node
/* ============================================================================
 *  qa-visibility.js — prove that nothing leaks into a neighbouring scene
 * ============================================================================
 *
 *  Screenshots tell you what a frame LOOKS like; this tells you WHY. It walks
 *  the whole timeline at a fine step and, at every step, reads the EFFECTIVE
 *  opacity of each scene element — the scene root's opacity multiplied by the
 *  element's own — and where the scene is `display:none`, treats the element as
 *  invisible.
 *
 *  That is the machine-checkable form of "no text or logo leaks into the
 *  previous scene": if a reveal, a light sweep or a headline is supposed to be
 *  confined to one scene, its effective opacity must be 0 everywhere outside
 *  that scene's window.
 *
 *  It asserts, per element, the window in which it is actually visible and
 *  prints any frame where an element is visible outside its own scene.
 *
 *      node lib/qa-visibility.js                 # default 0.05s step
 *      node lib/qa-visibility.js --step 0.02
 *      node lib/qa-visibility.js --json out.json
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { cfg } = require('./config');
const { resolveTimeline } = require('./timeline');
const template = require('./template');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i === -1 ? dflt : process.argv[i + 1];
}
const STEP = parseFloat(arg('step', '0.05'));
const JSON_OUT = arg('json', null);
/* below this effective opacity an element is not perceptible on screen */
const EPS = 0.02;

(async () => {
  const config = cfg();
  const built = template.build(config);
  const tl = built.tl;
  const total = tl.total;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--hide-scrollbars', '--force-color-profile=srgb',
           '--font-render-hinting=none', '--disable-lcd-text',
           '--disable-features=PaintHolding,CalculateNativeWinOcclusion',
           '--allow-file-access-from-files',
           '--window-size=' + config.video.width + ',' + config.video.height],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: config.video.width, height: config.video.height, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'networkidle0', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction('window.__ready === true', { timeout: 90000, polling: 100 });

  /* What to watch, and which scene each thing is allowed to appear in.
     `sel` is resolved inside that scene's root. */
  const targets = [
    { name: 'flash',           sel: '#flash',           scene: null },
    { name: 'sweepFrame',      sel: '#sweepFrame',      scene: null },
  ];
  tl.scenes.forEach((s) => {
    targets.push({ name: s.id + ':root', sel: null, scene: s.id });
    targets.push({ name: s.id + ':endcard-COMING SOON', sel: '#coming', scene: s.id });
    targets.push({ name: s.id + ':endcard-tagline',     sel: '#tagline', scene: s.id });
    targets.push({ name: s.id + ':endcard-subline',     sel: '#subline', scene: s.id });
    targets.push({ name: s.id + ':brand-logo',          sel: '#logo', scene: s.id });
    (s.headlines || []).forEach((h) => {
      targets.push({ name: s.id + ':headline-' + h.idx, sel: '#' + s.id + 'h' + h.idx, scene: s.id });
    });
    if (s.kind === 'operatorGrid') {
      (s.props.operators || []).forEach((o, i) => {
        targets.push({ name: s.id + ':mark-' + i + '-' + (o.alt || '?'), sel: '.opCard:nth-child(' + (i + 1) + ')', scene: s.id });
      });
    }
    if (s.kind === 'transferCard') {
      targets.push({ name: s.id + ':headLogo', sel: '.hdLogo', scene: s.id });
    }
  });

  /* Read every target's effective opacity at time t. */
  const probe = await page.evaluateHandle(() => {
    const eff = (root, el) => {
      if (!el) return null;
      /* a scene that is display:none paints nothing, whatever a child says */
      let node = el, op = 1, disp = null;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        if (cs.display === 'none') return 0;
        if (cs.visibility === 'hidden') return 0;
        op *= parseFloat(cs.opacity === '' ? '1' : cs.opacity);
        if (disp === null && node.id && node.id.indexOf('scene-') === 0) disp = cs.display;
        node = node.parentElement;
      }
      return op;
    };
    return eff;
  });

  const samples = [];
  for (let t = 0; t <= total + 1e-9; t = Math.round((t + STEP) * 1000) / 1000) {
    const row = await page.evaluate((tt, tg) => {
      window.seek(tt);
      const out = {};
      tg.forEach((x) => {
        let el = null;
        if (x.sel) {
          /* transitions live outside the scene roots, on the stage */
          el = (x.sel === '#flash' || x.sel === '#sweepFrame')
            ? document.querySelector(x.sel)
            : (document.getElementById('scene-' + window.__PLAN__.scenes.findIndex((s) => s.id === x.scene)) || {}).querySelector
              ? document.getElementById('scene-' + window.__PLAN__.scenes.findIndex((s) => s.id === x.scene)).querySelector(x.sel)
              : null;
        }
        if (!x.sel) {
          const i = window.__PLAN__.scenes.findIndex((s) => s.id === x.scene);
          el = document.getElementById('scene-' + i);
        }
        if (!el) { out[x.name] = 0; return; }
        let node = el, op = 1;
        while (node && node !== document.documentElement) {
          const cs = getComputedStyle(node);
          if (cs.display === 'none' || cs.visibility === 'hidden') { op = 0; break; }
          op *= parseFloat(cs.opacity === '' ? '1' : cs.opacity);
          node = node.parentElement;
        }
        out[x.name] = Math.round(op * 10000) / 10000;
      });
      return out;
    }, t, targets.map((x) => ({ name: x.name, sel: x.sel, scene: x.scene })));
    samples.push({ t: Math.round(t * 1000) / 1000, v: row });
  }

  await browser.close();

  /* ------------------------------------------------------------ assertions -- */
  const sceneOf = {};
  tl.scenes.forEach((s) => { sceneOf[s.id] = s; });

  const windows = {};
  targets.forEach((x) => {
    const vals = samples.map((s) => ({ t: s.t, v: s.v[x.name] == null ? 0 : s.v[x.name] }));
    const vis = vals.filter((p) => p.v > EPS);
    windows[x.name] = {
      scene: x.scene,
      firstVisible: vis.length ? vis[0].t : null,
      lastVisible: vis.length ? vis[vis.length - 1].t : null,
      peak: vals.reduce((m, p) => Math.max(m, p.v), 0),
    };
  });

  let failures = 0;
  console.log('\n' + '='.repeat(92));
  console.log('  VISIBILITY QA — step ' + STEP + 's, ' + samples.length + ' samples over ' + total + 's');
  console.log('  an element counts as visible above effective opacity ' + EPS);
  console.log('='.repeat(92));
  console.log('  ' + 'element'.padEnd(44) + 'visible from'.padStart(13) + 'visible to'.padStart(13) + 'peak'.padStart(9));
  console.log('  ' + '-'.repeat(88));

  targets.forEach((x) => {
    const w = windows[x.name];
    const isRoot = x.sel === null;
    const isFrame = x.scene === null;
    let verdict = '';
    if (!isRoot && !isFrame && w.firstVisible != null) {
      const s = sceneOf[x.scene];
      /* an element must not appear before its own scene starts, nor linger
         after it ends (allow one sample step for the boundary itself) */
      const tol = STEP + 1e-6;
      const early = w.firstVisible < s.start - tol;
      const late = w.lastVisible > s.end + tol;
      if (early || late) {
        verdict = '   <-- LEAK' + (early ? ' before scene start' : '') + (late ? ' past scene end' : '');
        failures++;
      }
    }
    const cell = (v) => (v == null ? '—' : v.toFixed(3) + 's').padStart(13);
    console.log('  ' + x.name.padEnd(44) + cell(w.firstVisible) + cell(w.lastVisible) + w.peak.toFixed(3).padStart(9) + verdict);
  });

  /* ---------------------------------------- the end-card confinement rule -- */
  console.log('\n' + '='.repeat(92));
  console.log('  RULE: the "coming soon" message may appear ONLY on the end card');
  console.log('='.repeat(92));
  const endCard = tl.scenes.filter((s) => s.kind === 'logoReveal')[0];
  const pill = endCard ? windows[endCard.id + ':endcard-COMING SOON'] : null;
  if (!endCard) {
    console.log('  (no logoReveal scene in this config — rule not applicable)');
  } else if (!pill || pill.firstVisible == null) {
    console.log('  (no CTA pill in this config — rule not applicable)');
  } else {
    const ok = pill.firstVisible >= endCard.start - STEP - 1e-6;
    console.log('  end card runs ' + endCard.start.toFixed(3) + 's -> ' + endCard.end.toFixed(3) + 's');
    console.log('  "COMING SOON" first visible at ' + pill.firstVisible.toFixed(3) + 's  ' + (ok ? '[ok] inside the end card' : '[FAIL] appears before the end card'));
    if (!ok) failures++;
    const others = Object.keys(windows).filter((k) => /endcard-.*(COMING|subline|tagline)/.test(k) && windows[k].scene !== endCard.id && windows[k].firstVisible != null);
    console.log('  end-card elements discovered elsewhere: ' + (others.length ? others.join(', ') : 'none'));
    if (others.length) failures++;
  }

  /* --------------------------------------------------- brand-mark placement */
  console.log('\n' + '='.repeat(92));
  console.log('  RULE: bKash appears only where money movement is discussed — never in the operator row');
  console.log('='.repeat(92));
  const gridScene = tl.scenes.filter((s) => s.kind === 'operatorGrid')[0];
  if (gridScene) {
    const names = (gridScene.props.operators || []).map((o) => o.file);
    const hasBkash = names.some((f) => /bkash/i.test(f));
    console.log('  operator row holds ' + names.length + ' marks: ' + names.map((f) => path.basename(f)).join(', '));
    console.log('  contains a bKash mark: ' + (hasBkash ? '[FAIL] yes' : '[ok] no'));
    if (hasBkash) failures++;
  }
  const bkashScenes = tl.scenes.filter((s) => {
    const inProps = s.props && s.props.headLogo && /bkash/i.test(s.props.headLogo);
    const inHead = (s.headlines || []).some((h) => h.logo && /bkash/i.test(h.logo));
    return inProps || inHead;
  }).map((s) => s.id);
  console.log('  scenes that legitimately carry the bKash mark: ' + (bkashScenes.length ? bkashScenes.join(', ') : 'none'));

  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(ROOT, JSON_OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify({ step: STEP, total, windows, samples: samples.map((s) => ({ t: s.t, v: s.v })) }, null, 2));
    console.log('\n  written: ' + JSON_OUT);
  }

  console.log('\n' + (failures ? failures + ' verification(s) FAILED' : 'all visibility verifications passed') + '\n');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
