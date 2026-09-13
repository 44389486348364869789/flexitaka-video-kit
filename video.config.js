/**
 * ============================================================================
 *  video.config.js  —  FlexiTaka SERVICE EXPLAINER (marketplace concept)
 * ============================================================================
 *
 *  THE ONE FILE THAT DEFINES THIS VIDEO. Length, scenes, on-screen text, the
 *  voice-over clips passed in by the client, music, sound effects.
 *
 *  ---------------------------------------------------------------------------
 *  THIS CUT
 *  ---------------------------------------------------------------------------
 *  A ~46-second Bangla service explainer that explains FlexiTaka as a
 *  marketplace: one person's unused SIM balance on one side, another person's
 *  need for a cheaper recharge on the other, and FlexiTaka matching the two.
 *
 *  It is NOT the earlier 20s "COMING SOON" teaser. Different structure,
 *  different length, different scenes, and most importantly it actually
 *  explains the service rather than teasing it.
 *
 *  The voice-over is the CLIENT'S OWN RECORDING (vo/vo_s1..s6.wav), sliced from
 *  the single file they supplied. Its line boundaries were measured with
 *  silencedetect, and every scene duration below was derived from the measured
 *  speech length of its own line — so no line is cut off and none is rushed.
 *
 *  ---------------------------------------------------------------------------
 *  LENGTH
 *  ---------------------------------------------------------------------------
 *  Not fixed. It is exactly the sum of the scene durations:
 *      3.6 + 10.8 + 7.7 + 10.6 + 8.3 + 5.1 = 46.1s
 *  and every scene duration is (leadIn + measured speech + tail + breathing
 *  room) rounded up to 0.1s. Change a duration and the frame count, the audio
 *  length and every timing window follow automatically.
 *
 *  ---------------------------------------------------------------------------
 *  SCENES AT A GLANCE
 *  ---------------------------------------------------------------------------
 *    s1   0.0– 3.6   splitCompare    the problem, in two panels
 *    s2   3.6–14.4   twoSidedMatch   what FlexiTaka is — the match itself
 *    s3  14.4–22.1   splitCompare    the problem again, named plainly
 *    s4  22.1–32.7   appStep         what you can take the value out as
 *    s5  32.7–41.0   operatorGrid    any operator's SIM
 *    s6  41.0–46.1   logoReveal      brand + tagline, held to the last frame
 *
 *  Quick start:   ./render.sh              full build
 *                 ./render.sh check        environment + font check, renders nothing
 *                 node lib/dump-plan.js    show the computed timeline + audio plan
 * ============================================================================
 */

