---
name: analytics-report
description: >-
  Vocal Habit traffic & product-analytics reporter for vocalhabit.com. Use when the user asks
  "what's the latest traffic report?", "what's the user activity?", "analytics report", "daily analytics",
  "how are we doing on citations?", "update the dashboard", or any request to summarize acquisition or in-app
  engagement. Two modes: a QUICK terminal answer for a narrow ask, and a FULL daily run that gathers everything
  across PostHog + Ahrefs, updates a persistent findings log, and publishes/refreshes an artifact dashboard.
  Always reconciles the two data sources and states the standard caveats — never raw dumps. Read-only on
  PostHog/Ahrefs; writes only the findings log + the dashboard artifact.
metadata:
  version: 2.0.0
---

# Analytics Report — Vocal Habit

Answer the site's core question — *what do AI-referred visitors do when they land?* — thoroughly and honestly.
Reconcile PostHog (behavior) against Ahrefs (acquisition), and never dump raw rows: synthesize.

## Modes

- **QUICK** ("what's the traffic report", "how's user activity") → run the matching section (§A or §B), answer
  in the terminal with tables + insights. Skip the dashboard/log unless asked.
- **FULL / DAILY** ("analytics report", "daily analytics", "update the dashboard", "full report", first run of a
  day) → run **everything** (§A + §B + §C), then **update the findings log** (§D) and **publish/refresh the
  dashboard artifact** (§E). This is the default when the ask is broad or mentions the dashboard.

**Window:** default last 7 days. Analytics went live **2026-08-13** — earlier is zero *by construction*. Today
is a **partial** UTC day; flag it. Honor an explicit window when given.

## Fixed constants (do not re-derive)

| Thing | Value |
| --- | --- |
| PostHog project | **556732** ("Vocal Habit"), UTC |
| Ahrefs Web Analytics `project_id` | **10013070** |
| Ahrefs Site Explorer target | **vocalhabit.com** (`mode: subdomains`) |
| Findings log | `analytics/findings-log.md` (persistent memory + stored `dashboard_url`) |
| Bing AI Performance | browser-only, no MCP; defaults to wrong site (gradical.app) |

**⚠️ ALWAYS `switch-project {"projectId": 556732}` before every PostHog query** — the active project is
account-global and silently drifts to Gradical (558041). Idempotent; do it every run.

Load deferred tools first: `mcp__posthog__exec`; and
`ToolSearch "select:mcp__ahrefs__web-analytics-source-channels,mcp__ahrefs__web-analytics-sources,mcp__ahrefs__web-analytics-entry-pages,mcp__ahrefs__site-explorer-ai-responses-count"`.

---

## §A Traffic (Ahrefs)

- **A1 Channels** — `web-analytics-source-channels` (`project_id 10013070`, ISO window, `order_by visitors:desc`).
  LLM/direct/search/social + bounce + avg session. Compute **LLM share** and **LLM:search ratio**. LLM leading is the thesis.
- **A2 Sources** — `web-analytics-sources` (`limit 12`). Which assistant (ChatGPT ≈ all LLM), which engines.
- **A3 Entry pages** — `web-analytics-entry-pages` (`limit 15`). Landing distribution + dwell (`avg_session_duration_sec`). Flag any page breaking out.
- **A4 Citations** — `site-explorer-ai-responses-count` (`target vocalhabit.com`, `mode subdomains`,
  `select "chatgpt,copilot,perplexity,gemini,google_ai_overviews,google_ai_mode,grok"`, `date` = today).
  **No Claude coverage** — say so. Report **citations-per-page** as an inflow-lever gauge.
- **A5 Branded search (WoM + inflow gauge)** — `gsc-keywords` (project 10013070) filtered to "vocal habit" /
  "vocalhabit": clicks + impressions + position. Rising branded search = awareness spreading (word-of-mouth).
  Baseline Aug 22: 14 clicks / 15 impr / pos 2 (Google — understates vs Bing, where ChatGPT/Copilot resolve).
- §A is **co-primary hypothesis 1A (inflow)** — verdict it each run alongside 1B retention (§B4): are the levers
  we're trying (new content → citations-per-page, authority → DR, branded search) moving the inflow rate?

## §B Activity (PostHog)

- **B1 Daily volume** — `query-trends`, `interval day`: `$pageview` total + dau, `practice_started`,
  `pattern_completed`, `onboarding_finished`, `session_logged`, `range_test_started`, `coaching_started`. Day table.
  **FULL runs use `dateRange.date_from: "2026-08-13"` (launch) so the dashboard trend ACCUMULATES** — never a
  rolling 7-day window (that loses history). QUICK runs may use `-7d`. PostHog + Ahrefs both retain full history.
