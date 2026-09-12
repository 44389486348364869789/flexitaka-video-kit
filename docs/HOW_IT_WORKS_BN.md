# এই প্রজেক্টটা আসলে কীভাবে কাজ করে — সহজ বাংলায়

**রেপো:** <https://github.com/44389486348364869789/flexitaka-video-kit>
**এই ডকুমেন্টের কমিট:** `eec7a64`
**যাচাইয়ের তারিখ:** ২০২৬-০৯-১২

---

## সংক্ষেপে এক বাক্যে

এই রেপোতে একটা **ভিডিও বানানোর কারখানা** আছে। কারখানাটা ফিক্স — আপনি শুধু একটা ফাইলের (`video.config.js`) সংখ্যা আর লেখা বদলাবেন, আর `./render.sh` চালালেই নতুন ভিডিও তৈরি হবে।

> **এটা শুধু "COMING SOON" টিজার বানানোর জন্য বন্দী না।** টিজারটা শুধু ডিফল্ট সেটিং — একটা উদাহরণ। দৈর্ঘ্য, সিন সংখ্যা, লেখা, রঙ, লোগো, মিউজিক সব বদলানো যায়।

---

## ১. রেপো আসলেই আছে ও কাজ করে কি না — লাইভ যাচাই

### ১.১ রেপোর মেটাডেটা (GitHub API থেকে সরাসরি)

```bash
curl -s https://api.github.com/repos/44389486348364869789/flexitaka-video-kit
```

**প্রকৃত ফলাফল:**

| কী | মান |
|---|---|
| মালিক/নাম | `44389486348364869789/flexitaka-video-kit` |
| ডিফল্ট ব্রাঞ্চ | `main` |
| দৃশ্যমানতা | `public` (`private: false`) |
| লাইসেন্স | **MIT** |
| তৈরি হয়েছে | ২০২৬-০৯-১২ ০৯:০১:৫৪ UTC |
| শেষ push | ২০২৬-০৯-১২ ১১:২৪:৪৫ UTC |
| ফাইল (blob) সংখ্যা | **৫৮** (`truncated: false` — অর্থাৎ পুরো তালিকা এসেছে) |
| Topics | advertising, bangla, bangla-typography, chromium, config-driven, ffmpeg, fintech, h264, motion-graphics, puppeteer, reusable-template, video-generation |

**শেষ কমিট (পুরো হ্যাশ):**

```
eec7a64ece7dbf2f9eadd76eb31e5c4e012a8ea4
Fix scene order and logic: coming-soon on the end card only,
bKash isolated to the money-movement scenes, operator row is mobile operators only
লেখক: FlexiTaka Kit Agent    তারিখ: Sat Sep 12 11:24:43 2026 +0000
```

### ১.২ রেপো পেজ ঠিকঠাক খোলে কি না

চারটি ঠিকানা HTTP স্ট্যাটাস কোড দিয়ে পরীক্ষা করা হয়েছে:

```
200  <- https://github.com/44389486348364869789/flexitaka-video-kit
200  <- https://github.com/44389486348364869789/flexitaka-video-kit/blob/main/README.md
200  <- https://raw.githubusercontent.com/44389486348364869789/flexitaka-video-kit/main/README.md
200  <- https://github.com/44389486348364869789/flexitaka-video-kit/blob/main/LICENSE
```

সবগুলো **২০০ (ঠিক আছে)** মানে রেপো, README ও লাইসেন্স তিনটাই খোলে।

### ১.৩ আসল প্রমাণ: ফ্রেশ ক্লোন করে ভিডিও বানানো

এটাই সবচেয়ে জরুরি যাচাই — রেপোতে হয়তো ভিডিও ফাইল রাখা আছে, কিন্তু **সোর্স কোড থেকে সত্যিই ভিডিও তৈরি হয় কি না** সেটা আলাদা কথা।

তাই রেপোটা **অন্য জায়গায়** নামিয়ে (একদম পরিষ্কার অবস্থায়) সেখানে পুরো রেন্ডার চালানো হয়েছে:

```bash
rm -rf /tmp/clone_verify
git clone https://github.com/44389486348364869789/flexitaka-video-kit.git /tmp/clone_verify
cd /tmp/clone_verify

npm install                 # ৮৩টি প্যাকেজ, ইনস্টল হয়েছে puppeteer-core@23.11.1
rm -rf frames output        # আগের সব মুছে একদম শূন্য থেকে
PORT=9123 ./render.sh       # পুরো রেন্ডার
```

**ফলাফল: `EXIT_CODE=0` — সফল।** রেন্ডারের লগ:

```
-- [1/7] Dependencies -------------------------------------------
  [ok] puppeteer-core loads
-- [2/7] Generating index.html ----------------------------------
wrote index.html  total 20.000s  (600 frames)
all 12 referenced assets present
-- [3/7] Static server on port 9123 ---------------------------
  [ok] server up
-- [4/7] Environment, font and overflow check -------------------
  [ok]   node v20.20.2
  [ok]   chromium at /usr/bin/chromium
  [ok]   ffmpeg on PATH
  [ok]   video.config.js loaded and valid
  [ok]   resolved 6 scenes, total 20.000s, 600 frames
  [ok]   Bangla webfont active (Hind Siliguri 1002.0px vs fallback 787.8px)
  [ok]   Latin webfont active (Poppins 742.6px vs fallback 733.4px)
all checks passed
-- [5/7] Capturing 600 frames ----------------------------------
frames 600 / 600
-- [6/7] Encoding MP4 -------------------------------------------
-- [7/7] Voice-over + music mix, then mux -----------------------
-- Verify -------------------------------------------------------
  [ok] render complete
```

> লক্ষ্য করুন: **ফন্ট পরীক্ষাটা আসলেই কাজ করছে** — বাংলা লেখার প্রস্থ আসল ফন্টে ১০০২px, কিন্তু ফলব্যাকে ৭৮৭.৮px। দুটো আলাদা, তাই ফন্ট সত্যিই লোড হয়েছে। যদি সমান হতো, তার মানে ফন্ট লোড হয়নি (বাংলা যুক্তাক্ষর ভাঙা আসত) — তখন স্ক্রিপ্ট রেন্ডার শুরুই করত না।

