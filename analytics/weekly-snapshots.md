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
| W2 · Aug 20–26 | 4* | 166→ | 45% | 332 | 170 | 121 | 48 | 42.5 | 30.25 |

\*W2 is 4 of 7 days. **Per-day W1→W2: practice +22%, scoring +31%, logged +88%** vs pageviews +11% (75→83/day) —
engagement keeps **outpacing traffic** (held over 4 days). W2's 45% LLM is the direct-traffic surge diluting the
mix (see investigation), not an LLM decline — LLM is flat at ~16/day.

## Retention (1B) — the health bar

| Metric | Returning | New |
|---|---|---|
| Pages / visit | 3.50 | 2.49 |
| Practice starts / visitor-day (**depth**) | 2.14 | 1.12 |

**Health bar = both rising. Status Aug 24: PASSING.**
- **Volume** (returning practice-starts/day, per ISO week): **7.75 → 10.9/day (+40%)** ✓
- **Depth** (practice-starts/returning visit): **1.89 → 2.10 → 2.14** ✓
- Returning share of tagged pageviews: 21% → **22.5%**. Untagged frozen at 87 (launch-days only; resolved).

## Inflow (1A) — lever gauges (mostly point-in-time)

Flat so far — no inflow experiment shipped yet. Baseline to beat as content/authority work begins:

| Date | ChatGPT cites | Copilot cites | ChatGPT referrals/day | Branded search ("vocal habit") | DR |
|---|---|---|---|---|---|
| 2026-08-22 | 33 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |
| 2026-08-24 | 32 / 4pg | 5 / 3pg | ~16 | 14 clicks / pos 2 (Google) | 0 |

## Crawler hits (cumulative; retrieval ≠ referrals)

| Date | ChatGPT-User | OAI-SearchBot | ClaudeBot | PerplexityBot | GPTBot | Claude cite-path (SearchBot/User) |
|---|---|---|---|---|---|---|
| 2026-08-20 | 126 | 37 | 39 | 39 | 33 | 3 / 1 (≈ tests) |
| 2026-08-21 | 159 | 41 | 41 | 39 | 33 | 3 / 1 |
| 2026-08-22 | 310 | 70 | 70 | 69 | 67 | 3 / 1 |
| 2026-08-24 | 350 | 75 | 71 | 69 | 67 | 3 / 1 (STILL ≈ tests) |

`ChatGPT-User` climbing (retrieval up) while human referrals stay ~16/day — zero-click. **Anthropic still
scraped-not-recommended**: `Claude-SearchBot` hasn't crawled since the Aug 20 test, 4 days after robots allow +
Brave submit. Verify Brave has actually indexed us.
