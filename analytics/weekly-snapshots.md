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
| W4 · Sep 3–9 | **2** | — | — | 213 | 153 | 178* | 43 | **76.5** | — |

**W4 (2 of 7 days) opens ABOVE W3: 76.5 practice/day, logging 21.5/day (vs 13.1).** ⚠️ Two days is not a week —
do not headline it.

\*⚠️ **The "Reached scoring" column is mode-contaminated and its per-day rate has been removed.** `pattern_completed`
fires once per *run* in Standard but once per *key* in Guided, so the column mixes granularities and the W4 figure
exceeds `practice_started` for that reason alone. See the retraction below. The mode-clean funnel is session-level:
W1 74→57→21, W2 78→59→32, W3 89→69→27, W4 (2 d) 30→22→10.

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

## ⚠️ RETRACTED: "keys scored per practice start" (posted and withdrawn, Sep 4)

**The 0.72 → 1.03 jump was a Guided-mode artifact, not a depth improvement. Do not cite it.**

`pattern_completed` is **not** a per-key event. It fires **once per practice run that scored at least one key**,
carrying `keys` (keys actually scored), `plannedKeys`, and `completedAllKeys`. Three mutually-exclusive emit sites
in `app/(tabs)/index.tsx`: guided (`:527`), standard scored (`:929`), follow-along unscored (`:1009`).

But **in Guided mode it fires once per key anyway**, because `handleGuidedPatternComplete` is invoked by
`GuidedSession` on each pattern (= each key) while `handleGuidedStart` fires `practice_started` once per run.
So the ratio splits hard by mode:

| Mode (since Aug 27) | Starts | pattern_completed | Ratio |
|---|---|---|---|
| standard | 511 | 341 | **0.67** |
| guided | 148 | 197 | **1.33** |

Guided-mode instrumentation only landed ~Aug 26, so guided's share of starts went 0% (W1–W2) → ~20% (W3–W4).
That mix shift alone produced the entire "jump." **Standard-mode only, heavy identities excluded:**

| Week | Standard starts | Standard completions | Ratio |
|---|---|---|---|
| W1 · Aug 13–19 | 214 | 143 | 0.67 |
| W2 · Aug 20–26 | 220 | 160 | 0.73 |
| W3 · Aug 27–Sep 2 | 322 | 194 | 0.60 |
| W4 · Sep 3–4 (2 d) | 86 | 66 | 0.77 |

Flat and noisy. There is no depth jump. **Rule to hold: never mix modes in a ratio when one mode's numerator
and denominator are emitted at different granularities.** Any cross-mode funnel must filter `mode='standard'`
or use session-level counts.

**Open instrumentation defect:** Guided's `pattern_completed` granularity disagrees with Standard's. Either make
Guided emit once per run (with `keys` = keys completed, matching Standard) or add a per-key event and leave
`pattern_completed` per-run. Until then every mode-blind ratio on this event is wrong.

**What the metric was reaching for is real, and lives here instead:** see "How far new users get" below.

## How far new users get (Sep 4, corrected same day)

Standard mode, since Aug 25. **`plannedKeys` = the number of tonic iterations the engine planned**, i.e.
`(highest − lowest)/step + 1`, doubled minus one because `five-note-scale` sets `direction: "both"` (up the range,
then back down). For that exercise the full plan is **15 (baritone) / 19 (alto, soprano) / 21 (tenor)**.

**✅ Scope check (Sep 4): tonic memory is in-memory only and does NOT survive leaving the app.** `exerciseTonicMap`
is plain `useState` with no AsyncStorage backing. Of **95 first-runs-in-a-browser-session, 95 planned the full
range and 0 resumed**; resumes appear only on 2nd+ runs within one session (46% of them). So a reduced plan means
"second run in one sitting," never "came back next day."

**⚠️ `plannedKeys` is NOT a user choice, and `completedAllKeys` is NOT comparable across practice numbers.**
The plan starts from **per-exercise tonic memory**, not the range floor: `startTonicMidi`
(`app/(tabs)/index.tsx:323`) reads the saved tonic for `(exerciseId, voicePart)` and falls back to `range.lowest`;
the engine then plans from there (`engine.ts:64`, `startTonicOverride`). The UI says so out loud —
"Resuming at F4" vs "Starting at C4". So someone running the exercise a **second time in the same sitting**
gets a plan containing only the **remainder**, sometimes as few as 1 key. Nobody is editing their routine, and
nobody is carrying state across visits; this is the resume feature working as designed.

