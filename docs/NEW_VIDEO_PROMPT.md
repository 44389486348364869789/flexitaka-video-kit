# Making a new video — the agent prompt template

Hand this file to your agent, or paste the template below into a new chat.

---

## The template

```
Make a new video with the FlexiTaka Video Kit in flexitaka-video-kit/.

Here is what I want:

  LENGTH      : <total seconds>
  SCENE PLAN  : <for each scene: what it shows, and the exact on-screen text>
  BRAND       : <colours, or "keep the FlexiTaka green/white/yellow">
  VOICE-OVER  : <Bangla lines, or "keep the existing clips" / "no voice-over">
                ("no voice-over" means: leave every scene without a `vo` block.
                 The music level and the duck settings are rebalanced for you.)
  MUSIC       : <keep the existing bed / no music / a different mood>
  LOGO        : <keep the FlexiTaka logo, or give me a new file to use>

Please:
  1. read docs/VIDEO_CONFIG.md and docs/NEW_VIDEO_PROMPT.md first,
  2. edit only video.config.js (plus vo/ or music/ if I gave new assets),
  3. keep the existing visual design and the logo-untouched rule,
  4. run ./render.sh plan and show me the timeline before rendering,
  5. run ./render.sh and give me the finished MP4.
```

---

## What the agent should ask if you left something blank

Ask before editing anything — a wrong assumption wastes a full render:

1. **How long?** Total seconds, or a duration per scene.
2. **How many scenes, in what order?** And should any existing scene be dropped?
3. **Exact on-screen text, per scene** — Bangla is spelling-sensitive, so it
   should be given, not guessed.
4. **Is there a voice-over?** If yes, the lines. If a line is new, it has to be
   synthesised into `vo/` first.
5. **Same colours, or different?**
6. **Same logo, or a new file?**
7. **Does the music bed change?**

---

## Rules the agent must follow

1. **Edit `video.config.js` — not the machinery.** `lib/engine.js` holds the
   *design*; only touch it when the request is a genuinely new visual, not a
   text/time change.
2. **The logo is never altered.** `assets/logo_original.png` stays byte-identical.
   The end-card sweep is brightness-only and masked through the logo's shape.
3. **Length is derived, never hard-coded.** The video is exactly the sum of the
   scene `duration` values.
4. **`designDuration` protects the animation.** When shortening a scene below its
   design length, the animation compresses to fit rather than being clipped. If
   you author a new scene, set `designDuration` to the length you drew it for.
5. **Let the planner handle voice-over timing.** Place lines with `cue` and
   `spillBefore`; do not hand-tune milliseconds. Use `./render.sh plan` to check.
6. **Run `./render.sh plan` before `./render.sh`.** It is instant and catches a
   wrong total length or a voice-over that cannot fit.
7. **Verify after rendering.** Confirm duration, frame count and resolution
   against the config, and confirm the video stream MD5 is unchanged across the
   audio mux.

---

## Worked examples

### 20 seconds, same six scenes, slower pacing

> "Make the video 20 seconds: scene 1 = 4s, scene 2 and 3 = 3s each,
> scene 4 = 3s, the operator row = 3.5s, and the end card held for 3.5s.
> Keep everything else the same."

The agent changes six `duration` values and re-renders. Because transitions and
sound effects are anchored to scenes, they follow the new timings automatically.

### Add a row of partner logos

> "Add a scene after the wallet flow that shows our four partner logos in a row —
> bKash, Robi, BanglaLink and Grameenphone — and drop the scene that shows a SIM
> card on its own. Hold each logo row for 3 seconds."

The agent adds a `operatorGrid` scene, deletes the old one, and puts the logo
files in `assets/logos/`.

### 8 seconds, silent, vertical

> "Cut it to 8 seconds, 1080x1920, no audio at all, and drop the end card."

The agent edits `video.width` / `video.height`, sets `audio.enabled = false`, and
removes the `logoReveal` entry (the validator would otherwise stop the render if a
transition still pointed at it).

### Reorder + drop a scene

> "Put the operator row first, and delete the counter scene."

Scene order is array order, so the agent moves one entry and deletes another. If
anything still references the deleted scene's `id`, validation fails loudly
rather than rendering something wrong.

### New text only

> Keep the FlexiTaka teaser exactly as it is, but change scene 1's headline to
> `মোবাইল ওয়ালেটে টাকা পাঠাতে গিয়ে...`.

*Agent edits:* one string. Then `./render.sh`.

---

## Where the pieces live

| You want to change… | File |
|---|---|
| timing, text, colours, audio levels, scene order | `video.config.js` |
| how a scene *looks* or animates | `lib/engine.js` |
| the auto-timing rules for voice-over | `lib/plan-audio.js` |
| the audio mix, ducking, true-peak ceiling | `lib/build-audio.js` |
| the build steps themselves | `render.sh` |