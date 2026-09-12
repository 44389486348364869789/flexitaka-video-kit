# Scene-by-scene frame QA — 20s narration-free cut

Video: `flexitaka_coming_soon_teaser_20s_no_voice.mp4`
Method: frames extracted at the timestamps below and read back visually. This is the
per-frame check of **both** reported problems.

---

## Problem 1 — "COMING SOON" must appear only in the last scene

The end card is scene 6, which occupies **14.500s → 20.000s** — the final 5.5 seconds.
Inside that scene the elements fade in on a design clock of 5.5s, so the yellow
"COMING SOON" pill first reaches full strength at about **15.05s**.

| t | Scene on screen | Yellow "COMING SOON" pill | FlexiTaka logo | Operator logos | Main element |
|---|---|---|---|---|---|
| 0.50s | s1 | **NO** | no | no | transfer card, `bKash থেকে টাকা পাঠাতে গিয়ে...` |
| 3.30s | s1 | **NO** | no | no | card tail, `SIM RECHARGE SUCCESSFUL` |
| 3.70s | s2 | **NO** | no | no | SIM card, `ভুল করে SIM-এ রিচার্জ করে ফেলেছেন?` |
| 5.70s | s2 | **NO** | no | no | SIM card with badge and warning mark |
| 6.30s | s3 | **NO** | no | no | counter bars, `SIM-এ অতিরিক্ত টাকা পড়ে আছে?` |
| 8.30s | s3 | **NO** | no | no | counter bars, ৳ value counting up |
| 9.00s | s4 | **NO** | no | no | particles travelling SIM → wallet |
| 10.70s | s4 | **NO** | no | no | `খুব শীঘ্রই আসছে...` |
| 11.20s | s5 | **NO** | no | starting | operator row begins, bKash in |
| 12.50s | s5 | **NO** | no | **YES** | four operator marks on white cards |
| 14.20s | s5 | **NO** | no | **YES** | operator row at full strength |
| 14.80s | s6 | **NO** | **yes** | no | end card, logo + `SIM BALANCE TO CASH` |
| **15.30s** | s6 | **YES** | yes | no | pill faded in |
| 16.50s | s6 | **YES** | yes | no | end card held |
| 18.00s | s6 | **YES** | yes | no | end card held |
| 19.90s | s6 | **YES** | yes | no | last frame of the video |

**Result: PASS.** The pill is absent in every frame of scenes 1–5 and appears only
inside scene 6, from ~15.05s to the end — i.e. within the last 5.5 seconds, exactly
as asked. Nothing from a later scene appears early.

### Transition / overlay leakage

Checked at every scene boundary (the frame before the cut and the frame after):

| Boundary | Before | After | Leak? |
|---|---|---|---|
| s1 → s2 (3.5s) | transfer card | SIM card | none |
| s2 → s3 (6.0s) | SIM card | counter bars | none |
| s3 → s4 (8.5s) | counter bars | particles | none |
| s4 → s5 (11.0s) | particles | operator row | none |
| s5 → s6 (14.5s) | operator row | end card | none |

No flash, sweep or overlay from one scene is visible in a neighbouring scene.

### What was changed in the code

`lib/engine.js` now applies a **hard scene-window gate** in `render()`:

```js
var inWindow = (t >= s.start && t <= s.end);
root.style.display = inWindow ? '' : 'none';
if (!inWindow) return;
```

Previously the only guard was a loose `t <= s.start - 1 || t >= s.end + 1` test, so
a scene root kept being drawn for a full second outside its own window. Because each
scene root has `opacity: min(fadeIn, fadeOut)` and the **last** scene is deliberately
built with `fadeOut = 0`, scene 6's elements were painted — at full opacity — up to a
second *before* scene 6 began. The hard gate makes it structurally impossible for any
scene's layers to be painted outside its own window, whatever any child's own opacity
is set to.

---

## Problem 2 — voice-over removed

- **Video:** no speech anywhere. `audio.clips` count in the QC report is **0** and no
  scene in `video.config.js` carries a `vo` block.
- **Soundtrack:** music bed + 12 transition effects only.
- The audio build now skips the voice bus entirely and feeds the music side-chain from
  the **sound-effect bus**, so the bed still breathes under each accent.

### Measured levels (final MP4 audio stream)

| Metric | Value |
|---|---|
| Integrated loudness | **−16.8 LUFS** |
| Loudness range (LRA) | 3.0 LU |
| True peak | **−1.5 dBTP** |
| Sample peak | −1.501 dBFS |
| RMS | −19.26 dBFS |
| Flat factor | **0.000000** (no clipping) |
| Peak count | 2 |
| DC offset | 0.00032 |

Music level was raised from **−13 dB to −9 dB** now that nothing has to sit on top of
it, and the effect bus from −9 dB to −6 dB. No clipping: `flat factor 0.0`, peak
pinned exactly at the −1.5 dBTP ceiling by the limiter.

---

## Unchanged from the previous cut (as required)

| Requirement | Status |
|---|---|
| Length 20.000s | ✅ exact |
| 6 scenes | ✅ s1 transferCard, s2 simCard, s3 counterBars, s4 flowToWallet, s5 operatorGrid, s6 logoReveal |
| bKash / Robi / BanglaLink (new) / Grameenphone logos | ✅ all four present in scene 5, bKash also in scenes 1 and 4 |
| FlexiTaka logo 100% unaltered | ✅ same file, never redrawn, recoloured or distorted |
| Green / white / yellow palette | ✅ unchanged |
| 1920×1080 @ 30 fps | ✅ exact, 600 frames |