- **B2 Practice funnel** — `practice_started` → `pattern_completed` → `session_logged`. **`pattern_completed`
  = first scored key, NOT completion** (read `completedAllKeys` for true completion). Call it "reached scoring."
- **B3 ChatGPT activation funnel** — `query-trends -7d day`, each series `math dau` filtered
  `$referring_domain = chatgpt.com`: pageview → practice_started → pattern_completed → session_logged. Sum days.
  **Present rates as FLOORS against Ahrefs' A2 ChatGPT visitor count** (referer-stripped ChatGPT hides in `$direct`).
- **B4 Returning vs new** (the cohort that matters — cookieless-safe via localStorage super-properties):
  ```sql
  -- pages-per-visit by cohort
  SELECT coalesce(toString(properties.returning),'untagged') AS cohort,
         count() AS pageviews, uniq(person_id) AS visitor_days,
         round(count()/uniq(person_id),2) AS pages_per_visit
  FROM events WHERE event='$pageview' AND timestamp > now() - INTERVAL 7 DAY
  GROUP BY cohort ORDER BY pageviews DESC
  ```
  ```sql
  -- visit-number distribution
  SELECT properties.visitNumber AS visit_number, count() AS pageviews
  FROM events WHERE event='$pageview' AND timestamp > now() - INTERVAL 7 DAY
  GROUP BY visit_number ORDER BY visit_number
  ```
  ```sql
  -- engagement by cohort (do returning visitors do more?)
  SELECT coalesce(toString(properties.returning),'untagged') AS cohort,
         countIf(event='practice_started') AS practice_started,
         countIf(event='pattern_completed') AS reached_scoring,
         countIf(event='session_logged') AS logged
  FROM events WHERE timestamp > now() - INTERVAL 7 DAY
    AND event IN ('practice_started','pattern_completed','session_logged')
  GROUP BY cohort ORDER BY practice_started DESC
  ```
  Report: returning **share** of tagged pageviews, **pages/visit** new-vs-returning, **practice-starts per
  visitor-day** new-vs-returning, the **visit-# distribution**, and the **untagged** share (data-quality gauge).
  **This is co-primary hypothesis 1B**, paired with **1A inflow** (citations/referrals, §A) — report a verdict on
  BOTH every run; neither is "the" one. With inflow flat, retention decides whether the trickle compounds. The 1B
  health bar is explicit: **we're good iff BOTH (a) returning-session volume/week and (b) depth per returning
  visit (practice-starts/visit) are rising.** Report both as per-week rates and state plainly whether each is up, flat, or down —
  that verdict leads the activity section. (Prefer practice-starts/visit over logged/visit for depth: logging is
  opt-in and regulars skip it.) Standing companion metric: branded-search ("vocal habit") growth as a WoM proxy.

## §C Citation engine / crawler hits (PostHog)

```sql
SELECT properties.vendor AS vendor, properties.bot AS bot, properties.kind AS kind, count() AS hits
FROM events WHERE event='ai_crawler_hit' AND timestamp > now() - INTERVAL 7 DAY
GROUP BY vendor, bot, kind ORDER BY hits DESC
```
From `netlify/edge-functions/ai-crawler-tap.ts`. `kind:user` = a user's question pulled the page; `kind:index` =
crawled for search. **Anthropic hits are the headline signal.** Caveat: ~5 spoofed setup tests exist (Aug 20
~04:00 UTC, `Claude-SearchBot`/`Claude-User`); discount them. Crawler data only spans since the tap deployed.

## Caveats to always state

- **PostHog undercounts source; Ahrefs undercounts behavior** — ChatGPT strips referer → `$direct` in PostHog,
  recovered via UTM in Ahrefs. Cross-reference; trust neither alone.
- Cookieless identity rotates daily → no true cross-day unique-humans or person-level retention; the
  `returning`/`visitNumber` super-properties (localStorage, per-device, a floor) are the substitute.
- `pattern_completed` semantics (B2). Today is partial. "Direct" + counts include unfilterable dev traffic.
- **Ahrefs session-duration / dwell is unreliable** — inflated by left-open idle tabs (sovt-exercises read 27min
  on Ahrefs vs ~12s median on PostHog). Treat "avg session" as noise, not engagement; cross-check real dwell
  against PostHog event-span (`dateDiff('second', min, max)` per `$session_id`) before reporting any dwell claim.
