/**
 * ============================================================================
 *  video.config.js   —   THE ONE FILE YOU EDIT TO MAKE A NEW VIDEO
 * ============================================================================
 *
 *  Everything about the output lives here: length, scene order, on-screen
 *  text, brand colours, music, voice-over and sound effects. The render
 *  pipeline reads this file, so changing a value here and re-running
 *  `./render.sh` produces a new video. You normally never touch index.html
 *  or lib/.
 *
 *  LENGTH IS NOT FIXED. The video is exactly as long as the sum of the scene
 *  `duration` values — here 3.5+2.5+2.5+2.5+3.5+5.5 = 20.0s. Change them and
 *  the video gets shorter or longer; the frame count, the audio length and
 *  every timing window are derived from the config, not hard-coded.
 *
 *  ADD / REMOVE / RE-ORDER SCENES by editing the `scenes` array. The array
 *  order IS the timeline order.
 *
 *  NOTHING GETS CUT OR OVERLAPS. Each scene's voice-over is placed
 *  automatically inside that scene's window; if a line would run past the
 *  scene, the planner first slides it earlier, then (only if needed) speaks it
 *  slightly faster, and only as a last resort lengthens the scene. Every
 *  adjustment is printed by `node lib/dump-plan.js` and written to
 *  build/audio_report.json.
 *
 *  THIS CUT HAS NO NARRATION. No scene below carries a `vo` block, so the
 *  audio build has no voice bus to mix: the soundtrack is the music bed plus
 *  the sound effects alone. The voice-over machinery is still fully wired --
 *  add a `vo: { file, cue, text }` block to any scene and the whole auto-timing
 *  / ducking chain comes straight back. Because there is no speech to stay
 *  under, the bed is set louder here than in the narrated cut.
 *
 *  Quick start:   ./render.sh              (full build)
 *                 ./render.sh probe        (a few still frames, fast)
 *                 ./render.sh check        (environment + font check only)
 *                 node lib/dump-plan.js    (show the computed timeline)
 *
 *  See README.md for the "new video" prompt template.
 * ============================================================================
 */

