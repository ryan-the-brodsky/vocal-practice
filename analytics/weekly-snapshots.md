# Vocal Habit — Weekly Snapshots

Persistent week-over-week metrics so trends survive the sliding 7-day window. **Time-series rows**
(visitors, pageviews, funnel, returning) are recomputed from source each run — PostHog and Ahrefs both retain
history, so these self-heal. **Point-in-time rows** (citations, cumulative crawler hits, branded search) are
*snapshotted* because they can't be recomputed for a past date. Buckets are 7 days from launch (Aug 13, 2026).
The current bucket is partial until it fills — see "days". **Read growth from the per-day rates, never the totals.**

## Volume & funnel — 7-day buckets

| Bucket | Days | Visitors (Ahrefs) | LLM % | Pageviews | Practice▶ | Reached scoring | Logged | practice/day | scoring/day |
|---|---|---|---|---|---|---|---|---|---|
| W1 · Aug 13–19 | 7 | 207 | 53% | 526 | 244 | 162 | 45 | 34.9 | 23.1 |
| W2 · Aug 20–26 | 6* | 219 | 50% | 450 | 238 | 170 | 77 | 39.7 | 28.3 |

\*W2 volume/funnel computed on its 6 full days (Aug 20–25; Aug 26 partial, excluded). **Per-day W1→W2: practice
+14%, scoring +23%, logged +100%** vs pageviews flat (75→75/day) — engagement keeps **outpacing traffic**, though
the deepening softened as W2 filled (lighter Aug 25). W2's 50% LLM reflects the persistent high-bounce direct surge
diluting the mix (see investigation), not an LLM decline — LLM flat at ~18/day.

## Retention (1B) — the health bar

| Metric | Returning | New |
|---|---|---|
| Pages / visit | 3.05 | 2.20 |
| Practice starts / visitor-day (**depth**) | 2.49 | 0.98 |

**Health bar = both rising. Status Aug 26: PASSING (4th run).**
- **Volume** (returning practice-starts/day): **7.75 → 10.9 → 12.3 → 13.9/day** ✓
- **Depth** (practice-starts/returning visit): **1.89 → 2.10 → 2.14 → 2.32 → 2.49** ✓
- Returning share of tagged pageviews: 22.5% → 20.2% → **23.0%** (recovered). Untagged still 0 (resolved).
- **Genuine practice-returner counter now reading** (Aug 24+ tagged): repeat starts 27 vs 9 first-timers,
  `practiceNumber` tail to #11 — directional (n small); clean cut on this metric ~a week out.

## Inflow (1A) — lever gauges (mostly point-in-time)

Flat so far — no inflow experiment shipped yet. Baseline to beat as content/authority work begins:

| Date | ChatGPT cites | Copilot cites | ChatGPT referrals/day | Branded search ("vocal habit") | DR |
|---|---|---|---|---|---|
| 2026-08-22 | 33 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-24 | 32 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-25 | 33 / 4pg | 5 / 3pg | ~14 | pos 2 (Google) | 0 |
| 2026-08-26 | 33 / 4pg | 5 / 3pg | ~18 | 8 clicks / pos 2 (Google, 7d) | 0 |

## Crawler hits (cumulative; retrieval ≠ referrals)

| Date | ChatGPT-User | OAI-SearchBot | ClaudeBot | PerplexityBot | GPTBot | Claude cite-path (SearchBot/User) |
|---|---|---|---|---|---|---|
| 2026-08-20 | 126 | 37 | 39 | 39 | 33 | 3 / 1 (≈ tests) |
| 2026-08-21 | 159 | 41 | 41 | 39 | 33 | 3 / 1 |
| 2026-08-22 | 310 | 70 | 70 | 69 | 67 | 3 / 1 |
| 2026-08-24 | 350 | 75 | 71 | 69 | 67 | 3 / 1 (STILL ≈ tests) |
| 2026-08-25 | 393 | 79 | 72 | 70 | 67 | 3 / 2 (STILL ≈ tests) |
| 2026-08-26 | 446 | 85 | 72 | 70 | 67 | 3 / 3 (STILL ≈ tests) |

`ChatGPT-User` climbing (retrieval 393→446, +13%) while human referrals stay ~18/day — zero-click. **Anthropic
still scraped-not-recommended**: `Claude-SearchBot` hasn't crawled for real since the Aug 20 test, 6 days after
robots allow + Brave submit (only +1 `Claude-User` hit since). Verify Brave has actually indexed us (blocking action).

**⚠️ Aug 26 (run 2) — the raw counts above are SPOOF-INFLATED. Read content_hits, not raw UA totals.** A
credential-scanner fakes crawler UAs to hit secret paths (`/.env`, `/.ssh`, `/aws/credentials`). Content-path
filter (§C) gives the REAL cumulative retrieval:

| Bot | Content hits (real) | Probe hits (spoof) |
|---|---|---|
| ChatGPT-User | **277** | 209 |
| OAI-SearchBot | 25 | 96 |
| ClaudeBot | 6 | 80 |
| Claude-User | **3** | 37 |
| Claude-SearchBot | **3** | 16 |
| PerplexityBot | 1 | 81 |
| GPTBot | 0 | 93 |
| Perplexity-User | 0 | 23 |

**ChatGPT-User (277 content) is the only genuine retrieval, and it matches Bing's 277 AI citations exactly.** Claude
stays test-level (3/3) — never went live. The prior 446/72/70 rows counted spoof traffic; keep them for history but
judge crawling on content_hits going forward.