### ১.৪ রেন্ডার হওয়া ফাইলের যাচাই (ffprobe)

```bash
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -show_entries stream=index,codec_name,codec_type,width,height,r_frame_rate,nb_frames,sample_rate,channels \
  -of default=noprint_wrappers=1 output/flexitaka_coming_soon_teaser_20s_v3.mp4
```

**প্রকৃত আউটপুট:**

```
index=0
codec_name=h264
codec_type=video
width=1920
height=1080
r_frame_rate=30/1
nb_frames=600
index=1
codec_name=aac
codec_type=audio
sample_rate=48000
channels=2
nb_frames=939
duration=20.000000
size=4838862
bit_rate=1935544
```

ফ্রেম সংখ্যা আলাদাভাবে গুনে দেখাও হয়েছে (`-count_frames`): **৬০০** — হুবহু মিলেছে।

**মানে:** দৈর্ঘ্য ২০.০০০ সেকেন্ড, ১৯২০×১০৮০, ৩০fps, ৬০০ ফ্রেম, H.264 ছবি + AAC স্টেরিও অডিও (৪৮kHz)।

### ১.৫ ছবি বদলে যায়নি — mux-এ প্রমাণ

অডিও যোগ করার সময় ছবিটা আবার এনকোড হয়ে গেলে কোয়ালিটি নষ্ট হতো। তাই কিটটা মিক্স করার আগে-পরে ছবির স্ট্রিম হ্যাশ মিলিয়ে দেখায়:

```
=== 7. Mux into the video (video stream COPIED, never re-encoded) ===
  video stream MD5 before mux : e7ddc79783a768751d89a87df0877aca
  video stream MD5 after  mux : e7ddc79783a768751d89a87df0877aca
  PASS — the picture is bit-for-bit unchanged.
```

দুটো হ্যাশ **হুবহু এক** — ছবির একটাও পিক্সেল বদলায়নি।

### ১.৬ অডিওর যাচাই

```
=== 4. Sum ducked bed + sfx bus ===
  _raw_mix.wav  peak -6.60 dBFS  rms -24.35 dBFS  flat 0  peak-count 2

=== 5. Gain trim to -1.5 dBTP + safety limiter ===
  raw true peak -6.60 dBTP -> applying +5.10 dB
  final_audio.wav  peak -1.50 dBFS  rms -19.25 dBFS  flat 0  peak-count 2  (20.000s)

=== 8. QC report ===
  final      : 20.000s | -16.8 LUFS | -1.5 dBTP
```

| মাপ | মান | মানে কী |
|---|---|---|
| True peak | **−1.5 dBTP** | সুরক্ষিত সীমার নিচে, স্পিকার/প্ল্যাটফর্মে ভাঙবে না |
| Loudness | −16.8 LUFS | অনলাইন ভিডিওর স্বাভাবিক মাত্রা |
| `flat 0` | **ক্লিপিং শূন্য** | কোথাও শব্দ চাপা পড়েনি |

### ১.৭ যাচাইয়ের সারসংক্ষেপ

| প্রশ্ন | উত্তর |
|---|---|
| রেপো আছে? | ✅ পাবলিক, MIT |
| ব্রাঞ্চ? | ✅ `main` |
| শেষ কমিট? | ✅ `eec7a64ece7dbf2f9eadd76eb31e5c4e012a8ea4` |
| ফাইল সংখ্যা? | ✅ ৫৮ |
| README খোলে? | ✅ HTTP 200 |
| ফ্রেশ ক্লোনে `npm install` চলে? | ✅ ৮৩ প্যাকেজ |
| ফ্রেশ ক্লোনে `./render.sh` চলে? | ✅ `EXIT_CODE=0` |
| সোর্স থেকে ভিডিও তৈরি হয়? | ✅ ২০s / ৬০০ ফ্রেম / ১৯২০×১০৮০ / h264+aac |

---

## ২. এই রেপো দিয়ে কী কী করা যায়

### ২.১ যা ফিক্স — একবার বানানো, সবসময় কাজ করে

এই জিনিসগুলো আপনি **হাত দেবেন না**। এগুলো "কারখানা", বদলানোর দরকার নেই:

| অংশ | ফাইল | কাজ |
|---|---|---|
| **রেন্ডার পাইপলাইন** | `render.sh` | ৯ ধাপে পুরো বিল্ড চালায়: প্রি-ফ্লাইট → পেজ তৈরি → সার্ভার → সেলফ-টেস্ট → ফ্রেম ক্যাপচার → এনকোড → অডিও মিক্স → mux → যাচাই |
| **ফন্ট সেটআপ** | `fonts/` | বাংলা = Hind Siliguri, ইংরেজি = Poppins। পেজ একটা লোকাল `http://` সার্ভার থেকে ফন্ট নেয় (কারণ কিছু Chromium `file://`-এ ফন্ট ব্লক করে দেয়, তখন চুপচাপ অন্য ফন্ট বসে যায়) |
| **অ্যানিমেশন ইঞ্জিন** | `lib/engine.js` | পুরো অ্যানিমেশন এখানে — CSS, SVG, প্রতিটি সিনের নড়াচড়া। এটা একটা পিওর ফাংশন `window.seek(t)` দেয়: সময় `t` দিলে ঠিক সেই মুহূর্তের ছবি আঁকে |
| **অটো-ফিট (লেখা)** | `lib/engine.js` → `fitAll()` | লম্বা লাইন ফ্রেমের বাইরে গেলে লেখা নিজে থেকেই ছোট হয়ে ভেতরে বসে |
| **অটো-টাইমিং (ভয়েস)** | `lib/plan-audio.js` | কণ্ঠস্বরের টুকরো কোথায় বসবে তা নিজে হিসাব করে — কেউ কাটা পড়ে না, ওভারল্যাপও করে না |
| **সাউন্ড ইফেক্ট সিস্টেম** | `lib/build-audio.js` + `sfx/` | চারটি ইফেক্ট (whoosh, click, ding, riser), সব ffmpeg দিয়ে স্ক্র্যাচ থেকে বানানো — কোনো বাইরের স্যাম্পল নেই |
| **ক্যাপচার স্ক্রিপ্ট** | `lib/capture.js` | প্রতি ফ্রেমে একটা PNG। প্রতি ১৫০ ফ্রেমে ব্রাউজার রিস্টার্ট করে (দীর্ঘ রেন্ডারে ক্র্যাশ এড়াতে) |
| **যাচাই** | `lib/check.js`, `lib/qa-visibility.js` | ফন্ট ঠিক আছে কি না, লেখা বাইরে বেরোচ্ছে কি না, কোনো সিন আগেভাগে দেখা যাচ্ছে কি না |
| **টাইমলাইন হিসাব** | `lib/timeline.js` | সিনের দৈর্ঘ্য থেকে পুরো ভিডিওর দৈর্ঘ্য, ফ্রেম সংখ্যা, ট্রানজিশনের সময় — সব বের করে |

