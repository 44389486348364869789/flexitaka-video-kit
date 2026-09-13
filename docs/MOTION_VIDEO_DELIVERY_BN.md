# FlexiTaka Motion Video — Delivery Index (v11 "dense motion")

**Final video:** https://static.teamily.ai/sites/8c8a17b9-8738-4d1b-b337-8e9547d0db02/documents/flexitaka_motion_video/flexitaka_service_video_46s_motion.mp4

| Deliverable | Link |
|---|---|
| Final MP4 | `documents/flexitaka_motion_video/flexitaka_service_video_46s_motion.mp4` |
| Audio MP3 320 kbps | `documents/flexitaka_motion_video/flexitaka_motion_audio_320.mp3` |
| Audio WAV (master) | `documents/flexitaka_motion_video/flexitaka_motion_audio.wav` |
| Still s1 | `documents/flexitaka_motion_video/stills/s1_problem.png` |
| Still s2 | `documents/flexitaka_motion_video/stills/s2_marketplace_match.png` |
| Still s3 | `documents/flexitaka_motion_video/stills/s3_problem_plain.png` |
| Still s4 | `documents/flexitaka_motion_video/stills/s4_app_flow.png` |
| Still s5 | `documents/flexitaka_motion_video/stills/s5_operators_3.png` |
| Still s6 | `documents/flexitaka_motion_video/stills/s6_endcard.png` |
| QA report | `docs/DENSE_MOTION_QA_BN.md` |

---

## Why v10 was rejected

The v10 cut read like a slideshow. Measured on extracted frames:

- **Scene 2 held one near-identical frame for ~11 seconds.** From 0.5s to 17.5s the two cards, the brand mark and the MARKETPLACE pill sat in the same place — only the ambient particles drifted. Nothing inside the cards moved.
- Scenes 1 and 3 finished their entrance and then froze.
- No element ever travelled, counted, drew or stamped — only faded in.
- Scene 4's app screen was a static mock-up: no press, no transition, no loading state.
- Nothing was synced to the narration, so the cuts felt arbitrary.

## What v11 does instead

Every scene is split into **sub-beats of roughly 1–2 seconds**, each with its own motion graphic and its own word-level text animation.

- **Nothing is ever a still frame.** Two background grids pan in opposite directions, 26 particles rise on staggered paths, three light orbs drift, and a light streak crosses the frame roughly every 7 seconds. The end card gets a **second** sweep so its 5-second hold never looks frozen.
- **Text animates by word**, not by fade: every label renders as a word-mask (`.wd` > `.wdi`) that rises into place on its own delay. The mask carries padding so Bengali conjuncts and below-baseline vowel signs are never clipped.
- **All motion is eased** — `eo` (ease-out), `eio` (ease-in-out) and `eoback` (overshoot). Marks, badges and ticks *stamp* rather than slide.
- **The centrepiece match is real motion:** the balance token and the recharge token leave opposite sides, meet on the beam at the centre, and the ring fires outward on contact.
- **The app screen behaves like an app:** rows cascade in, each tick draws its own stroke with a press ripple, the confirm button depresses, a spinner runs, then a success sheet drops from the top.
- **49 sound accents** are placed on the same sub-beat boundaries the motion uses, so every visual change is audible. They sit far below the voice.

## Timing

Total 46.2 s, set by the client's own recording (39.44 s), with a **1.77 s silent brand hold** at the end.

| Scene | Window | Kind | What it shows |
|---|---|---|---|
| s1 | 0.0–3.6 | splitCompare | the problem, two sides, drawn not shown |
| s2 | 3.6–14.4 | twoSidedMatch | the marketplace match — the centrepiece |
| s3 | 14.4–22.1 | splitCompare | the problem, named plainly |
| s4 | 22.1–32.7 | appStep | the in-app flow, live presses not a screenshot |
| s5 | 32.7–41.0 | operatorGrid | Banglalink · Robi · Grameenphone |
| s6 | 41.0–46.2 | logoReveal | brand + slogan, held to the last frame |

Per-sub-beat tables are in `docs/DENSE_MOTION_QA_BN.md`.

## Verified

```
h264 High · yuv420p · 1920x1080 · 30/1 fps · 1386 frames read back
aac LC · 48000 Hz · stereo · 46.200000 s
-14.3 LUFS · -1.6 dBTP · LRA 4.6 LU · flat factor 0 (no clipping)
video stream MD5 identical before and after the audio mux
Bengali spelling: OCR of 17 rendered frames — 0 errors, 0 broken conjuncts
font substitution: none (Hind Siliguri 1002.0 vs fallback 787.8)
```

One real defect was caught and fixed: in s5 the cards converged too far and the outer
cards painted over the middle logo (at 38.8 s "banglalink" read as "bangla" and "robi"
as "ro"). The shift was reduced to 30 px so the cards touch but never overlap.

## Brand use

Operator marks shown: **Banglalink, Robi, Grameenphone** — the three named by the client.
No payment-brand mark appears anywhere: the payout destinations in s4 are spelled in
words, with no third-party logo.

All three operator marks are third-party registered trademarks. Written permission from
each brand is required before public advertising or broadcast.
