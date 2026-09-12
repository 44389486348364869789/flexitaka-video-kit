/**
 * ============================================================================
 *  video.config.js   —   THE ONE FILE YOU EDIT TO MAKE A NEW VIDEO
 * ============================================================================
 *
 *  Everything about the output lives here: length, scene order, on-screen
 *  text, brand colours, music and voice-over settings. The render pipeline
 *  reads this file, so changing a value here and re-running `./render.sh`
 *  produces a new video. You normally never touch index.html or lib/.
 *
 *  LENGTH IS NOT FIXED. The video is exactly as long as the sum of the scene
 *  `duration` values. Change them and the video gets shorter or longer — the
 *  frame count, the audio length and every timing window are derived from the
 *  config, not hard-coded.
 *
 *  ADD / REMOVE / RE-ORDER SCENES by editing the `scenes` array. The array
 *  order IS the timeline order.
 *
 *  NOTHING GETS CUT OR OVERLAPS. Each scene's voice-over is placed
 *  automatically inside that scene's window; if a line would run past the
 *  scene, the planner first slides it earlier, then (only if needed) speaks it
 *  slightly faster, and only as a last resort lengthens the scene. Every
 *  adjustment is printed by `node lib/dump-plan.js`.
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
    outputName: 'flexitaka_coming_soon_teaser',   // -> output/<name>.mp4
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
      file:     'music/flexitaka_teaser_bgm.mp3',
      gainDb:   -12,          // level of the bed before ducking
      fadeIn:   1.0,          // seconds
      fadeOut:  1.6,          // seconds, measured back from the end
    },

    // The music is pushed down while the voice speaks.
    duck: { threshold: 0.06, ratio: 4, attackMs: 5, releaseMs: 400 },

    vo: {
      leadIn:   0.18,   // default gap between a scene starting and its VO starting
      tailGap:  0.05,   // keep the line this far clear of the scene end
      peakDb:  -3.0,    // every VO line is peak-normalised to this, so lines match
      tailPad:  0.06,   // silence kept after the last phoneme when trimming
      maxSpeed: 1.32,   // never speed a line up more than this to make it fit
                        // (higher = more likely the requested durations are kept
                        //  exactly; lower = speech stays closer to natural pace,
                        //  and a scene gets lengthened instead)
      noiseDb:  -38,    // silence-detection threshold for trimming head/tail
    },
  },

  /* -------------------------------------------------------------- transitions */
  /* Whole-frame overlay effects. `anchor` names a scene and `at` is the number
     of seconds after that scene's start, so effects follow the timeline when
     you change scene lengths. Available types: 'flash', 'sweepFrame'.         */
  transitions: [
    { type: 'flash',      anchor: 's4', at: 1.84, dur: 0.32, strength: 0.34 },
    { type: 'sweepFrame', anchor: 's5', at: 0.28, dur: 0.62 },
  ],

  /* =========================================================================
   *  THE TIMELINE — scenes play in this order
   * =========================================================================
   *
   *  id             unique name; used by transitions and by the audio planner
   *  kind           which visual module draws the scene (see lib/scenes.js)
   *                   transferCard  — a phone-money transfer card that becomes a
   *                                   recharge confirmation
   *                   simCard       — a SIM card with a success badge / warning
   *                   counterBars   — a bar chart that counts a value up
   *                   flowToWallet  — particles travelling from one symbol to another
   *                   logoReveal    — the brand logo + tagline + call to action
   *  duration       seconds this scene is on screen (this is the LENGTH knob)
   *  designDuration the length the animation was drawn for. If you shorten a
   *                 scene below this, its animation is compressed to fit so no
   *                 element is ever cut off. If you lengthen it, the animation
   *                 simply holds at the end.
   *  headlines      text shown at the top. `{...}` renders in the Latin font,
   *                 so {SIM} inside Bangla text uses Poppins. Long lines are
   *                 auto-shrunk to fit the safe margin.
   *  vo             voice-over for this scene. `file` is an audio clip in vo/.
   *                 `cue` is when the clip starts, in seconds from the scene
   *                 start (may be negative to start just before the scene).
   *                 `spillBefore` is how many seconds early it is allowed to
   *                 start. Omit `cue` and it is placed automatically.
   *  props          scene-specific settings handed to the visual module.
   */
  scenes: [

    /* ---------------------------------------------------- SCENE 1 — 0-3s ---- */
    {
      id: 's1',
      kind: 'transferCard',
      duration: 3.0,
      designDuration: 3.0,
      headlines: [{ text: '\u09ac\u09bf\u0995\u09be\u09b6\u09c7 \u099f\u09be\u0995\u09be \u09aa\u09be\u09a0\u09be\u09a4\u09c7 \u0997\u09bf\u09af\u09bc\u09c7...', appear: 0.01 }],
      vo: {
        file: 'vo/vo_s1_bikash.mp3',
        cue: 0.20,
        text: '\u09ac\u09bf\u0995\u09be\u09b6\u09c7 \u099f\u09be\u0995\u09be \u09aa\u09be\u09a0\u09be\u09a4\u09c7 \u0997\u09bf\u09af\u09bc\u09c7\u2026',
      },
      props: {
        sendLabel: 'SEND MONEY',
        rechargeLabel: 'RECHARGE',
        sheetLabel: 'SIM RECHARGE',
        sheetSub: 'SUCCESSFUL',
        currency: '\u09f3',
      },
    },

    /* ---------------------------------------------------- SCENE 2 — 3-5s ---- */
    {
      id: 's2',
      kind: 'simCard',
      duration: 2.0,
      designDuration: 2.0,
      headlines: [{ text: '\u09ad\u09c1\u09b2 \u0995\u09b0\u09c7 {SIM}-\u098f \u09b0\u09bf\u099a\u09be\u09b0\u09cd\u099c \u0995\u09b0\u09c7 \u09ab\u09c7\u09b2\u09c7\u099b\u09c7\u09a8?', size: 72, appear: 0.0 }],
      vo: {
        file: 'vo/vo_s2_wrong_recharge.mp3',
        cue: 0.15,
        text: '\u09ad\u09c1\u09b2 \u0995\u09b0\u09c7 \u09b0\u09bf\u099a\u09be\u09b0\u09cd\u099c \u09b9\u09af\u09bc\u09c7 \u0997\u09c7\u099b\u09c7?',
      },
      props: { badge: 'check', mark: 'exclaim' },
    },

    /* ---------------------------------------------------- SCENE 3 — 5-7s ---- */
    {
      id: 's3',
      kind: 'counterBars',
      duration: 2.0,
      designDuration: 2.0,
      headlines: [{ text: '{SIM}-\u098f \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u099f\u09be\u0995\u09be \u09aa\u09a1\u09bc\u09c7 \u0986\u099b\u09c7?', size: 80, appear: 0.0 }],
      vo: {
        file: 'vo/vo_s3_extra_balance.mp3',
        cue: 0.15,
        text: '\u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u099f\u09be\u0995\u09be \u09aa\u09a1\u09bc\u09c7 \u0986\u099b\u09c7?',
      },
      props: { counterTarget: 2450, counterPrefix: '\u09f3 ', bars: 6, barHeights: [130, 175, 225, 280, 340, 400] },
    },

    /* ---------------------------------------------------- SCENE 4 — 7-9s ---- */
    {
      id: 's4',
      kind: 'flowToWallet',
      duration: 2.0,
      designDuration: 2.0,
      headlines: [
        { text: '{SIM}-\u098f\u09b0 \u0985\u09a4\u09bf\u09b0\u09bf\u0995\u09cd\u09a4 \u099f\u09be\u0995\u09be \u0995\u09bf', size: 72, appear: 0.375, exit: 0.56 },
        { text: '\u09ac\u09bf\u0995\u09be\u09b6 \u09ac\u09be \u09ac\u09cd\u09af\u09be\u0982\u0995\u09c7 \u09a8\u09bf\u09a4\u09c7 \u099a\u09be\u09a8?', size: 72, top: 196, appear: 0.425, exit: 0.56 },
        { text: '\u0996\u09c1\u09ac \u09b6\u09c0\u0998\u09cd\u09b0\u0987 \u0986\u09b8\u099b\u09c7...', size: 92, top: 150, appear: 0.61, glow: true },
      ],
      vo: {
        file: 'vo/vo_s4_short.mp3',
        cue: 0.05,
        text: '\u09ac\u09bf\u0995\u09be\u09b6\u09c7 \u09a8\u09be\u0995\u09bf \u09ac\u09cd\u09af\u09be\u0982\u0995\u09c7?',
      },
      props: { particles: 7 },
    },

    /* ---------------------------------------------------- SCENE 5 — 9-10s --- */
    {
      id: 's5',
      kind: 'logoReveal',
      duration: 1.0,
      designDuration: 1.0,
      headlines: [],
      vo: {
        file: 'vo/vo_s5_coming_soon.mp3',
        cue: -0.45,          // starts just before this scene, while scene 4 is still fading
        spillBefore: 1.0,
        text: '\u09b6\u09c0\u0998\u09cd\u09b0\u0987 \u0986\u09b8\u099b\u09c7!',
      },
      props: {
        logo: 'assets/logo_trimmed.png',   // NEVER alter this file — see README
        tagline: 'SIM BALANCE TO CASH',
        cta: 'COMING SOON',
      },
    },

  ],
};