### ২.২ যা বদলানো যায় — সবই `video.config.js`-এ

| আপনি কী বদলাতে চান | কোথায় |
|---|---|
| **ভিডিওর দৈর্ঘ্য** | যেকোনো সিনের `duration` (যোগফলই মোট দৈর্ঘ্য) |
| **সিনের ক্রম** | `scenes` অ্যারের ক্রম উল্টে-পাল্টে — **অ্যারের ক্রমই টাইমলাইনের ক্রম** |
| **সিন যোগ / বাদ** | `scenes`-এ নতুন এন্ট্রি বসান বা মুছুন |
| **যেকোনো লেখা** | ওই সিনের `headlines[].text` |
| **রঙ** | `theme` ব্লক |
| **লোগো** | `scenes[].props.logo`, `props.headLogo`, `props.operators[]` |
| **মিউজিক ও তার লেভেল** | `audio.music` |
| **সাউন্ড ইফেক্ট** | `audio.sfx.cues` |
| **ভয়েস ওভার** | প্রতিটি সিনের `vo` ব্লক (এখন খালি) |
| **রেজোলিউশন / fps / কোয়ালিটি** | `video` ব্লক |

### ২.৩ সীমাবদ্ধতা — কোথায় নতুন কোড লাগবে

এটা জানা জরুরি, নইলে ভুল প্রত্যাশা হবে।

**এই কিটে সহজে হয় ✅**
- লেখা/সংখ্যা/সময়/রঙ বদলানো
- সিন যোগ/বাদ/ক্রম বদল
- দৈর্ঘ্য কম-বেশি (৫s, ৩০s, ৬০s…)
- রেজোলিউশন ও fps বদল
- মিউজিক, সাউন্ড ইফেক্ট, ভয়েস ওভার
- নতুন লোগো/ছবি বসানো

**নতুন কোড লাগবে ⚠️**
দৃশ্যের **ধরন** মাত্র ৬টি (`lib/engine.js`-এর ভেতরে বানানো):

| `kind` | কী দেখায় |
|---|---|
| `transferCard` | টাকা পাঠানোর কার্ড → রিচার্জ কনফার্মেশন |
| `simCard` | সাকসেস/সতর্কতা ব্যাজসহ SIM কার্ড |
| `counterBars` | বার চার্ট, সংখ্যা গুনে ওঠে |
| `flowToWallet` | এক প্রতীক থেকে আরেকটায় কণা যাত্রা |
| `operatorGrid` | সাদা কার্ডে ব্র্যান্ড লোগোর সারি |
| `logoReveal` | লোগো + ট্যাগলাইন + কল-টু-অ্যাকশন |

আপনি যদি **একদম নতুন ধরনের দৃশ্য** চান — যেমন সিনেমাটিক ক্যামেরা মুভমেন্ট, ফোনের স্ক্রিন রেকর্ডিং, চরিত্রের অ্যানিমেশন, 3D — তাহলে `lib/engine.js`-এ নতুন একটা `kind` ও তার `DRAW` ফাংশন লিখতে হবে। এটা এজেন্ট পারবে, কিন্তু এটা "কনফিগ বদল" নয়, "কোড লেখা"।

**সীমাবদ্ধতার আরও দুটো দিক:**
- **রেন্ডারের গতি:** ৬০০ ফ্রেমে ~১০ মিনিট (এই মেশিনে ৫৯০ সেকেন্ড)। দীর্ঘ ভিডিও মানে বেশি সময়।
- **সিস্টেম নির্ভরতা:** Node 18+, ffmpeg ও Chromium লাগবে। `install-deps.sh` Debian/Ubuntu-র জন্য লেখা; macOS-এ `brew` দিয়ে বসাতে হবে।

---

## ৩. নতুন ভিডিও বানাতে ঠিক কী edit করতে হবে

### ৩.১ ফিল্ড রেফারেন্স (উদাহরণসহ)

#### `video` — ছবির ক্যানভাস

```js
video: {
  width: 1920,          // প্রস্থ (px)
  height: 1080,         // উচ্চতা (px)
  fps: 30,              // ফ্রেম প্রতি সেকেন্ড → মোট ফ্রেম = দৈর্ঘ্য × fps
  crf: 16,              // কোয়ালিটি: কম = ভালো ও বড় ফাইল
  preset: 'slow',       // x264 স্পিড/কোয়ালিটি
  outputName: 'amar_notun_video',   // → output/amar_notun_video.mp4
},
```

**৯:১৬ (Reels/Shorts) করতে:** `width: 1080, height: 1920` বসান।

#### `theme` — ব্র্যান্ডের রঙ

```js
theme: {
  green:      '#025734',   // মূল রঙ — হেডলাইন, প্যানেল
  greenLight: '#04724A',
  greenDeep:  '#013D24',
  greenPale:  '#CFE8DA',
  yellow:     '#FDB801',   // অ্যাকসেন্ট — বোতাম, কণা
  yellowSoft: '#FFC933',
  cream:      '#F4FBF7',   // ব্যাকগ্রাউন্ড
  ink:        '#FFFFFF',
},
```

