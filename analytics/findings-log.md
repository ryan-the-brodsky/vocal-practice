---
# Each FULL run publishes a NEW date-stamped artifact (never update-in-place, since that hits a false
# "identical content" conflict). Newest first; this list is the pseudo-historical archive of daily boards.
dashboards:
  - 2026-09-02: "https://claude.ai/code/artifact/9c136383-0f95-427b-892e-84161d09d669"
  - 2026-09-01: "https://claude.ai/code/artifact/f0a64d4a-6c5f-4cb8-b047-0d22adf5a87f"
  - 2026-08-31: "https://claude.ai/code/artifact/fa97f3e8-097a-4490-824d-05eb4eb927a6"
  - 2026-08-30: "https://claude.ai/code/artifact/45f5a1fd-decf-4e23-a34a-22b4ea9f045e"
  - 2026-08-28: "https://claude.ai/code/artifact/bc419b0e-0ef6-49d4-8614-c79e5d04c571"
  - 2026-08-27: "https://claude.ai/code/artifact/5d6dd051-7d1e-4c3f-a51f-a600ddbf79a2"
  - 2026-08-26: "https://claude.ai/code/artifact/0be8ed29-bc50-4925-9895-38e45607829e"
last_run: 2026-09-02
window_default: 7d
---

# Vocal Habit Analytics Findings Log