- **Cumulative ≠ growth.** Totals (visitors-since-launch, citations, cumulative crawler hits) rise purely because
  days accumulate — **never present a rising total as growth.** Every trend/growth claim MUST be a **per-day or
  per-week rate** (from the 7-day buckets), and cumulative figures must be labelled "totals since launch." When a
  rate is flat but the total climbs, say so plainly (e.g. "cited at a steady ~16/day; the total only grows because
  days add up"). Corollary: separate *retrieval/consultation* (crawler `ChatGPT-User` hits) from *human referrals*
  (Ahrefs LLM visitors) — the former can rise while the latter stays flat (zero-click).
- LLM ≈ ChatGPT; Copilot via Bing; Claude via Brave (not in A4). GSC/Bing search massively understate this site.

---

## §D Update the findings log (FULL runs only)

Read `analytics/findings-log.md` first. Then edit it:
1. **Advance each active investigation** with today's number (e.g. update the returning share / crawler counts),
   and change status (`OPEN`→`RESOLVED` when answered, add `WATCH` items as trends emerge).
2. **Append** a dated `### <today>` block under "Findings (newest first)" with only what's *new or changed* —
   don't restate yesterday. 2–5 crisp bullets.
3. Bump `last_run`. Keep `dashboard_url` intact.
Treat the user's "that's interesting" / "let's dig into X" as instructions to open/annotate investigations here.

## §D2 Refresh the weekly snapshots (FULL runs only)

Maintain `analytics/weekly-snapshots.md` — the persistent week-over-week view so trends survive the sliding
window. **Recompute** the time-series rows (visitors, LLM %, pageviews, funnel, returning) from source into
**7-day-from-launch buckets** (W1 = Aug 13–19, W2 = Aug 20–26, …) — these self-heal since the data is retained.
Compare **per-day** (a partial current bucket vs a full prior one), not raw totals. **Append/update** a dated
row in the point-in-time table for the metrics that can't be recomputed for a past date: Ahrefs citation counts
and **cumulative** `ai_crawler_hit` totals by bot. Bucket weekly totals from the B1 daily series;
`toStartOfWeek(timestamp, 1)` gives ISO weeks if you prefer calendar weeks (note they won't align to launch).

## §E Publish / refresh the dashboard artifact (FULL runs only)

Build a single-page HTML dashboard (theme-aware light+dark, mono-led, signal-green accent — match the house
style; load `artifact-design` + `dataviz` if not already in context). Sections, in order:
1. **Header** — window + "updated <date>" + a one-line headline.
2. **KPI row** — visitors, LLM share, ChatGPT activation floor, returning share, total citations.
3. **Traffic** — channel bars, top entry pages (flag breakouts).
4. **Week over week** — the 7-day-buckets table from `weekly-snapshots.md` (per-day compare; flag deepening/decay).
5. **Activity** — daily pageviews/practice trend (FULL HISTORY since launch, accumulating), practice funnel, ChatGPT activation funnel.
6. **Returning vs new** — pages/visit + practice/visit comparison, visit-# distribution.
6. **Citation engine** — citation scoreboard + crawler-hit table (Anthropic highlighted).
7. **Active investigations** + **Recent findings** — rendered from `analytics/findings-log.md`.

Publish with the **stored `dashboard_url`** from the log's frontmatter (pass it as `url` so it updates in place,
one evolving dashboard). On the **first** run `dashboard_url` is empty → publish fresh, then write the returned
URL back into the log's frontmatter. Favicon 📈, title "Vocal Habit Analytics" (keep stable across runs).

## Output shape

After a FULL run: a short synthesis (headline + 3–5 insights + what changed since last run), the **dashboard
link**, and a one-line note of what was added to the findings log. After a QUICK run: just the section's tables
+ insights + caveats, and offer the other half. Use markdown tables — never the Ahrefs `render-*` widgets.
**Growth is a rate, not a total** — phrase every "up / down / growing / flat" claim as a per-day or per-week
rate, and call cumulative figures "totals since launch," so accumulation is never dressed up as growth.

## Deeper cuts (on request)
- **Page-level AI citations** → browser: Bing Webmaster Tools → vocalhabit.com → AI Performance → Pages/Grounding Queries.
- **Retention/stickiness** → `query-retention` / `query-stickiness` on `practice_started` (person-level; note the cookieless cross-day caveat).
- **Spike diagnosis** → entry-pages + sources scoped to the spike day.