প্রতিটা কী আসলে CSS ভেরিয়েবল (`--green`) হয়ে যায়, তাই ইঞ্জিনে `var(--green)` লিখে ব্যবহার করা হয়। নিজের নাম দিয়েও নতুন রঙ যোগ করা যায়।

#### `scenes` — টাইমলাইন

```js
{
  id: 's3',                    // ইউনিক নাম (ট্রানজিশন ও SFX এটা দিয়ে ধরে)
  kind: 'counterBars',         // ৬টি ধরনের একটা
  duration: 2.5,               // ⬅ দৈর্ঘ্যের নব
  designDuration: 2.0,         // অ্যানিমেশনটা যত সেকেন্ডের জন্য আঁকা হয়েছিল
  headlines: [
    { text: '{SIM}-এ অতিরিক্ত টাকা পড়ে আছে?', size: 80, appear: 0.0 },
  ],
  props: { counterTarget: 2450, counterPrefix: '৳ ', bars: 6 },
},
```

> **`{...}` এর ভেতরের লেখা ইংরেজি ফন্টে (Poppins) আসে।** যেমন `{SIM}` লিখলে বাংলা বাক্যের ভেতরে "SIM" ইংরেজি ফন্টে বসবে।

#### `headlines[]` — লেখার সেটিং

| ফিল্ড | মানে |
|---|---|
| `text` | লেখাটা। `{...}` = ইংরেজি ফন্ট |
| `size` | ফন্ট সাইজ (px) |
| `top` | উপরে থেকে দূরত্ব (ডিফল্ট ১০৪; দ্বিতীয় লাইনে ১৯৬) |
| `appear` | কখন ফুটে উঠবে — **ভগ্নাংশ** হিসেবে (০.৩ = সিনের ৩০% সময়ে) |
| `exit` | কখন মিলিয়ে যাবে — না দিলে সিন শেষ পর্যন্ত থাকে |
| `glow` | `true` = লেখার পিছনে নরম আভা |

#### `audio` — শব্দ

```js
audio: {
  enabled: true,             // false = একদম নীরব ভিডিও
  sampleRate: 48000,
  targetTruePeakDb: -1.5,    // চূড়ান্ত সীমা

  music: {
    file:    'music/flexitaka_teaser_bgm_20s.mp3',
    gainDb:  -9,             // লেভেল (কথা না থাকায় বেশি)
    fadeIn:  0.9,
    fadeOut: 2.2,
  },

  sfx: {
    masterGainDb: -6,
    cues: [
      { file: 'sfx/whoosh.mp3', anchor: 's1', at: 0.02, gainDb: -3 },
      { file: 'sfx/riser.mp3',  anchor: 's6', at: -0.9, gainDb: -4 },
    ],
  },
},
```

> **`anchor` = সিনের `id`, `at` = ওই সিন শুরুর কত সেকেন্ড পরে।** ঋণাত্মক মান মানে কাটের ঠিক আগে। এভাবে লেখা থাকায় সিনের দৈর্ঘ্য বদলালেও ইফেক্ট বিটে থাকে।

#### `transitions` — ট্রানজিশন

```js
transitions: [
  { type: 'flash',      anchor: 's4', at: 1.84, dur: 0.32, strength: 0.34 },
  { type: 'sweepFrame', anchor: 's5', at: 0.26, dur: 0.62 },
],
```

`flash` = সাদা ঝলক, `sweepFrame` = ফ্রেম জুড়ে আলোর রেখা।

### ৩.২ উদাহরণ ক — সহজ পরিবর্তন (একটা সিনের লেখা ও দৈর্ঘ্য)

**কাজ:** সিন ৩-এর হেডলাইন বদলানো আর দৈর্ঘ্য ২.৫s → ১.৬s করা।

**আগে:**

```js
{
  id: 's3',
  kind: 'counterBars',
  duration: 2.5,
  designDuration: 2.0,
  headlines: [{ text: '{SIM}-এ অতিরিক্ত টাকা পড়ে আছে?', size: 80, appear: 0.0 }],
  props: { counterTarget: 2450, counterPrefix: '৳ ', bars: 6, barHeights: [130,175,225,280,340,400] },
},
```

**পরে (শুধু দুটো লাইন বদলেছে):**

```js
{
  id: 's3',
  kind: 'counterBars',
  duration: 1.6,                       // ⬅ 2.5 থেকে 1.6
  designDuration: 2.0,                 // ⬅ ছোঁয়া হয়নি (ইচ্ছাকৃত)
  headlines: [{ text: 'আপনার {SIM}-এ জমে থাকা টাকা', size: 80, appear: 0.0 }],
  props: { counterTarget: 2450, counterPrefix: '৳ ', bars: 6, barHeights: [130,175,225,280,340,400] },
},
```

**কমান্ড:**

```bash
node lib/dump-plan.js     # আগে দেখুন — এক সেকেন্ডও লাগে না
./render.sh               # তারপর রেন্ডার
```

**প্রকৃত ফলাফল (`dump-plan.js`):**

```
  total      19.100s   (573 frames)
  #  id      kind            start     end       dur    anim
  3  s3      counterBars       6.000s    7.600s  1.600s  1.600s
        headline  "আপনার SIM-এ জমে থাকা টাকা"  80px  appear 0.000s -> hold
```

**এখানে যা শেখার:** সিন ১.৬s করা হয়েছে, কিন্তু অ্যানিমেশনটা ২.০s-এর জন্য আঁকা ছিল। তাই `anim` কলামে দেখুন — **১.৬০০s** হয়ে গেছে। মানে অ্যানিমেশনটা **চেপে বসেছে**, কাটা পড়েনি। এটাই `designDuration`-এর কাজ।

### ৩.৩ উদাহরণ খ — বড় পরিবর্তন (নতুন সিন যোগ করে ৩০ সেকেন্ডের ভিডিও)

**কাজ:** ২০s → ৩০s, আর এন্ড কার্ডের আগে একটা নতুন সিন বসানো।

**সম্পূর্ণ কনফিগ পরিবর্তন (`video.config.js`-এ সরাসরি):**

