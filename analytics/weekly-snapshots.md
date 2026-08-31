# Vocal Habit Weekly Snapshots

Persistent week-over-week metrics so trends survive the sliding 7-day window. **Time-series rows**
(visitors, pageviews, funnel, returning) are recomputed from source each run; PostHog and Ahrefs both retain
history, so these self-heal. **Point-in-time rows** (citations, cumulative crawler hits, branded search) are
*snapshotted* because they can't be recomputed for a past date. Buckets are 7 days from launch (Aug 13, 2026).
The current bucket is partial until it fills (see "days"). **Read growth from the per-day rates, never the totals.**

## Volume & funnel, 7-day buckets

| Bucket | Days | Visitors (Ahrefs) | LLM % | Pageviews | Practice▶ | Reached scoring | Logged | practice/day | scoring/day |
|---|---|---|---|---|---|---|---|---|---|
| W1 · Aug 13–19 | 7 | 176 | 52% | 526 | 244 | 162 | 45 | 34.9 | 23.1 |
| W2 · Aug 20–26 | 7 | 219 | 48% | 479 | 244 | 175 | 79 | 34.9 | 25.0 |
| W3 · Aug 27–Sep 2 | 3* | n/a | n/a | 238 | 182 | 127 | 32 | 60.7 | 42.3 |

\*W3 per-day rates computed on the 3 complete days (Aug 27–29); Aug 30 is partial and excluded. The Aug 27–28 spike
(64, 91 starts) did **not** hold — Aug 29 fell back to 27 and Aug 30 is pacing ~normal — so W3's elevated per-day rate
is the burst, not a new level. A stray future-dated Aug-31 row (12 pv, clock skew) is excluded. Ahrefs visitors still
not comparable (see caveat below).

**⚠️ Correction (Aug 27): the "funnel deepening" finding does not survive W2 completing.** Prior runs computed W2 on
its first 5–6 days and reported practice +14–23%/day. With all 7 days in, **per-day W1→W2 practice is exactly flat
(34.9 → 34.9)**, scoring **+8%** (23.1 → 25.0), logged **+76%** (6.4 → 11.3), and pageviews **fell 9%** (75.1 →
68.4/day). Only logging genuinely rose. The earlier reading excluded the very light Aug 25 (23 starts) and Aug 26
(6 starts). Lesson banked: never headline a delta computed on a partial bucket.

**Ahrefs visitor counts are not reliable at this precision.** W1 recomputed to **176** this run, down from the 207
recorded on Aug 21, and the cumulative Aug 13–27 call returns **449**, more than the two buckets sum to (395). The
counts are neither stable across refreshes nor additive across ranges. Use PostHog pageviews for volume trend and
treat Ahrefs visitors as channel-mix only.

## Retention (1B): the health bar

| Metric | Returning | New |
|---|---|---|
| Pages / visit | 6.84 | 3.27 |
| Practice starts / visitor-day (**depth**) | 3.21 | 1.11 |

**Health bar = both rising. Status Aug 28: PASSING (6th run), still LOW CONFIDENCE — the Aug 27–28 volume spike inflates the returning series; see the caveat.**
- **Volume** (returning practice-starts/day): **7.75 → 10.9 → 12.3 → 13.9 → 14.9 → 19.7/day** ✓ (Aug 28; note the Aug 27–28 volume spike lifts this — read with the WATCH)
- **Depth** (practice-starts/returning visit): **1.89 → 2.10 → 2.14 → 2.32 → 2.49 → 2.60 → 3.21** ✓
- Returning share of tagged pageviews: 22.5% → 20.2% → 23.0% → 29.7% → **35.9%**. Untagged still 0 (resolved).
- Visit-number tail this window: 1→329 pv, 2→100, 3→6, 4→7, 5→7, 6→4, 7→15.

**⚠️ One identity decides the verdict.** A single person logged 26 practice starts on Aug 27 with `practiceNumber`
running 1→24 on deploy day while toggling Guided mode. Almost certainly developer testing of the new nudge. It sits
in the `returning=true` cohort and supplies **24 of that cohort's 104 starts**. Excluding it, the same two bars read
**11.4/day volume and 2.05 depth, both DOWN**. Heavy single-day identities appear in every prior week too (30 starts
wk of Aug 10, 24 wk of Aug 17; cookieless ids rotate daily, so one human = one id per day), so excluding would break
the series and was not done. At this n the pass/fail flips on one person.

**The practice-returner curve** (`practiceNumber`, Aug 25+, 100% coverage, dev identity excluded).
Lead with this from here; it counts genuine practice-returners, not site-visit returners:

| Milestone | Devices (raw) | Genuine (−1 dev) | Share | vs Aug 25–27 |
|---|---|---|---|---|
| Practiced ≥1 | 28 | 27 | 100% | +9 (was 18) |
| Reached #2 | 21 | 20 | 74% | +7 (was 13, 72%) |
| Reached #3 | 15 | 14 | 52% | +4 (was 10, 56%) |
| Reached #5 | 10 | 9 | 33% | +4 (was 5, 28%) |
| Reached #10 | 5 | 4 | 15% | new tier |
| Reached #16 | 4 | 3 | 11% | new tier |

