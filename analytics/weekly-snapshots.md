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
| W3 · Aug 27–Sep 2 | 7 | n/a | n/a | 749 | 506 | 360 | 92 | **72.3** | **51.4** |
| W4 · Sep 3–9 | 0* | — | — | — | — | — | — | — | — |

\***W3 is now COMPLETE (7/7 days).** Daily practice starts: 64, 91, 27, 21, 115, 72, **116**. W3 finished at
**72.3 practice/day — 2.07x the flat 34.9/day W1–W2 baseline** — with pageviews 107.0/day (vs 75.1 / 68.4) and
logging 13.1/day (vs 6.4 / 11.3). The step-up held all seven days; Aug 29–30 was a trough inside a raised plateau.
W4 opens Sep 3. ⚠️ **Read the W3 tail with care:** Sep 2's record 116 starts is ~62% two identities (45 starts from
one device with `practiceNumber` running 1→45 in a single day — the known dev-test signature — plus 27 from another).
Ahrefs visitors still not comparable (see caveat below).

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
| Pages / visit | 5.60 | 2.76 |
| Practice starts / visitor-day (**depth**) | 3.96 | 1.79 |

**Health bar = both rising. Status Sep 2: PASSING (8th run), and now passing under a CONSISTENT exclusion rule —
the strongest read yet.**
- **Volume** (returning practice-starts/day, raw): 7.75 → 10.9 → 12.3 → 13.9 → 14.9 → 19.7 → 25.0 → **32.3/day** ✓
- **Depth** (practice-starts/returning visit, raw): 1.89 → 2.10 → 2.14 → 2.32 → 2.49 → 2.60 → 3.21 → 3.50 → **3.96** ✓
- Returning share of tagged pageviews: 22.5% → 20.2% → 23.0% → 29.7% → 35.9% → 41.6% → **42.6%**. Untagged still 0.

**✅ Sep 2: the verdict now survives a like-for-like exclusion, which is the test that mattered.** Earlier runs
compared a raw number against a differently-adjusted one. Applying ONE rule to BOTH weeks — drop any person_id with
**≥20 practice starts in a single day** (the dev-test signature) — gives:

| Week (heavy identities excluded) | Returning starts/day | Depth |
|---|---|---|
| Aug 20–26 | 9.6 | 1.76 |
| **Aug 27–Sep 2** | **17.9** ✓ | **2.36** ✓ |

Volume +86%, depth +34%, both directions confirmed without leaning on any single device. ⚠️ But note the raw
headline is inflated ~44% by those heavy identities — quote the excluded figures when the number has to be robust.

**The practice-returner curve** (`practiceNumber`, cumulative from Aug 25, 100% coverage). Raw devices; the
share column is the growth-free read:

| Milestone | Devices | Share | Share Sep 1 | Share Aug 28 |
|---|---|---|---|---|
| Practiced ≥1 | 94 | 100% | 100% | 100% |
| Reached #2 | 70 | 74% | 72% | 74% |
| Reached #3 | 58 | 62% | 59% | 52% |
| Reached #5 | 41 | 44% | 41% | 33% |
| Reached #10 | 24 | 26% | 24% | 15% |
| Reached #16 | 12 | 13% | 10% | 11% |

Base 83 → 94 devices; every share held or improved for a third straight run, and the #5 and #10 tiers have now
roughly doubled off the Aug-28 shape (33% → 44%, 15% → 26%). The n≥40 tail is 3 devices (pn 43, 45, 54), two of
them new on Sep 2 — treat that tail as probable dev testing, not power users.

Caveats: (1) `practiceNumber` is a per-device localStorage counter — a fresh device or cleared storage restarts at
1, so every tier is a **floor**. (2) The window is cumulative from Aug 25 (now 9 days), so raw counts partly reflect
window-widening; the share column is the honest read. Re-cut weekly.

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
| 2026-08-30 | 450 | 17 | 30 / 5pg | 7 / 3pg | ~15 | 3 clicks / pos 2 (Google, 7d) | 0 |
| 2026-08-31 | 811 | 18 | 29 / 5pg | 7 / 3pg | ~15 | — | 0 |
| 2026-09-01 | **898** | **18** | 26 / 5pg | 7 / 3pg | ~9 | **10 clicks / pos 1.8 (Google, 7d)** | 0 |
| 2026-09-02 | **980** | **18** | 22 / 5pg | 7 / 3pg | ~10 | 10 clicks / pos 1.8 (Google, 7d) | 0 |

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

