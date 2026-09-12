# SCENES.md — the default video, scene by scene

The shipped `video.config.js` renders the **FlexiTaka "COMING SOON" teaser**:
**20.000s**, 600 frames @ 30 fps, 1920×1080, with voice-over, music bed and
sound effects.

| # | id | kind | from → to | length |
|---|---|---|---|---|
| 1 | `s1` | `transferCard` | 0.000s → 3.500s | 3.5s |
| 2 | `s2` | `simCard` | 3.500s → 6.000s | 2.5s |
| 3 | `s3` | `counterBars` | 6.000s → 8.500s | 2.5s |
| 4 | `s4` | `flowToWallet` | 8.500s → 11.000s | 2.5s |
| 5 | `s5` | `operatorGrid` | 11.000s → 14.500s | 3.5s |
| 6 | `s6` | `logoReveal` | 14.500s → 20.000s | 5.5s |

Scene timings are computed from the `duration` values — nothing is hard-coded,
so changing them re-times everything, including the audio plan.

---

## Scene 1 — `s1` — 0.000s → 3.500s — `transferCard`

A phone-money transfer card animates in and then flips into a **SIM recharge
confirmation** — the accident the whole teaser is about.

- **Headline:** an operator brand mark (inline image) followed by
  `থেকে টাকা পাঠাতে গিয়ে...`. The mark stands in for the brand's written name.
- **Card header:** the same mark, via `props.headLogo`.
- **Beat:** `SEND MONEY` → `RECHARGE` → the card resolves to
  `SIM RECHARGE / SUCCESSFUL`.
- **Sound:** whoosh on entry, click on the press, ding on the confirmation.
- **Voice-over** (`vo/vo_s1_bikash.mp3`) starts at 0.250s and runs to 2.220s.

## Scene 2 — `s2` — 3.500s → 6.000s — `simCard`

A SIM card with a success badge and a warning mark.

- **Headline:** `ভুল করে {SIM}-এ রিচার্জ করে ফেলেছেন?`
  (`{SIM}` renders in the Latin font, so the technical term reads as a term.)
- **Sound:** whoosh on entry.
- **Voice-over** (`vo/vo_s2_wrong_recharge.mp3`) at 3.700s → 5.790s.

## Scene 3 — `s3` — 6.000s → 8.500s — `counterBars`

A bar chart grows while a counter ticks up, showing money sitting unused on the
SIM.

- **Headline:** `{SIM}-এ অতিরিক্ত টাকা পড়ে আছে?`
- **Props:** `counterTarget: 2450` (with a `৳` prefix), 6 bars.
- **Sound:** click as the counter starts, ding as it lands.
- **Voice-over** (`vo/vo_s3_extra_balance.mp3`) at 6.200s → 8.073s.

## Scene 4 — `s4` — 8.500s → 11.000s — `flowToWallet`

Particles travel from the SIM symbol to the wallet, then the scene resolves into
the promise. Two headlines cross-fade out as a third appears.

- **Headlines:** `{SIM}-এর অতিরিক্ত টাকা কি` and
  `<mark> বা ব্যাংকে নিতে চান?` (the mark is the inline brand image) cross-fade
  out at 0.56, then `খুব শীঘ্রই আসছে...` grows in with a glow.
- **Transition:** a soft white flash at 10.34s covers the hand-off.
- **Sound:** whoosh into the flash.
- **Voice-over** (`vo/vo_s4_short.mp3`) at 8.600s → 10.258s.

## Scene 5 — `s5` — 11.000s → 14.500s — `operatorGrid`

A row of four third-party operator marks, one per white card, revealing left to
right. This is the scene that shows the product works on any operator.

- **Headline:** `যেকোনো অপারেটরের {SIM} থেকেই`
- **Cards:** `bkash.png`, `robi.png`, `banglalink.png`, `grameenphone.png` —
  drawn unmodified, `object-fit: contain`, so every mark keeps its own aspect
  ratio. `highlight: -1` means no single brand is singled out.
- **Sound:** whoosh + click on arrival.
- **Voice-over** (`vo/vo_s5_operators.mp3`) at 11.550s → 13.880s.

## Scene 6 — `s6` — 14.500s → 20.000s — `logoReveal`

The end card: the FlexiTaka logo, the tagline and the call to action.

- **Props:** `logo: assets/logo_trimmed.png`, `tagline: SIM BALANCE TO CASH`,
  `cta: COMING SOON`.
- **Two light sweeps** (0.38–0.80 and 1.62–2.17) cross the logo. The sweep is a
  **brightness-only layer masked by the logo itself**, so the logo file is never
  altered — no recolour, no redraw, no distortion.
- **Idle float:** a ±4px vertical drift after 0.92s keeps the long hold alive.
- **transition:** flash at the cut, riser just before it.
- **Voice-over** (`vo/vo_s6_flexitaka.mp3`) at 15.050s → 19.598s.

---

## The voice-over script

| scene | voiced line | on-screen |
|---|---|---|
| s1 | বিকাশে টাকা পাঠাতে গিয়ে… | ⟨brand mark⟩ থেকে টাকা পাঠাতে গিয়ে... |
| s2 | ভুল করে রিচার্জ হয়ে গেছে? | ভুল করে {SIM}-এ রিচার্জ করে ফেলেছেন? |
| s3 | অতিরিক্ত টাকা পড়ে আছে? | {SIM}-এ অতিরিক্ত টাকা পড়ে আছে? |
| s4 | বিকাশে নাকি ব্যাংকে? | {SIM}-এর অতিরিক্ত টাকা কি ⟨brand mark⟩ বা ব্যাংকে নিতে চান? → খুব শীঘ্রই আসছে... |
| s5 | যেকোনো অপারেটরের সিম থেকেই। | যেকোনো অপারেটরের {SIM} থেকেই |
| s6 | ফ্লেক্সিটাকা — সিম ব্যালান্স টু ক্যাশ। খুব শীঘ্রই আসছে! | SIM BALANCE TO CASH · COMING SOON |

The voice-over is deliberately **shorter than the on-screen text**. The full
sentences stay on screen as the brand message, while the narration speaks the key
phrase of each — which is how a professional ad is paced. Reading all ~69
on-screen syllables aloud would take roughly 12s on its own.

Every line is auto-placed inside its own scene by `lib/plan-audio.js`. If a line
would run past the end of its scene, the planner slides it earlier, then speaks
it up to `maxSpeed`, and only as a last resort lengthens the scene — so a line is
never cut off and two lines never overlap. Run `node lib/dump-plan.js` to see the
result, or read `build/audio_report.json` after a render.

## Sound design

| file | used for |
|---|---|
| `sfx/whoosh.mp3` | scene entrances and cuts |
| `sfx/click.mp3` | a UI press |
| `sfx/ding.mp3` | a confirmation |
| `sfx/riser.mp3` | into the end reveal |

All four are synthesised from scratch by `sfx/make_sfx.sh` (ffmpeg only), so the
kit carries no third-party sample. They are anchored to scenes, so they travel
with the timeline when you change scene lengths. Effects sit on their own bus;
music ducking is driven by the voice alone.

## Third-party trademark note

Scenes 1, 4 and 5 display marks belonging to **bKash**, **Robi Axiata**,
**BanglaLink** and **Grameenphone**, and the voice-over says "বিকাশ". These are
third-party trademarks used on the client's explicit instruction. **Written
permission / legal clearance from each brand should be obtained before the video
is published, broadcast or run as an advertisement.** To remove any of them,
delete its entry from `scenes[s5].props.operators` and the `headLogo` /
`headlines[].logo` references, then re-render.
