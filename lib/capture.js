#!/usr/bin/env node
/**
 * capture.js — drives headless Chromium and screenshots every frame.
 *
 * The page exposes `window.seek(t)`, a pure function of the timestamp, so this
 * script simply walks t = 0, 1/fps, 2/fps ... and writes one PNG per frame.
 * Frame N is identical no matter how fast the machine is.
 *
 * Every value that defines the output (size, fps, frame count, output folder)
 * comes from video.config.js — nothing is hard-coded here.
 *
 *   node lib/capture.js all      full render
 *   node lib/capture.js probe    a handful of stills, for fast visual QA
 */
'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { cfg } = require('./config');
const { resolveTimeline } = require('./timeline');
const template = require('./template');
const planner = require('./plan-audio');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const MODE = process.argv[2] || 'all';

async function main() {
  const config = cfg();
  const built = template.build(config);
  const tl = built.tl;

  const W = config.video.width;
  const H = config.video.height;
  const FPS = config.video.fps;
  const TOTAL = tl.frames;
  const OUT = process.env.OUT_DIR || path.join(ROOT, 'frames');
  const PAGE_URL = process.env.PAGE_URL || 'file://' + path.join(ROOT, 'index.html');

  console.log('plan: ' + tl.total.toFixed(3) + 's  ' + TOTAL + ' frames @ ' + FPS + 'fps  ' + W + 'x' + H);
  if (built.plan && Object.keys(built.plan.extensions).length) {
    console.log('scene extensions applied: ' + JSON.stringify(built.plan.extensions));
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--hide-scrollbars', '--force-color-profile=srgb',
      '--font-render-hinting=none', '--disable-lcd-text',
      '--disable-features=PaintHolding,CalculateNativeWinOcclusion',
      '--allow-file-access-from-files',
      '--window-size=' + W + ',' + H,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    const t = m.text();
    if (/error|Error|warn|Warn/.test(t)) console.log('[page]', t);
  });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await page.goto(PAGE_URL, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction('window.__ready === true', { timeout: 90000, polling: 100 });

  /* font sanity — a silent substitution is how a Bangla render ships broken */
  const info = await page.evaluate(() => {
    const mk = (txt, fam) => {
      const s = document.createElement('span');
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;font-weight:700;font-family:' + fam;
      s.textContent = txt;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    const bn = '\u09ac\u09bf\u0995\u09be\u09b6\u09c7 \u099f\u09be\u0995\u09be \u09aa\u09be\u09a0\u09be\u09a4\u09c7 \u0997\u09bf\u09af\u09bc\u09c7';
    return {
      bangla: Math.round(mk(bn, "'HS',sans-serif") * 100) / 100,
      banglaFallback: Math.round(mk(bn, 'sans-serif') * 100) / 100,
      latin: Math.round(mk('COMING SOON', "'PP',sans-serif") * 100) / 100,
      latinFallback: Math.round(mk('COMING SOON', 'sans-serif') * 100) / 100,
    };
  });
  console.log('FONT_INFO ' + JSON.stringify(info));
  const fontBad = Math.abs(info.bangla - info.banglaFallback) <= 1
               || Math.abs(info.latin - info.latinFallback) <= 1;
  if (fontBad) {
    console.log('FONT_CHECK: FAIL — a webfont did not load, text fell back to a system font.');
    await browser.close();
    process.exit(1);
  }
  console.log('FONT_CHECK: PASS');

  if (MODE === 'probe') {
    fs.mkdirSync(OUT, { recursive: true });
    /* sample the middle of each scene, both ends of every transition, and the
       first and last frame */
    const times = new Set([0, tl.total - 1 / FPS]);
    tl.scenes.forEach((s) => {
      times.add(Math.round((s.start + s.duration * 0.25) * 1000) / 1000);
      times.add(Math.round((s.start + s.duration * 0.55) * 1000) / 1000);
      times.add(Math.round((s.end - 0.10) * 1000) / 1000);
    });
    tl.transitions.forEach((tr) => {
      times.add(Math.round((tr.at + tr.dur / 2) * 1000) / 1000);
    });
    const list = Array.from(times).filter((t) => t >= 0 && t <= tl.total - 1 / FPS).sort((a, b) => a - b);
    for (const t of list) {
      await page.evaluate((tt) => window.seek(tt), t);
      const nm = 'p_' + String(Math.round(t * 1000)).padStart(6, '0') + '.png';
      await page.screenshot({ path: path.join(OUT, nm), type: 'png', optimizeForSpeed: true });
    }
    console.log('PROBE_DONE ' + list.length + ' stills -> ' + OUT);
    await browser.close();
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < TOTAL; i++) {
    await page.evaluate((tt) => window.seek(tt), i / FPS);
    const nm = 'f_' + String(i + 1).padStart(5, '0') + '.png';
    await page.screenshot({ path: path.join(OUT, nm), type: 'png', optimizeForSpeed: true });
    if ((i + 1) % 60 === 0 || i + 1 === TOTAL) {
      const el = (Date.now() - t0) / 1000;
      const eta = ((Date.now() - t0) / (i + 1)) * (TOTAL - i - 1) / 1000;
      console.log('frames ' + (i + 1) + ' / ' + TOTAL + '  elapsed ' + el.toFixed(0) + 's  eta ' + eta.toFixed(0) + 's');
    }
  }
  console.log('CAPTURE_DONE ' + TOTAL);
  await browser.close();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