module.exports = {

  /* ------------------------------------------------------------------ canvas */
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    crf: 16,
    preset: 'slow',
    outputName: 'flexitaka_service_video_46s',
  },

  /* ------------------------------------------------------------ brand colours */
  theme: {
    green:      '#025734',
    greenLight: '#04724A',
    greenDeep:  '#013D24',
    greenPale:  '#CFE8DA',
    yellow:     '#FDB801',
    yellowSoft: '#FFC933',
    cream:      '#F4FBF7',
    ink:        '#FFFFFF',
  },

  /* ---------------------------------------------------------------- typography */
  type: {
    banglaFamily: "'HS',sans-serif",
    latinFamily:  "'PP',sans-serif",
    headline:     70,
    headlineMin:  40,
    margin:       120,
  },

  /* --------------------------------------------------------------------- audio */
  audio: {
    enabled: true,
    sampleRate: 48000,
    targetTruePeakDb: -1.5,

    music: {
      file:     'music/flexitaka_service_bgm.mp3',
      /* The bed sits well under the narration. With a voice bus present the
         planner also side-chain-ducks the music by the voice, so the bed is
         set here at a level that is audible in the gaps but never competes
         with speech. */
      gainDb:   -15,
      fadeIn:   0.9,
      fadeOut:  2.2,
    },

    duck: { threshold: 0.12, ratio: 2, attackMs: 8, releaseMs: 320 },

    vo: {
      leadIn:   0.15,   // scene start -> line start
      tailGap:  0.05,   // the line must clear the scene end by this much
      peakDb:  -3.0,    // every line peak-normalised, so they match each other
      tailPad:  0.06,
      maxSpeed: 1.32,   // never rush a line harder than this to make it fit
      noiseDb:  -38,    // head/tail silence-detection threshold
    },

    /* Sound effects, each anchored to a scene so they travel with the timeline
       when a scene length changes. Positions are all inside their scene (or
       just before it, for a pre-cut riser), which avoids the one clamp that
       would otherwise fire: a cue at t >= DUR is skipped, and the last scene
       starts at 41.0s of a 46.1s video. */
    sfx: {
      masterGainDb: -6,
      cues: [
        { file: 'sfx/whoosh.mp3', anchor: 's1', at: 0.02, gainDb: -3 },

        { file: 'sfx/riser.mp3',  anchor: 's2', at: -0.35, gainDb: -4 },
        { file: 'sfx/whoosh.mp3', anchor: 's2', at: 0.90, gainDb: -4 },
        { file: 'sfx/ding.mp3',   anchor: 's2', at: 3.10, gainDb: -1 },

        { file: 'sfx/whoosh.mp3', anchor: 's3', at: 0.02, gainDb: -3 },
        { file: 'sfx/click.mp3',  anchor: 's3', at: 0.60, gainDb: -3 },

        { file: 'sfx/riser.mp3',  anchor: 's4', at: -0.35, gainDb: -4 },
        { file: 'sfx/click.mp3',  anchor: 's4', at: 0.55, gainDb: -3 },
        { file: 'sfx/ding.mp3',   anchor: 's4', at: 2.10, gainDb: -2 },

        { file: 'sfx/whoosh.mp3', anchor: 's5', at: 0.02, gainDb: -3 },
        { file: 'sfx/click.mp3',  anchor: 's5', at: 0.45, gainDb: -4 },
        { file: 'sfx/click.mp3',  anchor: 's5', at: 0.95, gainDb: -4 },
        { file: 'sfx/click.mp3',  anchor: 's5', at: 1.45, gainDb: -4 },

        { file: 'sfx/riser.mp3',  anchor: 's6', at: -0.60, gainDb: -4 },
        { file: 'sfx/ding.mp3',   anchor: 's6', at: 0.55, gainDb: -1 },
        { file: 'sfx/whoosh.mp3', anchor: 's6', at: 1.30, gainDb: -3 },
      ],
    },
  },

  /* -------------------------------------------------------------- transitions */
  /* NOTE: `at` is always POSITIVE. The planner adds it to the anchor scene's
     start time, so a negative value would evaluate to `scene.end - dur` and
     push the flash past the scene's own cut. A flash at +0.02s reads as an
     accent ON the cut, which is what is wanted here. */
  transitions: [
    { type: 'flash',      anchor: 's2', at: 0.03, dur: 0.32, strength: 0.26 },
    { type: 'flash',      anchor: 's3', at: 0.03, dur: 0.30, strength: 0.26 },
    { type: 'sweepFrame', anchor: 's4', at: 0.04, dur: 0.62 },
    { type: 'flash',      anchor: 's5', at: 0.03, dur: 0.30, strength: 0.24 },
    { type: 'flash',      anchor: 's6', at: 0.03, dur: 0.34, strength: 0.30 },
  ],

  /* =========================================================================
   *  THE TIMELINE — scenes play in this order
   * =========================================================================
   *  Each scene's `vo` carries the client's own recording for that line, and
   *  `duration` is sized from that line's MEASURED speech length — see the
   *  header. `designDuration` equals `duration`, so each scene's animation
   *  plays out across its whole window and then holds, rather than being
   *  compressed and rushed.
   */
  scenes: [

    /* ==================================================== SCENE 1 — 0.0-3.6s
     * "ফ্লেক্সি টাকা কি?"  — the problem, stated as two panels.
     * Left: balance sitting unused. Right: a recharge that cost too much.
     * The dashed divider between them is drawn but never joined. */
    {
      id: 's1',
      kind: 'splitCompare',
      duration: 3.6,
      designDuration: 3.6,
      headlines: [
        { text: 'সিমে থাকা ব্যালেন্স কি আসলেই কাজে লাগছে?', size: 66, appear: 0.02 },
      ],
      props: {
        leftLabel: 'অব্যবহৃত',
        leftSub: 'সিমে পড়ে আছে',
        rightLabel: 'রিচার্জ',
        rightTag: 'প্রয়োজনের বেশি?',
        amount: 500,
        currency: '৳ ',
      },
      vo: {
        file: 'vo/vo_s1.wav',
        text: 'ফ্লেক্সি টাকা কি?',
      },
    },

    /* =================================================== SCENE 2 — 3.6-14.4s
     * The heart of the film. Seller's unused value on the left, buyer's
     * recharge need on the right, FlexiTaka in the middle matching them.
     * The two value tokens travel inward and meet under the brand mark. */
    {
      id: 's2',
      kind: 'twoSidedMatch',
      duration: 10.8,
      designDuration: 10.8,
      headlines: [
        { text: 'দুই প্রয়োজন, এক জায়গায়', size: 68, appear: 0.02 },
      ],
      props: {
        leftTitle: 'ব্যালেন্স',
        leftSub: 'যেটা এখন দরকার নেই',
        rightTitle: 'রিচার্জ',
        rightSub: 'কম দামে করতে চান',
        logo: 'assets/logo_trimmed.png',
        pill: 'MARKETPLACE',
      },
      vo: {
        file: 'vo/vo_s2.wav',
        /* Long line (9.897s measured) — this is why the scene runs 10.8s. */
        text: 'ফ্লেক্সি টাকা হলো একটি নতুন ডিজিটাল প্ল্যাটফর্ম যেখানে আপনার সিমে থাকা অতিরিক্ত বা প্রয়োজনের চেয়ে বেশি ব্যালেন্সের ভ্যালু কাজে লাগানোর সুযোগ তৈরি হবে।',
      },
    },

    /* ================================================== SCENE 3 — 14.4-22.1s
     * The problem again, named plainly — "wrong recharge / more balance than
     * needed". Same scene type as s1 but different copy and a warning mark. */
    {
      id: 's3',
      kind: 'splitCompare',
      duration: 7.7,
      designDuration: 7.7,
      headlines: [
        { text: 'ভুল করে রিচার্জ, না দরকারের বেশি ব্যালেন্স?', size: 62, appear: 0.02 },
      ],
      props: {
        leftLabel: 'সিমে ব্যালেন্স',
        leftSub: 'প্রয়োজন নেই এখন',
        rightLabel: 'রিচার্জ',
        rightTag: 'দামি হয়ে যায়',
        amount: 300,
        currency: '৳ ',
      },
      vo: {
        file: 'vo/vo_s3.wav',
        text: 'অনেক সময় ভুল করে সিমে রিচার্জ হয়ে যায় অথবা সিমে এমন ব্যালেন্স থাকে যেটা আপনার এখন প্রয়োজন নেই।',
      },
    },

    /* =================================================== SCENE 4 — 22.1-32.7s
     * What the value comes out AS. The client asked for the brand marks of the
     * payment services, each drawn unmodified inside its own row on a white
     * card — object-fit:contain, so no mark is ever stretched or recoloured. */
    {
      id: 's4',
      kind: 'appStep',
      duration: 10.6,
      designDuration: 10.6,
      headlines: [
        { text: 'ব্যালেন্সের ভ্যালু নিন ক্যাশ হিসেবে', size: 66, appear: 0.02 },
      ],
      props: {
        title: 'ভ্যালু কোথায় নিতে চান?',
        appear: 0.55,
        stagger: 0.95,
        rows: [
          { logo: 'assets/logos/bkash.png', label: 'বিকাশ' },
          { logo: 'assets/logos/nagad.png', label: 'নগদ' },
          { glyph: '৳', label: 'ব্যাংক অ্যাকাউন্ট' },
        ],
        button: 'অফার নিশ্চিত করুন',
      },
      vo: {
        file: 'vo/vo_s4.wav',
        text: 'ফ্লেক্সি টাকা সেই অতিরিক্ত ব্যালেন্সের ভ্যালু ব্যবহার করে আপনাকে সহজে বিকাশ, নগদ অথবা ব্যাংক অ্যাকাউন্টে ক্যাশ নেওয়ার সুবিধা দেওয়ার লক্ষ্য নিয়ে তৈরি হচ্ছে।',
      },
    },

    /* =================================================== SCENE 5 — 32.7-41.0s
     * Every operator's SIM. All five brand marks the client asked for, each
     * inside its own white card, none recoloured, none stretched. */
    {
      id: 's5',
      kind: 'operatorGrid',
      duration: 8.3,
      designDuration: 8.3,
      headlines: [
        { text: 'দেশের যেকোনো অপারেটরের সিমে', size: 64, appear: 0.02 },
      ],
      props: {
        appear: 0.70,
        stagger: 0.50,
        highlight: -1,          // no single brand is singled out
        cardW: 300,
        cardH: 212,
        gap: 30,
        markW: 208,
        markH: 106,
        operators: [
          { file: 'assets/logos/bkash.png',        alt: 'bKash' },
          { file: 'assets/logos/nagad.png',        alt: 'Nagad' },
          { file: 'assets/logos/grameenphone.png', alt: 'Grameenphone' },
          { file: 'assets/logos/robi.png',         alt: 'Robi' },
          { file: 'assets/logos/banglalink.png',   alt: 'Banglalink' },
        ],
      },
      vo: {
        file: 'vo/vo_s5.wav',
        text: 'অর্থাৎ আপনার সিমে পড়ে থাকা ব্যালেন্স আর শুধু পড়ে থাকবে না, এর ভ্যালু আপনি প্রয়োজন অনুযায়ী কাজে লাগাতে পারবেন।',
      },
    },

    /* =================================================== SCENE 6 — 41.0-46.1s
     * The end card. Holds to the last frame — no fade-out — so the logo and
     * the tagline are at full strength on the final frame. The slogan is Latin
     * and lives here rather than in a headline.
     *
     * designDuration stays 4.1 while duration is 5.1: the reveal animation
     * plays at its original pace and then HOLDS for the extra second, which is
     * what gives the end card the ~1.8s of quiet brand time after the last
     * spoken line (line ends 44.33s, picture runs to 46.1s). */
    {
      id: 's6',
      kind: 'logoReveal',
      duration: 5.1,
      designDuration: 4.1,
      headlines: [],
      props: {
        logo: 'assets/logo_trimmed.png',
        tagline: 'Your SIM Balance, More Value.',
        /* No CTA pill: the platform is not launched yet, and "COMING SOON" is
           not part of this cut's message. The pill is optional — omitting it
           removes it entirely rather than falling back to a default. */
        cta: null,
        sub: null,
        sweep2At: 1.30,
        sweep2Dur: 0.55,
        floatFrom: 0.95,
        floatAmp: 4,
      },
      vo: {
        file: 'vo/vo_s6.wav',
        text: 'ফ্লেক্সি টাকা, ইয়োর সিম ব্যালেন্স, মোর ভ্যালু।',
      },
    },

  ],
};