Consequence: **100% of first practices get a full-length plan** (no memory yet, by construction) while only
44–67% of runs at practices 2–9 do. Comparing raw finish rates across tiers therefore compares long plans against
short remainders. Restricting to full-length plans (≥15 keys) on the same exercise removes it:

| Practice # | Runs | Full-plan runs | Keys scored (full plans) | Finished (full plans) |
|---|---|---|---|---|
| 1st practice | 74 | 74 (100%) | 7.2 | **13.5%** |
| 2nd | 26 | 16 (62%) | 8.0 | 25.0% |
| 3rd–4th | 27 | 12 (44%) | 10.5 | 33.3% |
| 5th–9th | 9 | 6 (67%) | 12.3 | 33.3% |
| 10th+ | 24 | 22 (92%) | 14.8 | **45.5%** |

**Like-for-like the gap is 13.5% → 45.5%, not the 13.3% → 77.2% first reported.** The effect is real and roughly
halved. Keys actually scored (plan-independent) **7.2 → 14.8** is the cleanest statement of it.

Two refinements that change the story's shape:
- **The jump is not at visit 2.** Keys scored is essentially flat from the 1st to the 2nd practice (7.2 → 8.0)
  and only climbs from the 3rd onward. "They come back and then practise properly" is right, but it builds
  gradually over several sessions rather than switching on at the return visit.
- **First runs stop at ~7 keys with striking consistency**, ≈35–45 s of singing at ~5 s per key. Worth knowing as
  a baseline; **not** currently read as an exercise-length problem — 18 keys up and down the range is a normal run
  (Ryan, Sep 4). Any change here would be an A/B on ordering, not a fix.

**Possible quirk worth a look (not yet a bug report):** the tonic advance (`index.tsx:967`) sets memory to
`lastCompletedIteration.tonicMidi + step`, but with `direction: "both"` the last completed iteration may be on the
*descending* leg, so quitting late resumes low rather than where they left off in the sequence — and completing the
whole run lands memory one step above `range.lowest`. That is why the 10th+ tier is back to 92% full plans. It may
well be intended; flagging it because it is what makes `plannedKeys` non-monotonic in progress.

## Retention (1B): the health bar



| Metric | Returning | New |
|---|---|---|
| Pages / visit | 5.69 | 2.85 |
| Practice starts / visitor-day (**depth**) | 4.08 | 1.65 |

**Health bar = both rising. Status Sep 4: PASSING (9th run) — both bars up again under the consistent exclusion rule,
though W4 is only 2 days deep.**
- **Volume** (returning practice-starts/day, raw): 7.75 → 10.9 → 12.3 → 13.9 → 14.9 → 19.7 → 25.0 → 32.3 → **34.4/day** ✓
- **Depth** (practice-starts/returning visit, raw): 1.89 → 2.10 → 2.14 → 2.32 → 2.49 → 2.60 → 3.21 → 3.50 → 3.96 → **4.08** ✓
- Returning share of tagged pageviews: 22.5% → 20.2% → 23.0% → 29.7% → 35.9% → 41.6% → 42.6% → **42.2%**. Untagged still 0.

**✅ Sep 2: the verdict now survives a like-for-like exclusion, which is the test that mattered.** Earlier runs
compared a raw number against a differently-adjusted one. Applying ONE rule to BOTH weeks — drop any person_id with
**≥20 practice starts in a single day** (the dev-test signature) — gives:

| Week (heavy identities excluded) | Returning starts/day | Depth |
|---|---|---|
| W1 · Aug 13–19 | 6.6 | 1.70 |
| W2 · Aug 20–26 | 9.6 | 1.76 |
| W3 · Aug 27–Sep 2 | 17.9 | 2.36 |
| **W4 · Sep 3–4 (2 d)** | **19.5** ✓ | **3.00** ✓ |

Volume +86%, depth +34%, both directions confirmed without leaning on any single device. ⚠️ But note the raw
headline is inflated ~44% by those heavy identities — quote the excluded figures when the number has to be robust.

**The practice-returner curve** (`practiceNumber`, cumulative from Aug 25, 100% coverage). Raw devices; the
share column is the growth-free read:

| Milestone | Devices (Sep 4) | Share | Share Sep 2 | Share Sep 1 | Share Aug 28 |
|---|---|---|---|---|---|
| Practiced ≥1 | **122** | 100% | 100% | 100% | 100% |
| Reached #2 | 87 | 71% | 74% | 72% | 74% |
| Reached #3 | 73 | 60% | 62% | 59% | 52% |
| Reached #5 | 50 | 41% | 44% | 41% | 33% |
| Reached #10 | 28 | 23% | 26% | 24% | 15% |
| Reached #16 | 15 | 12% | 13% | 10% | 11% |

