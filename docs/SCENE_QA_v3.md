# Scene QA — FlexiTaka "COMING SOON" teaser, 20s (v3)

**Build:** `output/flexitaka_coming_soon_teaser_20s_v3.mp4`
**Duration:** 20.000s · 600 frames @ 30 fps · 1920×1080 · H.264 + AAC (48 kHz stereo)
**Narration:** none (music bed + transition sound effects only)

This report answers the three reported defects. Every claim below was checked two
ways: **visually** (frames read from the encoded video) and **programmatically**
(`lib/qa-visibility.js`, which walks the timeline and reads each element's
effective opacity at every step).

---

## Timeline

| scene | window | on-screen content |
|---|---|---|
| s1 | 0.000 – 3.500s | 〈bKash mark〉 থেকে টাকা পাঠাতে গিয়ে... → card shows `SEND MONEY` → `SIM RECHARGE · SUCCESSFUL` |
| s2 | 3.500 – 6.000s | ভুল করে SIM-এ রিচার্জ করে ফেলেছেন? |
| s3 | 6.000 – 8.500s | SIM-এ অতিরিক্ত টাকা পড়ে আছে? (counter lands on ৳ 2,450) |
| s4 | 8.500 – 11.000s | SIM-এর অতিরিক্ত টাকা কি 〈bKash mark〉 বা ব্যাংকে নিতে চান? |
| s5 | 11.000 – 14.500s | যেকোনো অপারেটরের SIM থেকেই — Robi · BanglaLink · Grameenphone |
| s6 | 14.500 – 20.000s | FlexiTaka logo · SIM BALANCE TO CASH · COMING SOON · খুব শীঘ্রই আসছে |

---

## Defect 1 — "খুব শীঘ্রই আসছে" was appearing in the question scene

**Cause.** The end-card layers were drawn while scene 6 was still up to a full
second away. `lib/engine.js`'s `render()` guarded with
`if (t <= s.start - 1 || t >= s.end + 1) return;` — a ±1 s margin, so every scene
painted one second outside its own window. Because the end card is authored with
`fadeOut = 0` (so the logo stays fully lit on the last frame), that out-of-window
painting was at full opacity: the launch message was on screen before its scene.

**Fix.** A hard window gate — a scene's layers now cannot paint outside their own
window at all:

```js
var inWindow = (t >= s.start && t <= s.end);
root.style.display = inWindow ? '' : 'none';
if (!inWindow) return;
```

Scene 4 was also stripped of its third headline (the early
`খুব শীঘ্রই আসছে...` reveal) and its `dim` prop set to `null`, so the question no
longer fades out from under itself.

**Verified.** `lib/qa-visibility.js`, stepping the whole 20 s timeline at 0.05 s
(401 samples) and reading effective opacity of every scene element:

| element | visible from | visible to | verdict |
|---|---|---|---|
| s1:root | 0.000s | 3.500s | ok |
| s2:root | 3.500s | 6.000s | ok |
| s3:root | 6.000s | 8.500s | ok |
| s4:root | 8.500s | 11.000s | ok |
| s5:root | 11.000s | 14.500s | ok |
| s6:root | 14.500s | 20.000s | ok |
| s1–s5 :endcard-COMING SOON | — | — | never visible |
| s6:endcard-COMING SOON | **15.050s** | 20.000s | ok — inside the end card |
| s1–s5 :endcard-subline (খুব শীঘ্রই আসছে) | — | — | never visible |
| s6:endcard-subline | **15.800s** | 20.000s | ok — inside the end card |
| s1–s5 :brand-logo | — | — | never visible |
| s6:brand-logo | 14.500s | 20.000s | ok |
| s5:mark-0 Robi / mark-1 BanglaLink / mark-2 Grameenphone | 11.240s / 11.400s / 11.560s | 14.500s | ok |

**Zero leaks.** No element is visible outside its own scene window. The launch
message appears **only** in the last 4.95 s, on the end card.

---

## Defect 2 — bKash mark was appearing on every operator card

**Cause.** `scenes[s5].props.operators` listed four entries, `bkash.png` first.
The operator row rendered whatever the list held, so the bKash mark sat beside the
three mobile operators.

**Fix.** The row now holds **mobile operators only** — Robi, BanglaLink (the
current rebrand mark) and Grameenphone. The bKash mark remains where money
movement is actually discussed: scene 1's headline and the scene 4 question.
Card geometry also became config-driven, so a three-mark row is sized
deliberately rather than left looking sparse.

**Verified visually.** Frame reads from the encoded video:

- `f_00031.png` (t=1.000s, s1) — bKash mark present, inline in the headline
  "〈bKash〉 থেকে টাকা পাঠাতে গিয়ে..." **and** in the card header. No comma: this
  is a scene that talks about sending money, so the mark belongs here.
- `f_00316.png` (t=10.500s, s4) — bKash mark present, inline in the question
  "SIM-এর অতিরিক্ত টাকা কি 〈bKash〉 বা ব্যাংকে নিতে চান?". Correct.
- `f_00361.png` (t=12.000s, s5) — the row shows **Robi, BanglaLink,
  Grameenphone**. Explicitly checked: **no bKash mark in this frame.**

