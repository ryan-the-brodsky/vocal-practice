# Vocal Habit — Keyword Research & SEO Opportunity Map

**Date:** 2026-06-24
**Domain:** vocalhabit.com
**Source:** Ahrefs API v3 (Keywords Explorer + SERP Overview + Site Explorer), market = US
**Data files in this folder:**
- `keywords-2026-06.csv` — 99 deduplicated, product-relevant keywords tagged by cluster
- `serp-snapshots-2026-06.json` — top-10 organic competition for the 3 priority targets
- `keyword-research-2026-06.md` — this report

> Ahrefs units used for this research run: ~12,000 of 100,000/mo (Lite plan). Plenty of headroom for follow-ups.

---

## TL;DR

1. **Your two seed phrases barely get searched.** `free vocal exercises` and `free singing site` are ~0 volume in the US. "Free" is a great *click-magnet word to put in titles*, not a keyword to target on its own.
2. **The real demand is right next door, and it's soft.** `vocal warm ups` (5,300/mo, **difficulty 3**), `vocal exercises` (1,800/mo, KD 16), `vocal range test` (8,400/mo, KD 6) — all low-difficulty SERPs full of YouTube, Reddit, and small blogs. The app *is* literally this product.
3. **The single best play is a `vocal range test` interactive tool page.** 8,400 searches/mo, traffic potential 23,000, and the SERP is won by *interactive tools* (Tonegym, Singing Carrots) — not 2,000-word articles. That's your pitch-detection engine's home turf. Tonegym's one tool page pulls **~20,800 visits/mo**.
4. **You're starting from zero, but the bar is low.** vocalhabit.com is DR 0 with 0 ranking keywords (brand new, barely crawled). Your closest model, **Singing Carrots, is only DR 33** and pulls **~24,000 organic visits/mo**. This is a winnable category, not a fortress.

---

## Reality check on the original targets

| Phrase you mentioned | US volume/mo | Verdict |
|---|---|---|
| `free vocal exercises` | ~0 | No search demand. Don't target. |
| `free singing site` | ~0 | No search demand. Don't target. |
| `free singing lessons` | 400 (KD 2) | Real, and easy — worth a page. |
| `free singing app` | 150 (KD 29) | Real but app-store-dominated. |
| `learn to sing for free` | 100 (KD 8) | Real, easy. |

**Reframe:** people don't search "free [thing]" much — they search the *thing* (`vocal warm ups`, `vocal range test`), then "free" / "no signup" in your title+meta is what wins the click against paid apps and lesson upsells. Use "free" as positioning, target the head terms.

---

## Where you stand today vs. the benchmark

| | vocalhabit.com | Singing Carrots (the model) | Tonegym |
|---|---|---|---|
| Domain Rating | **0** | 33 | 44 |
| Organic keywords | 0 | 4,652 | — |
| Top-3 rankings | 0 | 1,436 | — |
| Est. organic traffic/mo | 0 | **~24,174** | (one tool page = ~20,800) |

Takeaway: a **DR 33** site beats this whole category. That's a realistic 12–18 month target. Singing Carrots is a free, browser-based singing-practice tool with a pitch detector, a vocal range test, and exercises — i.e. **your closest direct competitor and your roadmap.** Study `singingcarrots.com`.

---

## The opportunity map (by cluster)

Full data in `keywords-2026-06.csv`. Totals are US volume/mo across the keywords in each cluster.

| Cluster | # kw | Total vol/mo | Difficulty | Product fit | Priority |
|---|---|---|---|---|---|
| **Warmups** | 35 | ~11,970 | mostly KD 0–6 (head term KD 3) | 🟢 exact | **P0** |
| **Range test** | 1 | 8,400 | KD 6 (TP 23,000) | 🟢 you have pitch detection | **P0** |
| **Exercises (general)** | 14 | ~4,670 | KD 0–16 | 🟢 exact | **P1** |
| **Learn to sing / improve** | 14 | ~107,000* | KD 0–12 | 🟡 informational, top-of-funnel | **P1 (blog)** |
| **App / commercial** | 14 | ~2,770 | KD 4–29 | 🟢 you are an app | **P2 (hard SERP)** |
| **Practice** | 7 | ~1,090 | KD 0–36 | 🟢 exact | **P2** |
| **Technique (chest/mix/head/belt/vibrato)** | 11 | ~790 | **KD 0–6** | 🟢 matches new taxonomy | **P1 (easy wins)** |
| **Pitch / in tune** | 3 | ~520 | KD 0–17 | 🟢 your USP | **P2** |