**Aug 28 read: the deep-returner cohort roughly doubled.** #5-reachers went **5 → 10** (genuine 9) and a #10 tier
(4 genuine) and #16 tier (3 genuine) now exist where before the curve ran out. The *rates* held (72→74% at #2,
28→33% at #5), so the growth is more people entering the funnel (Aug 28 added ~10 practicers) with retention shape
stable-to-improving, not just window-widening. That is the "growing habit-builder cohort" signal.

Caveats: (1) `practiceNumber` is a localStorage per-device counter — a fresh device or cleared storage restarts at
1, so every tier is a **floor**. (2) One dev device reached **54** (30 starts on Aug 28 alone) and passes through
every bucket, so it inflates each tier by exactly 1 and **owns the entire n≥21 tail** — subtracted in the "genuine"
column. (3) Window is cumulative from Aug 25 (4 days), so the vs-prior counts partly reflect one more (big) day, not
pure retention. Re-cut weekly.

## Inflow (1A): lever gauges (mostly point-in-time)

Flat so far, no inflow experiment shipped yet. Baseline to beat as content/authority work begins:

| Date | Bing cites (real) | Bing cited pages | ChatGPT cites (Ahrefs) | Copilot cites (Ahrefs) | ChatGPT referrals/day | Branded search ("vocal habit") | DR |
|---|---|---|---|---|---|---|---|
| 2026-08-22 | n/a | n/a | 33 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-24 | n/a | n/a | 32 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-25 | n/a | n/a | 33 / 4pg | 5 / 3pg | ~14 | pos 2 (Google) | 0 |
| 2026-08-26 | 277 | ~5 (top reported) | 33 / 4pg | 5 / 3pg | ~18 | 8 clicks / pos 2 (Google, 7d) | 0 |
| 2026-08-27 | **352** | **17** | 33 / 4pg | 5 / 3pg | ~15 | 7 clicks / pos 2 (Google, 7d) | 0 |
| 2026-08-28 | 352* | 17* | 33 / 4pg | 5 / 3pg | ~15 | 37 clicks / pos 2.7 (Google, 30d) | 0 |

**Aug 27: 1A moved for the first time, on the citation lever only.** Bing citations per day: **10.9/day (Aug 11–17)
→ 28.7/day (Aug 18–24)**, +163%; single days of 79 (Aug 22) and 75 (Aug 25). Bing's own "avg cited pages" moved
**4 → 10** on Aug 25, which is directly comparable and confirms the surface really widened (the 5 → 17 page jump is
partly a reporting difference, since prior runs recorded only the top ~5 rows).

Bing daily citations, Aug 11–25: 9, 12, 10, 11, 1, 14, 19, 16, 18, 10, 21, **79**, 8, **49**, **75**.

**Cited pages (Aug 27, 17 total):** `/learn/` **168** · sovt-exercises 40 · `/` 25 · freddie-mercury 20 ·
**`/vocal-range-test` 12** · can-tone-deaf-people-learn-to-sing 11 · vocal-warm-ups-for-beginners 11 ·
chappell-roan 10 · vocal-agility 8 · ariana-grande 7 · how-to-increase-vocal-range 5 · mix-voice 4 ·
can-anyone-learn-to-sing 4 · chest-voice 2 · belting 1 · breathing 1 · how-to-practice-singing 1.

**Grounding queries (Aug 27, 6 total):** "learn to sing online free" 44 (23.7%) · **"learn to sing" 40 (20.5%,
was 8)** · "best free online singing course" 32 (19.8%) · "free singing lessons for beginners" 19 (17.9%) ·
**"range test" 9 (14.3%, NEW)** · "free voice lessons for beginners" 4 (11.1%). The range-test entry is the first
sign a *tool page* pulls citations on its own terms rather than everything routing through the Learn hub.

**Ahrefs has now returned an identical 33/5 for six consecutive runs** while Bing's first-party count went
277 → 352. Treat the Ahrefs citation panel as a stale sample, not a trend line.

**Bing indexation (Aug 27): 25/31 sitemap URLs indexed.** Never crawled: the three Aug-26 pain-point articles
(`why-cant-i-sing-high-notes`, `why-do-i-sing-flat`, `why-does-my-recorded-voice-sound-bad`) plus
`why-does-my-voice-crack`, the last still uncrawled a day after manual Request Indexing. Crawled-but-unindexed:
`how-to-improve-singing-voice`, `how-to-practice-singing`. Publish + IndexNow is not producing a next-day crawl.
Bing Search Performance: 978 impr / 12 clicks over Aug 12–25 (~70 impr/day, flat); top organic queries
"vocal warm ups" 51 and "vocal warm up" 37, **both at 0 clicks**.

## Crawler hits (cumulative; retrieval ≠ referrals)

