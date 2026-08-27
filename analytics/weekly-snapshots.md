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
| W3 · Aug 27– | 1* | n/a | n/a | 69 | 59 | 40 | 17 | 59.0 | 40.0 |

\*W3 is one partial day and is inflated by developer testing (one identity = 26 of 59 starts); do not read it as a
trend. Ahrefs has not ingested Aug 27 at all, hence n/a.

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
| Pages / visit | 3.48 | 2.12 |
| Practice starts / visitor-day (**depth**) | 2.60 | 0.97 |

**Health bar = both rising. Status Aug 27: PASSING (5th run), but LOW CONFIDENCE, see the caveat.**
- **Volume** (returning practice-starts/day): **7.75 → 10.9 → 12.3 → 13.9 → 14.9/day** ✓ (+7%)
- **Depth** (practice-starts/returning visit): **1.89 → 2.10 → 2.14 → 2.32 → 2.49 → 2.60** ✓
- Returning share of tagged pageviews: 22.5% → 20.2% → 23.0% → **29.7%**. Untagged still 0 (resolved).
- Visit-number tail this window: 1→329 pv, 2→100, 3→6, 4→7, 5→7, 6→4, 7→15.

**⚠️ One identity decides the verdict.** A single person logged 26 practice starts on Aug 27 with `practiceNumber`
running 1→24 on deploy day while toggling Guided mode. Almost certainly developer testing of the new nudge. It sits
in the `returning=true` cohort and supplies **24 of that cohort's 104 starts**. Excluding it, the same two bars read
**11.4/day volume and 2.05 depth, both DOWN**. Heavy single-day identities appear in every prior week too (30 starts
wk of Aug 10, 24 wk of Aug 17; cookieless ids rotate daily, so one human = one id per day), so excluding would break
the series and was not done. At this n the pass/fail flips on one person.

**The practice-returner curve** (`practiceNumber`, Aug 25+, 100% coverage, dev identity excluded).
Lead with this from here; it counts genuine practice-returners, not site-visit returners:

| Milestone | Singers | Share |
|---|---|---|
| Practiced at all | 18 | 100% |
| Reached practice #2 | 13 | 72% |
| Reached practice #3 | 10 | 56% |
| Reached practice #5 | 5 | 28% |

Caveat: `practiceNumber` is a localStorage per-device counter. A fresh device or cleared storage restarts at 1, so
these are floors. Window is short (3 days); re-cut weekly as it accrues.

## Inflow (1A): lever gauges (mostly point-in-time)

Flat so far, no inflow experiment shipped yet. Baseline to beat as content/authority work begins:

| Date | Bing cites (real) | Bing cited pages | ChatGPT cites (Ahrefs) | Copilot cites (Ahrefs) | ChatGPT referrals/day | Branded search ("vocal habit") | DR |
|---|---|---|---|---|---|---|---|
| 2026-08-22 | n/a | n/a | 33 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-24 | n/a | n/a | 32 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-25 | n/a | n/a | 33 / 4pg | 5 / 3pg | ~14 | pos 2 (Google) | 0 |
| 2026-08-26 | 277 | ~5 (top reported) | 33 / 4pg | 5 / 3pg | ~18 | 8 clicks / pos 2 (Google, 7d) | 0 |
| 2026-08-27 | **352** | **17** | 33 / 4pg | 5 / 3pg | ~15 | 7 clicks / pos 2 (Google, 7d) | 0 |

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
**36, 39, 47, 42, 44, 35, 36, 35**. Averaging ~39/day with no trend. The cumulative 277 → 314 is one more day
accumulating. The "+12%" (Aug 25) and "+13%" (Aug 26) growth claims in earlier entries were reading the cumulative
total, which is exactly the accumulation trap this file warns about. **Only the per-day rate counts.**

**Reconciliation:** Bing citations are rising fast while live `ChatGPT-User` fetches are flat. Both can be true. Answers are increasingly grounded on Bing's **cached index** rather than fresh page pulls. That also explains
citations rising while human referrals hold at ~15/day: more consultation, not more clicks.