## Point-in-time snapshot — 2026-08-31

- **Bing AI Performance (3 M):** total **811** citations (was 450 on Aug 30), avg cited pages 5. Daily Aug 24–30: 49, 75, 44, 54,
  **176**, 93, 92 → **~83.3/day over the last 7 data days vs ~24.4/day the 7 before** (+241%). Bing lags ~2 days.
- **Cited pages (18):** /learn/ **438** · vocal-warm-ups-for-beginners **79** · sovt-exercises 55 · / 45 · ariana-grande 38 ·
  freddie-mercury 31 · can-tone-deaf 24 · chappell-roan 15 · vocal-range-test 12 · mix-voice 11 · chest-voice 10 · agility 9 ·
  can-anyone 7 · increase-range 5 · breathing 4 · can-you-learn-as-adult 3 (new) · belting 1 · how-to-practice 1. **No /courses/ page cited.**
- **Grounding queries (12, was 8):** learn to sing **124** (22.6%) · learn to sing online free 64 · **voice warmups exercises for students 36 (new)** ·
  free singing lessons for beginners 35 · best free online singing course 32 · **vocal exercises for singing 30 (new)** · **singing exercises 20 (new)** ·
  learning to sing 15 · learning singing 11 · range test 9 · **freddie mercury voice type 8 (new)** · free voice lessons for beginners 8.
- **Ahrefs citation sample:** chatgpt 29/5 (down again from 30, then 33 — stale sample, ignore for trend), copilot 7/3, others 0.
- **Crawler content hits (cumulative):** ChatGPT-User **473** (~38/day, flat) · OAI-SearchBot 52 · ClaudeBot 9 · Claude-User/SearchBot **3/3 (frozen 11 days)** ·
  PerplexityBot 2 · GPTBot 0. **Course paths: 0 hits from any bot.**
- **Bing index:** 27/42. Targeted check: `/courses/`, the syllabus, and lesson 01 all **not indexed** 2 days after submission;
  `why-does-my-voice-crack` still not indexed 5 days after Request Indexing.
- **Bing organic:** best click day yet Aug 28 (6 clicks / 84 impr); otherwise ~55 impr/day, 0–2 clicks.
- **Courses funnel (day 2):** 45 pv / 17 people · course_viewed 11/7 · lesson_viewed 11/6 · next_pressed 10/6 · completed 1/1 · **toggled 0**.

## Point-in-time snapshot — 2026-09-01

- **Bing AI Performance (3 M):** total **898** citations (was 811 on Aug 31), avg cited pages 5. Daily Aug 25–31:
  75, 44, 54, **176**, 93, 92, 87 → **~88.7/day over the last 7 data days vs ~28.7/day the 7 before** (+209%).
  Aug 28 remains the single-day peak; the four days since have settled into a **~90/day plateau**, roughly 3x the
  W2 rate and no longer accelerating. Bing lags ~2 days.
- **Cited pages (18, unchanged count):** `/learn/` **500** · vocal-warm-ups-for-beginners 79 · sovt-exercises 63 ·
  `/` 46 · ariana-grande 43 · freddie-mercury 32 · can-tone-deaf 24 · chappell-roan 15 · vocal-range-test 12 ·
  chest-voice 11 · mix-voice 11 · agility 9 · can-anyone 7 · increase-range 5 · breathing 4 · can-you-learn-as-adult 3 ·
  belting 1 · how-to-practice 1. **No /courses/ page cited.** ⚠️ **Concentration is increasing, not the surface:**
  of the ~87 citations added since Aug 31, **62 went to the `/learn/` hub alone** (438 → 500). The hub is now 56% of
  all cited volume; 11 of the 18 pages were exactly flat.
