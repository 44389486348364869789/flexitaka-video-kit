# Sub-beat timing tables — v11 "dense motion" cut

Scene-local (design) clock. Rule enforced: **something new happens on screen every 1–2 seconds,
and no frame is ever a still.**

Full QA report (old-video diagnosis, OCR results, UI/UX checks, audio levels):
`docs/DENSE_MOTION_QA_BN.md`

---

## s1 — `ফ্লেক্সিটাকা কি?` · 0.00–3.60s

| Time (s) | Motion | Text |
|---|---|---|
| 0.12–0.66 | left card flies in; the SIM outline **draws itself** (stroke draw) | "অব্যবহৃত" rises word by word |
| 0.34–0.90 | right card flies in; **signal bars grow one at a time** | "রিচার্জ" rises word by word |
| 0.70–1.26 | the dashed **beam draws top-down** — it stays broken, never joins | — |
| 0.86–1.58 | **৳ 0 → ৳ 500 count-up** | ৳ 500 |
| 1.26–1.62 | **alert badge stamps in** with overshoot | — |
| 1.58–2.02 | warning tag lifts in | "ভুল হয়ে যায়" |
| continuous | card sheen, inner spark drifting | — |

## s2 — `দুই প্রয়োজন, এক জায়গায়` · 3.60–14.40s ← the centrepiece

| Time (s) | Motion | Text |
|---|---|---|
| 0.20–0.98 | both side panels **float in**; icon outlines draw | — |
| 0.90–1.44 | **FlexiTaka mark stamps into the centre** (overshoot) | — |
| 1.00–1.90 | **৳ 0 → ৳ 2,450 count** | ৳ 2,450 |
| **1.20–2.05** | **the two value tokens leave opposite sides and meet in the middle** — this meeting is the core idea | — |
| 2.05–2.67 | on contact the **ring fires outward + pulse** | — |
| 2.50–2.96 | **MARKETPLACE pill** lands | MARKETPLACE |
| 3.40–4.60 | a **dot travels left→right along the beam** — "matching" shown as continuous flow | — |
| 8.50–9.60 | flow line rises word by word | অতিরিক্ত ব্যালেন্স ➜ ভ্যালু ➜ কম দামে রিচার্জ |
| 8.60+ | brand mark **breathes** (2% scale oscillation) | — |

## s3 — `ভুল করে রিচার্জ, না দরকারের বেশি ব্যালেন্স?` · 14.40–22.10s

| Time (s) | Motion | Text |
|---|---|---|
| 0.12–0.90 | both cards in, icons draw | — |
| 0.70–1.26 | dashed beam draws | — |
| **1.20–3.40** | **৳ 300 drains to ৳ 0; the bar shrinks and turns orange** | ৳ 300 → ৳ 0 |
| 1.26–1.62 | alert badge stamps in | — |
| 1.58–2.02 | badge lifts in | "দামি হয়ে যায়" |

## s4 — `ব্যালেন্সের ভ্যালু নিন ক্যাশ হিসেবে` · 22.10–32.70s

| Time (s) | Motion | Text |
|---|---|---|
| 0.28–0.86 | **phone panel lands, then floats continuously** | — |
| 0.42–1.00 | ৳ 2,450 count-up | — |
| 0.60 / 1.15 / 1.70 | **three payout rows cascade in** | বিকাশ · নগদ · ব্যাংক অ্যাকাউন্ট |
| 1.02 / 1.57 / 2.12 | **each row's tick overshoots in + draws its stroke + press ripple** (a real press, not a screenshot) | — |
| 3.85 | **button built; at 5.32 it depresses + ripple spreads** | নিশ্চিত করুন |
| 5.60 | **spinner runs → success sheet drops from the top** | — |
| 6.90–7.60 | green circle draws + tick stroke | রিকোয়েস্ট সম্পন্ন / ভ্যালু পাঠানো হয়েছে |
| 8.20–9.40 | **the calc block opens line by line** | ব্যবহৃত ব্যালেন্স ৳ 2,450 · যা পাবেন ক্যাশ ভ্যালু |
| continuous | step indicator (3 dots) advances and pulses | — |

## s5 — `যেকোনো অপারেটরের সিমে` · 32.70–41.00s

| Time (s) | Motion | Text |
|---|---|---|
| 0.66 / 1.16 / 1.66 | **three cards drop in on separate beats; logos scale in with overshoot** | — |
| 1.00 / 1.50 / 2.00 | one sheen crosses each card | — |
| 2.60–3.10 | **equaliser bars bounce — "any of these" carried in motion** | — |
| 3.40–3.80 | badge stamps in | যেকোনো অপারেটর |
| **4.30–5.50** | **the three cards draw slightly closer (30 px — deliberately small so none paints over another)** | — |
| 5.60–6.12 | rule line draws out from the centre | — |
| 6.12+ | the row breathes slowly | — |

> Fix note: this gather was originally much larger and slid the outer cards over the middle
> one, painting over the Robi mark (at 38.8 s the names read "bangla" and "ro"). Reduced to
> 30 px — the cards touch, never overlap.

## s6 — brand card · 41.00–46.20s

| Time (s) | Motion | Text |
|---|---|---|
| 0.02–0.52 | logo rises from below, glow blooms | — |
| 0.42–1.05 | tagline rises **word by word** | Your SIM Balance, More Value. |
| 0.92–1.42 | gold rule draws from the centre | — |
| 0.46–0.92 | **light sweep 1** (arrival) | — |
| 1.45–2.07 | **light sweep 2** (mid-hold — so the hold never looks frozen) | — |
| 0.95+ | logo and glow drift slowly | — |
| 3.12–4.44 | **final voice line** | — |
| 4.44–4.62 | **silent brand hold** (1.77 s) | — |

---

## Sound accents

**49 accents**, each anchored to a sub-beat boundary so the picture's changes are audible:

| Effect | Used for |
|---|---|
| `whoosh` | scene entry / cut moment |
| `click` | UI press, card landing |
| `tick` | tokens, small steps |
| `pop` | badges, marks appearing |
| `chime` | the match, success |
| `ding` | confirmation, brand return |
| `riser` | pull before a scene change |

All synthesised with ffmpeg — no third-party samples. Levels sit well under the voice.

```
sfx bus    peak -13.24 dBFS   rms -33.07 dBFS
voice      peak  -3.00 dBFS (normalised)
delivered  -14.3 LUFS · -1.6 dBTP · LRA 4.6 LU · flat factor 0 (no clipping)
music while speech  -23.5 dB
music in gaps       -31.4 dB   ← ducked under the voice
```

## Scene timing

| Scene | Window | Kind | Shows |
|---|---|---|---|
| s1 | 0.0–3.6 | splitCompare | the problem, two sides, drawn not shown |
| s2 | 3.6–14.4 | twoSidedMatch | the marketplace match — the centrepiece |
| s3 | 14.4–22.1 | splitCompare | the problem, named plainly |
| s4 | 22.1–32.7 | appStep | the in-app flow, live presses |
| s5 | 32.7–41.0 | operatorGrid | Banglalink · Robi · Grameenphone |
| s6 | 41.0–46.2 | logoReveal | brand + slogan, held to the last frame |

Total 46.2 s; the client's recording is 39.44 s with 6 spoken lines; end hold 1.77 s.

## Brand use

Operator marks shown: **Banglalink, Robi, Grameenphone** only. No payment-brand mark appears
anywhere — the payout destinations in s4 are spelled in words with no third-party logo.

All three are third-party registered trademarks; written permission is required before public
advertising or broadcast.