**Sep 4: base 94 → 122 devices (+30%) and every absolute tier grew (70→87, 58→73, 41→50, 24→28, 12→15), but every
*share* slipped 1–3 points.** That is dilution, not decay: 28 devices entered the window in two days and none of
them has had time to reach #5, let alone #16. The honest reading is "the curve held its shape while the base grew
a third" — this is the first run where the share column moves *down*, and it should not be reported as retention
weakening. Re-cut once the new cohort has aged a week.

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
| 2026-09-04 | **1.1K (~1024 attrib.)** | **18** | 21 / 5pg | **10 / 3pg** | ~10 | 9 clicks / pos 1.6 (Google, 7d) | 0 |

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


## Point-in-time snapshot — 2026-09-04

**Bing AI-Performance read completed** after the user signed in mid-run (the automation browser holds its own
session; it also defaulted to gradical.app, as always — the property was switched to vocalhabit.com before reading).

- **Bing AI Performance (3 M): total 1.1K citations** (was 980), avg cited pages 5. Bing lags ~2 days, so Sep 2 is
  the newest point and only **one new day** landed since the last read. Daily Aug 27–Sep 2: 54, **176**, 93, 92, 87,
  82, **86** → **95.7/day over the last 7 data days vs 40.9/day the 7 before (+134%)**. Shape is unchanged: Aug 28's
  176 was a spike and the five days since sit at 82–93. **Call it a ~88/day plateau, not acceleration.**
- **Grounding queries: 13 → 14.** The new entry is `learning singing ideas` 3. The real movement is
  **`semi occluded vocal tract exercises` 7 → 21 (+200%)** and `singing exercises` 36 → 48; `range test` 21 → 25.
  Full list: learn to sing **151** (23.1% share) · learn to sing online free 84 · singing exercises 48 ·
  vocal exercises for singing 44 · free singing lessons for beginners 43 · voice warmups exercises for students 36 ·
  best free online singing course 32 · range test 25 · learning singing 25 · semi occluded vocal tract exercises 21 ·
  learning to sing 15 · free voice lessons for beginners 12 · freddie mercury voice type 8 · learning singing ideas 3.
- **Cited pages: 18 (count unchanged), 1024 citations attributed.** `/learn/` **573** (+44) · sovt-exercises **102**
  (+21) · vocal-warm-ups-for-beginners 79 · `/` 46 · **ariana-grande 46** (+3) · freddie-mercury 35 · chappell-roan 30 ·
  **vocal-range-test 28** (+4) · can-tone-deaf 24 · **vocal-agility 16** (+7) · chest-voice 11 · mix-voice 11 ·
  can-anyone 7 · increase-range 5 · breathing 4 · belting 3 · can-you-learn-as-adult 3 · how-to-practice 1.
  Hub share 54% → **56%**. **Still no `/courses/` page cited**, 7 days after launch.
- **The SOVT page is now the clearest second engine.** Its citations went 81 → 102 while its grounding query tripled
  7 → 21, and it is simultaneously the only page converting Bing *organic* impressions to clicks (36 impr / 2 clicks).
  Technique intent is finally pulling its own weight next to the free/beginner intent that drives the hub.

- **🔓 FIRST CRACK IN THE BING CRAWL GATE.** `https://vocalhabit.com/courses/` carries a real crawl timestamp of
  **2026-09-04 18:41 UTC** — about 35 minutes before this check. Every post-Aug-13 URL had carried the
  never-crawled sentinel (`/Date(-62135568000000-0800)/`) on every prior run. The per-URL `lastmod` + filtered
  IndexNow fix went to production **Sep 3** (commit `75ca50b`, Sep 2 22:00 MDT; live sitemap now serves **6
  distinct lastmod dates** — 25× Aug 27, 12× Aug 29, and one each Jul 3/6/15/23 — where it previously served one
  date on all 42 URLs). So: fix deployed Sep 3, first new-URL crawl Sep 4. **`size=0`, so it is a fetch, not yet an
  index, and the headline is still 27/42.** One URL is not a verdict; the skill's own protocol is to re-check at
  ~5 and ~10 days after deploy (Sep 8 and Sep 13). Do not close the investigation on this.
- **Bing index: 27/42, unchanged.** Still uncrawled: 10 remaining `/courses/` URLs and all 4 `why-*` articles.
  Most recent Bing crawls of indexed pages: `pitch-training-for-singers` Sep 4 00:11, `how-to-sing-in-tune`
  Sep 3 19:53, `can-tone-deaf` Sep 3 19:04, `/learn/` Sep 3 18:26. Bing visits daily, as always.