- **Grounding queries (12, unchanged set — no new query entered):** learn to sing **138** (23.2%) · learn to sing
  online free 72 · vocal exercises for singing 42 · free singing lessons for beginners 39 · voice warmups exercises
  for students 36 (flat) · best free online singing course 32 (flat) · singing exercises 28 · learning singing 17 ·
  learning to sing 15 · free voice lessons for beginners 12 · range test 9 (flat) · freddie mercury voice type 8 (flat).
- **Ahrefs citation sample:** chatgpt 26/5 (33 → 30 → 29 → 26 across runs while Bing went 277 → 898 — the panel is
  drifting *down* as first-party climbs; treat as noise, not a trend).
- **Crawler content hits (cumulative):** ChatGPT-User **525** · OAI-SearchBot 55 · ClaudeBot 9 ·
  Claude-User/SearchBot **3/3 (frozen 13 days)** · PerplexityBot 3 · GPTBot 0. Per-day ChatGPT-User Aug 26–Sep 1:
  36, 38, 37, 41, 36, 37, 45 = **38.6/day, flat** (prior 7: 39.9/day). **Course paths: still 0 hits from any bot.**
- **Bing index: 27/42, unchanged from Aug 31.** All **11 `/courses/` URLs still uncrawled** (4 days after submission,
  0 bytes) and all 4 `why-*` articles still never crawled. `/learn/` itself was re-crawled Aug 31.
- **Bing organic:** 11 clicks / 359 impr over Aug 26–31 (~60 impr/day) vs 6 clicks / 325 impr the prior 6 days —
  clicks up, impressions flat. Top queries "vocal warm ups" 52 impr and "vocal warm up" 43 impr are **still 0 clicks**.
- **Google branded (7 d):** "vocal habit" 8 clicks / 10 impr / pos 1.8 + "vocal habits" 2 clicks → **10 branded
  clicks**, up from 3 on Aug 30. First real move on the word-of-mouth gauge.
- **Community mentions:** still **0** (Reddit sweep + referrer scan). DR still **0**.
- **Courses funnel (day 3):** cooling. Course pageviews by day 17 → 28 → 10; course_viewed 6 → 5 → 2;
  lesson_viewed 5 → 6 → 2; next_pressed 4 → 6 → 2. All-time: course_viewed 15/10 people · lesson_viewed 13/8 ·
  next_pressed 12/8 · **lesson_completed 1** · **`course_exercise_toggled` has never fired** (absent from the
  project taxonomy entirely).
- **Article → app conversion is working:** `embed_exercise_played` 7 → **31 (17 people)**, `embed_exercise_open_full`
  1 → **13 (12 people)** since Aug 28. Both were near-zero blockers a week ago.
- **Guided nudge:** `guided_nudge_shown` 10 → **28 (27 people)**, `guided_nudge_accepted` 2 → **4**. Accept rate ~14%.

## Point-in-time snapshot — 2026-09-02

**Bing AI-Performance read completed 2026-09-03 17:52 UTC** (deferred from the Sep 2 sweep, which skipped the
browser step during a screen recording). Bing lags ~2 days, so its latest data point is Sep 1 — nothing was lost.

- **Bing AI Performance (3 M):** total **980** citations (was 898 on Sep 1), avg cited pages 5. Daily Aug 26–Sep 1:
  44, 54, **176**, 93, 92, 87, 82 → **~89.7/day over the last 7 data days vs ~37.1/day the 7 before** (+142%).
  Note the shape: Aug 28's 176 was a spike, and the four days since step gently *down* (93, 92, 87, 82). Reading it
  as a settling ~85/day plateau is more honest than "still accelerating."
- **⚠️ Yesterday's "concentration, not expansion" finding is REVISED — it was a one-day artifact.** On Sep 1, 62 of
  ~87 new citations (71%) went to `/learn/`. Today only **29 of ~82 (35%)** did, and the rest spread across
  **sovt-exercises +18, chappell-roan +15, vocal-range-test +12, freddie-mercury +3, belting +2**. The hub's share of
  all cited volume actually *fell*, 56% → **54%**. Lesson re-learned: do not headline a distribution delta computed
  on a single day.
