# `video.config.js` — field reference

This is the only file you normally edit. Everything the renderer, the capture
loop and the audio mixer do is derived from it.

```bash
node lib/dump-plan.js     # see the effect of your edit before rendering
```

---

## `video`

| Field | Type | Meaning |
|---|---|---|
| `width` | px | Frame width. Default `1920`. |
| `height` | px | Frame height. Default `1080`. |
| `fps` | number | Frames per second. Default `30`. Frame count = `total seconds × fps`. |
| `crf` | 0–51 | x264 quality. Lower = better and bigger. Default `16` (near-lossless). |
| `preset` | string | x264 speed/quality preset. Default `slow`. |
| `outputName` | string | Base name for the MP4 and the audio deliverables. |

Changing `width`/`height` re-renders at that size; no CSS edits are needed —
the layout is authored against the configured canvas.

---

## `theme`

Free-form colour map. Each key becomes a CSS custom property available to every
scene as `var(--<key>)`. The default set:

| Key | Used for |
|---|---|
| `green` | primary — headlines, panels, the SIM card |
| `greenLight` | gradient partner of `green` |
| `greenDeep` | the background vignette |
| `greenPale` | placeholder bars, low-emphasis fills |
| `yellow` | accent — the call-to-action, particles, highlights |
| `yellowSoft` | gradient partner of `yellow` |
| `cream` | page background |
| `ink` | reservable for light text on dark |

Add your own keys freely; reference them as `var(--myColour)` in `lib/engine.js`.

---

## `type`

| Field | Meaning |
|---|---|
| `banglaFamily` | CSS font stack for Bangla text. Default `'HS',sans-serif`. |
| `latinFamily` | CSS font stack for Latin text. Default `'PP',sans-serif`. |
| `headline` | Default headline size in px (used when a headline omits `size`). |
| `headlineMin` | Advisory floor for the auto-fit. |
| `margin` | Left/right safe margin in px. Headlines never cross it. |

Inside any headline text, `{...}` switches to the Latin font — so
`'{SIM}-এ টাকা'` renders "SIM" in Poppins and the Bengali in Hind Siliguri.

---

## `audio`

```js
audio: {
  enabled: true,            // false => the whole audio stage is skipped
  sampleRate: 48000,
  targetTruePeakDb: -1.5,   // final ceiling, in dBTP
  music:  { file, gainDb, fadeIn, fadeOut },
  duck:   { threshold, ratio, attackMs, releaseMs },
  vo:     { leadIn, tailGap, peakDb, tailPad, maxSpeed, noiseDb },
}
```

| Field | Meaning |
|---|---|
| `enabled` | `false` produces a silent video and skips every audio step. |
| `targetTruePeakDb` | Final true-peak ceiling. `-1.5` is the streaming-safe default. |
| `music.file` | Path to the music bed, relative to the project root. |
| `music.gainDb` | Level of the bed **before** ducking. More negative = quieter. |
| `music.fadeIn` / `fadeOut` | Fade lengths in seconds. `fadeOut` is measured back from the end. |
| `duck.threshold` | How loud the voice must be before the music is pushed down. |
| `duck.ratio` | How hard it is pushed. Higher = more aggressive. |
| `duck.attackMs` / `releaseMs` | How fast ducking engages and lets go. |
| `vo.leadIn` | Default gap between a scene starting and its VO starting (s). |
| `vo.tailGap` | Keep the line this far clear of the scene end (s). |
| `vo.peakDb` | Every VO line is peak-normalised to this, so lines match each other. |
| `vo.tailPad` | Silence kept after the last phoneme when trimming. |
| `vo.maxSpeed` | Hard cap on speeding a line up to make it fit. Higher = requested durations are honoured more often; lower = speech stays closer to natural pace and a scene gets lengthened instead. |
| `vo.noiseDb` | Silence-detection threshold used to trim head/tail. |

---

## `transitions`

Whole-frame overlay effects.

```js
{ type: 'flash',      anchor: 's4', at: 1.84, dur: 0.32, strength: 0.34 }
{ type: 'sweepFrame', anchor: 's5', at: 0.28, dur: 0.62 }
```

| Field | Meaning |
|---|---|
| `type` | `flash` (white bloom) or `sweepFrame` (a light band crossing the frame). |
| `anchor` | **A scene `id`** — not an absolute time. |
| `at` | Seconds **after that scene starts**. Moving the scene moves the effect with it. |
| `dur` | Length of the effect in seconds. |
| `strength` | `flash` only — peak opacity, 0–1. |