```js
module.exports = {
  video: { /* ... */ outputName: 'example_b_30s' },

  // ... theme, type অপরিবর্তিত ...

  audio: {
    // ... music অপরিবর্তিত ...
    sfx: {
      masterGainDb: -6,
      cues: [
        // ... আগের ১৩টি cue অপরিবর্তিত ...
        { file: 'sfx/whoosh.mp3', anchor: 'growth', at: 0.05, gainDb: -3 },  // ⬅ নতুন
        { file: 'sfx/ding.mp3',   anchor: 'growth', at: 1.80, gainDb: -2 },  // ⬅ নতুন
      ],
    },
  },

  transitions: [
    // ... আগের ৩টি অপরিবর্তিত ...
    { type: 'flash', anchor: 'growth', at: 0.02, dur: 0.30, strength: 0.22 },  // ⬅ নতুন
  ],

  scenes: [
    // ১) আগের সিনগুলোর দৈর্ঘ্য বাড়ানো
    { id: 's1', kind: 'transferCard', duration: 5.0,  designDuration: 3.0, /* ... */ },
    { id: 's2', kind: 'simCard',      duration: 3.5,  designDuration: 2.0, /* ... */ },
    { id: 's3', kind: 'counterBars',  duration: 3.5,  designDuration: 2.0, /* ... */ },
    { id: 's4', kind: 'flowToWallet', duration: 3.5,  designDuration: 2.0, /* ... */ },
    { id: 's5', kind: 'operatorGrid', duration: 4.5,  designDuration: 3.5, /* ... */ },

    // ২) নতুন সিন — এন্ড কার্ডের ঠিক আগে
    {
      id: 'growth',
      kind: 'counterBars',            // ⬅ বিদ্যমান ৬টি kind-এর একটা
      duration: 4.0,
      designDuration: 3.0,
      headlines: [{ text: 'কত টাকা আটকে আছে?', size: 76, appear: 0.0 }],
      props: { counterTarget: 7200, counterPrefix: '৳ ', bars: 6,
               barHeights: [120,170,220,300,360,430] },
    },

    // ৩) এন্ড কার্ড
    { id: 's6', kind: 'logoReveal',   duration: 6.0,  designDuration: 5.5, /* ... */ },
  ],
};
```

**প্রকৃত ফলাফল (`dump-plan.js`):**

```
  TIMELINE  —  1920x1080 @ 30fps
  total      30.000s   (900 frames)
  #  id      kind            start     end       dur    anim
  1  s1      transferCard      0.000s    5.000s  5.000s  3.000s
  2  s2      simCard           5.000s    8.500s  3.500s  2.000s
  3  s3      counterBars       8.500s   12.000s  3.500s  2.000s
  4  s4      flowToWallet     12.000s   15.500s  3.500s  2.000s
  5  s5      operatorGrid     15.500s   20.000s  4.500s  3.500s
  6  growth  counterBars      20.000s   24.000s  4.000s  3.000s
  7  s6      logoReveal       24.000s   30.000s  6.000s  5.500s
  transition  flash       at 24.020s  for 0.3s
  transition  flash       at 20.020s  for 0.3s
```

**লক্ষ্য করুন:**
- মোট দৈর্ঘ্য ঠিক **৩০.০০০s** (৯০০ ফ্রেম) — শুধু সংখ্যা যোগ করেই।
- নতুন সিন **২০.০০০s → ২৪.০০০s** সময়ে বসেছে, কোনো হাত দিয়ে সময় বসাতে হয়নি।
- নতুন সিনের ট্রানজিশন ও SFX **নিজে থেকেই** ঠিক জায়গায় চলে গেছে (`at 20.020s`)।

**নতুন লেখাটা ফ্রেমের ভেতরে বসল কি না — পরীক্ষা:**

```bash
./render.sh check
```

```
  [ok]   resolved 7 scenes, total 30.000s, 900 frames
  [ok]   Bangla webfont active (Hind Siliguri 1002.0px vs fallback 787.8px)
  [ok]   headline growthh0 fits its margin (overflow 0px)      ⬅ নতুন সিনের লেখা
all checks passed
```

`overflow 0px` মানে নতুন লেখাটা **পুরোপুরি ফ্রেমের ভেতরে** — নিজে থেকে ছোট হয়ে বসেছে।

### ৩.৪ সিন বাদ দেওয়ার সময় সাবধানতা

সিন মুছলে যদি কোনো `transition` বা `sfx` cue বা `vo` এখনও ওই সিনের `id` ধরে থাকে, তাহলে কনফিগ ভ্যালিডেটর **স্পষ্ট এরর দিয়ে থামিয়ে দেবে** — চুপচাপ ভুল ভিডিও বানাবে না।

---

## ৪. বিকল্প পদ্ধতি: HTML/CSS → MP4

### ৪.১ পদ্ধতিটা কী

এটাই এই কিট যেভাবে কাজ করে। চার ধাপ:

```
১. HTML/CSS/JS দিয়ে একটা পেজ বানানো (প্রতিটা মুহূর্তের ছবি আঁকা যায়)
        ↓
২. headless ব্রাউজার দিয়ে প্রতি ফ্রেমে স্ক্রিনশট
        ↓
৩. ffmpeg দিয়ে সেই ছবিগুলোকে H.264 ভিডিওতে সাজানো
        ↓
৪. অডিও মিক্স করে ছবির সাথে জোড়া (mux)
```

### ৪.২ কেন এটা ভালো

- **যা দেখছেন, তাই পাবেন ঠিক তেমনই** — ব্রাউজারের রেন্ডারিং মানে শেডার/ফন্ট/লেআউট সব হুবহু।
- **সিএমকে/ভেক্টর/টেক্সট** — বাংলা ফন্ট, SVG লোগো, গ্রেডিয়েন্ট সব পরিষ্কার।
- **পূর্ণ নিয়ন্ত্রণ** — CSS দিয়ে যা বানাতে পারেন, তার সীমা প্রায় নেই।
- **ডিটারমিনিস্টিক** — একই কোড চালালে একই ফ্রেম আসে (নিচে ব্যাখ্যা আছে)।

### ৪.৩ যা লাগে