- **Bing organic is genuinely up, on both bars.** Last 7 data days (Aug 27–Sep 2): **471 impr / 14 clicks =
  67.3 impr/day, 2.0 clicks/day**, against the prior 7 (Aug 20–26) 364 impr / 6 clicks = 52.0 impr/day,
  0.86 clicks/day → **+29% impressions/day, +133% clicks/day**. **Sep 2 set an impressions record at 94.**
  Bing lags ~2 days, so Sep 3–4 are not in yet. Top organic queries: "vocal warm ups" 52 impr / 0 clicks ·
  "vocal warm up" 43 / 0 · **"semi occluded vocal tract exercises" 36 impr / 2 clicks** — the SOVT page is the
  only one converting impressions to clicks, and it is the same query that entered Bing's grounding set on Sep 2.
- **Google is broadening fast on a page Bing has never crawled.** `why-does-my-voice-crack` now draws impressions
  across **~22 distinct queries** (was 6 on Sep 2) at positions 25–60 — "why does my voice crack when i sing"
  pos 25, "voice cracking when singing" pos 27, "when will my voice stop cracking" pos 29. Zero clicks (nothing
  ranks above ~25), but the breadth roughly quadrupled in two days. Reinforces that the `why-*` articles are fine
  and the blocker is Bing-specific.
- **Ahrefs citation sample:** chatgpt **21**/5 (33 → 30 → 29 → 26 → 22 → 21, still drifting down while Bing's
  first-party count climbed 277 → 980). Copilot **7 → 10**/3, its first move in a week. Still a stale sample;
  reported only for continuity.
- **Crawler content hits (cumulative since tap):** ChatGPT-User **641** · OAI-SearchBot 82 · ClaudeBot 9 ·
  PerplexityBot 6 · Claude-User/SearchBot **3/3 (frozen 15 days)** · GPTBot 0. Per-day ChatGPT-User Aug 28–Sep 3:
  37, 41, 36, 37, 45, 50, 46 = **41.7/day** vs 40.6 the prior 7 — flat with a mild upward tilt; the Sep 1–2 pair
  (45, 50) held into Sep 3 (46). **Course paths: still 0 hits from any AI crawler** (the Sep 4 `/courses/` crawl
  was bingbot, which the AI tap does not record).
- **Traffic mix (7 d, Aug 29–Sep 4):** LLM **73** · direct 62 · search **41** · internal 14 · unknown 2 →
  **LLM share 41.0%** (ex-internal), LLM:search 1.78:1. ChatGPT is 71 of the 73 LLM visitors. **Search is the
  channel that moved**: 41 visitors vs 38 the prior window, and Google alone is 20 — the highest yet.
  Cumulative since launch: ChatGPT 315 · direct 236 · Google 71 · Bing 28.
- **Direct is still uncharacterized, 13 days after first flagging:** 62 visitors at **82% bounce** over 7 days
  (cumulative 236 at 88%). Longest-open unactioned item in the log.
- **ChatGPT activation floors (cumulative, vs Ahrefs' 315 ChatGPT visitors):** 72 started / 58 scored / 26 logged
  = **≥23% start · ≥18% scoring · ≥8% logged**. Holding at the long-run level. Against the 124 PostHog-tagged
  ChatGPT people alone: 58% / 47% / 21%.
- **Google branded (7 d):** "vocal habit" 7 clicks / 8 impr / **pos 1.6** + "vocal habits" 2 clicks = **9 branded
  clicks**, vs 10 last run. Flat.
- **Community mentions:** still **0** — no reddit/HN/forum referrer in Ahrefs, `site:reddit.com` sweep empty. DR **0**.
- **Courses (day 6–7): the product side turned back up.** Daily course_viewed 6 → 5 → 2 → 2 → 3 → **7** and
  lesson_viewed 5 → 6 → 2 → 1 → 3 → **6**, next_pressed back to 5. `/courses` was the **#3 page by pageviews**
  over Sep 3–4 (18 pv / 10 people), behind only `/` and `/onboarding`. Lesson completions still **1 all-time**
  and `course_exercise_toggled` still absent from the taxonomy. Distribution: `/courses/` got its first bingbot
  crawl today (above) but no course URL is cited or AI-crawled yet.
- **Article → app conversion holding:** `embed_exercise_played` 5 (Sep 3) + 3 (Sep 4); `embed_exercise_open_full`
  3 + 2. Steady at roughly the level it reached on Sep 1, not growing.
- **Visit-number tail (7 d):** 1→461 pv, 2→144, 3→66, 4→47, then a continuous tail to **14**. Untagged **0**.