| Date | ChatGPT-User | OAI-SearchBot | ClaudeBot | PerplexityBot | GPTBot | Claude cite-path (SearchBot/User) |
|---|---|---|---|---|---|---|
| 2026-08-20 | 126 | 37 | 39 | 39 | 33 | 3 / 1 (≈ tests) |
| 2026-08-21 | 159 | 41 | 41 | 39 | 33 | 3 / 1 |
| 2026-08-22 | 310 | 70 | 70 | 69 | 67 | 3 / 1 |
| 2026-08-24 | 350 | 75 | 71 | 69 | 67 | 3 / 1 (STILL ≈ tests) |
| 2026-08-25 | 393 | 79 | 72 | 70 | 67 | 3 / 2 (STILL ≈ tests) |
| 2026-08-26 | 446 | 85 | 72 | 70 | 67 | 3 / 3 (STILL ≈ tests) |

`ChatGPT-User` climbing (retrieval 393→446, +13%) while human referrals stay ~18/day. Zero-click. **Anthropic
still scraped-not-recommended**: `Claude-SearchBot` hasn't crawled for real since the Aug 20 test, 6 days after
robots allow + Brave submit (only +1 `Claude-User` hit since). Verify Brave has actually indexed us (blocking action).

**⚠️ Aug 26 (run 2). The raw counts above are SPOOF-INFLATED. Read content_hits, not raw UA totals.** A
credential-scanner fakes crawler UAs to hit secret paths (`/.env`, `/.ssh`, `/aws/credentials`). Content-path
filter (§C) gives the REAL cumulative retrieval:

| Bot | Content hits Aug 26 | Content hits **Aug 27** | Probe hits (spoof, Aug 27) |
|---|---|---|---|
| ChatGPT-User | 277 | **314** | 209 |
| OAI-SearchBot | 25 | 32 | 96 |
| ClaudeBot | 6 | 9 | 80 |
| Claude-User | **3** | **3** | 37 |
| Claude-SearchBot | **3** | **3** | 16 |
| PerplexityBot | 1 | 1 | 81 |
| GPTBot | 0 | 0 | 93 |
| Perplexity-User | 0 | 0 | 23 |

**ChatGPT-User is the only genuine retrieval.** Claude stays test-level (3/3) seven days after the robots allow, never went live. The prior 446/72/70 rows counted spoof traffic; keep them for history but judge crawling on
content_hits going forward.

**⚠️ Rate correction (Aug 27): ChatGPT-User retrieval is FLAT, not growing.** Per-day content hits Aug 20–27:
**36, 39, 47, 42, 44, 35, 36, 35**. Averaging ~39/day with no trend. **Aug 28 (partial):** cumulative content hits ChatGPT-User 314 → **349**, OAI-SearchBot 32 → 35, ClaudeBot 9; Claude cite-path still **3/3** (test-level, 8 days on). Per-day ChatGPT-User retrieval ~35, still flat. The cumulative 277 → 314 is one more day
accumulating. The "+12%" (Aug 25) and "+13%" (Aug 26) growth claims in earlier entries were reading the cumulative
total, which is exactly the accumulation trap this file warns about. **Only the per-day rate counts.**

**Reconciliation:** Bing citations are rising fast while live `ChatGPT-User` fetches are flat. Both can be true. Answers are increasingly grounded on Bing's **cached index** rather than fresh page pulls. That also explains
citations rising while human referrals hold at ~15/day: more consultation, not more clicks.

## Point-in-time snapshot — 2026-08-30

- **Bing AI Performance (3 M):** total **450** citations / avg cited pages 5. Daily series Aug 21–27: 21, 79, 8, 49, 75, 44, 54
  (≈47.1/day last 7 data days vs ≈12.7 the prior 7 — still accelerating; Bing lags ~2 days). Cited pages (17): /learn/ 224 ·
  sovt 46 · / 31 · **vocal-warm-ups-for-beginners 31** · freddie-mercury 20 · chappell-roan 13 · ariana-grande 13 ·
  vocal-range-test 12 · tone-deaf 11 · agility 9 · increase-range 5 · mix 4 · can-anyone 4 · chest 2 · belting 1 · breathing 1 ·
  how-to-practice 1. Grounding queries (8): learn to sing online free 56 · learn to sing 52 · best free online singing course 32 ·
  free singing lessons for beginners 31 · range test 9 · free voice lessons for beginners 8 · learning to sing 6 · learning singing 6.
- **Ahrefs citation sample:** chatgpt 30/5 (fell from 33/5 — stale sample), copilot 7/3, all others 0.
- **Crawler content hits (cumulative since tap):** ChatGPT-User **435** (≈43/day, flat rate) · OAI-SearchBot 44 · ClaudeBot 9 ·
  Claude-User/SearchBot **3/3 (frozen 10 days)** · PerplexityBot 2 · GPTBot 0. Course paths: 0 hits from any bot.
- **Bing index:** 26/42 sitemap URLs; not indexed = 11 /courses/ URLs (submitted Aug 29) + 4 why-* articles (never crawled) + 1.
- **Bing organic:** ~39–77 impr/day, 0–3 clicks/day, flat. Google branded "vocal habit" (7d): 3 clicks / 5 impr / pos 2.
- **Courses funnel since deploy:** 18 pv / 4 people; course_viewed 6/3 · lesson_viewed 5/2 · next_pressed 4/2 · completed 1/1 · toggled 0.