- **Cited pages (18):** `/learn/` **529** · sovt-exercises **81** · vocal-warm-ups-for-beginners 79 · `/` 46 ·
  ariana-grande 43 · freddie-mercury 35 · **chappell-roan 30** · **vocal-range-test 24** · can-tone-deaf 24 ·
  chest-voice 11 · mix-voice 11 · agility 9 · can-anyone 7 · increase-range 5 · breathing 4 · belting 3 ·
  can-you-learn-as-adult 3 · how-to-practice 1. **Still no `/courses/` page cited.**
- **Grounding queries: 12 → 13, and the new one is a technique query.** **`semi occluded vocal tract exercises` 7
  (3.61%)** entered — pairing with sovt-exercises' +18 citations. **`range test` 9 → 21 (+12)**, matching
  `/vocal-range-test` exactly +12: the tool page is now pulling its own query, not riding the hub. Full list:
  learn to sing 140 · learn to sing online free 80 · vocal exercises for singing 42 · free singing lessons for
  beginners 39 · singing exercises 36 · voice warmups exercises for students 36 · best free online singing course 32 ·
  range test 21 · learning singing 20 · learning to sing 15 · free voice lessons for beginners 12 ·
  freddie mercury voice type 8 · semi occluded vocal tract exercises 7.

- **Ahrefs citation sample:** chatgpt **22**/5 (33 → 30 → 29 → 26 → 22 across runs, drifting steadily *down* while
  Bing's first-party count climbed 277 → 898). Copilot 7/3. Confirmed useless for trend; keep ignoring it.
- **Crawler content hits (cumulative):** ChatGPT-User **572** · OAI-SearchBot 64 · ClaudeBot 9 ·
  Claude-User/SearchBot **3/3 (frozen 14 days)** · PerplexityBot 4 · GPTBot 0. Per-day ChatGPT-User Aug 27–Sep 2:
  38, 37, 41, 36, 37, 45, **50** = **40.6/day** vs 39.9/day the prior 7 — still essentially flat, though Sep 1–2
  (45, 50) are the two highest days on record. Watch whether that becomes a trend. **Course paths: still 0 from any bot.**
- **Sitemap feeds registered with Bing** (new gauge, from `GetFeeds`):
  | Property | Feed | URLs Bing sees | Last read |
  |---|---|---|---|
  | vocalhabit.com | `/sitemap.xml` | 42 | 2026-09-01 22:34 UTC |
  | vocalhabit.com | `www./sitemap.xml` | 42 | 2026-09-01 21:15 UTC |
  | gradical.app | `/sitemap.xml` | **16** | **2026-09-02 16:18 UTC** |
  ✅ **The Sep 1 gradical `SubmitFeed` worked** — Bing re-read that sitemap ~12 h later and now sees all 16 URLs
  (previously 9, stale since Aug 14). vocalhabit's duplicate apex/`www` registration still stands.
- **Bing organic:** Aug 27–31 = 11 clicks / 320 impr (~64 impr/day). Aug 28 (6 clicks / 84 impr) still the best day.
  Bing's reporting lags ~2 days, so Sep 1–2 are not in yet.
- **Google branded (7 d):** unchanged at **10 clicks** — "vocal habit" 8 / 9 impr / pos 1.8 (CTR 89%) + "vocal habits" 2.
- **Google is indexing what Bing refuses.** `why-does-my-voice-crack` (published Aug 24, **never crawled by Bing**)
  is drawing Google impressions across 6 queries at positions 38–51. The four `why-*` pages are demonstrably
  crawlable and indexable — this is a **Bing-specific crawl decision**, which rules out page-level defects entirely
  and is consistent with the lastmod/IndexNow signal theory.
- **Community mentions:** still **0** (Reddit + web sweep). DR **0**.
- **ChatGPT activation (7 d):** 33 tagged people → 19 started → 13 scored → 5 logged. Against Ahrefs' 70 ChatGPT
  visitors the floors are 27% / 19% / 7%; against tagged people alone, 58% / 39% / 15%.
- **Traffic mix (7 d):** direct 82 · LLM 72 · search 38 (LLM share 37.5%). ChatGPT 70 of the 72 LLM visitors.
- **Odd entry page worth a look:** `https://vocalhabit.com/learn/%EF%BC%89` — a full-width `）` — took 2 visitors
  with a ~996 s session. Looks like a malformed link in an AI answer or an article; worth confirming it 404s cleanly.