The persistent memory for the `analytics-report` skill. Each daily run **reads** this file (to know what
we're tracking), **updates** the active investigations with the day's data, and **appends** new findings.
Newest findings first. Keep entries short and dated; link numbers to the run that produced them.

Status tags: `OPEN` (actively digging) · `WATCH` (monitoring a trend) · `RESOLVED` (answered) · `PARKED`.

---

## Active investigations

- **[OPEN · 2026-09-02] Bing crawl gate on new URLs — technical cause identified and fixed; awaiting verification.**
  **The split is perfectly clean: 27/27 URLs published before 2026-08-13 are indexed; 0/15 published after have EVER
  been crawled** (4 `why-*` articles Aug 24–26, 11 `/courses/` URLs Aug 29). Ariana Grande (published Jul 23) crawled
  fine. Bing is not slow — it re-crawled `/learn/`, `/`, `vocal-warm-ups-for-beginners`, `chappell-roan` and
  `/vocal-range-test` all on Sep 1. It visits daily and specifically refuses new URLs.
  Ruled out as causes: HTTP status (all 200, one clean 301), payload (41–62 KB real HTML), canonicals (correct,
  self-referencing), `noindex` (none), robots.txt (allows all but `?exerciseId=`), sitemap presence (all 15), and
  internal linking (**all 4 `why-*` and the syllabus are linked from `/learn/`, the page Bing crawls most**).
  Manual portal Request Indexing was already tried on `why-does-my-voice-crack` (Aug 26) and failed — still uncrawled
  7 days later. All 15 resubmitted via the API Sep 2; expect that alone to fail too.
  **Cause found — two defects that destroyed the freshness signal, both ours:**
  (1) `scripts/gen-sitemap.mjs:11` stamped `new Date()` on every URL, so the live sitemap carried
  `<lastmod>2026-08-29</lastmod>` on **all 42 URLs** — every regeneration asserts all 42 pages changed today.
  (2) `scripts/indexnow-submit.mjs:28` submitted **every** sitemap URL on **every production deploy**, unfiltered —
  the exact pattern IndexNow's spec warns against. Together Bing had no way to distinguish a genuinely new URL from
  41 crying wolf. The cutoff date matches the IndexNow plugin going live (commit `c058035`, Aug 13) to within days.
  **Fixed Sep 2 (uncommitted):** sitemap lastmod is now per-URL from each source file's last git commit date
  (6 distinct dates; regeneration is now byte-idempotent), and IndexNow submits only URLs whose lastmod falls inside
  a `--days` window (default 14, `--all` escape hatch, clean no-op exit 0 when nothing changed).
  ⚠️ **Causality is not proven** — clean correlation and a documented mechanism, but confounded with DR 0, domain age,
  and the 379 spam referring domains. **Verification: after the next production deploy, re-run `bwt.py check` at
  ~5 and ~10 days.** If the 15 start crawling, this was it. If they don't, the cause is authority, not signalling,
  and the content pipeline stays blocked until DR moves.
  **Update Sep 2 — baseline holds (27/42, unchanged) and this is the expected reading: the fixes are still
  uncommitted, so nothing has deployed.** The verification clock has not started. Do not read today's flat result
  as evidence against the theory.
  **New evidence that sharpens the diagnosis: Google indexes what Bing refuses.** `why-does-my-voice-crack`
  (published Aug 24, never once crawled by Bing) is drawing Google impressions across **6 queries at positions
  38–51**. So the pages are demonstrably crawlable, indexable and rankable — this is a **Bing-specific crawl
  decision**, not a page defect. That eliminates the whole class of page-level causes and is consistent with the
  lastmod/IndexNow signal theory, since Bing leans on IndexNow + lastmod far harder than Google does.
  **Gradical cross-check: the sitemap resubmission WORKED.** Bing re-read `gradical.app/sitemap.xml` on
  **2026-09-02 16:18 UTC**, ~12 h after the Sep 1 `SubmitFeed`, and now records **16 URLs (was 9, stale since
  Aug 14)**. Feed re-registration is therefore a live, fast lever — worth remembering as distinct from URL submission,
  which has never moved anything here.
  **Cross-check Sep 2 — gradical.app carries the identical defect (same copied scripts), fixed there too.**
  `gradical-app/scripts/gen-sitemap.mjs:11` had the same `new Date()` stamp (all 16 URLs read `2026-09-01`) and
  `scripts/indexnow.mjs:22` submitted every `<loc>` on every `npm run deploy`. **But it is NOT the cause of
  gradical's 0/16 indexed** — that site's first commit is Aug 14 (19 days old) and Bing only began crawling it
  Sep 1–2 (2 URLs, both still size=0). The vocalhabit failure needs an established crawl relationship to corrupt;
  gradical has none yet, so its state is ordinary DR-0 cold start and the defect is a latent landmine that would
  bite at exactly the moment new content starts shipping. **The real gradical blocker was different:** Bing had
  read its sitemap exactly once, on **2026-08-14**, and recorded **9 URLs** against the 16 now live — 7 articles
  were unknown to Bing entirely. Fixed by `SubmitFeed` + `SubmitUrlBatch` (both HTTP 200; quota 100 → 84).
  Both scripts ported and verified (5 distinct lastmods, byte-idempotent, URL list unchanged).
  Incidental: **vocalhabit has two sitemaps registered with Bing** (apex + `www.`), both 42 URLs — probably benign
  host-variant tracking, worth tidying.

- **[OPEN · 2026-09-02] Nobody browses the Learn section, and content landers convert 4.5x worse than app landers.**
  Over 2 weeks, **114 sessions touched a Learn page: 107 read exactly one article, 2 read two, and ZERO read three
  or more** (avg 0.97 distinct articles/session; 0.75–2.1 pageviews/session vs 3.85 on `/` and 5.45 on the range test).
  Consequence: an article earns nothing from internal navigation — **its entire value is being the landing page**, so
  an uncrawled article is worth exactly zero. Conversion by landing page: `/onboarding` 54%, `/` 45%,
  `/vocal-range-test` 45%, but across all Learn + artist landings only **10 of 99 sessions reached practice (10.1%)**
  — `mix-voice-exercises` 36% and `vocal-agility-exercises` 30% at the top, and `how-to-increase-vocal-range`,
  `vocal-warm-ups-for-beginners`, `chest-voice-exercises`, `ariana-grande`, `chappell-roan` all at **0%**
  (per-page n is too small to rank; the aggregate is the trustworthy figure).
  **Two corrections this forces:** (a) "people land on Learn with a question and browse" is not happening — the
  `/learn/` hub is an *AI retrieval* surface (500 Bing citations) not a human browsing surface (3 Ahrefs entries vs
  97 on `/`); (b) "they're getting to practice, so that's good" holds for `/` arrivals, not content arrivals.
  **Implication:** content→practice conversion (10% → 45%) is a larger available multiplier than article count, and
  unlike crawling it is not externally blocked. Hold new articles until the crawl gate is verified fixed.

- **[WATCH · 2026-08-30] Courses launch ("Foundations of Singing").** The direct play for the #2/#4 grounding queries
  ("best free online singing course" 32, "free singing lessons for beginners" 31). Track weekly: (a) Bing crawl/index of
  the 11 `/courses/` URLs (submitted Aug 29; 0 crawled Aug 30); (b) the syllabus entering Bing's cited-page pool;
  (c) product funnel course_viewed → lesson_viewed → exercise_toggled → lesson_completed (Aug 30 baseline ≈ smoke-test
  noise: 3/2/0/1 people); (d) Class Central + AlternativeTo listings (submission notes in seo/courses-class-central.md,
  still to be sent). Lesson-1 exercise is in DEFAULT_ROUTINE, so lesson-01 toggles under-count adds.
  **Update Aug 31 (day 2):** product side growing, distribution side stalled. Course pageviews 18 → **45 / 17 people**; course_viewed 6→**11 (7 people)**, lesson_viewed 5→**11 (6)**, next_pressed 4→**10 (6)**, completions still **1**, `course_exercise_toggled` still **0**. Bing has **not crawled a single /courses/ URL** 2 days after submission (targeted GetUrlInfo: all 0 bytes), and no AI crawler has fetched a course path. So the syllabus cannot enter the cited pool yet, and the funnel's weak step is the routine toggle.
  **Update Sep 1 (day 3): the product side has now cooled too, and one instrumentation gap is confirmed.** Course pageviews by day
  17 → 28 → **10**; course_viewed 6 → 5 → **2**, lesson_viewed 5 → 6 → **2**, next_pressed 4 → 6 → **2**. All-time completions still **1**.
  `course_exercise_toggled` is **absent from the PostHog taxonomy entirely** — it has never fired once, 4 days after launch, so the
  routine-add step is unmeasured as well as unused; worth a wiring check on `LessonExerciseBlock` before concluding users ignore it.
  Distribution is still fully blocked: **all 11 `/courses/` URLs remain uncrawled by Bing** (0 bytes, 4 days after submission), **no AI
  crawler has fetched a course path**, and no course URL appears in Bing's cited-page or grounding-query lists. The two courses-shaped
  grounding queries ("best free online singing course" 32, "free singing lessons for beginners" 39) are both being answered from `/learn/`.
  **Update Sep 2 (day 4): still cooling, and the funnel is now leaking at the top.** Daily course_viewed 6 → 5 → 2 → **2**;
  lesson_viewed 5 → 6 → 2 → **1**; next_pressed 4 → 6 → 2 → **0**. Course pageviews ticked back up (10 → 17) while
  in-page events fell, so people are reaching course URLs and not engaging. All-time completions still **1**;
  `course_exercise_toggled` still absent from the taxonomy. Distribution unchanged: 11 `/courses/` URLs uncrawled,
  0 AI-crawler fetches, no course URL cited.

- **[RESOLVED · 2026-08-28] PR-21 analytics coverage (19→61 events) is live and firing.** Deployed 04:16 UTC Aug 28;
  by 21:00 UTC ~18 brand-new events went 0→N exactly at deploy (onboarding_step_viewed 45, exercise_selected 24,
  practice_stopped 21, tempo_changed 15, headphones_answered 10, mode_changed 8, routine_advanced 7, pathway_selected 6,
  + a dozen more at 1–3). Prod bundle grep already confirmed the code shipped. Instrumentation verified working. ~29
  catalog events remain at zero — nearly all deep/rare actions (song_saved, import_* funnel, coaching_* deep steps,
  backup_restored, user_content_deleted). **One flagged for a wiring check: `voice_part_selected`** (50 starts + 8
  onboardings today, zero fires — likely emits only on explicit change and onboarding's voice step is excluded like
  routine, but confirm on the surface users touch). `plan_*` events zero too (Plan tab is low-traffic).

- **[WATCH · 2026-08-28] Weekday vs weekend usage — inconclusive, sample too small.** 2 weeks, n=4 weekend days (one is
  the Aug-15 launch spike) vs 10 weekday. Practice/day reads weekend 46 > weekday 37 but inverts to 30 < 37 once the
  launch Saturday is dropped. Outlier-robust cut (DAU/day) leans weekend: 31 vs 24, still 28 vs 24 without the spike —
  modestly more *people* on weekends, but depth/visitor flat (~1.5 starts) all week. No "weekday = deeper" signal.
  Re-cut monthly; need several clean weeks before calling it.

- **[RESOLVED · 2026-09-01] The Aug-27 practice-volume step-up is real and has held.** W1 & W2 were both exactly
  34.9 practice/day. W3 (Aug 27–Sep 1, six complete UTC days: 64, 91, 27, 21, 115, 72) runs **65.0/day — 1.86x the
  baseline**, with pageviews 103.0/day (vs 75.1 / 68.4) and logging 12.0/day. The Aug 29–30 dip that prompted the
  Aug-30 "spike didn't hold" call was a two-day trough inside a raised plateau, not a reversion. **Cause is still
  unattributed**: Aug 27 predates the #20/#21 deploys, inflow (ChatGPT referrals, crawler retrieval) is flat, and no
  single identity explains it — the extra volume is spread across many devices. The most likely reading is that the
  Aug-25-onward practicer cohort is compounding (see the retention curve), i.e. this is a *retention* effect showing
  up as volume, not an acquisition one. Re-open if W4 falls back toward 35/day.


- **[OPEN · 2026-08-20] Claude citation tracking.** No dashboard reports Claude citations (it rides Brave, not
  Bing). We allowed `Claude-User`/`Claude-SearchBot` in robots.txt and submitted 4 URLs to Brave on Aug 20.
  Signal to watch: `ai_crawler_hit` where `vendor='anthropic' AND kind IN ('index','user')` growing *beyond* the
  ~5 setup test hits; and vocalhabit.com appearing on search.brave.com for target queries.
  Next check: daily crawler counts; Brave SERP spot-check weekly.
  **Update Aug 22:** still flat. `Claude-SearchBot` has NOT crawled since our Aug 20 test, 2 days after the robots
  allow + Brave submit (ChatGPT-User by contrast exploded 126→310). Verify Brave has actually indexed us and that
  prod robots.txt still serves the Claude groups.
  **Update Aug 25:** 5 days on, STILL test level. `Claude-SearchBot` 3 / `Claude-User` 2, no real crawl since Aug 20.
  Meanwhile `ChatGPT-User` retrieval climbed 350→393 (+12%). Anthropic scrapes for training (`ClaudeBot` 72) but the
  recommendation path is dead. Brave-index verification is now the blocking action. Spot-check search.brave.com.
  **Update Aug 26:** 6 days on, still test level. `Claude-SearchBot` 3 / `Claude-User` 3 (+1 User hit only), no real
  crawl. `ChatGPT-User` retrieval 393→446 (+13%); `ClaudeBot` training flat at 72. Brave-index verification still the
  blocking action, still not done.
  **Update Aug 26 (run 2): RAW COUNTS WERE SPOOFED.** Content-path filter (see the new spoof investigation) shows the
  earlier 446/72/70 were inflated by a UA-spoofing scanner. **Genuine** retrieval: `ChatGPT-User` **277** content hits
  (the only real one; matches Bing's 277 citations); `Claude-User`/`Claude-SearchBot` **3/3** content hits = STILL
  test-level. Claude's cite-path never went live. Judge this investigation on content_hits, not raw UA counts, from now on.
  **Update Aug 27:** 7 days on, still frozen. `Claude-SearchBot` 3 / `Claude-User` 3 content hits, zero movement.
  `ClaudeBot` (training) crept 6→9. Brave-index verification is still the blocking action and still has not been done.
  **Update Aug 30:** 10 days on, still frozen at 3/3 content hits. ClaudeBot flat at 9. Brave-index verification remains undone.
  **Update Aug 31:** 11 days on. Still 3/3. ClaudeBot still 9. Unchanged; Brave-index verification still the blocking action.
  **Update Sep 1:** 13 days on. Still **3/3** content hits, ClaudeBot still 9. Unchanged for two weeks. Brave-index verification has now been the named blocking action for 11 consecutive runs and still has not been done — either do it or downgrade this to PARKED.
  **Update Sep 2:** 14 days. Still 3/3, ClaudeBot still 9. Twelfth run with the same blocking action outstanding. Recommend PARKING this until someone actually checks search.brave.com — logging an unchanged 3/3 every night adds nothing.

- **[OPEN · 2026-08-26 · run 2] Crawler tap is UA-spoofed (a credential scanner).** A scanner sprays secret paths
  (`/.env`, `/.ssh/id_dsa`, `/aws/credentials`, `/Dockerfile`, `/jenkins/.env`, `/proxy`, `/api/*`) while faking
  crawler UAs (Claude-User, Perplexity-User, GPTBot, …), so `ai_crawler_hit` counts by UA are junk. The Aug-26
  "Claude 40/19 surge" was 37+16 spoof, 3+3 real. **Content-path filter is now mandatory (§C).** Real picture:
  ChatGPT-User 277 content hits; all others near-zero. Static export leaks nothing (probes 404), but the active scan
  is worth a security note. Next: consider content-filtering the tap itself and/or a WAF rule; keep reading content_hits only.

- **[WATCH · 2026-08-26 · run 2] New pain-point articles + embed analytics.** 3 articles shipped + Request-Indexed
  today (why-cant-i-sing-high-notes / why-does-my-recorded-voice-sound-bad / why-do-i-sing-flat). First content
  inflow lever. In-article `EmbeddedExercise` now fires `embed_exercise_played` + `embed_exercise_open_full`
  (article→app conversion), on Learn + spotlights. No data yet (just deployed). Watch first plays + whether the new
  pages enter Bing's cited pool (currently the 4-page surface is /learn/ hub 124, sovt 40, home 21, spotlights).
  **Update Aug 27: first data, and a blocker.** `embed_exercise_played` fired **2 times / 1 person** (first at
  18:10:50 UTC); `embed_exercise_open_full` **0**. The article-to-app conversion step has not happened once. Both
  events are wired in code (`components/learn/EmbeddedExercise.tsx:76` and `:119`), so the zero is genuine, not a
  gap. Separately, **Bing has still never crawled any of the 3 new articles** (`bwt.py check`: why-cant-i-sing-high-notes,
  why-do-i-sing-flat, why-does-my-recorded-voice-sound-bad all uncrawled), so they cannot enter the cited pool yet.
  **Update Aug 28:** `embed_exercise_played` climbed 2 → **7** all-time; `embed_exercise_open_full` got its **first fire**
  (1, at 02:20 UTC). Article→app conversion is alive but still thin.
  **Update Sep 1: this one has turned. Article→app conversion is no longer the blocker.** `embed_exercise_played` **7 → 31 (17 people)**
  and `embed_exercise_open_full` **1 → 13 (12 people)**. Both moved from near-zero to routine in four days, and the open-full step is now
  converting at ~42% of plays. The *other* half of this watch is unchanged: **all 4 `why-*` pain-point articles have still never been
  crawled by Bing**, so none of them can enter the cited pool. The embed works; the pages it lives on aren't being retrieved.

- **[WATCH · 2026-08-27] Guided-mode nudge (deployed ~Aug 26 night).** `guided_nudge_shown` **5 impressions / 4
  people**, first at 2026-08-27T08:54:48Z, last 21:02:42Z. **Every impression was `reason: "rough"`** (the
  struggling-singer branch). The `experienced` branch has not triggered once. `guided_nudge_accepted` = **0**;
  the event is wired at `components/practice/PostSessionPanel.tsx:161`, so that is a genuine zero, not missing
  instrumentation. Meanwhile Guided mode itself is now readable for the first time (the Aug-26 instrumentation
  landed): **6 of 59 practice starts today were `mode:'guided'`, from 2 people, 4 of them scored**, but 4 of
  those 6 came from the heavy dev-test identity, so real guided usage is ~2 starts / 1 person. Next: give it a
  few days of impressions before judging the accept rate; if accepts stay at 0 while impressions accumulate,
  the nudge copy or its placement in the post-session panel is the suspect, not the targeting.
  **Update Aug 28: first accepts.** `guided_nudge_accepted` 0 → **2** (1 today) against `guided_nudge_shown` 10 all-time
  (2 since deploy). The accept path is alive; rate ~20% on a tiny base. Keep logging.

- **[OPEN · 2026-08-26] Bing indexation + AI grounding (NEW ground truth: Bing Webmaster Tools).** BWT *is* set up
  (verified `vocalhabit.com` property; also holds gradical.app, so switch property before reading). This is the
  upstream view for ChatGPT+Copilot (both Bing-backed) we'd been blind to. First read:
  - **Search Performance:** 908 impressions / 11 clicks (last ~30d). Bing indexes & serves us far more than GSC shows.
  - **AI Performance (Copilot + partners, 3-mo):** **277 total citations, avg 4 cited pages.** Far more citations than
    Ahrefs' sampled "Copilot 5"; confirms the narrow-page-surface finding from Bing's own data. Citations ticking up
    Aug 21–24; cited-pages nudged to ~7 recently.
  - **Top cited PAGES:** `/learn/` hub **124**, `/learn/sovt-exercises` 40, `/` 21, `/artists/freddie-mercury` 19,
    `/artists/chappell-roan` ~10. Artist spotlights ARE getting cited. Validates that content type.
  - **Top grounding QUERIES:** "learn to sing online free" **44 (23.7% share)**, "best free online singing course" 20,
    "free singing lessons for beginners" 19, "learn to sing" 8. Citations are driven by **free/online/beginner
    learn-to-sing intent** (AI recommends us as a free tool), NOT by technique or pain-point articles (sovt is the
    lone technique exception).
  - **Indexation audit:** most pages indexed fine (`chest-voice-exercises`, `chappell-roan` = "Indexed successfully").
    The lone straggler was **`/learn/why-does-my-voice-crack`: "Discovered but not crawled. URL cannot appear on
    Bing"** (discovered via IndexNow Aug 24, never crawled). **→ Requested indexing manually (Aug 26); quota 100/day.**
  - **Takeaways:** (1) indexation is NOT the main citation blocker. Most content is indexed; getting cited is about
    answer-fit/authority. (2) The **/learn/ hub is our single biggest cited asset** (124) on "learn to sing free"
    intent. (3) DR 0 is flagged by BWT itself ("not enough inbound links from high-quality domains"). The real lever.
  - Next: **request-indexing on every new publish** (voice-crack proved IndexNow-discovery ≠ crawl for brand-new URLs);
    lean pain-point articles toward the proven "free/beginner/how-do-I" framing; check AI Performance weekly.
  **Update Aug 27: citations jumped and the page surface widened.** Total citations **277 → 352**; more importantly
  the **daily rate roughly tripled**: 10.9/day (Aug 11–17) → **28.7/day (Aug 18–24)**, with single days of 79 (Aug 22)
  and 75 (Aug 25). Bing's own "avg cited pages" moved **4 → 10** on Aug 25. The cited-page list is now **17 pages**
  (was reported as the top ~5): `/learn/` **168**, sovt 40, `/` 25, freddie-mercury 20, **`/vocal-range-test` 12**,
  can-tone-deaf-people-learn-to-sing 11, vocal-warm-ups-for-beginners 11, chappell-roan 10, vocal-agility 8,
  ariana-grande 7, how-to-increase-vocal-range 5, mix-voice 4, can-anyone-learn-to-sing 4, chest-voice 2, belting 1,
  breathing 1, how-to-practice-singing 1. Grounding queries went 4 → 6: **"learn to sing" 8 → 40** (20.5% share) and
  **"range test" 9 (new)**. The first evidence a *tool page* pulls citations on its own terms, not just the hub.
  **Indexation regression:** 25/31 indexed; the 3 Aug-26 pain-point articles have **never been crawled**, and
  `why-does-my-voice-crack` is still uncrawled a day after manual Request Indexing. Publish + IndexNow is not
  yielding a next-day crawl. Caveat: `/learn/how-to-practice-singing` reads "not indexed" in the API yet appears in
  the AI-cited list, so the two Bing surfaces disagree. Bing Search Performance: 978 impr / 12 clicks over Aug 12–25
  (~70 impr/day, flat); top organic queries "vocal warm ups" 51 and "vocal warm up" 37, **both at 0 clicks**.

- **[OPEN · 2026-08-20] `/learn/sovt-exercises` entry growth.** Entries grew ~2 → 24. **Real**. The 27-min Ahrefs
  avg dwell is a **measurement artifact** (PostHog session-span: 12s median, 3.3min max). Idle left-open tabs
  inflating Ahrefs' mean, not deep reading. Real question: which channel drives the *entry* growth, and can we
  replicate it. Corollary: **distrust Ahrefs session-duration generally**. Cross-check dwell against PostHog.

- **[PRIMARY · 1A · 2026-08-22] Inflow: grow citations & referrals.** Co-equal with retention (1B); actively
  being worked, NOT settled. Flat now (~16 ChatGPT ref/day, ~33 citations) with no organic flywheel. Citations
  don't compound from clicks, so growth comes from INPUTS we ship: more indexed answer-content (query coverage),
  real authority (legit backlinks / brand mentions; DR is 0), primary-source assets, Bing indexation. Baseline
  (Aug 22): ChatGPT 33 cites / 4 pages · Copilot 5 / 3 · others 0 · ~16 ChatGPT ref/day · DR 0 · branded search
  "vocal habit" 14 clicks / 15 impr / pos 2 (Google. Understates vs Bing). Lever gauges to track each run:
  citations-per-page, referral rate, branded-search growth.
  **Update Aug 27: 1A MOVED for the first time, on the citation lever only.** Bing citations **10.9/day → 28.7/day
  week-over-week (+163%)** and the cited-page surface widened to 17 pages (see the Bing investigation above). Every
  other gauge is unmoved: LLM referrals **~15/day** (Ahrefs LLM 106 over W2), branded search "vocal habit" **7 clicks
  / 10 impr / pos 2**, **DR still 0**, **0 community mentions**. And our own tap says `ChatGPT-User` content fetches
  are **flat at ~39/day** (36/39/47/42/44/35/36/35 across Aug 20–27). So: consultation is widening, clicks are not.
  Reconciliation. Rising Bing citations against flat live page-fetches means answers are increasingly grounded on
  Bing's **cached index** rather than fresh `ChatGPT-User` pulls, which is consistent with both numbers being right.
  **Correction to prior runs:** the "+12%/+13% ChatGPT-User retrieval growth" reported Aug 24–26 was cumulative-total
  growth, i.e. days accumulating. The per-day rate was flat the whole time. Read rates only.
- **[PRIMARY · 1B · 2026-08-22] Retention: do they stick & deepen.** Co-equal with inflow (1A). Growth =
  inflow × retention × word-of-mouth; with inflow flat, retention decides whether the trickle compounds.
  **Success criterion (Ryan): we're healthy iff BOTH
  (a) returning-session volume per week AND (b) depth per returning visit are rising.** A steady trickle into a
  bucket that holds is fine; a leaky bucket is not. Baselines (Aug 22): depth = **2.10 practice-starts / returning
  visit** (vs 1.16 new), rising 1.89→2.10; returning = **21%** of tagged pageviews. Measure as **per-week rates**,
  never cumulative. Depth metric = practice-starts/visit (logging is opt-in; regulars skip it, so logged/visit
  understates depth). Caveats: localStorage proxy is a per-device floor; true person-level retention isn't
  available cookieless. WoM proxy to stand up: branded-search ("vocal habit") growth in GSC/Bing.
  **⚠ Metric caveat (Ryan, Aug 24): the returner definition is muddy.** `returning`/`visitNumber` count *site*
  visits, so the cohort conflates genuine tool-returners with first-time-tool users on site-visit 2 (e.g. read a
  Learn article, then tried the tool). Exercise completion by visit depth is 39%→50%→62% (visits 1→2→3). The
  right direction, but n collapses (198/34/21), so directional only.
  **✅ FIX SHIPPED (PR #19 `feat/practice-counters`, merged + deployed 2026-08-24).** `lib/analytics/practiceCounters.ts`
  stamps `practiceNumber` / `hasPracticedBefore` on practice_started + pattern_completed, and `finishNumber` /
  `hasFinishedBefore` on true completions (completedAllKeys). Verified live in the prod bundle; property present on
  practice_started from Aug 24 (11/45, mid-day deploy) and **100% from Aug 25 (9/9)**. First read (n≈20, directional
  only): practiceNumber tail already reaches #9; hasPracticedBefore=true 15 starts / 5 ppl vs false 5 / 5.
  **Now measure 1B depth/completion on `practiceNumber` (genuine practice-returners), not `visitNumber`**. Needs
  ~a week of accumulation before the 2nd+-practice cohort has usable n. Until then 1B stays directional on the
  site-visit proxy, but the honest metric is finally instrumented.
  **Update Aug 27: PASSING on the headline series, but the verdict now turns on one identity.** Site-visit proxy:
  returning practice-starts **13.9 → 14.9/day (+7%)**, depth **2.49 → 2.60** practice-starts/returning visit,
  returning share **23.0% → 29.7%**. Returning browse **64% deeper** (3.48 vs 2.12 pv/visit) and start **168% more**
  practice/visit (2.60 vs 0.97). Untagged still 0. **⚠ Sensitivity:** one identity logged **26 practice starts today**
  with `practiceNumber` running 1→24 on deploy day and toggling Guided mode. Almost certainly Ryan testing the new
  nudge. It sits in the `returning=true` cohort and supplies **24 of that cohort's 104 starts**. Excluding it, the
  same two bars read **11.4/day and 2.05 depth. Both DOWN**. Heavy single-day identities appear in every prior week
  too (30 starts wk of Aug 10, 24 wk of Aug 17; cookieless ids rotate daily so one human = one id per day), so
  excluding would break the series and was not done, but at this n the pass/fail flips on one person. Treat the
  PASSING verdict as low-confidence this run.
  **First clean read on the honest counter** (Aug 25+, 100% coverage, dev identity excluded): of **18 distinct
  singers**, **13 reached practice #2 (72%)**, **10 reached #3 (56%)**, **5 reached #5 (28%)**. That is a genuinely
  healthy practice-retention curve and is the metric to lead with from here. Caveat: `practiceNumber` is a
  localStorage per-device counter, so a fresh device or cleared storage restarts at 1. It is a floor.

- **[WATCH · 2026-08-20] ChatGPT activation floor.** ~25% of ChatGPT arrivals start practicing / ~22% reach
  scoring (floors vs Ahrefs' ChatGPT visitor count). Strong for cold referral. Watch for drift up or down.
  **Update Aug 27:** cumulative floors **holding**. 52 started / 45 scored / 21 logged against Ahrefs' 223
  cumulative ChatGPT visitors = **≥23% start / ≥20% scoring / ≥9% logged**. The 7-day slice reads lower
  (19/94 = 20% start, 16/94 = 17% scoring) but that is small-n noise, not a drift; report the cumulative.

- **[RESOLVED · 2026-08-21] `untagged` events.** Was ~15% (87 pv) but all confined to the launch days
  (Aug 13–16); week 2 has **0 untagged**. Early-days artifact (pageviews before the super-property registered),
  now clean, not a growing problem.
- **[WATCH · 2026-08-21] Funnel deepening.** Per-day W1→W2: practice +19%, scoring +34%, logged +80% while
  pageviews held flat. Watch whether it holds as W2 fills (currently 2 of 7 days). Persisted in `weekly-snapshots.md`.
- **[OPEN · 2026-08-21] Re-aim onboarding pacing.** Drop-off is front-loaded (18 of 28 skippers bail at the first
  two steps), NOT at the late steps, so pacing isn't a drop-off fix. But steps 4–5 (Import, Song-segment) teach
  features with 5 opens / 0 song-saves. **Shipped Aug 22 to prod (PR #13):** voice → step 0 + default tenor→alto.
  Next: defer Import/Song-segment intros to a return visit; analyze onboarding funnel by `stepKey` (indices shifted).
- **[OPEN · 2026-08-22] Direct-traffic surge: bots?** W2 (Aug 20–22) direct = 51 visitors at **96% bounce, 0s
  avg session**. Smells like a bot/spam wave or a burst of referrer-stripped junk, not real visitors. It dragged
  cumulative LLM share from ~52% to ~49%. Next: break `$direct` down by UA / `$virt_is_bot` / geo; don't count it
  as growth until characterized. **Update Aug 25:** persists. W2 (Aug 20–24) direct = **69 visitors at 94% bounce**,
  now roughly equal to LLM (72) and holding LLM share down to 44%. Still uncharacterized; still don't count as growth.
  **Update Aug 26:** persists. W2 (Aug 20–26) direct = **81 visitors at 93% bounce**; cumulative direct 130 @ 90%
  (+9 since last run). Holds W2 LLM share to ~50%. Still uncharacterized. Break down by UA / bot flag / geo.
  **Update Aug 27:** persists. Cumulative direct **142 @ 89% bounce**; last 7 days 77 @ 92%. Still uncharacterized
  after 5 days of flagging it; this is now the longest-open unactioned item. Break down by UA / `$virt_is_bot` / geo.
  **Update Aug 30:** persists. Last 7 days direct **88 @ 88% bounce**, now the #2 "channel" and nearly equal to LLM (100). Still uncharacterized.
  **Update Aug 31:** persists. 7d direct **75 @ 88% bounce** vs LLM 83. Ten days flagged, still unactioned.

- **[WATCH · 2026-08-24] Organic / community mentions (WoM).** As the user base grows, public mentions. Reddit
  especially. Are the leading sign word-of-mouth is taking hold, and a more public organic-mention venue than
  branded search. Track each run: reddit.com / HN / forum referrers in Ahrefs Web Analytics + a
  `site:reddit.com "vocal habit"` / `"vocalhabit.com"` sweep. **Baseline Aug 24: 0 Reddit mentions.** Pairs with
  branded search as the WoM gauge on the retention→growth path. Evaluating a metered tool-gateway (see below) for
  proper social listening. **Update Aug 30: still 0** Reddit/HN/forum referrers; `site:reddit.com` sweep empty. Branded "vocal habit" (Google, 7d) 3 clicks / 5 impr / pos 2.
  **Update Aug 31:** Bing organic had its best click day yet (Aug 28: 6 clicks / 84 impr) but the rate is unchanged overall (~55 impr/day, 0-2 clicks). **Update Aug 26: still 0**, no reddit/HN/forum referrers in Ahrefs; `site:reddit.com`
  sweep empty. First artist-spotlight page (`/artists/chappell-roan`) drew its first 2 AI-referred entries.
  **Update Aug 27: still 0 Reddit/HN/forum referrers**, `site:reddit.com` sweep still empty. One small first:
  Ahrefs logged the **first-ever `social` visitor** (1) in the cumulative window. Branded search flat at 7 clicks /
  10 impr / pos 2. Artist spotlights are, however, now visible on the *citation* side (freddie-mercury 20,
  chappell-roan 10, ariana-grande 7) and picking up branded-artist impressions in Bing organic
  ("freddie mercury vocal range" 10, "ariana grande vocal range" 10, both 0 clicks).

## Findings (newest first)

### 2026-09-02

_(Browser steps deferred during a screen recording, then completed 2026-09-03 17:52 UTC. Bing lags ~2 days, so its
latest point is Sep 1 and nothing was lost. Activity figures below still cover through Sep 2 UTC, the last complete day.)_

- **Citations 898 → 980, running ~89.7/day vs 37.1/day the prior 7 (+142%) — but the shape is a settling plateau,
  not acceleration.** Daily Aug 26–Sep 1: 44, 54, **176**, 93, 92, 87, 82. Aug 28 was a spike and the four days since
  step gently down. Call it ~85/day and stop describing it as accelerating.
- **⚠️ The Sep 1 "concentration, not expansion" finding is REVISED — it was a one-day artifact.** On Sep 1, 62 of ~87
  new citations (71%) landed on `/learn/`. Today only **29 of ~82 (35%)** did; the rest spread across sovt +18,
  chappell-roan +15, vocal-range-test +12, freddie-mercury +3, belting +2. The hub's share of cited volume *fell*
  56% → **54%**. This is the second time a single-day distribution delta has misled a headline (cf. the Aug 27
  partial-bucket correction). **Rule to hold: distribution claims need two data points minimum.**
- **The grounding surface widened into technique for the first time in days: 12 → 13 queries.**
  **`semi occluded vocal tract exercises` 7** entered — pairing with sovt's +18 citations — and **`range test`
  9 → 21 (+12)** matches `/vocal-range-test`'s +12 exactly, so the tool page now pulls its own query rather than
  riding the hub. Still **no `/courses/` page cited**, and no courses-shaped query has moved.

- **W3 closed at 72.3 practice/day — 2.07x the W1/W2 baseline of 34.9.** First fully complete post-step-up bucket
  (749 pageviews, 506 starts, 360 scored, 92 logged over 7/7 days). Sep 2 set a new single-day record at 116 starts.
  ⚠️ **But that record is ~62% two identities** — one device did 45 starts with `practiceNumber` running 1→45 in a
  single day (the dev-test signature), another 27. Quote the week, not the day.
- **1B passed a like-for-like test for the first time, which is the result that actually matters.** Previous runs
  compared a raw figure against a differently-adjusted one. Applying one rule to both weeks — drop any person_id
  with ≥20 starts in a single day — gives volume **9.6 → 17.9/day (+86%)** and depth **1.76 → 2.36 (+34%)**, both
  up without leaning on any single device. Raw bars (32.3/day, 3.96) are inflated ~44% by heavy identities; use the
  excluded pair whenever the number needs to be robust.
- **Retention curve improved for a third straight run.** Base 83 → 94 devices, and every share held or rose:
  #3 59% → 62%, #5 41% → 44%, #10 24% → 26%, #16 10% → 13%. Against Aug 28 the #5 and #10 tiers have roughly
  doubled (33% → 44%, 15% → 26%).
- **Google indexes the pages Bing won't touch.** `why-does-my-voice-crack` — never crawled by Bing since publishing
  Aug 24 — is pulling Google impressions across 6 queries at positions 38–51. The pages are fine; the blocker is
  Bing-specific. This eliminates page-level causes from the crawl-gate investigation.
- **The gradical sitemap resubmission worked, fast.** Bing re-read that feed ~12 h after `SubmitFeed` and went from
  seeing **9 URLs to 16**. Feed re-registration is a real lever and is distinct from URL submission, which has never
  moved anything on either property. Worth trying on vocalhabit once the lastmod fix is deployed.
- **ChatGPT retrieval may finally be ticking up.** Per-day content hits Aug 27–Sep 2: 38, 37, 41, 36, 37, **45, 50** —
  the two highest days on record, against a 40.6/day week average that is still nominally flat vs 39.9 prior.
  Two days is not a trend; flag it and re-check.
- **Courses day 4: pageviews up, engagement down** (17 pv but course_viewed 2, next_pressed **0**). People reach the
  URLs and bounce. Article embeds remain healthy by comparison (4 plays / 1 open-full on Sep 2).

### 2026-09-01

- **Both co-primary hypotheses moved in the same direction for the first time, and 1B finally survives its own caveat.**
  **1A (inflow): PASSING on citations, still failing everywhere else.** Bing citations **88.7/day** over the last 7 data
  days vs 28.7/day the 7 before (+209%), total 811 → **898**. But DR is still **0**, community mentions still **0**, and
  ChatGPT *referrals* are ~9/day (down from ~15) while ChatGPT-User *retrieval* holds flat at 38.6/day — the zero-click
  gap is widening, not closing. **1B (retention): PASSING (7th run) and, for the first time, it survives excluding the
  heavy dev identity** — 20.7/day volume and 2.96 depth without it, vs 11.4 / 2.05 (both down) at the same test on Aug 28.
  Confidence upgraded LOW → MODERATE.
- **⚠️ The citation growth is concentration, not surface expansion.** Of the ~87 citations added since yesterday,
  **62 went to the `/learn/` hub alone** (438 → 500). The hub is now **56% of all cited volume**; 11 of the 18 cited pages
  were exactly flat, the page count did not move (18 → 18), and the grounding-query set did not move (12 → 12, no new
  query). Bing is answering more questions from the same one page. That is a fragile shape: a single URL carries the
  citation business, and the pages built to widen it (courses, `why-*` articles) are not in the pool at all.
- **The practicer base tripled and the deep tiers improved faster than the shallow ones.** Devices with ≥1 practice since
  Aug 25: 27 → **83 genuine**. The *shares* (growth-free) improved at depth: #5-reachers 33% → **41%**, #10-reachers
  15% → **24%**, while the #2 rate held (74% → 72%). Eight devices other than the dev identity have now reached #16,
  and the visit-number tail runs continuously to 14 (it stopped at 7 on Aug 28).
- **Article → app conversion flipped from blocker to working.** `embed_exercise_played` **7 → 31 (17 people)** and
  `embed_exercise_open_full` **1 → 13 (12 people)** in four days; open-full now converts at ~42% of plays. The
  constraint on the pain-point articles is no longer the embed — it is that **all 4 `why-*` articles have still never
  been crawled by Bing**, so nothing retrieves them.
- **Courses: cooling on the product side, still fully blocked on distribution — and one step is unmeasured.**
  Day 1→3 course pageviews 17 → 28 → **10**; course_viewed 6 → 5 → **2**; completions still **1** all-time.
  `course_exercise_toggled` is **absent from the PostHog taxonomy entirely** — never fired once — so "the routine
  toggle is the weak step" is currently unprovable; check the wiring on `LessonExerciseBlock` first. Meanwhile all
  **11 `/courses/` URLs remain uncrawled by Bing** 4 days after submission (0 bytes), no AI crawler has touched a
  course path, and the two courses-shaped grounding queries are both being served from `/learn/`.
- **Branded search made its first real move:** 10 Google branded clicks over 7 days ("vocal habit" 8 @ pos 1.8 +
  "vocal habits" 2), up from 3 on Aug 30. Bing organic clicks also roughly doubled (6 → 11 over comparable 6-day
  windows) on flat impressions. Still 0 Reddit/community mentions.

### 2026-08-31
- **Biggest usage day since launch, by a wide margin.** Aug 31 (complete UTC day): **209 pageviews / 38 DAU / 115 practice starts / 75 reached scoring / 19 range tests / 21 onboardings.** The prior record was Aug 15 (174 pv / 93 starts) and the W1-W2 baseline was 34.9 starts/day, so this is **3.3x baseline**. No deploy or campaign explains it; the course + deck shipped Aug 29-30. W3 (Aug 27-31, 5 complete days) now runs **63.6 practice/day**, so the "spike reverted" read from yesterday was premature: Aug 29-30 was the dip, not the return to baseline.
- **Citations nearly doubled again: 450 -> 811 total, and the daily rate went ~24/day -> ~83/day.** Bing daily Aug 24-30: 49, 75, 44, 54, **176**, 93, 92. Aug 28 alone (176) beat the entire first week. Cited-page pool 17 -> 18 with the top of it inflating hard: `/learn/` **224 -> 438**, `vocal-warm-ups-for-beginners` **31 -> 79**, `ariana-grande` **13 -> 38**, `can-tone-deaf-people-learn-to-sing` **11 -> 24**, `chest-voice` 2 -> 10, `mix-voice` 4 -> 11.
- **The grounding-query surface broadened from resource-seeking into technique, which revises an earlier finding.** 8 -> 12 queries, and the four new ones are mostly *exercise* queries: **"voice warmups exercises for students" 36**, **"vocal exercises for singing" 30**, **"singing exercises" 20**, "freddie mercury voice type" 8. "learn to sing" also went 52 -> **124** (now #1, 22.6% share). The Aug-26 lesson ("citations are driven by free/beginner intent, NOT technique") is now **partially superseded**: technique queries contribute ~86 citations. Free/beginner is still the largest cluster, but the technique library is now pulling its own citations.
- **CORRECTION to yesterday's data-quality note.** I flagged a future-dated `2026-08-31` row as clock skew. It was not: the PostHog project is **UTC**, and yesterday's sweep ran at 04:58 UTC on Aug 31, so that row was simply the current UTC day already in progress. Today's `2026-09-01` row (11 pv) is the same artifact. **Not a bug; the day tables just need the current UTC day labelled partial.**
- **1B retention: PASSING, and this time not on one identity.** 7d returning volume **18.3 -> 25.1 starts/day**, depth **3.12 -> 3.83 starts/returning visit**, returning share of tagged pageviews **35% -> 43%**, pages/visit 5.57 vs 2.47 new. Both health bars up. ChatGPT activation floor also up: 24 starts / 23 people against Ahrefs' 81 ChatGPT visitors = **>=30% start floor** (was >=27%).
- **Zero-click still the shape of it.** ChatGPT-User content fetches 435 -> 473 (~38/day, flat) and LLM referrals 83/7d (~12/day, flat) while citations run ~83/day. Consultation keeps rising; clicks do not.

### 2026-08-30
- **Courses shipped and instrumented end-to-end.** "Foundations of Singing" (9 lessons, `/courses/…`) deployed Aug 29 ~23:00 UTC
  with `course_viewed / course_lesson_viewed / course_lesson_completed / course_exercise_toggled / course_next_pressed`.
  First ~18 h: 18 course pageviews / 4 people; funnel 3 people viewed syllabus → 2 opened a lesson → 1 completed lesson 01
  (that walk matches the post-deploy smoke test; treat n as ~1–2 real). 11 course URLs Bing-submitted Aug 29 (browser);
  none crawled yet (`bwt.py check`: 26/42 indexed, misses = 11 course URLs + the 4 `why-*` articles, STILL never crawled).
  `course_exercise_toggled` 0 so far. New WATCH below.
- **1A citation rate is still accelerating: ~12.7/day → ~47.1/day week-over-week.** Bing daily citations Aug 21–27:
  21, 79, 8, 49, 75, 44, 54 (3-mo total now 450; Bing's view lags ~2 days). `/learn/` hub 168 → **224**;
  **`vocal-warm-ups-for-beginners` 11 → 31** (biggest riser, now #3 with `/`); spotlights up (freddie 20, chappell 13,
  ariana 13); `/vocal-range-test` holds 12. Grounding queries still pure free/beginner intent: "learn to sing online
  free" 56 · "learn to sing" 52 · **"best free online singing course" 32** · "free singing lessons for beginners" 31 ·
  "range test" 9. The course syllabus page now exists to serve exactly that third query — watch whether it enters the
  cited pool. Ahrefs' panel meanwhile *fell* 33→30 chatgpt citations: confirmed stale sample, ignore for trend.
- **The Aug 27–28 practice spike did NOT hold.** Practice starts: 64, 91 → 27 (Aug 29), 21 (Aug 30 partial). W3
  (3 complete days) reads 60.7 practice/day vs the 34.9 W1/W2 baseline, but that is entirely the two spike days.
  Reverts the "WATCH: doubling" toward "two-day burst, source still unidentified."
- **1B holding at the elevated level.** 7d: returning volume **18.3 starts/day** (vs 19.7 dev-inflated Aug 28, 14.9 Aug 27),
  depth **3.12 starts/returning visit** (vs 3.21, 2.60). Both marginally down vs the inflated read, both up vs Aug 27:
  call it flat-at-high. Returning = 35.1% of tagged pageviews; pages/visit 4.00 vs 2.28 new.
- **ChatGPT activation floor (7d):** Ahrefs ChatGPT 99 visitors; PostHog chatgpt.com-referred: 27 people / 28 practice
  starts / 12 scored / 2 logged → ≥27% start floor, holding. Zero-click still widening: retrieval (`ChatGPT-User`
  content hits) 349 → 435 cumulative ≈ ~43/day, roughly flat, while citations run ~47/day and referrals ~14/day.
- **Data quality:** a future-dated `2026-08-31` row (12 pageviews) appeared in the UTC daily series — client clock skew;
  exclude from day tables. `plan_exercise_toggled` has never fired all-time (taxonomy miss) — with the Plan tab now
  renamed Routine and getting a tab-order boost, watch whether it starts; if traffic reaches the tab and it stays 0,
  check the wiring alongside `voice_part_selected`.

### 2026-08-28
- **PR-21 analytics coverage is LIVE and firing.** ~18 new events went 0→N at the 04:16 UTC deploy on a busy Friday
  (50 practice starts post-deploy): onboarding_step_viewed 45, exercise_selected 24, practice_stopped 21, tempo_changed
  15, headphones_answered 10, mode_changed 8, routine_advanced 7, pathway_selected 6, and a dozen more at 1–3.
  Instrumentation works. ~29 catalog events still zero, nearly all deep/rare-by-design; **`voice_part_selected` is the
  one worth a wiring check** (50 starts + 8 onboardings, zero fires).
- **Weekday vs weekend: can't call it yet.** Weekend leans slightly higher on *visitors* (DAU 28–31 vs 24/day, survives
  outlier removal) but depth/visitor is flat all week (~1.5 starts). The raw practice/day "weekend wins" is entirely the
  Aug-15 launch Saturday; remove it and weekdays edge ahead. n=4 weekend days over 2 weeks — insufficient. Faint "more
  people on weekends," no depth difference. Re-cut monthly.
- **Practice spiked the last two days.** W1 & W2 both exactly 34.9 practice/day; W3 (Aug 27–28, partial) running 77.5/day
  (Aug 27=64, Aug 28=91). Aug 27 predates today's deploys, so organic. WATCH — two days isn't a trend.
- **Two conversion paths came alive.** Guided nudge got its **first accepts** (guided_nudge_accepted 0→2). Embedded-exercise
  plays climbed 2→7 and `embed_exercise_open_full` fired for the first time. Both still thin.
- **Returning cohort remains the strongest story.** 7d: returning = 36% of tagged pageviews, **6.84 pages/visit vs 3.27**
  new, **3.21 practice-starts/visit vs 1.11** — ~3× the practice per visit. Zero untagged (clean tagging).
- **Branded search "vocal habit"** 37 clicks / 51 impr / pos 2.7 (Google, 30d); Bing organic 11 clicks / 855 impr (14d,
  flat). Ahrefs citation sample timed out this run; Bing AI-Performance (browser) deferred — last banked Aug 27 (352 cites).

### 2026-08-27
- **1A INFLOW MOVED, first time since launch, and only on the citation lever.** Bing citations went
  **~10.9/day (Aug 11–17) → ~28.7/day (Aug 18–24)**, single days of 79 (Aug 22) and 75 (Aug 25); total 277 → 352.
  The cited-page surface widened from a handful to **17 distinct pages**. `/vocal-range-test` (12),
  can-tone-deaf-people-learn-to-sing (11), vocal-warm-ups-for-beginners (11), vocal-agility (8), ariana-grande (7)
  and six more all entered the pool, on top of the `/learn/` hub climbing 124 → **168**.
- **Two new grounding queries, one of them a tool.** "learn to sing" jumped **8 → 40** citations (20.5% share) and
  **"range test" appeared at 9**. That is the first evidence a *tool page* earns citations on its own terms rather
  than everything funnelling through the Learn hub. A direct argument for building more free ungated tools.
- **Zero-click confirmed and widening.** Citations +163%/day while LLM referrals hold **~15/day** and our own
  `ChatGPT-User` content fetches are **flat at ~39/day**. Reconciliation: answers are increasingly grounded on
  Bing's cached index, not fresh page pulls. **Correction:** the "+12%/+13% retrieval growth" in the Aug 24–26
  entries was cumulative accumulation, not a rate. The per-day rate never moved.
- **W2 completed and the "funnel deepening" finding broke.** With all 7 days in, per-day W1→W2: practice **exactly
  flat** (34.9 → 34.9), scoring **+8%**, logged **+76%**, pageviews **−9%** (75.1 → 68.4). The earlier +14%/+23%
  readings came from W2's first six days, which excluded the very light Aug 25 (23 starts) and Aug 26 (6). Only
  logging genuinely rose. Lesson: do not headline a partial-bucket delta.
- **Bing still has not crawled the Aug-26 articles.** 25/31 sitemap URLs indexed; all three pain-point pages
  uncrawled, and `why-does-my-voice-crack` uncrawled a day after manual Request Indexing. Publish + IndexNow is not
  producing a next-day crawl. The content lever cannot be evaluated yet.
- **Last night's three features each caught users; none converted.** `guided_nudge_shown` 5 / 4 people (all
  `reason:'rough'`), accepted **0**. `embed_exercise_played` 2 / 1 person, open-full **0**. Practice counters at
  100% coverage. Guided mode readable at last: 6 of 59 starts. Both accept-path events are wired in code, so the
  zeros are real. Too early to judge, but log the accept rate daily from here.
- **1B passing but low-confidence**. One likely dev identity (26 starts, counter 1→24 on deploy day) supplies 24 of
  the returning cohort's 104 starts; strip it and both health bars invert. The honest practice-returner curve is the
  better read: **72% of singers reach practice #2, 56% reach #3, 28% reach #5** (n=18, dev identity excluded).

### 2026-08-26 · product deep-dive (scoring realness + Guided mode)
- **First-party data is REAL. Score distribution proves it.** 201 scored completions (meanAccuracyPct on
  `pattern_completed`, flowing since Aug 15): mean 55.5%, median 57%, p25–p75 = 36–78%, only 6/201 at exactly 0.
  A smooth human skill-curve, not a bot/silence spike at 0. Granting a mic + singing a pitch-matched pattern is the
  hardest thing to fake and the least worth faking. The trustworthy layer is trustworthy.
- **Grading was beginner-harsh → softened (code, pending deploy).** The `accuracyPct` is "% of frames within ±50¢
  of target" (time-on-pitch), NOT a grade, but a bare "57%" reads like an F. Fixes: (1) widened color bands to
  green ≤50¢ / yellow ≤100¢ / red >100¢ (unified `tone-utils` with `NoteResultsStrip`; DESIGN.md's own labels:
  green "in tune", yellow "close call", red "clearly off"); (2) the post-session badge now shows **avg ±X¢ off pitch**
  (the tuning metric) instead of a percent.
- **Guided (slow drill) mode was UNINSTRUMENTED. Now fixed.** `GuidedSession` had zero `track()` calls, so the
  "0 guided / 488 standard" split was a blind spot, not proven zero use. Wired `practice_started` + `pattern_completed`
  with `mode:'guided'` (+ practiceNumber/finish counters). From next deploy we can finally see slow-mode usage and
  scoring. **Open:** nudge struggling beginners (high cents-off / low accuracy) toward Guided; measure conversion.

### 2026-08-26 · run 2 (PM)
- **Crawler tap is spoofed. Major correction.** A credential-scanner fakes crawler UAs to hit `/.env`, `/.ssh`,
  `/aws/credentials`. Content-path filter: **ChatGPT-User 277 content hits is the ONLY real retrieval** (matches
  Bing's 277 citations); Claude 3/3, GPTBot 0, Perplexity 1. The 446/72/70 counts we'd been tracking were
  spoof-inflated. Crawler signal is content-filtered from now on (§C updated).
- **Claude never went live**. The Aug-26 "Claude 40/19 surge" was the scanner, not Anthropic. Genuine Claude
  retrieval still 3/3. Three sources agree (Bing, Ahrefs-via-Brave=0, content-filtered tap): ChatGPT is the engine.
- **Bing AI Performance is now a standing sweep step (§A4b)**. 277 real citations / ~4 pages, grounding on
  free/beginner "learn to sing free/online/course" intent; top page the /learn/ hub (124). Ahrefs' 38 samples the same.
- **3 pain-point articles shipped + Request-Indexed today** (first content inflow lever); in-article exercise
  instrumented (`embed_exercise_played` / `_open_full`), awaiting first data.
- **Same-day deltas otherwise flat:** Ahrefs byte-identical to the AM run (its own refresh lag); 1B retention steady
  (returning browse ~43% deeper, 3.05 vs 2.13 pv). Dashboard redeployed in place (same URL, run-2 content).

### 2026-08-26
- **1B (retention) PASSING. 4th run running.** Both bars up again: returning practice-starts **12.3→13.9/day
  (+13%)**, depth **2.32→2.49** practice-starts/returning visit, and returning **share recovered** 20.2→**23.0%**.
  Returning browse **39% deeper** (3.05 vs 2.20 pv/visit) and start **~150% more** practice/visit (2.49 vs 0.98).
  Untagged still 0.
- **Practice-returner counter is now READING** (Aug 24+ tagged window): repeat-practice starts already outnumber
  first-timers **27 vs 9**, `practiceNumber` tail reaching **#11**. Directional (n small). A clean 1B depth/completion
  cut on genuine practice-returners is ~a week of accrual out, but the honest metric is confirmed live.
- **1A (inflow) still FLAT**. Citations unchanged (ChatGPT 33/4pg, Copilot 5/3pg, others 0), branded search
  "vocal habit" pos 2 (8 clicks / 10 impr this window), DR 0, **0 Reddit mentions**. No lever shipped yet.
- **Anthropic still scraped-not-recommended**. `Claude-SearchBot`/`Claude-User` **3/3** (+1 User hit only), no real
  crawl 6 days post-allow, while `ChatGPT-User` retrieval climbed **393→446 (+13%)**. Zero-click retrieval rising;
  human referrals flat ~18/day.
- **Funnel deepening softened but holds** (6 full days of W2). Per-day vs W1: practice **+14%**, scoring **+23%**,
  logged **+100%**; pageviews flat (75→75/day). Logging doubled; engagement still outpacing traffic.
- **Direct surge persists**. Cumulative direct 130 @ 90% bounce (+9); W2 81 @ 93%. Still open.
- **First artist-spotlight entries**. `/artists/chappell-roan` drew 2 AI-referred entries this window (new content
  type live). `/learn/chest-voice-exercises` holds as #3 Learn entry (11). Aug 23 remains biggest day (115 pv).

### 2026-08-25
- **1B (retention) still PASSING**. Both bars up again: returning practice-starts **~10.9→~12.3/day (+13%)**,
  depth **2.14→2.32** practice-starts/returning visit. Returning still browse **34% deeper** (3.16 vs 2.36 pv/visit)
  and start **~110% more** practice/visit (2.32 vs 1.11) than new. Returning share dipped 22.5→**20.2%**. Dilution
  from a new-visitor week, not fewer returns (returning volume rose). Untagged still 0.
- **✅ Practice-session counter is LIVE (PR #19, shipped Aug 24). I mis-reported it as pending last run.**
  `practiceNumber` / `hasPracticedBefore` / `finishNumber` now stamp practice events; 100% coverage from Aug 25.
  This retires the "returner def is muddy" blocker. From next week, cut 1B depth/completion on `practiceNumber`
  (genuine practice-returners) instead of the `visitNumber` site-visit proxy. First read is n≈20 (directional only).
- **1A (inflow) still FLAT**. Citations unchanged (ChatGPT 33/4pg, Copilot 5/3pg, others 0), branded search
  "vocal habit" steady at pos 2, DR 0. No lever shipped yet. **Anthropic still scraped-not-recommended:**
  `Claude-SearchBot`/`Claude-User` frozen at 3/2 (test level) 5 days post-allow, while `ChatGPT-User` retrieval
  climbed 350→**393 (+12%)**. Zero-click retrieval rising; human referrals flat ~14–16/day.
- **Funnel deepening holds at 5 full days of W2**. Per-day vs W1: practice **+23%**, scoring **+30%**, logged
  **+96%**; pageviews now also up **+9%** (75→82/day). Engagement still outpacing traffic.
- **Direct surge persists**. W2 direct 69 @ 94% bounce, ~equal to LLM (72); LLM share held down to 44%. Still open.
- **`/learn/chest-voice-exercises` breaking out**. 11 entries this window, new #3 Learn entry page (after
  homepage 134 and sovt-exercises 41). Second content entry point worth watching.
- **Aug 24 solid** (79 pv / 45 practice / 15 logged); Aug 23 remains the biggest day (115 pv / 47 practice).

### 2026-08-24
- **1B (retention) is PASSING its bar**. Both metrics rising: returning practice-starts **~7.75→~10.9/day
  (+40%)** week-over-week, and depth **2.14** practice-starts/returning visit (↑ 1.89→2.10→2.14). Returning
  share 21→**22.5%**. This is the win condition being met.
- **1A (inflow) is FLAT**. Citations ~32 (from 33/34; noise), ChatGPT referrals steady ~16/day, branded search
  "vocal habit" unchanged at **14 clicks / pos 2**, DR still 0. No inflow lever has shipped yet, so flat is
  expected, not a failure, just no experiment run. Anthropic **still scraped-not-recommended**: `Claude-SearchBot`
  flat at test level 4 days on, while `ChatGPT-User` climbs 310→350 (retrieval up, not referrals).
- **Funnel deepening continues** (4 days of W2): per-day practice +22%, scoring +31%, logged +88% vs W1.
- **Direct surge persists**. 119 visitors at 90% bounce; still bot-like, investigation still open.
- **Aug 23 was the biggest day yet** (115 pageviews, 47 practice starts).

### 2026-08-22
- **Funnel deepening holds** at 3 days of W2: per-day practice +17%, scoring +27%, logged +72% vs W1, pageviews
  flat (~75→72/day). Real, sustained. Engagement rising faster than traffic.
- **Returning engagement gap is widening**. Returning now browse ~33% deeper (3.34 vs 2.51 pages/visit) and
  start ~81% more practice/visit (2.10 vs 1.16), up from +23%/+50% a day ago. The cohort matters more with volume.
- **Still scraped, not recommended**. ChatGPT-User crawler exploded (159→310); Anthropic's `ClaudeBot` (training)
  grew to 70, but `Claude-SearchBot`/`Claude-User` haven't fired for real since our Aug 20 test. Claude has still
  not recommended us to anyone.
- **Direct-traffic surge looks like junk**. W2 direct 51 at 96% bounce / 0s sessions; opened an investigation.
  Cumulative LLM share dipped to 49% purely from this dilution (LLM itself flat at ~16/day).
- **Shipped to prod:** onboarding voice-first + alto default (PR #13); analytics skill + logs (PR #14).

### 2026-08-21
- **Onboarding is bimodal, not leaky**. 71% finish all 6 steps; 29% skip and bail immediately (avg step 1.5),
  no mid-funnel drop-off. Voice is load-bearing: 69% pick, and **74% of pickers choose a non-default voice**
  (alto 39% > tenor 26% > baritone 23% > soprano 13%). Import/Song-segment steps teach near-unused features
  (5 import opens, 0 song saves in 9 days). **Shipped:** default tenor→alto; voice moved to step 0 (gates Next).
- **Funnel is deepening.** Per-day W1→W2: practice **+19%**, reached-scoring **+34%**, logged **+80%** while
  pageviews held flat (~75→73/day). Engagement rising faster than traffic. (W2 = 2 of 7 days; confirm as it fills.)
- **ChatGPT activation holding**. Cumulative floors ~26% start / ~22% scoring / ~12% logged (37/32/17 of 142
  Ahrefs ChatGPT visitors). Not drifting.
- **`untagged` resolved**. 87 pv all in launch days; week 2 is 0 untagged. Returning cohort data is clean now.
- **Still scraped, not recommended**. `ChatGPT-User` climbing (126→159, real OpenAI end-user serving);
  `ClaudeBot` +2 (training only); `Claude-SearchBot`/`Claude-User` flat at test levels. Perplexity/GPTBot quiet since Aug 20.
- **Returning share fell 30%→14%**, but that's **dilution from a new-visitor surge** (162→305 new pv), not
  fewer returns (69→49). Returning still browse ~23% deeper and start ~50% more practice/visit.
- **Set up the persistent view**. `Analytics/weekly-snapshots.md` (7-day buckets + point-in-time snapshots) and
  the dashboard trend now accumulates from launch instead of a rolling 7-day window.

### 2026-08-20
- **Returning visitors are meaningfully more engaged** than new ones: 3.5 vs 2.66 pages/visit, and 2.17 vs 1.24
  practice-starts per visitor-day (~75% higher). First real read on the returning feature. Positive.
- **Claude has SCRAPED us but not RECOMMENDED us yet.** `ClaudeBot` (training) 39 hits is real, but training
  ≠ end-user citation (direct analog to `GPTBot` 33). The recommendation path. `Claude-SearchBot` (index) +
  `Claude-User` (a real question pulling the page). Is still ≈ our 5 setup tests. Nuance: `ClaudeBot` was
  already allowed *before* our robots.txt change and feeds *future* models, so it won't drive near-term recs; the
  `Claude-SearchBot`/`Claude-User` path we just enabled is the one to watch. Contrast: OpenAI is already serving
  end users (`ChatGPT-User` 126, `OAI-SearchBot` 37), not just training.
- **AI-crawler tap live** (`netlify/edge-functions/ai-crawler-tap.ts`): first-day landscape. ChatGPT-User 126,
  PerplexityBot 39, ClaudeBot 39, OAI-SearchBot ~36, GPTBot 33.
- **LLM still the #1 channel**. 128/243 visitors (53%), 2.8:1 over search; ChatGPT ≈ 99% of LLM.
- **`/learn/sovt-exercises` entries grew ~2→24** (real), but its 27-min Ahrefs dwell is an idle-tab artifact
  (PostHog: 12s median). Lesson banked: Ahrefs session-duration ≠ real engagement; cross-check against PostHog.
- **Citations:** ChatGPT 33 across 4 pages, Copilot 5 across 3; Perplexity/Gemini/Google/Grok 0.
- **Infra shipped:** Claude crawlers allowed in robots.txt; 4 URLs submitted to Brave; crawler tap deployed.
