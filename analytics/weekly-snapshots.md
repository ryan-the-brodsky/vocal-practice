# Vocal Habit — Weekly Snapshots

Persistent week-over-week metrics so trends survive the sliding 7-day window. **Time-series rows**
(visitors, pageviews, funnel, returning) are recomputed from source each run — PostHog and Ahrefs both retain
history, so these self-heal. **Point-in-time rows** (citations, cumulative crawler hits) are *snapshotted*
because they can't be recomputed for a past date. Buckets are 7 days from launch (Aug 13, 2026). The current
bucket is partial until it fills — see "days".

## Volume & funnel — 7-day buckets

| Bucket | Days | Visitors (Ahrefs) | LLM % | Pageviews | Practice▶ | Reached scoring | Logged | practice/day | scoring/day |
|---|---|---|---|---|---|---|---|---|---|
| W1 · Aug 13–19 | 7 | 207 | 53% | 526 | 244 | 162 | 45 | 34.9 | 23.1 |
| W2 · Aug 20–26 | 2* | 66→ | 48% | 146 | 83 | 62 | 23 | 41.5 | 31.0 |

\*W2 is 2 of 7 days. **Per-day trend W1→W2: practice +19%, scoring +34%, logged +80%** while pageviews held flat
(~75→73/day) — the funnel is *deepening*, not just holding. Confirm as W2 fills.

## Returning cohort — by period

| Period | Returning % (of tagged) | Returning pages/visit | New pages/visit | Untagged pv |
|---|---|---|---|---|
| Cumulative (Aug 13–21) | 20% | 3.28 | 2.67 | 87 |
| Early (Aug 13–16, ISO wk) | 30% | — | — | 87 |
| Recent (Aug 17–21, ISO wk) | 14% | — | — | 0 |

Returning **share** fell 30%→14% — but that's **dilution from a new-visitor surge** (162→305 new pageviews), not
fewer returns (69→49 absolute, similar). **Untagged resolved** (87→0): the missing-super-property issue was an
early-days artifact, now clean. Returning visitors stay ~23% deeper (3.28 vs 2.67 pages/visit) and start ~50%
more practice per visit.

## Point-in-time snapshots (dated; not recomputable)

| Date | ChatGPT cites | Copilot cites | ChatGPT-User (cum) | OAI-SearchBot (cum) | ClaudeBot (cum) | Claude cite-path (SearchBot/User) |
|---|---|---|---|---|---|---|
| 2026-08-20 | 33 / 4pg | 5 / 3pg | 126 | 37 | 39 | 3 / 1 (≈ tests) |
| 2026-08-21 | 34 / 4pg | 5 / 3pg | 159 | 41 | 41 | 3 / 1 (still ≈ tests) |

ChatGPT-User climbing (126→159); Anthropic still training-only (ClaudeBot +2), citation-path flat at test levels
— **scraped, not recommended.** PerplexityBot/GPTBot went quiet after Aug 20.