Anchoring to a scene rather than an absolute time is what keeps effects correct
when you change the scene's length or reorder the timeline.

---

## `scenes` — the timeline

The array **order is the timeline order**. Each entry:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique name. Referenced by `transitions` and used in log output. |
| `kind` | yes | Which visual module draws it. See below. |
| `duration` | yes | Seconds on screen. **This is the length knob.** |
| `designDuration` | no | The length the animation was drawn for. Defaults to `duration`. |
| `headlines` | no | On-screen text. See below. |
| `vo` | no | Voice-over for this scene. See below. |
| `props` | no | Scene-specific settings passed to the visual module. |

### Scene kinds

| `kind` | What it draws | Key `props` |
|---|---|---|
| `transferCard` | A phone-money transfer card that becomes a recharge confirmation | `sendLabel`, `rechargeLabel`, `sheetLabel`, `sheetSub`, `currency` |
| `simCard` | A SIM card with a success badge and a warning mark | `badge`, `mark` |
| `counterBars` | A bar chart that counts a value up | `counterTarget`, `counterPrefix`, `bars`, `barHeights` |
| `flowToWallet` | particles travelling from one symbol to another |
| `operatorGrid` | a row of brand marks, one white card each |
| `logoReveal` | the brand logo + tagline + call to action |

`operatorGrid` takes `props.operators` — one entry per card, each
`{ file, alt }`. Cards use `object-fit: contain` with a `max-width`, so every
mark keeps its own aspect ratio and is never stretched (see README section 4).
`props.appear` and `props.stagger` time the reveal; `props.highlight` is the
index of the card that gets the yellow ring, or `-1` for none.

### `headlines[]`

| Field | Meaning |
|---|---|
| `text` | The text. `{...}` renders in the Latin font. |
| `size` | Font size in px. Omit to use `type.headline`. Auto-fitted if too wide. |
| `top` | Distance from the top of the frame in px. Default `104`. Use `196` etc. for a second line. |
| `appear` | When it fades in, as a **fraction** of the scene's animation span. Default `0.06`. |
| `exit` | When it fades out, same units. Omit to hold until the scene ends. |
| `glow` | `true` adds a soft radial glow behind the line. |

Because `appear`/`exit` are fractions of the scene, they scale automatically
when you change the scene's duration — that is how a line is never cut off.

### `vo`

| Field | Meaning |
|---|---|
| `file` | Path to the clip, relative to the project root (usually `vo/…`). |
| `cue` | When the clip starts, in seconds **from the scene start**. May be negative to begin just before the scene. Omit to use `audio.vo.leadIn`. |
| `spillBefore` | How many seconds early the line may start. Default `0`. |
| `text` | The spoken text. Written into the QC report so you can review the script. |

You never need to hand-place a line: `lib/plan-audio.js` fits it into the
scene's window automatically and reports any compromise. Run
`./render.sh plan` to see where every line lands.

### `sfx`

Sound effects, summed on their own bus:

```js
sfx: {
  masterGainDb: -9,          // the whole bus, kept well under the voice
  cues: [
    { file: 'sfx/whoosh.mp3', anchor: 's1', at: 0.02,  gainDb: -3 },
    { file: 'sfx/riser.mp3',  anchor: 's6', at: -0.90, gainDb: -4 },  // starts just before the cut
  ],
}
```

`anchor` names a scene and `at` is seconds after that scene **starts** (negative
means it starts before the cut). Because cues are anchored rather than timed
absolutely, they stay on the beat when you change scene lengths. A cue that
would land outside the timeline is skipped with a printed note instead of
failing the render; an `anchor` naming a scene that does not exist is an error.

Effects never duck the music — the ducking sidechain is fed by the voice bus
alone, so a whoosh cannot pump the bed.

---

## Validation

`lib/timeline.js` validates the config and fails with a clear message on:

- a missing `video`, `type` or `theme` block, or an `fps` of 0 or less;
- an empty `scenes` array;
- a scene without `id` or `kind`, a duplicate `id`, or a `duration` of 0 or less;
- an unknown `kind` (the message lists the valid ones);
- a headline whose `text` is not a string, or whose `exit` comes before `appear`;
- a `transition` anchored on a scene `id` that does not exist, or an unknown
  transition `type`.

Because validation is strict, deleting a scene cannot silently leave a
transition or a voice-over pointing at nothing — the render stops and tells you.