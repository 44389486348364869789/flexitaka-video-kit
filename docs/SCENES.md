# SCENES.md — the default video, scene by scene

The default config renders the FlexiTaka **"COMING SOON"** teaser: 10.000s at
30 fps, 1920×1080, with Bangla voice-over and a ducked music bed.

Style rules the whole video obeys: green/white/yellow brand palette, clean
motion graphics, **no people, no photographs, no stock footage, no emojis, no
extra logos, no watermark**. Typography and simple vector symbols only.

---

## Scene 1 — `s1` — 0.000s → 3.000s — `transferCard`

| | |
|---|---|
| **Headline** | `বিকাশে টাকা পাঠাতে গিয়ে...` |
| **Voice-over** | `বিকাশে টাকা পাঠাতে গিয়ে…` — starts at 0.200s |
| **Music** | fading in from 0s over 1.0s |

A white transfer card rises into frame. Two placeholder rows populate one after
the other; the yellow **SEND MONEY** button pulses, then a ripple crosses it.

Then the accidental action: the button cross-fades to **RECHARGE**, the card
dims, and a confirmation sheet slides up from the bottom carrying a green disc
with a drawn-on check mark, `SIM RECHARGE` and `SUCCESSFUL`.

That is the whole beat — a normal transfer that turns into the wrong recharge.

---

## Scene 2 — `s2` — 3.000s → 5.000s — `simCard`

| | |
|---|---|
| **Headline** | `ভুল করে {SIM}-এ রিচার্জ করে ফেলেছেন?` |
| **Voice-over** | `ভুল করে রিচার্জ হয়ে গেছে?` — starts at 3.150s |

A large SIM card fades up centre-frame, holds, then shakes left and right — the
"that's not what I wanted" beat. A white success badge with a green check pops
onto its lower corner. A yellow warning mark settles in above.

---

## Scene 3 — `s3` — 5.000s → 7.000s — `counterBars`

| | |
|---|---|
| **Headline** | `{SIM}-এ অতিরিক্ত টাকা পড়ে আছে?` |
| **Voice-over** | `অতিরিক্ত টাকা পড়ে আছে?` — starts at 5.150s |

A smaller SIM card sits at the left. Six bars grow one after another from a
dashed baseline; the last one is yellow. A green pill rides up with the tallest
bar, counting to **৳ 2,450** — the unused balance piling up.

---

## Scene 4 — `s4` — 7.000s → 9.000s — `flowToWallet`

| | |
|---|---|
| **Headline 1** | `{SIM}-এর অতিরিক্ত টাকা কি` — appears at 7.750s, exits at 8.120s |
| **Headline 2** | `বিকাশ বা ব্যাংকে নিতে চান?` — appears at 7.850s, exits at 8.120s |
| **Headline 3** | `খুব শীঘ্রই আসছে...` — appears at 8.220s, with glow |
| **Voice-over** | `বিকাশে নাকি ব্যাংকে?` — starts at 7.050s |
| **Transition** | `flash` at 8.840s for 0.32s, strength 0.34 |

The question is asked over a SIM card on the left and a wallet on the right,
joined by a dashed arc. Seven yellow particles travel along the arc from the
SIM into the wallet — the balance moving into a digital wallet.

As the voice finishes, the first two headlines swap to
`খুব শীঘ্রই আসছে...` over a soft yellow glow, and a white flash wipes the
scene away.

---

## Scene 5 — `s5` — 9.000s → 10.000s — `logoReveal`

| | |
|---|---|
| **Logo** | `assets/logo_trimmed.png` — the uploaded FlexiTaka logo, unaltered |
| **Tagline** | `SIM BALANCE TO CASH` |
| **Call to action** | `COMING SOON` in a yellow pill |
| **Voice-over** | `শীঘ্রই আসছে!` — starts at 8.550s, i.e. before the scene begins |
| **Transition** | `sweepFrame` at 9.280s for 0.62s |

The logo fades up and settles under a soft green radial glow. The tagline
fades in beneath it, its letter-spacing tightening as it lands. The yellow
`COMING SOON` pill rises and scales into place.

A **brightness-only** light sweep then travels across the logo, masked through
the logo's own shape with `mix-blend-mode: screen`. It adds light *through* the
artwork — it never redraws, recolours or distorts it.

**The end card holds.** The final scene has no fade-out, so the logo is at full
strength on the last frame of the video.

---

## The voice-over script

Deliberately shorter than the on-screen text. The full sentences stay on screen
(the brand message); the narration reads the keyword version, which is how a
professional ad is normally cut.

| Scene | Screen text | Spoken |
|---|---|---|
| 1 | বিকাশে টাকা পাঠাতে গিয়ে... | বিকাশে টাকা পাঠাতে গিয়ে… |
| 2 | ভুল করে SIM-এ রিচার্জ করে ফেলেছেন? | ভুল করে রিচার্জ হয়ে গেছে? |
| 3 | SIM-এ অতিরিক্ত টাকা পড়ে আছে? | অতিরিক্ত টাকা পড়ে আছে? |
| 4 | SIM-এর অতিরিক্ত টাকা কি বিকাশ বা ব্যাংকে নিতে চান? | বিকাশে নাকি ব্যাংকে? |
| 5 | COMING SOON | শীঘ্রই আসছে! |

Each line is peak-normalised independently so the five clips sit at a
consistent level, and each is placed inside its own scene window by
`lib/plan-audio.js`.

---

## Brand-name note

Scenes 1 and 4 display **"বিকাশ" (bKash)**, a third-party trademark. That was the
explicit instruction for this teaser, but a legal/brand review is advisable
before public use. The neutral alternative `মোবাইল ওয়ালেট বা ব্যাংকে` can be
substituted in the headline text in `video.config.js` and the video re-rendered
in one command.