| জিনিস | কেন |
|---|---|
| **Node.js 18+** | স্ক্রিপ্ট চালানো, পেজ জেনারেট করা |
| **Puppeteer / puppeteer-core + Chromium** | ব্রাউজার চালানো ও ফ্রেম ক্যাপচার |
| **ffmpeg + ffprobe** | ভিডিও এনকোড, অডিও মিক্স, ফাইল পরিমাপ |
| **ফন্ট ফাইল** | বাংলা টাইপোগ্রাফি ঠিক রাখতে (নইলে যুক্তাক্ষর ভাঙে) |

### ৪.৪ প্রমাণ: এই কিট ঠিক এই পদ্ধতিই ব্যবহার করে

অনুমান নয় — **কোড থেকেই প্রমাণ**।

**(ক) প্রতি ফ্রেমে স্ক্রিনশট — `lib/capture.js`:**

```js
const puppeteer = require('puppeteer-core');

browser = await puppeteer.launch({
  executablePath: CHROME,          // সিস্টেমের Chromium
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', ...],
});
page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(PAGE_URL, { waitUntil: 'networkidle0', timeout: 90000 });
```

তারপর লুপে প্রতিটা ফ্রেম:

```js
for (let i = 0; i < TOTAL; i++) {
  await page.evaluate((tt) => window.seek(tt), i / FPS);   // ⬅ সময় সেট
  await page.screenshot({ path: nameOf(i), type: 'png' }); // ⬅ ছবি নিন
}
```

**(খ) পেজটা আসলে তৈরি হয় — `lib/template.js`:**

```js
let engine = fs.readFileSync(path.join(ROOT, 'lib', 'engine.js'), 'utf8');
const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${config.video.outputName}</title>
</head>
<body>
<div id="stage">
  <div id="bg">...</div>
  <div id="flash"></div>
  <div id="sweepFrame">...</div>
</div>
<script>window.__PLAN__ = ${JSON.stringify(payload)};</script>
<script>${engine}</script>
</body>
</html>`;
```

এটা **একটা স্বয়ংসম্পূর্ণ HTML ফাইল** লিখে দেয় — কোনো বান্ডলার নেই, কোনো ফ্রেমওয়ার্ক নেই।

**(গ) অ্যানিমেশনটা সময়ের ফাংশন — `lib/engine.js`:**

```js
/* seek() sets opacity/transform on every element directly from t. Nothing
   uses wall-clock time or requestAnimationFrame, which is what makes
   frame-accurate capture possible: frame N renders identically regardless of
   how fast the machine is. */
function render(t) { ... }
```

> এটাই সবচেয়ে গুরুত্বপূর্ণ কৌশল। যদি অ্যানিমেশনটা `requestAnimationFrame` দিয়ে চলত, তাহলে ধীর মেশিনে ফ্রেম বাদ পড়ত আর ভিডিওতে ঝাঁকুনি আসত। বদলে এখানে **সময় দেওয়া হয়, ছবি চাওয়া হয়** — তাই ব্রাউজার যত ধীরই হোক, ফ্রেম নম্বর ৩০০ সবসময় একই দেখাবে।

**(ঘ) এনকোড — `render.sh`:**

```bash
ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -r "$FPS" -i "$CONCAT" \
  -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p \
  -crf "$CRF" -preset "$PRESET" -r "$FPS" -vsync cfr \
  -movflags +faststart \
  "$OUT"
```

**(ঙ) অডিও মিক্স + mux — `lib/build-audio.js`:**

```js
run('ffmpeg', ['-y', ... '-i', video, '-i', finalWav,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy',        // ⬅ ছবি কপি — আবার এনকোড নয়
  '-c:a', 'aac', '-b:a', '256k',
  '-shortest', '-movflags', '+faststart', tmp]);