module.exports = {

  /* ------------------------------------------------------------------ canvas */
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    crf: 16,           // lower = better quality, bigger file (16 is near-lossless)
    preset: 'slow',    // ffmpeg x264 preset
    outputName: 'flexitaka_coming_soon_teaser_20s_v3',   // -> output/<name>.mp4
  },

  /* ------------------------------------------------------------ brand colours */
  /* These become CSS variables (--green, --yellow, ...) used by every scene. */
  theme: {
    green:      '#025734',   // primary
    greenLight: '#04724A',
    greenDeep:  '#013D24',
    greenPale:  '#CFE8DA',
    yellow:     '#FDB801',   // accent
    yellowSoft: '#FFC933',
    cream:      '#F4FBF7',   // page background
    ink:        '#FFFFFF',
  },

  /* ---------------------------------------------------------------- typography */
  /* Font files live in fonts/. Bangla = Hind Siliguri, Latin = Poppins. */
  type: {
    banglaFamily: "'HS',sans-serif",
    latinFamily:  "'PP',sans-serif",
    headline:     78,    // default headline size (px)
    headlineMin:  40,    // auto-fit will never shrink a headline below this
    margin:       130,   // left/right safe margin for headlines (px)
  },

  /* --------------------------------------------------------------------- audio */
  /* Set enabled:false for a silent video — the pipeline then skips all audio
     steps and just copies the silent master to output/.                        */
  audio: {
    enabled: true,
    sampleRate: 48000,
    targetTruePeakDb: -1.5,   // final true-peak ceiling (dBTP)

    music: {
      file:     'music/flexitaka_teaser_bgm_20s.mp3',
      gainDb:   -9,           // level of the bed before ducking (louder: no VO)
      fadeIn:   0.9,          // seconds
      fadeOut:  2.2,          // seconds, measured back from the end
    },

    // The music is pushed down while the voice speaks. With no voice-over in
    // this cut the side-chain is fed by the SOUND-EFFECT bus instead, so the
    // bed still breathes under each transition accent.
    duck: { threshold: 0.12, ratio: 2, attackMs: 8, releaseMs: 320 },

    vo: {
      leadIn:   0.18,   // default gap between a scene starting and its VO starting
      tailGap:  0.05,   // keep the line this far clear of the scene end
      peakDb:  -3.0,    // every VO line is peak-normalised to this, so lines match
      tailPad:  0.06,   // silence kept after the last phoneme when trimming
      maxSpeed: 1.32,   // never speed a line up more than this to make it fit
      noiseDb:  -38,    // silence-detection threshold for trimming head/tail
    },

    /* ------------------------------------------------------------ sound design
     * Short effects placed RELATIVE TO A SCENE, so they travel with the
     * timeline if you change scene lengths: `anchor` names the scene and `at`
     * is seconds after that scene starts (negative = just before the cut).
     * They are mixed on their own bus, well below the voice-over, and the
     * music is ducked only by the voice, never by the effects.
     */
    sfx: {
      masterGainDb: -6,
      cues: [
        { file: 'sfx/whoosh.mp3', anchor: 's1', at: 0.02, gainDb: -3 },
        { file: 'sfx/click.mp3',  anchor: 's1', at: 1.55, gainDb: -2 },
        { file: 'sfx/ding.mp3',   anchor: 's1', at: 2.24, gainDb: -1 },
        { file: 'sfx/whoosh.mp3', anchor: 's2', at: 0.02, gainDb: -3 },
        { file: 'sfx/click.mp3',  anchor: 's3', at: 0.50, gainDb: -2 },
        { file: 'sfx/ding.mp3',   anchor: 's3', at: 1.34, gainDb: -2 },
        { file: 'sfx/whoosh.mp3', anchor: 's4', at: 1.80, gainDb: -2 },
        { file: 'sfx/whoosh.mp3', anchor: 's5', at: 0.24, gainDb: -2 },
        { file: 'sfx/click.mp3',  anchor: 's5', at: 0.30, gainDb: -3 },
        { file: 'sfx/riser.mp3',  anchor: 's6', at: -0.90, gainDb: -4 },
        { file: 'sfx/ding.mp3',   anchor: 's6', at: 0.56, gainDb: -1 },
        { file: 'sfx/click.mp3',  anchor: 's6', at: 1.04, gainDb: -3 },
        { file: 'sfx/whoosh.mp3', anchor: 's6', at: 1.56, gainDb: -3 },
      ],
    },
  },

  /* -------------------------------------------------------------- transitions */
  /* Whole-frame overlay effects. `anchor` names a scene and `at` is the number
     of seconds after that scene's start, so effects follow the timeline when
     you change scene lengths. Available types: 'flash', 'sweepFrame'.         */
  transitions: [
    { type: 'flash',      anchor: 's4', at: 1.84, dur: 0.32, strength: 0.34 },
    { type: 'sweepFrame', anchor: 's5', at: 0.26, dur: 0.62 },
    { type: 'flash',      anchor: 's6', at: 0.02, dur: 0.30, strength: 0.24 },
  ],

  /* =========================================================================
   *  THE TIMELINE — scenes play in this order
   * =========================================================================
   *
   *  id             unique name; used by transitions/SFX and by the audio planner
   *  kind           which visual module draws the scene (see lib/engine.js)
   *                   transferCard  — a phone-money transfer card that becomes a
   *                                   recharge confirmation
   *                   simCard       — a SIM card with a success badge / warning
   *                   counterBars   — a bar chart that counts a value up
   *                   flowToWallet  — particles travelling from one symbol to another
   *                   operatorGrid  — a row of third-party brand marks on cards
   *                   logoReveal    — the brand logo + tagline + call to action
   *  duration       seconds this scene is on screen (this is the LENGTH knob)
   *  designDuration the length the animation was drawn for. If you shorten a
   *                 scene below this, its animation is compressed to fit so no
   *                 element is ever cut off. If you lengthen it, the animation
   *                 simply holds at the end.
   *  headlines      text shown at the top. `{...}` renders in the Latin font,
   *                 so {SIM} inside Bangla text uses Poppins. `logo` puts an
   *                 image inline before the text, so a partner's wordmark can
   *                 stand in for its written name. Long lines are auto-shrunk.
   *  vo             voice-over for this scene. `file` is an audio clip in vo/.
   *                 `cue` is when the clip starts, in seconds from the scene
   *                 start (may be negative to start just before the scene).
   *                 `spillBefore` is how many seconds early it may start.
   *  props          scene-specific settings handed to the visual module.
   */
  scenes: [

    /* -------------------------------------------------- SCENE 1 — 0.0-3.5s --- */
    /* An operator's mark, set inline in the headline where the written name
       used to be. props.headLogo puts the same mark on the card's header. */
    {
      id: 's1',
      kind: 'transferCard',
      duration: 3.5,
      designDuration: 3.0,
      headlines: [
        {
          text: '\u09a5\u09c7\u0995\u09c7 \u099f\u09be\u0995\u09be \u09aa\u09be\u09a0\u09be\u09a4\u09c7 \u0997\u09bf\u09af\u09bc\u09c7...',
          logo: 'assets/logos/bkash.png',
          appear: 0.01,
        },
      ],
      props: {
        headLogo: 'assets/logos/bkash.png',
        sendLabel: 'SEND MONEY',
        rechargeLabel: 'RECHARGE',
        sheetLabel: 'SIM RECHARGE',
        sheetSub: 'SUCCESSFUL',
        currency: '\u09f3',
      },
    },

    /* -------------------------------------------------- SCENE 2 — 3.5-6.0s --- */
    {
      id: 's2',
      kind: 'simCard',
      duration: 2.5,
      designDuration: 2.0,
      headlines: [{ text: '\u09ad\u09c1\u09b2 \u0995\u09b0\u09c7 {SIM}-\u098f \u09b0\u09bf\u099a\u09be\u09b0\u09cd\u099c \u0995\u09b0\u09c7 \u09ab\u09c7\u09b2\u09c7\u099b\u09c7\u09a8?', size: 72, appear: 0.0 }],
      props: { badge: 'check', mark: 'exclaim' },
    },

    /* -------------------------------------------------- SCENE 3 — 6.0-8.5s --- */
    {
      id: 's3',
      kind: 'counterBars',
      duration: 2.5,
      designDuration: 2.0,
      headlines: [{ text: '{SIM}-\u098f \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u099f\u09be\u0995\u09be \u09aa\u09a1\u09bc\u09c7 \u0986\u099b\u09c7?', size: 80, appear: 0.0 }],
      props: { counterTarget: 2450, counterPrefix: '\u09f3 ', bars: 6, barHeights: [130, 175, 225, 280, 340, 400] },
    },

    /* -------------------------------------------------- SCENE 4 — 8.5-11.0s -- */
    {
      id: 's4',
      kind: 'flowToWallet',
      duration: 2.5,
      designDuration: 2.0,
      /* The question stays a QUESTION for the whole scene. Neither line carries
         an `exit`, so both hold all the way to the cut, and nothing here
         announces the launch - the "coming soon" message belongs to the end
         card alone (scene 6). */
      headlines: [
        { text: '{SIM}-\u098f\u09b0 \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u099f\u09be\u0995\u09be \u0995\u09bf', size: 72, appear: 0.375 },
        { text: '\u09ac\u09be \u09ac\u09cd\u09af\u09be\u0982\u0995\u09c7 \u09a8\u09bf\u09a4\u09c7 \u099a\u09be\u09a8?', logo: 'assets/logos/bkash.png', size: 72, top: 196, appear: 0.425 },
      ],
      /* dim:null - no end-of-scene dim, because nothing is revealed afterwards.
         Set dim:{ from, to, amount } to fade the visual toward a following
         reveal instead. */
      props: { particles: 7, dim: null },
    },

    /* -------------------------------------------------- SCENE 5 — 11.0-14.5s - */
    /* Third-party operator marks. Each is drawn unmodified inside a plain white
       card; object-fit:contain keeps every mark's own aspect ratio intact. */
    {
      id: 's5',
      kind: 'operatorGrid',
      duration: 3.5,
      designDuration: 3.5,
      headlines: [
        {
          text: '\u09af\u09c7\u0995\u09cb\u09a8\u09cb \u0985\u09aa\u09be\u09b0\u09c7\u099f\u09b0\u09c7\u09b0 {SIM} \u09a5\u09c7\u0995\u09c7\u0987',
          size: 74,
          appear: 0.03,
        },
      ],
      props: {
        appear: 0.16,
        stagger: 0.16,
        highlight: -1,   // no single brand is singled out
        /* Card geometry, so the row is sized for the number of marks it holds.
           All three marks below end up limited by `markW`, which means they
           all span the same width and their heights differ only by their own
           aspect ratio - the only non-distorting way to balance a row built
           from files of very different source resolution. */
        cardW: 470,
        cardH: 262,
        gap: 56,
        markW: 330,
        markH: 150,
        /* MOBILE OPERATORS ONLY. bKash is a separate payment service, not a
           mobile operator, so its mark must never appear in this row - it
           belongs to the scenes that actually talk about moving money (s1 and
           the s4 question). Add or remove entries freely; the row re-centres
           itself and every mark keeps its own aspect ratio (object-fit:
           contain). BanglaLink here is the CURRENT (rebrand) mark. */
        operators: [
          { file: 'assets/logos/robi.png',         alt: 'Robi' },
          /* the BanglaLink source file is the smallest of the three, so it is
             given a per-mark boost to hold its own beside the others - the
             mark itself is still never stretched or recoloured. */
          { file: 'assets/logos/banglalink.png',   alt: 'Banglalink', markW: 356 },
          { file: 'assets/logos/grameenphone.png', alt: 'Grameenphone' },
        ],
      },
    },

    /* -------------------------------------------------- SCENE 6 — 14.5-20.0s - */
    /* The end card is designed for the whole 5.5s, so logoScale stays at 1.0 and
       the original composition is kept exactly. A second light sweep and a slow
       idle float keep the long hold alive. The logo file itself is never
       altered: the sweep is a brightness-only layer masked BY the logo. */
    {
      id: 's6',
      kind: 'logoReveal',
      duration: 5.5,
      designDuration: 5.5,
      headlines: [],
      props: {
        logo: 'assets/logo_trimmed.png',   // NEVER alter this file — see README
        tagline: 'SIM BALANCE TO CASH',
        cta: 'COMING SOON',
        /* The Bangla launch line, one step below the CTA pill. It lives HERE
           and nowhere else: the end card is the ONLY place in the video where
           the "coming soon" message is allowed to appear. Set `sub: null` (or
           delete the key) to drop the line again. */
        sub: 'খুব শীঘ্রই আসছে',
        sweep2At: 1.62,        // second sweep, for the longer hold
        sweep2Dur: 0.55,
        floatFrom: 0.92,       // idle float starts once the card has settled
        floatAmp: 4,
      },
    },

  ],
};