\* The learn-to-sing total is inflated by `how to sing` (100,000/mo, KD 11). That's a huge informational term dominated by YouTube + AI Overview — a long-term blog play, not a quick win.

---

## The three plays, in priority order

### 🥇 Play 1 — Build a `/vocal-range-test` interactive tool page (highest ROI)

- **Target:** `vocal range test` — 8,400/mo, **KD 6**, traffic potential **23,000**.
- **Why it's the best move:** the SERP is owned by *interactive tools*, not content:
  - #1 Tonegym tool page — DR 44, 48 refdomains, **~20,800 visits/mo**
  - #2 Singing Carrots `/range-test` — DR 33, 32 refdomains, ~5,500 visits/mo
  - #3 mixbutton tool — DR 36, only **3 refdomains**, ~3,600 visits/mo
- A DR-3 site (`tourdefierce.vip`) ranks #6 with **0 refdomains** — proof the SERP isn't link-fortified.
- **You already have the hard part** (mic capture + pitchy pitch detection). Wrap it as a standalone, shareable "Find your vocal range" page: sing low→high, it returns your range + voice type (soprano/alto/tenor/baritone — which you already model), then CTA into the warm-up app.
- **Bonus:** this cluster also feeds `voice type test`, `am i a soprano or alto`, etc. — expand once the page exists.

### 🥈 Play 2 — Own the warm-ups / exercises cluster (your core product = the keyword)

- **Primary:** `vocal warm ups` (5,300, KD 3), `vocal warm up exercises` (1,300, KD 26), `vocal exercises` (1,800, KD 16), `singing warm ups` (700, KD 6).
- **SERP reality (`vocal warm ups`):** #1 is a School of Rock listicle (featured snippet); the rest is YouTube, Reddit, and blogs. A DR-0 blog (`staceymenton.com`, 1 refdomain) ranks #10 — *the door is open.*
- **What to build:** a real landing page (not just the app shell) at e.g. `/vocal-warm-ups` that **does** the thing — pick a voice part, press play, sing along, get scored — plus indexable supporting copy explaining each warm-up. Google's results here are mostly "9 best warm-ups" lists; an *interactive* warm-up tool is differentiated and matches intent better.
- **Long-tail freebies in this cluster (all KD 0–2, easy pages/sections):** `5 minute vocal warm up` (200), `10 minute vocal warm up` (70), `vocal scales warm up` (90), `soprano vocal warm up` (80), `male vocal warm up` (40), `vocal warm up app` (40, KD 2 — commercial, you literally are one), `daily vocal warm up` (parent topic alone = 3,900 TP).

### 🥉 Play 3 — Sweep the technique long-tail (KD 0, perfectly matches your new taxonomy)

You just shipped a Chest → Mix → Head taxonomy plus belt/vibrato/agility. These map 1:1 to **near-zero-difficulty** keywords:

| Keyword | Vol/mo | KD |
|---|---|---|
| `semi occluded vocal tract exercises` (SOVT) | 150 | 2 |
| `vocal resonance exercises` | 90 | 0 |
| `vibrato exercises` | 80 | 0 |
| `vocal breathing exercises` | 80 | 6 |
| `head voice exercises` | 70 | 0 |
| `vocal agility exercises` | 70 | 0 |
| `vocal range exercises` | 60 | 3 |
| `vocal belting exercises` | 60 | — |
| `chest voice exercises` | 40 | 0 |
| `mix voice exercises` | 30 | 0 |

Individually small, collectively a tidy ~700/mo of *exactly your users* — and each is a near-empty SERP. A short page per capability (you already have the blurbs in `lib/exercises/capabilities.ts`) that embeds the matching exercise is a low-effort, high-relevance win. Note: **you have a SOVT exercise (lip trill) already** — `semi occluded vocal tract exercises` (KD 2) is a gift.

---

## App / commercial terms — play the listicles, don't fight the app stores

`vocal training app` (250), `singing app` (1,000, KD 50), `voice training app` (450), `singing practice app` (100), `learn to sing app` (300), `best app to learn to sing` (100).

**Don't expect to rank your own page here** — these SERPs are Apple App Store + Google Play (DR 97–99) + Reddit/Quora + "best singing apps" review listicles. The realistic moves:
1. **Get listed in the roundups** that already rank — `americansongwriter.com/best-singing-apps`, `singwell.eu/singing-apps` (DR 29!), etc. Outreach: "free, no-signup, browser-based, with real pitch scoring" is a strong angle for inclusion.
2. **Be present in the Reddit/Quora threads** (`r/singing` app-recommendation posts rank on page 1) — organic, non-spammy mentions.
3. Long-game: a native wrapper / PWA listing if you ever want the app-store real estate.