```

**উপসংহার: হ্যাঁ, এই কিট ঠিক এই পদ্ধতিই ব্যবহার করে** — HTML/CSS পেজ → headless Chromium ফ্রেম ক্যাপচার → ffmpeg H.264 এনকোড → অডিও মিক্স → mux।

### ৪.৫ আপনার কাঙ্ক্ষিত workflow সম্ভব কি না?

> **"README/টেক্সটে এজেন্টকে বলে দেব কী ভিডিও চাই → এজেন্ট HTML/CSS নতুন করে লিখবে বা বদলাবে → সেই HTML থেকে MP4 বানাবে"**

**হ্যাঁ, সম্পূর্ণ সম্ভব — এবং এই কিট ইতিমধ্যেই সেটার জন্য প্রস্তুত।** এজেন্টের তিনটি স্তরের কাজ:

| স্তর | এজেন্ট কোথায় হাত দেবে | কখন |
|---|---|---|
| **স্তর ১ — কনফিগ বদল** | শুধু `video.config.js` | লেখা, সময়, রঙ, ক্রম বদলাতে (৯০% কাজ এখানেই) |
| **স্তর ২ — দৃশ্য নকশা** | `lib/engine.js` | বিদ্যমান ৬টি `kind`-এর চেহারা বদলাতে |
| **স্তর ৩ — নতুন দৃশ্য** | `lib/engine.js`-এ নতুন `kind` + `DRAW` ফাংশন | একদম নতুন ধরনের দৃশ্য (স্ক্রিন রেকর্ডিং, 3D, চরিত্র) |

**এজেন্টের জন্য পুরো ধাপ:**

```
১. ক্লোন করে npm install
২. docs/VIDEO_CONFIG.md পড়ে (কোন ফিল্ড কী করে)
৩. আপনার প্রম্পট পড়ে ঠিক করে — কনফিগ বদল যথেষ্ট, নাকি নতুন kind লাগবে
৪. video.config.js এডিট করে (অথবা engine.js-এ নতুন DRAW ফাংশন লেখে)
৫. node lib/dump-plan.js চালিয়ে টাইমলাইন দেখে (মুহূর্তেই ফল)
৬. ./render.sh check চালিয়ে ফন্ট ও লেখা-ওভারফ্লো যাচাই করে
৭. ./render.sh চালিয়ে MP4 বানায়
৮. ffprobe দিয়ে দৈর্ঘ্য/ফ্রেম/রেজোলিউশন যাচাই করে
```

**একটা বাস্তব উদাহরণ — শুধু পাঠ্য প্রম্পট থেকে চূড়ান্ত MP4:**

> **আপনার প্রম্পট:** *"৭টা সিন, ৪৫ সেকেন্ডের একটা ভিডিও বানাও — প্রতিটা সিনে প্রধান সংখ্যাটা বড় করে দেখাও, শেষে আমাদের লোগো।"*

**এজেন্ট যা করবে:**

```bash
git clone https://github.com/44389486348364869789/flexitaka-video-kit.git
cd flexitaka-video-kit && npm install
```

তারপর `video.config.js`-এ ৭টি `counterBars`/`logoReveal` সিন লিখবে, প্রতিটার `duration` এমনভাবে ভাগ করবে যাতে যোগফল ৪৫ হয় (যেমন ৭+৭+৭+৬+৬+৬+৬ = ৪৫), প্রতিটার `headlines` ও `counterTarget` বসাবে, আর শেষে `logoReveal` রাখবে।

```bash
node lib/dump-plan.js        # ৪৫.০০০s, ১৩৫০ ফ্রেম — মিলছে কি না দেখুন
./render.sh check            # ফন্ট ও লেখা যাচাই
./render.sh                  # চূড়ান্ত MP4
ffprobe -v error -show_entries format=duration -of csv=p=0 output/nama.mp4
```

**ফলাফল:** `output/nama.mp4` — ৪৫ সেকেন্ড, আপনার লেখা, আপনার ব্র্যান্ড রঙে।

### ৪.৬ এই পদ্ধতির ঝুঁকিগুলো

| ঝুঁকি | কী হয় | কিট কী করে |
|---|---|---|
| **ফন্ট চুপচাপ বদলে যাওয়া** | বাংলা যুক্তাক্ষর ভেঙে যায় | `check.js` আসল ফন্ট বনাম ফলব্যাকের প্রস্থ মিলিয়ে দেখে, সমান হলে থামিয়ে দেয় |
| **দীর্ঘ রেন্ডারে ক্র্যাশ** | "Target closed" এরর, অর্ধেক কাজ নষ্ট | `capture.js` প্রতি ১৫০ ফ্রেমে ব্রাউজার রিস্টার্ট করে ও ডিস্কে থাকা ফ্রেম স্কিপ করে রিজিউম করে |
| **অডিও জোড়ার সময় ছবি নষ্ট** | রি-এনকোডে কোয়ালিটি কমে | mux-এ `-c:v copy`, আর আগে-পরে MD5 মিলিয়ে PASS দেখায় |
| **লেখা ফ্রেমের বাইরে** | টেক্সট কেটে যায় | `fitAll()` নিজে থেকে ছোট করে, `check.js` overflow মাপে |

---

## ৫. সুপারিশ — কোন পথ সবচেয়ে সহজ

### ৫.১ সহজতার ক্রম

| পথ | কতটা সহজ | কখন বেছে নেবেন |
|---|---|---|
| **১. শুধু `video.config.js` এডিট** | ⭐⭐⭐⭐⭐ | ৯০% কাজ — লেখা, সময়, ক্রম, রঙ, মিউজিক, লোগো |
| **২. `engine.js`-এ বিদ্যমান दृশ্যের চেহারা বদল** | ⭐⭐⭐ | "কার্ডটা অন্যভাবে সাজাও", "এই অ্যানিমেশনটা ধীর করো" |
| **৩. নতুন `kind` লেখা** | ⭐⭐ | একদম নতুন ধরনের দৃশ্য লাগলে |
| **৪. শূন্য থেকে নতুন প্রজেক্ট** | ⭐ | এই কিটের ধরন একদম না মিললে |

### ৫.২ আমার সুপারিশ

**পথ ১ সবচেয়ে ভালো — আর সেটাই এই কিটের পুরো উদ্দেশ্য।**

কারণ:
1. **এক ফাইল, এক কমান্ড।** অন্য কিছু হাত দেওয়ার দরকার নেই।
2. **ভুল হলে সাথে সাথে ধরা পড়ে।** `dump-plan.js` এক সেকেন্ডে টাইমলাইন দেখায়; ভুল `id` ধরলে ভ্যালিডেটর থামিয়ে দেয়।
3. **অটো-সুরক্ষা আছে।** লেখা নিজে ছোট হয়, অ্যানিমেশন চেপে বসে, ছবি জোড়ার সময় নষ্ট হয় না।
4. **যাচাই করা আছে।** শূন্য থেকে ক্লোন করে এই ডকুমেন্টের প্রতিটা সংখ্যা আসল রেন্ডার থেকে নেওয়া।

**আপনার জন্য সবচেয়ে ভালো workflow:**

> এজেন্টকে **শুধু `video.config.js` এডিট করতে বলুন** — আর যদি একদম নতুন ধরনের দৃশ্য দরকার হয়, তখন আলাদা করে বলুন "নতুন kind লাগবে"।

### ৫.৩ রেডি-টু-কপি প্রম্পট টেমপ্লেট

নতুন ভিডিওর জন্য এজেন্টকে এটা দিন — শুধু ফাঁকা জায়গা পূরণ করুন:

```
FlexiTaka Video Kit (flexitaka-video-kit/) দিয়ে একটা নতুন ভিডিও বানাও।

আমি যা চাই:

  দৈর্ঘ্য      : <মোট সেকেন্ড, যেমন ২০>
  সিন পরিকল্পনা : <প্রতিটা সিনে কী দেখাবে + হুবহু লেখা>
                  যেমন: ১) টাকা পাঠানোর কার্ড, লেখা "..."  ২) ...
  রঙ           : <নতুন রঙ, অথবা "FlexiTaka-র সবুজ/সাদা/হলুদ রাখো">
  ভয়েস ওভার    : <বাংলা লাইনগুলো, অথবা "পুরোনো ক্লিপ রাখো" / "ভয়েস ওভার ছাড়া">
  মিউজিক        : <"একই মিউজিক রাখো" / "মিউজিক ছাড়া" / নতুন মুড>
  সাউন্ড ইফেক্ট : <"আগেরগুলোই রাখো" / নতুন কী চাই>
  লোগো         : <"FlexiTaka লোগো রাখো" / নতুন ফাইল দিচ্ছি>

