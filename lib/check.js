#!/usr/bin/env node
/**
 * check.js — environment + font self-test. Renders nothing.
 *
 * Two failure modes this catches before you waste a full render:
 *
 *   1. a webfont silently falling back to a system font (which breaks Bangla
 *      conjuncts) — detected by comparing the rendered width of a Bangla
 *      sample string in the intended family against a generic fallback;
 *   2. the page erroring out, or never reaching window.__ready.
 *
 *   node lib/check.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { cfg } = require('./config');
const { assetList, resolveTimeline } = require('./timeline');
const template = require('./template');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';

(async () => {
  let failures = 0;
  const say = (ok, msg) => {
    console.log((ok ? '  [ok]   ' : '  [FAIL] ') + msg);
    if (!ok) failures++;
  };

  console.log('\n=== environment ===');
  say(Number(process.versions.node.split('.')[0]) >= 18, 'node ' + process.version);
  say(fs.existsSync(CHROME), 'chromium at ' + CHROME);
  try {
    require('child_process').execSync('ffmpeg -version', { stdio: 'ignore' });
    say(true, 'ffmpeg on PATH');
  } catch (e) { say(false, 'ffmpeg not found on PATH'); }

  console.log('\n=== configuration ===');
  let config, built, tl;
  try {
    config = cfg();
    say(true, 'video.config.js loaded and valid');
  } catch (e) {
    say(false, 'video.config.js: ' + e.message);
    process.exit(1);
  }

  console.log('\n=== assets ===');
  assetList(config).forEach((a) => say(fs.existsSync(path.join(ROOT, a)), a));
  if (config.audio && config.audio.enabled) {
    say(fs.existsSync(path.join(ROOT, config.audio.music.file)), config.audio.music.file);
    config.scenes.forEach((s) => {
      if (s.vo && s.vo.file) say(fs.existsSync(path.join(ROOT, s.vo.file)), s.vo.file);
    });
  }

  console.log('\n=== timeline ===');
  try {
    built = template.build(config);
    tl = built.tl;
    say(true, 'resolved ' + tl.scenes.length + ' scenes, total ' + tl.total.toFixed(3) + 's, ' + tl.frames + ' frames');
  } catch (e) {
    say(false, 'timeline: ' + e.message);
    process.exit(1);
  }

  console.log('\n=== page + fonts ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--hide-scrollbars', '--force-color-profile=srgb',
           '--font-render-hinting=none', '--disable-lcd-text',
           '--allow-file-access-from-files',
           '--window-size=' + config.video.width + ',' + config.video.height],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: config.video.width, height: config.video.height, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'networkidle0', timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction('window.__ready === true', { timeout: 60000, polling: 100 });
    say(true, 'page booted (window.__ready)');
  } catch (e) {
    say(false, 'page did not become ready: ' + e.message);
  }
  say(pageErrors.length === 0, 'no page errors' + (pageErrors.length ? ': ' + pageErrors.join(' | ') : ''));

  if (!pageErrors.length) {
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
      return { bn: mk(bn, "'HS',sans-serif"), bnFb: mk(bn, 'sans-serif'),
               la: mk('COMING SOON', "'PP',sans-serif"), laFb: mk('COMING SOON', 'sans-serif') };
    });
    say(Math.abs(info.bn - info.bnFb) > 1,
        'Bangla webfont active (Hind Siliguri ' + info.bn.toFixed(1) + 'px vs fallback ' + info.bnFb.toFixed(1) + 'px)');
    say(Math.abs(info.la - info.laFb) > 1,
        'Latin webfont active (Poppins ' + info.la.toFixed(1) + 'px vs fallback ' + info.laFb.toFixed(1) + 'px)');

    /* Measure every headline against its safe margin. The engine auto-fits
       headlines, so this asserts the auto-fit actually succeeded — overflow is
       caught here instead of after a full render. */
    await page.evaluate(() => window.seek(0));
    const overflows = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.hl').forEach((e) => {
        out.push({ id: e.id, over: Math.round(e.scrollWidth - e.clientWidth) });
      });
      return out;
    });
    overflows.forEach((o) => {
      say(o.over <= 1, 'headline ' + o.id + ' fits its margin (overflow ' + o.over + 'px)');
    });
  }

  await browser.close();
  console.log('\n' + (failures ? failures + ' check(s) FAILED' : 'all checks passed') + '\n');
  process.exit(failures ? 1 : 0);
})();