Aspect-ratio audit of every mark in the row (natural vs. rendered, read from the
live DOM): all keep their exact ratio to within 0.6% — nothing is stretched.
BanglaLink's source file is the smallest of the three, so it carries a per-mark
width boost; the mark itself is never stretched or recoloured.

---

## Defect 3 — scene order and story logic

The story now runs in the requested order, with each scene starting and ending on
its own window (proof in the table above):

1. **s1** — 〈bKash〉 থেকে টাকা পাঠাতে গিয়ে... → a transfer card confirming
   `SIM RECHARGE · SUCCESSFUL` (the accidental recharge)
2. **s2** — ভুল করে SIM-এ রিচার্জ করে ফেলেছেন?
3. **s3** — SIM-এ অতিরিক্ত টাকা পড়ে আছে? a counter climbing to ৳ 2,450
4. **s4** — SIM-এর অতিরিক্ত টাকা কি 〈bKash〉 বা ব্যাংকে নিতে চান? — **a question,
   and nothing else.** No launch language.
5. **s5** — যেকোনো অপারেটরের SIM থেকেই — Robi · BanglaLink · Grameenphone
6. **s6** — the payoff: FlexiTaka logo · SIM BALANCE TO CASH · COMING SOON ·
   খুব শীঘ্রই আসছে

---

## Frame-by-frame report

Times are exact frame times, `t = (n − 1) / 30`.

| frame | t | scene | what is on screen |
|---|---|---|---|
| `f_00031` | 1.000s | s1 | Transfer card on a green→white gradient. Headline "〈bKash mark〉 থেকে টাকা পাঠাতে গিয়ে...". White card with green header, two list rows, yellow `SEND MONEY` button. **No COMING SOON. No েখুব শীঘ্রই আসছে.** |
| `f_00121` | 4.000s | s2 | Fully settled question: "ভুল করে SIM-এ রিচার্জ করে ফেলেছেন?" over a dark green SIM-card graphic with a yellow chip and a green success tick. **No brand logos. No COMING SOON.** |
| `f_00211` | 7.000s | s3 | "SIM-এ অতিরিক্ত টাকা পড়ে আছে?" with a six-bar chart on a dashed baseline; the tall yellow bar carries a callout reading **৳ 2,220** (the count is still climbing toward ৳ 2,450). SIM graphic at left. **No COMING SOON.** |
| `f_00271` | 9.000s | s4 | SIM graphic and wallet graphic joined by a dashed arc, three yellow particles travelling along it. Captions are mid-transition (particles are in flight, so the headline is between beats). **No COMING SOON, no launch language.** |
| `f_00316` | 10.500s | s4 | The question fully formed: "SIM-এর অতিরিক্ত টাকা কি" / "〈bKash mark〉 বা ব্যাংকে নিতে চান?" over the SIM→wallet arc. Explicitly checked: **COMING SOON — NO. েখুব শীঘ্রই আসছে — NO.** This is the frame that proves defect 1 is fixed. |
| `f_00361` | 12.000s | s5 | "যেকোনো অপারেটরের SIM থেকেই" with three white rounded cards holding **Robi** (multi-colour icon + red wordmark), **BanglaLink** (orange heart + black wordmark) and **Grameenphone** (blue icon + wordmark). Explicitly checked: **no bKash mark.** |
| `f_00460` | 15.300s | s6 | End card. FlexiTaka logo centred above "FlexiTaka" · SIM BALANCE TO CASH flanked by thin rules · yellow pill reading **COMING SOON** · green pill reading **খুব শীঘ্রই আসছে**. Both present — correct, this is the only scene allowed to show them. |
| `f_00511` | 17.000s | s6 | Same end card, fully held: logo, wordmark, SIM BALANCE TO CASH, yellow **COMING SOON** pill, green **খুব শীঘ্রই আসছে** pill. |
| `f_00598` | 19.900s | s6 | Final held frame, 2 frames from the end: identical composition, logo fully lit. |

---

## Audio

No voice-over. Music bed (premium minimal fintech instrumental) plus 13
scene-anchored sound effects — whooshes on scene entries, clicks on UI arrivals,
dings on confirmations, a riser before the end-card reveal.

Ducking now runs from the **sound-effect bus** instead of a voice bus, so the
music lifts between accents.

| metric | value |
|---|---|
| Integrated loudness | **−16.8 LUFS** |
| True peak | **−1.5 dBTP** |
| Sample peak | −1.500 dBFS |
| RMS | −19.25 dBFS |
| **Flat factor** | **0** → no clipping |
| Peak count | 2 |
| Bed @ accent | −34.2 dBFS RMS |
| Bed @ quiet | −24.4 dBFS RMS |

Picture integrity: the video stream's MD5 is identical before and after the audio
mux (`e7ddc797…`), so no frame was re-encoded.

---

## Trademark notice

**bKash, Robi Axiata, BanglaLink and Grameenphone are third-party trademarks.**
They appear here as logo images on the client's explicit instruction. Written
permission from each brand owner is required before the video is published,
broadcast or run as an advertisement.

To produce a neutral cut, remove the mark references from
`scenes[s1].props.headLogo`, `scenes[s4].headlines[1].logo` and
`scenes[s5].props.operators`, then re-render.