অনুগ্রহ করে:
  ১. আগে docs/VIDEO_CONFIG.md আর docs/NEW_VIDEO_PROMPT.md পড়ো,
  ২. শুধু video.config.js এডিট করো (নতুন ফাইল দিলে vo/ বা music/-এ রাখো),
  ৩. বিদ্যমান ডিজাইন আর লোগো-অপরিবর্তিত নিয়ম রাখো,
  ৪. রেন্ডারের আগে ./render.sh plan চালিয়ে টাইমলাইন আমাকে দেখাও,
  ৫. তারপর ./render.sh চালিয়ে ফাইনাল MP4 দাও।
```

### ৫.৪ উদাহরণ: টেমপ্লেট ভরে লেখা একটা প্রম্পট

```
FlexiTaka Video Kit (flexitaka-video-kit/) দিয়ে একটা নতুন ভিডিও বানাও।

আমি যা চাই:

  দৈর্ঘ্য      : ৩০ সেকেন্ড
  সিন পরিকল্পনা : ৭টা সিন —
                  ১) টাকা পাঠানোর কার্ড, লেখা "টাকা পাঠাতে গিয়ে..." (৫s)
                  ২) SIM কার্ড, লেখা "ভুল করে রিচার্জ?" (৩.৫s)
                  ৩) বার চার্ট, লেখা "অতিরিক্ত টাকা পড়ে আছে?" (৩.৫s)
                  ৪) প্রশ্ন, লেখা "মোবাইল ওয়ালেট বা ব্যাংকে নিতে চান?" (৩.৫s)
                  ৫) অপারেটর লোগো সারি, লেখা "যেকোনো অপারেটরের SIM থেকে" (৪.৫s)
                  ৬) নতুন বার চার্ট, লেখা "কত টাকা আটকে আছে?" (৪s)
                  ৭) এন্ড কার্ড — FlexiTaka লোগো + "SIM BALANCE TO CASH" + "COMING SOON" (৬s)
  রঙ           : FlexiTaka-র সবুজ/সাদা/হলুদ রাখো
  ভয়েস ওভার    : ভয়েস ওভার ছাড়া (কোনো কথা নয়)
  মিউজিক        : একই মিউজিক রাখো, লেভেল ফাইন-টিউন করো
  সাউন্ড ইফেক্ট : আগেরগুলোই রাখো, নতুন সিন ৬-এ একটা whoosh আর ding যোগ করো
  লোগো         : FlexiTaka লোগো রাখো (১০০% অপরিবর্তিত), অপারেটর লোগো আগের মতোই

অনুগ্রহ করে:
  ১. আগে docs/VIDEO_CONFIG.md আর docs/NEW_VIDEO_PROMPT.md পড়ো,
  ২. শুধু video.config.js এডিট করো,
  ৩. রেন্ডারের আগে ./render.sh plan চালিয়ে টাইমলাইন দেখাও (৩০.০০০s হওয়া উচিত),
  ৪. ./render.sh check চালিয়ে লেখা-ওভারফ্লো যাচাই করো,
  ৫. তারপর ./render.sh চালিয়ে ফাইনাল MP4 দাও।
```

---

## ⚠️ তৃতীয় পক্ষের ট্রেডমার্ক ও লোগো

এই প্রজেক্টে **bKash, Robi, BanglaLink এবং Grameenphone**-এর লোগো আছে, আর ভয়েস ওভারের স্ক্রিপ্টে "বিকাশ" নামটি ছিল। **এগুলো সবই তৃতীয় পক্ষের ট্রেডমার্ক।**

- এগুলো এখানে আছে কারণ ক্লায়েন্ট চেয়েছেন।
- **প্রকাশ্যে প্রচার, সম্প্রচার বা বিজ্ঞাপন হিসেবে চালানোর আগে সংশ্লিষ্ট প্রতিটি ব্র্যান্ডের কাছ থেকে লিখিত অনুমতি / আইনি ক্লিয়ারেন্স নেওয়া প্রয়োজন।**
- নিরপেক্ষ ভার্সন দরকার হলে `video.config.js`-এর `scenes[s1].props.headLogo`, `scenes[s4].headlines[1].logo` ও `scenes[s5].props.operators` থেকে রেফারেন্স মুছে দিলেই এক কমান্ডে নতুন রেন্ডার হয়ে যাবে।

আর **লোগো-১০০%-অপরিবর্তিত নিয়ম:** `assets/logo_original.png` হাতে দেওয়া আসল ফাইল, বদলানো হয়নি। `logo_trimmed.png`-তে শুধু স্বচ্ছ মার্জিন কাটা হয়েছে। এন্ড কার্ডের আলোর ঝলকটা শুধু **উজ্জ্বলতা যোগ করে**, লোগোর নিজের আকার দিয়ে mask করা — ছবি আবার আঁকা, রঙ বদল বা টেনে বসানো হয় না।

---

## শেষ কথা

| প্রশ্ন | উত্তর |
|---|---|
| রেপো কাজ করে? | **হ্যাঁ** — ফ্রেশ ক্লোন থেকে রেন্ডার সফল (`EXIT_CODE=0`) |
| শুধু টিজার বানানো যায়? | **না** — যেকোনো দৈর্ঘ্য, যেকোনো লেখা, যেকোনো ক্রম |
| কী বদলাব? | **`video.config.js`** — একটাই ফাইল |
| কীভাবে চালাব? | **`./render.sh`** — একটাই কমান্ড |
| নতুন দৃশ্যের ধরন লাগলে? | `lib/engine.js`-এ নতুন `kind` লিখতে হবে |

**রেপো:** <https://github.com/44389486348364869789/flexitaka-video-kit>
**কমিট:** `eec7a64ece7dbf2f9eadd76eb31e5c4e012a8ea4`

```bash
git clone https://github.com/44389486348364869789/flexitaka-video-kit.git
cd flexitaka-video-kit
npm install && ./render.sh
```
