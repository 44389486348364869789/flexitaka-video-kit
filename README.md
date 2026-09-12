# FlexiTaka Video Kit

A reusable, editable motion-graphics video project. Edit **one config file**, run
**one command**, get a finished MP4 — with Bangla typography, music and sound effects.

> This particular cut ships **without narration**: no scene carries a `vo` block, so
the soundtrack is the music bed plus transition sound effects. The voice-over
machinery is fully intact and documented below — add a `vo` block to any scene
and the auto-timing and ducking chain returns.

The whole video is built from HTML + CSS + JavaScript. A headless Chromium
screenshots the animated page frame by frame, then ffmpeg assembles the PNG
sequence into H.264 and mixes in the audio.

This kit was factored out of the FlexiTaka "COMING SOON" teaser, which is
included here as the working default.

> **Length is not fixed.** The video is exactly as long as the sum of the scene
> durations — 5 seconds, 30 seconds or 60 seconds, whatever you set. Nothing in
> the pipeline hard-codes the length.

---

## Get started in three commands

```bash
git clone https://github.com/44389486348364869789/flexitaka-video-kit.git
cd flexitaka-video-kit
npm install && ./render.sh
```

You get the finished teaser in `output/`. To make your own video, edit
`video.config.js` and run `./render.sh` again — see
[section 4](#4-changing-the-video) and the
[prompt template](#5--prompt-template) for agents.

---

## 1. What's in the box

```
flexitaka-video-kit/
├── video.config.js          ← THE FILE YOU EDIT. length, scenes, text, colours, audio
├── render.sh                ← one-command build
├── install-deps.sh          ← system dependencies (Debian/Ubuntu)
├── package.json             ← npm manifest (single dependency: puppeteer-core)
│
├── lib/
│   ├── config.js            ← loads video.config.js
│   ├── timeline.js          ← turns scene durations into a concrete timeline
│   ├── engine.js            ← the animation itself (all CSS + drawing)
│   ├── template.js          ← generates index.html from config + engine
│   ├── capture.js           ← drives Chromium, writes every frame
│   ├── check.js             ← environment / font / overflow self-test
│   ├── plan-audio.js        ← the auto-timing brain: places every VO line
│   ├── build-audio.js       ← music + sound-effect mix, then muxes into the MP4
│   └── dump-plan.js         ← prints the resolved timeline + audio plan
│
├── assets/                  ← logo_original.png + logo_trimmed.png
├── fonts/                   ← Hind Siliguri (Bangla) + Poppins (Latin)
├── vo/                      ← voice-over clips, one per scene (unused in this cut)
├── music/                   ← background music bed
├── index.html               ← GENERATED — do not edit by hand
├── output/                  ← the finished MP4 + standalone audio
├── build/                   ← intermediate mix files + audio_report.json
└── docs/
    ├── VIDEO_CONFIG.md      ← every config field, explained
    ├── NEW_VIDEO_PROMPT.md  ← the prompt template for agents
    ├── SCENES.md            ← scene-by-scene description of the default video
    └── qa-sheets/           ← rendered contact sheets used during QA
```

---

## 2. Install

**System dependencies** (Node 18+, ffmpeg, Chromium):

```bash
sudo ./install-deps.sh          # Debian / Ubuntu
```

macOS equivalent:

```bash
brew install node ffmpeg
brew install --cask chromium
export CHROME_PATH="$(ls -d /Applications/Chromium.app/Contents/MacOS/Chromium)"
```

**Node dependency:**

```bash
npm install
```

`puppeteer-core` drives the **system Chromium** — it does not download its own
browser, so the install stays small. If Chromium is not at `/usr/bin/chromium`,
set `CHROME_PATH`:

```bash
CHROME_PATH=/path/to/chromium ./render.sh
```

**Fonts.** `fonts/` ships with the kit; nothing to install. Bangla renders with
**Hind Siliguri**, Latin with **Poppins**. Both are loaded over `http://` from a
local static server started by `render.sh` — a real HTTP origin is required,
because some Chromium builds block webfonts over `file://` and would silently
substitute a system font, breaking the Bangla conjuncts. `lib/check.js`
verifies the fonts really loaded and aborts before rendering if they did not.

---

## 3. Render

```bash
./render.sh
```

That single command does everything:

1. **Preflight** — checks node, ffmpeg, Chromium and that the config loads.
2. **Dependencies** — runs `npm install` only if `node_modules` is missing.
3. **Generate** `index.html` from `video.config.js` + `lib/engine.js`.
4. **Static server** on `127.0.0.1:8777` (override with `PORT=9000`).
5. **Self-test** — fonts, page errors, and headline overflow.
6. **Capture** one PNG per frame at the video's fps and resolution.
7. **Encode** H.264 High, yuv420p, `+faststart`.
8. **Audio** — fade the music bed, sum the sound effects on their own bus,
   duck the bed under whichever bus carries the transients, hold the true peak,
   then mux with `-c:v copy` so the picture is untouched.
9. **Verify** — re-reads the output and asserts frame count, resolution and
   duration all match the config.

### Other modes

```bash
./render.sh check      # environment + font + overflow check, renders nothing
./render.sh plan       # print the resolved timeline and where every VO line lands
./render.sh probe      # a handful of stills into frames/probe/ (fast visual QA)
./render.sh silent     # picture only, no audio, no mux
./render.sh audio      # re-mix and re-mux only, reusing the last render
node lib/dump-plan.js  # same as ./render.sh plan
```

Runtime: roughly 3–6 minutes for a 10-second video (capture is the slow part).

### Output

| File | What |
|---|---|
| `output/<outputName>.mp4` | the finished video, 1920×1080, H.264 + AAC |
| `output/audio/<outputName>_audio.mp3` | the mixed audio on its own (320 kbps) |
| `output/audio/<outputName>_audio.wav` | the mixed audio (48 kHz stereo) |
| `build/audio_report.json` | per-clip levels, ducking measurements, QC figures |

---

## 4. Changing the video

Everything lives in **`video.config.js`**. The most common edits:

| I want to change… | Edit this in `video.config.js` |
|---|---|
| **How long the video is** | the `duration` of any scene (see below) |
| **Scene order** | move entries in the `scenes` array — array order *is* timeline order |
| **Add or remove a scene** | add/delete an entry in `scenes` |
| **Any on-screen text** | that scene's `headlines[].text` |
| **Brand colours** | the `theme` block |
| **Resolution / fps / quality** | the `video` block (`crf` lower = better) |
| **Music and its level** | the `audio.music` block |
| **Voice-over lines** | each scene's `vo` block (none in this cut) |

Full field-by-field reference: **`docs/VIDEO_CONFIG.md`**.

### Length is not fixed

The video is **exactly as long as the sum of the scene `duration` values**.
Nothing is hard-coded: the frame count, the audio length, the capture loop and
the encoder all derive from the config. Make a 5-second cut, a 30-second
explainer or a 60-second ad by changing numbers.

**`designDuration` is the safety net.** It records how long the scene's
animation was drawn for. If you shorten a scene below it, the animation is
compressed to fit, so no element is ever left half-drawn or clipped at the cut.
If you lengthen a scene, the animation finishes and simply holds.

### Text is auto-fitted

Headlines are measured in the browser and automatically shrunk until they fit
the safe margin, so a long line never overflows the frame. `./render.sh check`
reports the measured overflow for every headline.

### Voice-over timing is automatic

You never hand-place a voice-over. For each scene the planner:

1. measures the real trimmed speech length of the clip with ffprobe —
   it does not guess from character counts;
2. works out the window from the scene start to the scene end, leaving a small
   tail gap;
3. fits the line by, in order of preference: placing it where `cue` says →
   sliding it earlier (never more than `spillBefore`, never over the previous
   line) → speaking it slightly faster (never past `maxSpeed`) → as a last
   resort **lengthening the scene** so the line is never cut off.

Whatever it had to do is printed by `./render.sh plan` and written into
`build/audio_report.json`. If a line had to be speeded up, the log says so.

### Music is ducked automatically

The music bed is trimmed to the video's length, faded in and out, and pushed
down under whatever carries the transients. With narration that is the **voice
bus**; in a narration-free cut like this one the **sound-effect bus** drives it
instead, so the bed still breathes under each transition accent. With neither,
the bed passes through un-ducked rather than being fed an empty input. If there
is no voice bus at all, `build-audio.js` skips that stage entirely instead of
summing zero inputs. The QC report prints the measured level in an accent
window and in a quiet window.

### The logo is never altered

`assets/logo_original.png` is the untouched source. `logo_trimmed.png` is the
same artwork with only its transparent margin cropped off — zero pixels changed.
The end-card light sweep is **brightness-only**, masked through the logo's own
shape with `mix-blend-mode: screen`; it adds light *through* the logo and never
redraws, recolours or distorts it.

**If you replace the logo, keep this rule:** crop the transparent margin if you
like, but never rescale, recolour or redraw the artwork. Point
`scenes[].props.logo` at your file and re-render.

### Third-party operator logos

The kit can show partners' brand marks, and the same never-alter rule applies to
them. `assets/logos/` holds the four marks used by the default video:

| file | brand |
|---|---|
| `assets/logos/bkash.png` | bKash |
| `assets/logos/robi.png` | Robi Axiata |
| `assets/logos/banglalink.png` | BanglaLink (the 2025 "heart B" mark) |
| `assets/logos/grameenphone.png` | Grameenphone |

Each PNG was normalised once — background made transparent, transparent margin
cropped — and **not one pixel of the mark itself was redrawn, recoloured or
rescaled**. Where they appear:

- **in a headline**, with `headlines[].logo` — the mark is rendered inline at
  `1.02em`, so it sits on the text baseline like a word would. This is how scene 1
  and scene 4 show an operator mark where the brand's written name used to be.
- **on a card**, with `props.headLogo` — used for the transfer card's header.
- **in a row**, with the `operatorGrid` scene kind — one white card per brand.
  The cards use `object-fit: contain` and a `max-width`, so every mark keeps its
  own aspect ratio no matter how the card is sized. No mark is ever stretched to
  fit a common box.

```js
// a row of marks — one entry per card
{
  id: 's5', kind: 'operatorGrid', duration: 3.5, designDuration: 3.5,
  headlines: [{ text: 'যেকোনো অপারেটরের {SIM} থেকেই', size: 74, appear: 0.03 }],
  vo: { file: 'vo/vo_s5_operators.mp3', cue: 0.55 },
  props: {
    appear: 0.16, stagger: 0.16, highlight: -1,
    operators: [
      { file: 'assets/logos/bkash.png',        alt: 'bKash' },
      { file: 'assets/logos/robi.png',         alt: 'Robi' },
      { file: 'assets/logos/banglalink.png',   alt: 'BanglaLink' },
      { file: 'assets/logos/grameenphone.png', alt: 'Grameenphone' },
    ],
  },
}
```

`highlight: -1` means no single brand is picked out. Set it to a card's index to
put the yellow ring on that one instead.

> **These are third-party trademarks.** They are used here because the client
> asked for them. Get written permission / legal clearance from each brand
> before publishing. See [section 7](#7-notes-and-caveats).

### Sound effects

`sfx/` holds four short effects, all synthesised by `sfx/make_sfx.sh` with
ffmpeg, so the kit ships no third-party sample and the sound design is
reproducible from scratch:

| file | what it is | used for |
|---|---|---|
| `whoosh.mp3` | filtered pink-noise swell | scene entrances and cuts |
| `click.mp3` | 45 ms sine tick | a UI press |
| `ding.mp3` | 988 Hz + two bell partials | a confirmation |
| `riser.mp3` | 1.3 s white-noise swell | into the end reveal |

They are placed **relative to a scene**, so they travel with the timeline when
you change scene lengths — exactly like transitions:

```js
audio: {
  sfx: {
    masterGainDb: -6,          // the whole bus; -9 when narration has to stay on top
    cues: [
      { file: 'sfx/whoosh.mp3', anchor: 's1', at: 0.02, gainDb: -3 },
      { file: 'sfx/ding.mp3',   anchor: 's1', at: 2.24, gainDb: -1 },
      { file: 'sfx/riser.mp3',  anchor: 's6', at: -0.90, gainDb: -4 },  // starts just before the cut
    ],
  },
}
```

The effects are summed on their **own bus** and ducked under whichever bus
carries the transients — the voice bus when there is narration, otherwise the
effects bus itself. Anything outside the
timeline is skipped with a printed note rather than failing the render.

---

## 5. 🎬 Prompt Template

**Copy this into a new chat with your agent whenever you want a new video.**
The agent should ask you for anything you leave blank, then edit
`video.config.js` and run `./render.sh`.

```
Make a new video with the FlexiTaka Video Kit in flexitaka-video-kit/.

Here is what I want:

  LENGTH      : <total seconds>
  SCENE PLAN  : <for each scene: what it shows, and the exact on-screen text>
  BRAND       : <colours, or say "keep the FlexiTaka green/white/yellow">
  VOICE-OVER  : <Bangla lines, or say "keep the existing clips" / "no voice-over">
  MUSIC       : <keep the existing bed / no music / a different mood>
  LOGO        : <keep the FlexiTaka logo, or give me a new file to use>

Please:
  1. read docs/VIDEO_CONFIG.md and docs/NEW_VIDEO_PROMPT.md first,
  2. edit only video.config.js (plus vo/ or music/ if I gave new assets),
  3. keep the existing visual design and the logo-untouched rule,
  4. run ./render.sh plan and show me the timeline before rendering,
  5. run ./render.sh and give me the finished MP4.
```

A longer version, with the rules an agent should follow and the follow-up
questions it should ask, is in **`docs/NEW_VIDEO_PROMPT.md`**.

### Worked example — a 20-second cut with different text

> Make a new video with the FlexiTaka Video Kit.
> I want it **20 seconds** long instead of 10, with the same five scenes but
> slower pacing: scene 1 gets 6s, scene 2 and 3 get 4s each, scene 4 gets 5s and
> the end card gets 1s. Change scene 3's headline to
> `আপনার SIM-এ জমে থাকা টাকা` and keep everything else as it is. Reuse the
> existing voice-over clips and music. Run `./render.sh plan` first so I can see
> the timing, then render.

The agent edits only the `duration` values and that one headline text, runs
`./render.sh`, and you get a 20-second video. Nothing else in the project
changes — the capture loop, the encoder and the audio mix all follow the config.

### Worked example — a silent 8-second vertical teaser

> Take the FlexiTaka Video Kit and make an 8-second **silent** teaser at
> **1080×1920** (9:16). Keep scenes 1, 4 and 5 only, 3s / 4s / 1s. Set
> `audio.enabled` to false. Keep the logo and the colours.

The agent sets `video.width`/`video.height`, removes two scenes from the array,
sets the three durations, and sets `audio.enabled: false`. `./render.sh` then
skips every audio step and just produces the silent MP4.

### Worked example — reordering and dropping scenes

> Remove scene 3 from the FlexiTaka Video Kit and move the end card to 0.5s.
> Make the video 8 seconds total.

The agent deletes that array entry (any transition or `vo` block pointing at the
deleted `id` is removed with it — the config validator fails loudly if one is
left dangling), shortens scene 5, and confirms the total with
`./render.sh plan`.

---

## 6. Verified — this kit reproduces the teaser

The default config renders the FlexiTaka "COMING SOON" teaser exactly:

```
duration   : 20.000000 s  (exact, matches the config)
frames     : 600 @ 30 fps  (exact)
resolution : 1920 x 1080, yuv420p, H.264 High
audio      : AAC, 48 kHz stereo — music bed + transition effects (no narration)
true peak  : -1.5 dBTP     (no clipping; flat factor 0.0)
```

Six scenes: a transfer card that becomes a recharge confirmation → a SIM card
→ a counter → a flow to wallet → a row of operator marks → the end card.

The pipeline was also run from a **clean extraction** of the delivered ZIP —
fresh `npm install`, then `./render.sh` — to confirm the source genuinely
produces the video, not just that a video exists.

Two things the kit checks automatically, because both are easy to get wrong and
neither shows an error:

- **Silent font substitution.** `lib/check.js` measures a Bangla sample string
  in the intended family against a generic fallback. Equal widths mean the
  webfont did not load — the render aborts instead of shipping broken conjuncts.
- **An altered picture during the mux.** `lib/build-audio.js` records the video
  stream's MD5 before and after muxing and prints PASS/FAIL. The picture is
  copied, never re-encoded.

---

## 7. Notes and caveats

- **Render determinism.** `window.seek(t)` is a pure function of the timestamp,
  so re-rendering produces the same frames. Sub-pixel differences in font
  rasterisation can appear between Chromium versions; composition and timing do
  not change.
- **Adding a new visual.** Scene *kinds* live in `lib/engine.js` (`MARKUP` for
  the DOM, `DRAW` for the animation) and are listed in `KNOWN_KINDS` in
  `lib/timeline.js`. Add a function to each, register the kind, and reference it
  from the config. Existing kinds: `transferCard`, `simCard`, `counterBars`,
  `flowToWallet`, `operatorGrid`, `logoReveal`.
- **The `frames/` directory is generated**, not shipped. `render.sh` recreates it.
- **Third-party trademarks — clearance required.** The default video displays
  four third-party marks: **bKash**, **Robi Axiata**, **BanglaLink** and
  **Grameenphone** (as logo images), and the word "বিকাশ" in the voice-over. These belong to
  their respective owners and are used here on the client's explicit instruction.
  **Written permission / legal clearance from every brand should be obtained
  before the video is published, broadcast or run as an advertisement.** Using a
  mark to state compatibility is not the same as being licensed to advertise with
  it. To drop any of them, delete its `operators[]` entry (and the `headLogo` /
  `headlines[].logo` references) in `video.config.js` and re-render; a neutral
  wording such as `মোবাইল ওয়ালেট বা ব্যাংকে` can stand in for a brand name.
- **No people, no photographs, no stock footage, no emojis, no watermarks** —
  the design is typography and simple vector symbols only.
