/* ============================================================================
 *  engine.js - the animated page itself (runs inside headless Chromium)
 * ============================================================================
 *
 *  This file is the video. It receives a fully resolved plan in
 *  `window.__PLAN__` (written by lib/template.js from video.config.js) and:
 *
 *    1. injects all CSS (built from the plan's theme colours),
 *    2. builds the DOM for every scene from its `kind`,
 *    3. exposes `window.seek(t)` - a PURE function of the timestamp t.
 *
 *  seek() sets opacity/transform on every element directly from t. Nothing
 *  uses wall-clock time or requestAnimationFrame, which is what makes
 *  frame-accurate capture possible: frame N renders identically regardless of
 *  how fast the machine is.
 *
 *  Timing never lives here. The plan says when each scene starts, how long it
 *  runs and how long its animation was designed for; this file only draws.
 * ========================================================================== */
(function () {
  'use strict';

  var PLAN = window.__PLAN__;
  if (!PLAN) { throw new Error('engine.js: window.__PLAN__ is missing'); }

  /* ---------------------------------------------------------------- helpers */
  var $ = function (id) { return document.getElementById(id); };
  function clamp(x, a, b) {
    if (a === undefined) a = 0;
    if (b === undefined) b = 1;
    return Math.min(b, Math.max(a, x));
  }
  function seg(t, t0, t1) { return clamp((t - t0) / (t1 - t0)); }
  function eo(x) { return 1 - Math.pow(1 - x, 3); }
  function ei(x) { return x * x * x; }
  function eio(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eoback(x, s) { s = (s === undefined) ? 1.7 : s; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* `{SIM}` in a headline renders in the Latin font (Poppins). */
  function rich(text, latinCls) {
    return esc(text).replace(/\{([^}]*)\}/g, '<span class="' + latinCls + '">$1</span>');
  }

  var THEME = PLAN.theme || {};
  function v(name, fallback) { return THEME[name] || fallback; }

  /* -------------------------------------------------------------------- CSS */
  var CSS = `
@font-face{font-family:'HS';font-weight:700;font-display:block;src:url('fonts/HindSiliguri-Bold.ttf') format('truetype')}
@font-face{font-family:'HS';font-weight:600;font-display:block;src:url('fonts/HindSiliguri-SemiBold.ttf') format('truetype')}
@font-face{font-family:'HS';font-weight:400;font-display:block;src:url('fonts/HindSiliguri-Regular.ttf') format('truetype')}
@font-face{font-family:'PP';font-weight:600;font-display:block;src:url('fonts/Poppins-SemiBold.ttf') format('truetype')}
@font-face{font-family:'PP';font-weight:700;font-display:block;src:url('fonts/Poppins-Bold.ttf') format('truetype')}

:root{
  --green:${v('green', '#025734')};
  --greenLight:${v('greenLight', '#04724A')};
  --greenDeep:${v('greenDeep', '#013D24')};
  --greenPale:${v('greenPale', '#CFE8DA')};
  --yellow:${v('yellow', '#FDB801')};
  --yellowSoft:${v('yellowSoft', '#FFC933')};
  --cream:${v('cream', '#F4FBF7')};
  --ink:${v('ink', '#FFFFFF')};
}

*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${PLAN.width}px;height:${PLAN.height}px;overflow:hidden;background:#fff}
body{font-family:${PLAN.type.banglaFamily};font-weight:700;-webkit-font-smoothing:antialiased}
#stage{position:relative;width:${PLAN.width}px;height:${PLAN.height}px;overflow:hidden;background:#fff;isolation:isolate}
.lat{font-family:${PLAN.type.latinFamily};font-weight:700}

/* ---- background ---- */
#bg{position:absolute;inset:0;overflow:hidden;background:linear-gradient(150deg,#FFFFFF 0%,#FCFEFD 42%,${v('cream', '#F4FBF7')} 100%)}
.orb{position:absolute;border-radius:50%;filter:blur(80px)}
.orb.g{width:1600px;height:1600px;left:-460px;top:-680px;background:radial-gradient(circle,color-mix(in srgb,var(--green) 15%,transparent) 0%,color-mix(in srgb,var(--green) 5%,transparent) 45%,transparent 72%)}
.orb.y{width:1400px;height:1400px;right:-420px;bottom:-620px;background:radial-gradient(circle,color-mix(in srgb,var(--yellow) 22%,transparent) 0%,color-mix(in srgb,var(--yellow) 7%,transparent) 45%,transparent 72%)}
.orb.m{width:1000px;height:1000px;left:48%;top:52%;margin-left:-500px;margin-top:-500px;background:radial-gradient(circle,color-mix(in srgb,var(--greenLight) 10%,transparent) 0%,transparent 70%)}
.vig{position:absolute;inset:0;background:radial-gradient(125% 95% at 50% 44%,transparent 52%,color-mix(in srgb,var(--greenDeep) 8%,transparent) 100%)}

/* ---- scenes + headlines ---- */
.scene{position:absolute;inset:0;opacity:0}
.hl{position:absolute;left:${PLAN.type.margin}px;right:${PLAN.type.margin}px;top:104px;text-align:center;color:var(--green);font-weight:700;white-space:nowrap;opacity:0}
.hl .lat{font-size:.94em}
.hlGlow{position:absolute;left:50%;top:190px;width:1500px;height:440px;margin-left:-750px;opacity:0;background:radial-gradient(closest-side,color-mix(in srgb,var(--yellow) 30%,transparent),transparent 72%);filter:blur(24px)}

/* ---- scene 1 : transfer card ---- */
#card{position:absolute;left:640px;top:290px;width:640px;height:660px;border-radius:48px;background:#fff;display:flex;flex-direction:column;padding:40px;gap:24px;overflow:hidden;box-shadow:0 44px 96px color-mix(in srgb,var(--green) 14%,transparent),0 10px 26px color-mix(in srgb,var(--green) 7%,transparent),0 0 0 1px color-mix(in srgb,var(--green) 5%,transparent)}
.cardHead{height:112px;border-radius:30px;background:linear-gradient(135deg,var(--greenLight),var(--green));display:flex;align-items:center;padding:0 24px;gap:16px;flex:0 0 auto}
.hdIc{width:64px;height:64px;border-radius:50%;background:#fff;color:var(--green);display:flex;align-items:center;justify-content:center;font-size:34px;line-height:1;font-weight:700}
.hdBars{display:flex;flex-direction:column;gap:10px}
.hdBars .b1{width:238px;height:14px;border-radius:7px;background:rgba(255,255,255,.52);display:block}
.hdBars .b2{width:150px;height:11px;border-radius:6px;background:rgba(255,255,255,.30);display:block}
.rows{display:flex;flex-direction:column;gap:24px;flex:0 0 auto}
.row{height:126px;border-radius:26px;background:#F5FBF8;border:1px solid #E7F3EC;display:flex;align-items:center;padding:0 24px;gap:18px;opacity:0}
.rIc{width:44px;height:44px;border-radius:14px;background:color-mix(in srgb,var(--green) 10%,transparent);display:block;flex:0 0 auto}
.rLbl{width:158px;height:13px;border-radius:7px;background:var(--greenPale);display:block}
.rVal{margin-left:auto;width:96px;height:13px;border-radius:7px;background:color-mix(in srgb,var(--green) 22%,transparent);display:block}
#cta{margin-top:auto;height:104px;border-radius:52px;position:relative;flex:0 0 auto;background:linear-gradient(180deg,var(--yellowSoft),var(--yellow));box-shadow:0 18px 40px color-mix(in srgb,var(--yellow) 44%,transparent)}
.ctaIn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:16px;color:var(--green)}
.ctaIn .lat{font-size:27px;letter-spacing:.14em;text-indent:.14em}
.ic{width:32px;height:32px;fill:var(--green);flex:0 0 auto}
#ctaRech{opacity:0}
#ripple{position:absolute;left:50%;top:50%;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;border:5px solid color-mix(in srgb,var(--green) 38%,transparent);transform:scale(.25);opacity:0}
#cardDim{position:absolute;inset:0;border-radius:48px;background:#fff;opacity:0}
#sheet{position:absolute;inset:0;border-radius:48px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;transform:translateY(102%)}
#sheet .ck{width:152px;height:152px;display:block}
.sheetLbl .lat{font-weight:600;font-size:28px;letter-spacing:.20em;text-indent:.20em;color:color-mix(in srgb,var(--green) 55%,transparent)}
.sheetSub .lat{font-size:38px;letter-spacing:.06em;text-indent:.06em;color:var(--green)}

/* ---- scene 2 : SIM card ---- */
.simCardSvg{display:block}
#v2{position:absolute;left:960px;top:660px;width:560px;height:480px;opacity:0}
#simGroup2{position:absolute;left:162px;top:50px;width:236px;height:366px}
#badge2{position:absolute;left:168px;top:280px;width:132px;height:132px;transform:scale(0);transform-origin:center}
#badge2 svg{width:132px;height:132px;display:block}
#mark2{position:absolute;left:100px;top:6px;width:96px;height:96px;opacity:0}
#mark2 svg{width:96px;height:96px;display:block}

/* ---- scene 3 : counter bars ---- */
#sim3{position:absolute;left:510px;top:590px;width:160px;height:248px;opacity:0}
#sim3 svg{width:160px;height:248px;display:block}
#base3{position:absolute;left:760px;top:830px;width:662px;height:3px;transform-origin:left center;opacity:0;background:repeating-linear-gradient(90deg,var(--green) 0 14px,transparent 14px 28px)}
.bar{position:absolute;bottom:250px;width:64px;height:0;border-radius:16px 16px 8px 8px;background:linear-gradient(180deg,color-mix(in srgb,var(--greenPale) 90%,#fff),color-mix(in srgb,var(--greenPale) 70%,var(--greenLight)));opacity:0}
.bar.top{background:linear-gradient(180deg,var(--yellowSoft),var(--yellow));box-shadow:0 14px 34px color-mix(in srgb,var(--yellow) 38%,transparent)}
#pill3{position:absolute;width:200px;height:62px;line-height:62px;text-align:center;border-radius:31px;background:var(--green);color:#fff;font-family:${PLAN.type.latinFamily};font-weight:600;font-size:27px;opacity:0;box-shadow:0 16px 34px color-mix(in srgb,var(--green) 28%,transparent)}

/* ---- scene 4 : flow to wallet ---- */
#v4{position:absolute;inset:0;opacity:0}
#arc4{position:absolute;inset:0;width:${PLAN.width}px;height:${PLAN.height}px;opacity:0}
#sim4{position:absolute;left:500px;top:570px;width:150px;height:232px}
#sim4 svg{width:150px;height:232px;display:block}
#wallet4{position:absolute;left:1330px;top:610px;width:240px;height:180px}
#wallet4 svg{width:240px;height:180px;display:block}
.pt{position:absolute;left:0;top:0;border-radius:50%;opacity:0;background:radial-gradient(circle at 34% 32%,#FFE49A,var(--yellow) 72%);box-shadow:0 8px 20px color-mix(in srgb,var(--yellow) 55%,transparent)}

/* ---- scene 5 : logo reveal ---- */
#logoGlow{position:absolute;left:50%;top:430px;width:1300px;height:940px;margin-left:-650px;margin-top:-470px;opacity:0;background:radial-gradient(closest-side,color-mix(in srgb,var(--green) 13%,transparent),color-mix(in srgb,var(--green) 4%,transparent) 46%,transparent 74%);filter:blur(28px)}
#logoBox{position:absolute;left:0;right:0;display:flex;justify-content:center}
#logoWrap{position:relative;overflow:hidden;isolation:isolate}
#logo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 22px 46px color-mix(in srgb,var(--green) 17%,transparent));transform-origin:center center;opacity:0}
#sweepLogo{position:absolute;inset:0;overflow:hidden;opacity:0;mix-blend-mode:screen}
#sweepBand{position:absolute;top:-30%;left:0;width:30%;height:160%;background:linear-gradient(100deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.30) 34%,rgba(255,255,255,.95) 50%,rgba(255,255,255,.30) 66%,rgba(255,255,255,0) 100%)}
#tagline{position:absolute;left:360px;right:360px;text-align:center;color:var(--green);font-family:${PLAN.type.latinFamily};font-weight:600;white-space:nowrap;opacity:0}
#comingWrap{position:absolute;left:0;right:0;display:flex;justify-content:center}
#coming{display:inline-block;padding:0 46px;height:74px;line-height:74px;border-radius:37px;background:linear-gradient(180deg,var(--yellowSoft),var(--yellow));color:var(--green);font-family:${PLAN.type.latinFamily};font-weight:700;letter-spacing:.26em;text-indent:.26em;opacity:0;box-shadow:0 18px 38px color-mix(in srgb,var(--yellow) 40%,transparent)}
#subWrap{position:absolute;left:0;right:0;display:flex;justify-content:center}
#subline{display:inline-block;padding:0 42px;height:62px;line-height:62px;border-radius:31px;background:linear-gradient(180deg,var(--greenLight),var(--green));color:#fff;font-weight:700;letter-spacing:.02em;text-indent:.02em;white-space:nowrap;opacity:0;box-shadow:0 16px 34px color-mix(in srgb,var(--green) 26%,transparent)}

/* ---- headline inline logo ---- */
.hlLogo{display:inline-block;vertical-align:middle;height:1.02em;width:auto;margin-right:.26em;transform:translateY(-.055em)}
.hdLogo{height:50px;width:auto;display:block;max-width:200px;object-fit:contain}

/* ---- scene 6 : operator grid ---- */
.opGrid{position:absolute;left:100px;right:100px;top:498px;display:flex;justify-content:center;align-items:center;gap:38px}
.opCard{position:relative;width:400px;height:280px;border-radius:34px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;opacity:0;box-shadow:0 30px 64px color-mix(in srgb,var(--green) 13%,transparent),0 6px 18px color-mix(in srgb,var(--green) 6%,transparent),0 0 0 1px color-mix(in srgb,var(--green) 6%,transparent)}
.opCard img{max-width:300px;max-height:140px;object-fit:contain;display:block}
.opGlow{position:absolute;inset:0;border-radius:34px;opacity:0;background:radial-gradient(closest-side,color-mix(in srgb,var(--yellow) 15%,transparent),transparent 78%);box-shadow:inset 0 0 0 4px color-mix(in srgb,var(--yellow) 80%,transparent)}

/* ---- whole-frame transitions ---- */
#flash{position:absolute;inset:0;background:#fff;opacity:0}
#sweepFrame{position:absolute;inset:0;overflow:hidden;opacity:0;mix-blend-mode:screen}
#sweepFrameBand{position:absolute;top:-25%;left:0;width:16%;height:150%;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.55) 50%,rgba(255,255,255,0))}
`;

  /* --------------------------------------------------------------- markup -- */
  var SIM_SVG = function (id, w, h) {
    return '<svg class="simCardSvg" viewBox="0 0 236 366" width="' + w + '" height="' + h + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + v('greenLight', '#04724A') + '"/>' +
      '<stop offset="1" stop-color="' + v('green', '#025734') + '"/></linearGradient></defs>' +
      '<path d="M0 40 A40 40 0 0 1 40 0 H150 L236 86 V326 A40 40 0 0 1 196 366 H40 A40 40 0 0 1 0 326 Z" fill="url(#' + id + ')"/>' +
      '<path d="M150 0 L236 86" stroke="#ffffff" stroke-width="4" opacity=".20"/>' +
      '<rect x="62" y="126" width="112" height="90" rx="16" fill="' + v('yellow', '#FDB801') + '"/>' +
      '<rect x="80" y="144" width="76" height="8" rx="4" fill="' + v('green', '#025734') + '" opacity=".32"/>' +
      '<rect x="80" y="164" width="76" height="8" rx="4" fill="' + v('green', '#025734') + '" opacity=".32"/>' +
      '<rect x="80" y="184" width="52" height="8" rx="4" fill="' + v('green', '#025734') + '" opacity=".32"/>' +
      '</svg>';
  };

  var MARKUP = {
    transferCard: function (s) {
      var p = s.props || {};
      return '' +
        '<div id="card">' +
          '<div class="cardHead">' + (p.headLogo
              ? '<img class="hdLogo" src="' + esc(p.headLogo) + '" alt="">'
              : '<div class="hdIc">' + esc(p.currency || '\u09f3') + '</div>') +
          '<div class="hdBars"><span class="b1"></span><span class="b2"></span></div></div>' +
          '<div class="rows">' +
            '<div class="row" id="row1"><span class="rIc"></span><span class="rLbl"></span><span class="rVal"></span></div>' +
            '<div class="row" id="row2"><span class="rIc"></span><span class="rLbl"></span><span class="rVal"></span></div>' +
          '</div>' +
          '<div id="cta">' +
            '<div class="ctaIn" id="ctaSend">' +
              '<svg class="ic" viewBox="0 0 24 24"><path d="M3 11.4 21 3l-8.6 18-2.1-7.4L3 11.4Z"/></svg>' +
              '<span class="lat">' + esc(p.sendLabel || 'SEND MONEY') + '</span></div>' +
            '<div class="ctaIn" id="ctaRech">' +
              '<svg class="ic" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="3.2"/><rect x="9.2" y="6.6" width="5.6" height="5" rx="1.1" opacity=".40"/></svg>' +
              '<span class="lat">' + esc(p.rechargeLabel || 'RECHARGE') + '</span></div>' +
            '<div id="ripple"></div>' +
          '</div>' +
          '<div id="cardDim"></div>' +
          '<div id="sheet">' +
            '<svg class="ck" viewBox="0 0 140 140"><circle cx="70" cy="70" r="67" fill="' + v('green', '#025734') + '"/>' +
            '<path id="checkPath" d="M40 72 L61 93 L101 49" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<div class="sheetLbl"><span class="lat">' + esc(p.sheetLabel || 'SIM RECHARGE') + '</span></div>' +
            '<div class="sheetSub"><span class="lat">' + esc(p.sheetSub || 'SUCCESSFUL') + '</span></div>' +
          '</div>' +
        '</div>';
    },

    simCard: function (s) {
      return '' +
        '<div class="grp" id="v2">' +
          '<div id="simGroup2">' + SIM_SVG('simG2', 236, 366) +
            '<div id="badge2"><svg viewBox="0 0 140 140">' +
              '<circle cx="70" cy="70" r="64" fill="#ffffff"/>' +
              '<circle cx="70" cy="70" r="61" fill="none" stroke="' + v('green', '#025734') + '" stroke-width="6"/>' +
              '<path d="M44 72 L63 91 L98 52" fill="none" stroke="' + v('green', '#025734') + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg></div>' +
          '</div>' +
          '<div id="mark2"><svg viewBox="0 0 100 100">' +
            '<circle cx="50" cy="50" r="46" fill="' + v('yellow', '#FDB801') + '"/>' +
            '<rect x="44" y="20" width="12" height="38" rx="6" fill="#ffffff"/>' +
            '<circle cx="50" cy="72" r="7.5" fill="#ffffff"/></svg></div>' +
        '</div>';
    },

    counterBars: function (s) {
      return '' +
        '<div id="sim3">' + SIM_SVG('simG3', 160, 248) + '</div>' +
        '<div id="base3"></div>' +
        '<div id="bars3"></div>' +
        '<div id="pill3"></div>';
    },

    flowToWallet: function (s) {
      return '' +
        '<div id="v4">' +
          '<svg id="arc4" viewBox="0 0 ' + PLAN.width + ' ' + PLAN.height + '">' +
            '<path d="M650 700 Q980 470 1315 700" fill="none" stroke="' + v('green', '#025734') + '" stroke-width="3" stroke-dasharray="10 16" stroke-linecap="round"/>' +
          '</svg>' +
          '<div id="sim4">' + SIM_SVG('simG4', 150, 232) + '</div>' +
          '<div id="wallet4"><svg viewBox="0 0 240 180">' +
            '<rect x="4" y="24" width="232" height="150" rx="32" fill="' + v('green', '#025734') + '"/>' +
            '<rect x="4" y="24" width="232" height="46" rx="32" fill="' + v('greenLight', '#04724A') + '"/>' +
            '<rect x="148" y="82" width="92" height="38" rx="19" fill="' + v('yellow', '#FDB801') + '"/>' +
            '<circle cx="194" cy="101" r="9.5" fill="' + v('green', '#025734') + '"/>' +
            '<path d="M36 46 H118" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity=".20"/>' +
          '</svg></div>' +
          '<div id="parts4"></div>' +
        '</div>';
    },

    logoReveal: function (s) {
      var p = s.props || {};
      return '' +
        '<div id="logoGlow"></div>' +
        '<div id="logoBox"><div id="logoWrap">' +
          '<img id="logo" alt="" src="' + esc(p.logo || 'assets/logo_trimmed.png') + '">' +
          '<div id="sweepLogo"><div id="sweepBand"></div></div>' +
        '</div></div>' +
        '<div id="tagline"><span class="lat">' + esc(p.tagline || '') + '</span></div>' +
        '<div id="comingWrap"><div id="coming"><span class="lat">' + esc(p.cta || 'COMING SOON') + '</span></div></div>' +
        (p.sub ? '<div id="subWrap"><div id="subline">' + esc(p.sub) + '</div></div>' : '');
    },

    /* A row/grid of third-party brand marks. Each one is drawn as-is inside a
       plain white card: never recoloured, never stretched (object-fit:contain
       and a max-width, so the intrinsic ratio is always preserved). */
    operatorGrid: function (s) {
      var p = s.props || {};
      var ops = p.operators || [];
      var cards = ops.map(function (o) {
        return '<div class="opCard">' +
          '<img src="' + esc(o.file) + '" alt="' + esc(o.alt || '') + '">' +
          '<div class="opGlow"></div>' +
          '</div>';
      }).join('');
      return '<div class="opGrid">' + cards + '</div>';
    },
  };

  /* ================================ DRAW ================================== */
  /*
   * Every draw function works on `d` - the scene's DESIGN clock in seconds.
   * When a scene is shortened, lib/timeline.js shrinks animSpan and d is
   * scaled so the whole animation still plays, simply faster. The literal
   * numbers below are therefore the original hand-authored timings, untouched.
   */

  var state = { bars: null, parts: null, checkLen: 0 };

  function buildBars(s, root) {
    var host = root.querySelector('#bars3');
    var n = (s.props && s.props.bars) || 6;
    var heights = (s.props && s.props.barHeights) || [130, 175, 225, 280, 340, 400];
    var xs = [770, 878, 986, 1094, 1202, 1310];
    state.bars = [];
    for (var i = 0; i < n; i++) {
      var b = document.createElement('div');
      b.className = 'bar' + (i === n - 1 ? ' top' : '');
      b.style.left = xs[i] + 'px';
      b.style.height = '0px';
      host.parentNode.appendChild(b);
      state.bars.push({ el: b, h: heights[i] });
    }
  }

  function buildParts(s, root) {
    var host = root.querySelector('#parts4');
    var n = (s.props && s.props.particles) || 7;
    state.parts = [];
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'pt';
      var sz = (i % 2 === 0) ? 21 : 28;
      p.style.width = sz + 'px'; p.style.height = sz + 'px';
      p.style.marginLeft = (-sz / 2) + 'px'; p.style.marginTop = (-sz / 2) + 'px';
      host.appendChild(p);
      state.parts.push(p);
    }
  }

  /* ----------------------------------------------------- scene 1: card ---- */
  function drawTransferCard(root, d) {
    var q = function (sel) { return root.querySelector(sel); };
    var card = q('#card');
    var c1 = eo(seg(d, 0.10, 0.62));
    var wu = seg(d, 1.58, 2.06), rot = 0;
    if (wu > 0 && wu < 1) rot = 2.3 * Math.sin(wu * Math.PI * 3.2) * (1 - wu);
    card.style.opacity = c1;
    card.style.transform = 'translate3d(0,' + lerp(22, 0, c1) + 'px,0) scale(' + lerp(.945, 1, c1) + ') rotate(' + rot + 'deg)';

    var r1 = eo(seg(d, 0.45, 0.80));
    q('#row1').style.opacity = r1;
    q('#row1').style.transform = 'translate3d(0,' + lerp(14, 0, r1) + 'px,0)';
    var r2 = eo(seg(d, 0.60, 0.96));
    q('#row2').style.opacity = r2;
    q('#row2').style.transform = 'translate3d(0,' + lerp(14, 0, r2) + 'px,0)';

    var ctaS = 1 + 0.030 * Math.sin(seg(d, 0.95, 1.55) * Math.PI);
    if (d >= 1.46 && d <= 1.72) ctaS = 1 - 0.050 * Math.sin(seg(d, 1.46, 1.72) * Math.PI);
    q('#cta').style.transform = 'scale(' + ctaS + ')';

    var rp = seg(d, 1.42, 1.66);
    if (rp > 0 && rp < 1) {
      q('#ripple').style.opacity = 0.55 * (1 - rp);
      q('#ripple').style.transform = 'scale(' + lerp(0.25, 1.75, rp) + ')';
    } else { q('#ripple').style.opacity = 0; }

    var sw = eo(clamp(seg(d, 1.53, 1.90) * 1.6));
    q('#ctaSend').style.opacity = 1 - sw;
    q('#ctaSend').style.transform = 'translate3d(' + lerp(0, -26, sw) + 'px,0,0)';
    var sw2 = eo(seg(d, 1.62, 1.96));
    q('#ctaRech').style.opacity = sw2;
    q('#ctaRech').style.transform = 'translate3d(' + lerp(26, 0, sw2) + 'px,0,0)';

    q('#cardDim').style.opacity = 0.30 * eo(seg(d, 1.72, 2.06));

    var sh = eo(seg(d, 1.80, 2.24));
    q('#sheet').style.transform = 'translate3d(0,' + lerp(102, 0, sh) + '%,0)';
    var ck = eio(seg(d, 2.18, 2.62));
    var cp = q('#checkPath');
    cp.style.strokeDashoffset = String(state.checkLen * (1 - ck));
    var cks = eo(seg(d, 2.10, 2.46));
    q('#sheet').querySelector('.ck').style.transform = 'scale(' + lerp(.86, 1, cks) + ')';
    var sl = eo(seg(d, 2.32, 2.66));
    root.querySelector('.sheetLbl').style.opacity = sl;
    root.querySelector('.sheetLbl').style.transform = 'translate3d(0,' + lerp(14, 0, sl) + 'px,0)';
    var ss = eo(seg(d, 2.44, 2.80));
    root.querySelector('.sheetSub').style.opacity = ss;
    root.querySelector('.sheetSub').style.transform = 'translate3d(0,' + lerp(14, 0, ss) + 'px,0)';
  }

  /* ------------------------------------------------------ scene 2: sim ---- */
  function drawSimCard(root, d) {
    var q = function (sel) { return root.querySelector(sel); };
    var v2a = eo(seg(d, 0.05, 0.55));
    q('#v2').style.opacity = v2a;
    q('#v2').style.transform = 'translate(-50%,-50%) scale(' + lerp(.90, 1, v2a) + ')';

    var w2 = seg(d, 0.56, 1.10), rot = 0;
    if (w2 > 0 && w2 < 1) rot = 7 * Math.sin(w2 * Math.PI * 2.6) * (1 - w2);
    q('#simGroup2').style.transform = 'rotate(' + rot + 'deg)';

    var b2p = seg(d, 0.28, 0.74);
    q('#badge2').style.transform = 'scale(' + (b2p > 0 ? eoback(b2p) : 0) + ')';
    q('#badge2').style.opacity = String(clamp(seg(d, 0.28, 0.44)));

    var m2 = eo(seg(d, 0.50, 0.94));
    q('#mark2').style.opacity = m2;
    q('#mark2').style.transform = 'translate3d(0,' + lerp(14, 0, m2) + 'px,0) rotate(' + lerp(-14, 0, m2) + 'deg)';
  }

  /* -------------------------------------------------- scene 3: counter ---- */
  function drawCounterBars(root, d, s) {
    var q = function (sel) { return root.querySelector(sel); };
    var v3a = eo(seg(d, 0.05, 0.52));
    q('#sim3').style.opacity = v3a;
    q('#sim3').style.transform = 'translate3d(0,' + lerp(18, 0, v3a) + 'px,0)';
    q('#base3').style.opacity = String(0.55 * v3a);
    q('#base3').style.transform = 'scaleX(' + v3a + ')';

    var i, bpr;
    for (i = 0; i < state.bars.length; i++) {
      bpr = eo(seg(d, 0.10 + i * 0.12, 0.10 + i * 0.12 + 0.55));
      state.bars[i].el.style.height = (state.bars[i].h * bpr) + 'px';
      state.bars[i].el.style.opacity = String(clamp(bpr * 3));
    }

    var target = (s.props && s.props.counterTarget) || 2450;
    var prefix = (s.props && s.props.counterPrefix) || '';
    var p6 = eo(seg(d, 0.70, 1.25));
    var pillOp = eo(seg(d, 0.50, 0.82));
    var pill = q('#pill3');
    pill.style.opacity = pillOp;
    pill.style.transform = 'translate3d(0,' + lerp(20, 0, pillOp) + 'px,0)';
    var topH = state.bars.length ? state.bars[state.bars.length - 1].h : 400;
    pill.style.top = ((830 - topH * p6) - 78) + 'px';
    pill.style.left = '1242px';
    pill.textContent = prefix + Math.round(target * p6).toLocaleString('en-US');
  }

  /* --------------------------------------------------- scene 4: wallet ---- */
  function drawFlowToWallet(root, d, s) {
    var q = function (sel) { return root.querySelector(sel); };
    var p = s.props || {};
    var v4a = eo(seg(d, 0.05, 0.58));
    /* Optional end-of-scene dim, for cuts where a reveal follows. When the
       scene asks for no `dim` the visual simply holds at full strength to the
       cut, so the question never fades out from under itself. */
    var v4dim = 1;
    if (p.dim) {
      v4dim = 1 - (p.dim.amount == null ? 0.72 : p.dim.amount) * eo(seg(d, p.dim.from, p.dim.to));
    }
    q('#v4').style.opacity = v4a * v4dim;
    q('#sim4').style.transform = 'translate3d(' + lerp(-26, 0, v4a) + 'px,0,0)';
    q('#wallet4').style.transform = 'translate3d(' + lerp(26, 0, v4a) + 'px,0,0)';
    q('#arc4').style.opacity = String(0.20 * eo(seg(d, 0.15, 0.55)));

    var P0 = { x: 650, y: 700 }, P1 = { x: 980, y: 470 }, P2 = { x: 1315, y: 700 };
    var k, pp, e, x, y, env;
    for (k = 0; k < state.parts.length; k++) {
      var st = 0.28 + k * 0.095;
      pp = seg(d, st, st + 0.92);
      if (pp <= 0 || pp >= 1) { state.parts[k].style.opacity = 0; continue; }
      e = pp;
      x = (1 - e) * (1 - e) * P0.x + 2 * (1 - e) * e * P1.x + e * e * P2.x;
      y = (1 - e) * (1 - e) * P0.y + 2 * (1 - e) * e * P1.y + e * e * P2.y;
      env = Math.sin(Math.PI * pp);
      state.parts[k].style.opacity = env;
      state.parts[k].style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + lerp(.55, 1, env) + ')';
    }
  }

  /* ----------------------------------------------- scene 5: logo reveal -- */
  function drawLogoReveal(root, d, s) {
    var q = function (sel) { return root.querySelector(sel); };
    var p = s.props || {};
    var sc = PLAN.logoScale || 1;
    var box = q('#logoWrap');
    var W = 640 * sc, H = 484 * sc;
    box.style.width = W + 'px';
    box.style.height = H + 'px';
    q('#logoBox').style.top = (180 - (H - 484) / 2) + 'px';

    var sweep = q('#sweepLogo');
    sweep.style.webkitMaskImage = 'url(' + (p.logo || 'assets/logo_trimmed.png') + ')';
    sweep.style.maskImage = 'url(' + (p.logo || 'assets/logo_trimmed.png') + ')';
    sweep.style.webkitMaskSize = '100% 100%';
    sweep.style.maskSize = '100% 100%';
    sweep.style.webkitMaskRepeat = 'no-repeat';
    sweep.style.maskRepeat = 'no-repeat';
    sweep.style.webkitMaskPosition = 'center';
    sweep.style.maskPosition = 'center';

    var tag = q('#tagline');
    tag.style.fontSize = (44 * sc) + 'px';
    tag.style.top = (706 + (H - 484) / 2) + 'px';
    var cw = q('#comingWrap');
    cw.style.top = (824 + (H - 484) / 2) + 'px';
    q('#coming').style.fontSize = (32 * sc) + 'px';

    var lg = eo(seg(d, 0.02, 0.48));
    q('#logo').style.opacity = lg;
    q('#logo').style.transform = 'translate3d(0,' + lerp(18, 0, lg) + 'px,0) scale(' + lerp(.905, 1, lg) + ')';
    q('#logoGlow').style.opacity = eo(seg(d, 0.00, 0.60));

    var tg = eo(seg(d, 0.40, 0.72));
    tag.style.opacity = tg;
    tag.style.transform = 'translate3d(0,' + lerp(16, 0, tg) + 'px,0)';
    var ls = lerp(0.30, 0.20, tg);
    tag.style.letterSpacing = ls + 'em';
    tag.style.textIndent = ls + 'em';

    var cm = eo(seg(d, 0.52, 0.86));
    q('#coming').style.opacity = cm;
    q('#coming').style.transform = 'translate3d(0,' + lerp(18, 0, cm) + 'px,0) scale(' + lerp(.88, 1, cm) + ')';

    /* The optional Bangla launch line, one step below the CTA pill. */
    var sub = q('#subline');
    if (sub) {
      q('#subWrap').style.top = (918 + (H - 484) / 2) + 'px';
      sub.style.fontSize = (30 * sc) + 'px';
      var sb = eo(seg(d, 0.78, 1.12));
      sub.style.opacity = sb;
      sub.style.transform = 'translate3d(0,' + lerp(18, 0, sb) + 'px,0) scale(' + lerp(.90, 1, sb) + ')';
    }

    /* The sweep is brightness-only, masked by the logo's own shape - the
       artwork itself is never altered. */
    var swT = seg(d, 0.38, 0.80);
    /* an optional second sweep, for end cards that are held for longer */
    var sw2 = (p.sweep2At == null) ? null : seg(d, p.sweep2At, p.sweep2At + (p.sweep2Dur || 0.55));
    var use = (swT > 0 && swT < 1) ? swT : ((sw2 != null && sw2 > 0 && sw2 < 1) ? sw2 : -1);
    if (use >= 0) {
      sweep.style.opacity = String(clamp(Math.sin(Math.PI * use) * 1.15));
      q('#sweepBand').style.transform = 'translate3d(' + lerp(-260, W * 1.45, use) + 'px,0,0)';
    } else {
      sweep.style.opacity = 0;
      q('#sweepBand').style.transform = 'translate3d(-260px,0,0)';
    }

    /* a soft idle float, so a long hold on the end card still feels alive
       (pure translation of the wrapper - the logo file is never touched) */
    var from = (p.floatFrom == null) ? 0.92 : p.floatFrom;
    var amp = (p.floatAmp == null) ? 4 : p.floatAmp;
    var yf = amp * Math.sin(Math.max(0, d - from) * 1.15);
    q('#logoBox').style.transform = 'translate3d(0,' + yf.toFixed(2) + 'px,0)';
    q('#logoGlow').style.transform = 'translate3d(0,' + (yf * 0.6).toFixed(2) + 'px,0)';
  }

  /* --------------------------------------------------- scene 6: op grid -- */
  function drawOperatorGrid(root, d, s) {
    var p = s.props || {};
    var cards = root.querySelectorAll('.opCard');
    var appear = p.appear == null ? 0.16 : p.appear;
    var stagger = p.stagger == null ? 0.16 : p.stagger;
    var hi = p.highlight == null ? cards.length - 1 : p.highlight;

    /* Card geometry is config-driven, so a row of three and a row of six both
       look deliberate rather than accidentally sparse. The row itself is
       centred, so removing a mark needs no other change. Every unset value
       falls back to the stylesheet, so an existing config renders unchanged. */
    var grid = root.querySelector('.opGrid');
    if (grid && p.gap != null) grid.style.gap = p.gap + 'px';
    for (var k = 0; k < cards.length; k++) {
      if (p.cardW != null) cards[k].style.width = p.cardW + 'px';
      if (p.cardH != null) cards[k].style.height = p.cardH + 'px';
      var mk = cards[k].querySelector('img');
      if (mk) {
        if (p.markW != null) mk.style.maxWidth = p.markW + 'px';
        if (p.markH != null) mk.style.maxHeight = p.markH + 'px';
        /* a per-mark override, for a logo whose source file is small enough
           that it would otherwise read as visibly lighter than its neighbours */
        var own = (p.operators && p.operators[k]) || {};
        if (own.markW != null) mk.style.maxWidth = own.markW + 'px';
        if (own.markH != null) mk.style.maxHeight = own.markH + 'px';
      }
    }

    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var a = eo(seg(d, appear + i * stagger, appear + i * stagger + 0.55));
      c.style.opacity = String(a);
      c.style.transform = 'translate3d(0,' + lerp(28, 0, a) + 'px,0) scale(' + lerp(.90, 1, a) + ')';
      var g = c.querySelector('.opGlow');
      if (g) {
        var h = (hi === i) ? eo(seg(d, appear + i * stagger + 0.34, appear + i * stagger + 0.76)) : 0;
        g.style.opacity = String(0.95 * h);
      }
    }
  }

  var DRAW = {
    transferCard: drawTransferCard,
    simCard: drawSimCard,
    counterBars: drawCounterBars,
    flowToWallet: drawFlowToWallet,
    logoReveal: drawLogoReveal,
    operatorGrid: drawOperatorGrid,
  };

  /* ============================== HEADLINES =============================== */
  function buildHeadline(root, s, h) {
    var d = document.createElement('div');
    d.className = 'hl';
    d.id = s.id + 'h' + h.idx;
    d.style.fontSize = h.size + 'px';
    d.style.top = h.top + 'px';
    d.style.lineHeight = '1.22';
    /* an optional brand mark rendered inline, so a headline can read
       "<mark> ... " in place of a partner's written name */
    d.innerHTML = (h.logo
      ? '<img class="hlLogo" src="' + esc(h.logo) + '" alt="">'
      : '') + rich(h.text, 'lat');
    root.appendChild(d);
    if (h.glow) {
      var g = document.createElement('div');
      g.className = 'hlGlow';
      g.id = s.id + 'h' + h.idx + 'Glow';
      root.insertBefore(g, root.firstChild);
    }
    return d;
  }

  function drawHeadlines(root, s, t) {
    s.headlines.forEach(function (h) {
      var el = root.querySelector('#' + s.id + 'h' + h.idx);
      if (!el) return;
      var a = eo(seg(t, s.start + h.appear, s.start + h.appear + Math.min(0.42, s.animSpan * 0.25)));
      var out = h.exit == null ? 0 : eo(seg(t, s.start + h.exit, s.start + h.exit + Math.min(0.34, s.animSpan * 0.2)));
      el.style.opacity = a * (1 - out);
      el.style.transform = 'translate3d(0,' + (lerp(24, 0, a) - lerp(0, 26, out)) + 'px,0)';
      if (h.glow) {
        var g = root.querySelector('#' + s.id + 'h' + h.idx + 'Glow');
        if (g) {
          g.style.opacity = String(0.85 * a * (1 - out));
          var pu = seg(t, s.start + h.appear + 0.2, s.start + h.appear + 0.9);
          el.style.transform += ' scale(' + (1 + 0.028 * Math.sin(pu * Math.PI * 2)) + ')';
        }
      }
    });
  }

  /* ------------------------------ headline auto-fit --------------------- */
  function fitAll() {
    PLAN.scenes.forEach(function (s) {
      s.headlines.forEach(function (h) {
        var el = $('' + s.id + 'h' + h.idx);
        if (!el) return;
        var fs = parseFloat(getComputedStyle(el).fontSize);
        for (var k = 0; k < 6; k++) {
          var w = el.scrollWidth, avail = el.clientWidth;
          if (w > avail && w > 0) {
            fs = fs * avail / w * 0.985;
            el.style.fontSize = fs + 'px';
          } else break;
        }
      });
    });
  }

  /* ================================ RENDER ================================ */
  function render(t) {
    /* background drifts slowly across the WHOLE video, whatever its length */
    var bp = clamp(t / (PLAN.total || 1));
    $('orbG').style.transform = 'translate3d(' + lerp(-40, 70, bp) + 'px,' + lerp(0, -52, bp) + 'px,0) scale(' + lerp(1, 1.10, bp) + ')';
    $('orbY').style.transform = 'translate3d(' + lerp(52, -62, bp) + 'px,' + lerp(0, 42, bp) + 'px,0) scale(' + lerp(1, 1.12, bp) + ')';
    $('orbM').style.transform = 'translate3d(0,0,0) scale(' + lerp(.90, 1.16, bp) + ')';

    PLAN.scenes.forEach(function (s, i) {
      var root = $('scene-' + i);
      if (!root) return;
      var fin = s.fadeIn > 0 ? seg(t, s.start, s.start + s.fadeIn) : 1;
      /* the last scene holds — a zero fade window would divide by zero */
      var fout = s.fadeOut > 0 ? (1 - seg(t, s.end - s.fadeOut, s.end)) : 1;
      root.style.opacity = Math.min(fin, fout);

      /* HARD GATE — a scene's own layers may only ever be painted inside that
         scene's window. The ±1s test below is just a "have the elements been
         built yet" shortcut; THIS is what guarantees that a reveal, a flash or
         a light sweep from one scene can never leak into a neighbour, whatever
         any individual child's opacity happens to be. */
      var inWindow = (t >= s.start && t <= s.end);
      root.style.display = inWindow ? '' : 'none';
      if (!inWindow) return;

      var p = clamp((t - s.start) / s.animSpan);        // 0..1 over the animation
      DRAW[s.kind](root, p * s.designDuration, s);       // -> design-clock seconds
      drawHeadlines(root, s, t);
    });

    /* whole-frame transitions */
    $('flash').style.opacity = 0;
    $('sweepFrame').style.opacity = 0;
    PLAN.transitions.forEach(function (tr) {
      var f = seg(t, tr.at, tr.at + tr.dur);
      if (tr.type === 'flash' && f > 0 && f < 1) {
        $('flash').style.opacity = tr.strength * Math.sin(f * Math.PI);
      }
      if (tr.type === 'sweepFrame' && f > 0 && f < 1) {
        $('sweepFrame').style.opacity = 0.10 * Math.sin(f * Math.PI);
        $('sweepFrameBand').style.transform = 'translate3d(' + lerp(-520, PLAN.width * 1.15, f) + 'px,0,0)';
      }
    });
  }

  /* ================================= BOOT ================================= */
  function boot() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    PLAN.scenes.forEach(function (s, i) {
      var root = document.createElement('div');
      root.className = 'scene';
      root.id = 'scene-' + i;
      root.setAttribute('data-scene-id', s.id);
      root.innerHTML = MARKUP[s.kind](s);
      $('stage').insertBefore(root, $('flash'));
      s.headlines.forEach(function (h) { buildHeadline(root, s, h); });

      if (s.kind === 'counterBars') buildBars(s, root);
      if (s.kind === 'flowToWallet') buildParts(s, root);
    });

    var done = function () {
      /* the scene 1 check-mark is a stroked path: measure it once */
      var cp = document.querySelector('#checkPath');
      if (cp && cp.getTotalLength) {
        state.checkLen = cp.getTotalLength();
        cp.style.strokeDasharray = state.checkLen;
        cp.style.strokeDashoffset = state.checkLen;
      }
      fitAll();
      render(0);
      window.seek = render;
      window.__ready = true;
    };

    var img = $('logo');
    var imgReady = (img && img.decode) ? img.decode().catch(function () {}) : Promise.resolve();
    Promise.all([document.fonts.ready, imgReady]).then(done).catch(done);
  }

  boot();
})();