---

## Quick-win shortlist (do these first)

Ranked by `(volume × fit) ÷ difficulty`:

| # | Keyword | Vol | KD | Action |
|---|---|---|---|---|
| 1 | `vocal range test` | 8,400 | 6 | Ship a standalone interactive range-test page. **Top priority.** |
| 2 | `vocal warm ups` | 5,300 | 3 | Make `/vocal-warm-ups` a real indexable interactive page. |
| 3 | `vocal exercises` | 1,800 | 16 | Indexable `/vocal-exercises` hub linking each exercise. |
| 4 | `singing warm ups` | 700 | 6 | Variant copy / H2 on the warm-ups page. |
| 5 | `free singing lessons` | 400 | 2 | "Free guided lessons" framing page. |
| 6 | `how to improve singing voice` | 500 | 3 | Short blog post → CTA into app. |
| 7 | `how to sing in tune` | 300 | 0 | Blog post leaning on your pitch-scoring USP. |
| 8 | `vocal warm up app` | 40 | 2 | Title/meta — you *are* this. |
| 9 | technique cluster (10 kw) | ~700 | 0–6 | One page per capability (chest/mix/head/belt/vibrato/SOVT). |
| 10 | `5 / 10 minute vocal warm up` | 270 | 0 | Timed-routine presets as landing sections. |

---

## On-page recommendations for vocalhabit.com

The app is currently a single SPA (`web.output: "single"`, SSR disabled) — **this is the #1 SEO blocker.** Right now there's essentially nothing for Google to index beyond the shell. Priorities:

1. **Indexable content.** The biggest lever is getting real HTML in front of the crawler. Options, easiest→hardest:
   - Add static, pre-rendered landing pages (`/vocal-warm-ups`, `/vocal-range-test`, `/vocal-exercises`, one per capability) with genuine copy + the interactive widget mounted client-side. Even simple pre-rendered HTML beats an empty SPA shell.
   - Re-evaluate the SSR/`tslib` blocker, or use a static-export / prerender step for marketing routes only (keep the app SPA).
2. **`<title>` + meta** per page, with "free / no signup" baked in. e.g. *"Free Vocal Warm-Ups — Sing Along & Get Scored | Vocal Habit"*.
3. **Schema markup:** `SoftwareApplication` (free, web) + `HowTo` on warm-up pages + `FAQPage` for the "can anyone learn to sing" type questions. (There's an `ai-seo` / `schema-markup` skill available if you want help.)
4. **One H1 per page** matching the target term; supporting H2s using the variants above.
5. **Internal linking** from each landing page into the live exercise it describes.
6. **A few referring domains.** DR 0 → even 5–10 quality links (directories of free music tools, a Reddit/forum mention, the "best singing apps" roundups, Product Hunt) moves the needle fast at this level.

---

## Competitors to study

- **Singing Carrots** (`singingcarrots.com`, DR 33, ~24k visits/mo) — the closest analog. Free browser tool: range test, pitch monitor, exercises, song search. Reverse-engineer their page structure and internal linking. *This is your template.*
- **Tonegym** (`tonegym.co`, DR 44) — ranks #1 for `vocal range test` AND appears for `vocal warm ups` with tool pages. Gamified ear/voice training.
- **mixbutton.com** (DR 36, only 3 refdomains) — proof a thin-link tool page can rank top 3.

---

## Suggested next steps

1. **Confirm priority** — do you want to lead with the **range-test tool page** (Play 1, biggest single prize) or the **warm-ups cluster** (Play 2, broadest fit)? I'd start with the range test.
2. **Decide the indexability fix** — prerendered marketing pages vs. revisiting SSR. This gates everything else.
3. Once a page is live, I can **add it to Ahrefs Rank Tracker** (this MCP supports it) to monitor these keywords over time, and re-run this research quarterly.
4. Optional: I can pull **`also rank for` / `also talk about`** related terms and **search-volume-by-country** if you want to size non-US markets (global volumes are ~2–3× US on most of these).

---

### Methodology & caveats
- Volumes/KD are Ahrefs US estimates as of 2026-06-24; treat as directional, not exact.
- KD ("Keyword Difficulty", 0–100) estimates ranking difficulty for the top 10; low KD here largely reflects SERPs full of YouTube/Reddit/small blogs, **not** that a DR-0 site ranks instantly — you still need indexable pages + a handful of links + crawl time.
- Excluded from the dataset: the medical/speech-therapy "vocal cord dysfunction / paralysis / atrophy / hoarseness" cluster and gender-voice-training terms — real volume, wrong audience for this product.
- CPC is in USD (Ahrefs returns cents; converted here).
