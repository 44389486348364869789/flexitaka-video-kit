# রেপো পুশের অবস্থা — ফাইল অনুযায়ী

এই রানে `lib/engine.js` **৩টি নতুন দৃশ্য-ধরন** ও **ওয়াটারমার্ক** দিয়ে বড় করা হয়েছে (২৫৩ লাইন যোগ)।
স্যান্ডবক্সে GitHub-এর write-credential ছিল না, তাই ফাইলগুলো GitHub API দিয়ে পুশ করা হয়েছে —
কিন্তু API-র `content` প্যারামিটার প্রতিটি কলে হাতে পাঠাতে হয়, যা বড় বাইনারি/সোর্স ফাইলে সম্ভব নয়।

নিচে ঠিক কী কোথায় আছে:

| ফাইল | রেপোতে? | বিঃদ্রঃ |
|---|---|---|
| `video.config.js` | ✅ হ্যাঁ | ৬ সিন, ভয়েস-অ্যাংকরড সময় |
| `lib/timeline.js` | ✅ হ্যাঁ | ৩টি নতুন kind + asset তালিকা |
| `lib/template.js` | ✅ হ্যাঁ | ওয়াটারমার্ক DOM |
| `docs/SERVICE_VIDEO_QA_BN.md` | ✅ হ্যাঁ | সম্পূর্ণ QA রিপোর্ট |
| `docs/REPO_PUSH_STATUS_BN.md` | ✅ হ্যাঁ | এই ফাইল |
| `lib/engine.js` | ⚠️ **পুরোনো ভার্সন** | নতুন ২৫৩ লাইন এখনো পুশ হয়নি |
| `assets/logos/nagad.png` | ⚠️ অনুপস্থিত | নতুন সংগ্রহ |
| `assets/logos/banglalink.png` | ⚠️ পুরোনো (218×58) | বড় ভার্সন পুশ হয়নি |
| `vo/vo_s1..s6.wav` | ⚠️ পুরোনো mp3 ক্লিপ | WAV ক্লিপ পুশ হয়নি |
| `music/flexitaka_service_bgm.mp3` | ⚠️ অনুপস্থিত | নতুন BGM |

## `lib/engine.js` — নতুন ভার্সনটি কোথায়

```
sha256 : 9c0713591685751e6342bd06dd316ec5f778ba5050df001dff1d73d26fe6f32c
size   : 56,337 বাইট (২৫৩ লাইন যোগ)
git blob sha (পুশ হলে হবেঃ): 0960d1d537a9124ad8a04c4dc9f1a66cfa9552a2
```

ফাইলটি এখান থেকে ডাউনলোড করে উপরের sha256 দিয়ে যাচাই করে নেওয়া যায়:

```
https://static.teamily.ai/files/bb5e524c-4573-453b-be7c-3a78bbe2be96/engine.js
```

যোগ হওয়া অংশটি: `#wm` ওয়াটারমার্কের CSS/DOM, `splitCompare`, `twoSidedMatch`, `appStep`
তিনটি দৃশ্যের CSS + মার্কআপ + ড্র-ফাংশন, ট্রানজিশন ও শেষ-কার্ডের CTA-পিল ঐচ্ছিক করা।

## পুশ করতে যা করতে হবে

যে মেশিনে GitHub write-অ্যাক্সেস আছে, সেখানে:

```bash
git clone git@github.com:44389486348364869789/flexitaka-video-kit.git
cd flexitaka-video-kit

# engine.js-এর নতুন ভার্সন বসাও, তারপর sha256 মিলিয়ে দেখো
sha256sum lib/engine.js        # 9c071359...6f32c হওয়া উচিত

git add -A
git commit -m "Add the market-match scene kinds and the corner watermark"
git push origin main
```

---

*এই ফাইলটি এই রানের সীমাবদ্ধতা স্পষ্টভাবে লিপিবদ্ধ করার জন্য রাখা — যাতে রেপোটির অবস্থা নিয়ে কোনো বিভ্রান্তি না থাকে।*
