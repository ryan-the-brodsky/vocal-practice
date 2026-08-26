---
# Each FULL run publishes a NEW date-stamped artifact (never update-in-place — that hits a false
# "identical content" conflict). Newest first; this list is the pseudo-historical archive of daily boards.
dashboards:
  - 2026-08-26: "https://claude.ai/code/artifact/0be8ed29-bc50-4925-9895-38e45607829e"
last_run: 2026-08-26
window_default: 7d
---

# Vocal Habit — Analytics Findings Log

The persistent memory for the `analytics-report` skill. Each daily run **reads** this file (to know what
we're tracking), **updates** the active investigations with the day's data, and **appends** new findings.
Newest findings first. Keep entries short and dated; link numbers to the run that produced them.

Status tags: `OPEN` (actively digging) · `WATCH` (monitoring a trend) · `RESOLVED` (answered) · `PARKED`.

---

## Active investigations

- **[OPEN · 2026-08-20] Claude citation tracking.** No dashboard reports Claude citations (it rides Brave, not
  Bing). We allowed `Claude-User`/`Claude-SearchBot` in robots.txt and submitted 4 URLs to Brave on Aug 20.
  Signal to watch: `ai_crawler_hit` where `vendor='anthropic' AND kind IN ('index','user')` growing *beyond* the
  ~5 setup test hits; and vocalhabit.com appearing on search.brave.com for target queries.
  Next check: daily crawler counts; Brave SERP spot-check weekly.
  **Update Aug 22:** still flat — `Claude-SearchBot` has NOT crawled since our Aug 20 test, 2 days after the robots
  allow + Brave submit (ChatGPT-User by contrast exploded 126→310). Verify Brave has actually indexed us and that
  prod robots.txt still serves the Claude groups.
  **Update Aug 25:** 5 days on, STILL test level — `Claude-SearchBot` 3 / `Claude-User` 2, no real crawl since Aug 20.
  Meanwhile `ChatGPT-User` retrieval climbed 350→393 (+12%). Anthropic scrapes for training (`ClaudeBot` 72) but the
  recommendation path is dead. Brave-index verification is now the blocking action — spot-check search.brave.com.
  **Update Aug 26:** 6 days on, still test level — `Claude-SearchBot` 3 / `Claude-User` 3 (+1 User hit only), no real
  crawl. `ChatGPT-User` retrieval 393→446 (+13%); `ClaudeBot` training flat at 72. Brave-index verification still the
  blocking action, still not done.
  **Update Aug 26 (run 2) — RAW COUNTS WERE SPOOFED.** Content-path filter (see the new spoof investigation) shows the
  earlier 446/72/70 were inflated by a UA-spoofing scanner. **Genuine** retrieval: `ChatGPT-User` **277** content hits
  (the only real one; matches Bing's 277 citations); `Claude-User`/`Claude-SearchBot` **3/3** content hits = STILL
  test-level. Claude's cite-path never went live. Judge this investigation on content_hits, not raw UA counts, from now on.

- **[OPEN · 2026-08-26 · run 2] Crawler tap is UA-spoofed (a credential scanner).** A scanner sprays secret paths
  (`/.env`, `/.ssh/id_dsa`, `/aws/credentials`, `/Dockerfile`, `/jenkins/.env`, `/proxy`, `/api/*`) while faking
  crawler UAs (Claude-User, Perplexity-User, GPTBot, …), so `ai_crawler_hit` counts by UA are junk. The Aug-26
  "Claude 40/19 surge" was 37+16 spoof, 3+3 real. **Content-path filter is now mandatory (§C).** Real picture:
  ChatGPT-User 277 content hits; all others near-zero. Static export leaks nothing (probes 404), but the active scan
  is worth a security note. Next: consider content-filtering the tap itself and/or a WAF rule; keep reading content_hits only.

- **[WATCH · 2026-08-26 · run 2] New pain-point articles + embed analytics.** 3 articles shipped + Request-Indexed
  today (why-cant-i-sing-high-notes / why-does-my-recorded-voice-sound-bad / why-do-i-sing-flat) — first content
  inflow lever. In-article `EmbeddedExercise` now fires `embed_exercise_played` + `embed_exercise_open_full`
  (article→app conversion), on Learn + spotlights. No data yet (just deployed). Watch first plays + whether the new
  pages enter Bing's cited pool (currently the 4-page surface is /learn/ hub 124, sovt 40, home 21, spotlights).

- **[OPEN · 2026-08-26] Bing indexation + AI grounding (NEW ground truth — Bing Webmaster Tools).** BWT *is* set up
  (verified `vocalhabit.com` property; also holds gradical.app — switch property before reading). This is the
  upstream view for ChatGPT+Copilot (both Bing-backed) we'd been blind to. First read:
  - **Search Performance:** 908 impressions / 11 clicks (last ~30d) — Bing indexes & serves us far more than GSC shows.
  - **AI Performance (Copilot + partners, 3-mo):** **277 total citations, avg 4 cited pages.** Far more citations than
    Ahrefs' sampled "Copilot 5"; confirms the narrow-page-surface finding from Bing's own data. Citations ticking up
    Aug 21–24; cited-pages nudged to ~7 recently.
  - **Top cited PAGES:** `/learn/` hub **124**, `/learn/sovt-exercises` 40, `/` 21, `/artists/freddie-mercury` 19,
    `/artists/chappell-roan` ~10. Artist spotlights ARE getting cited — validates that content type.
  - **Top grounding QUERIES:** "learn to sing online free" **44 (23.7% share)**, "best free online singing course" 20,
    "free singing lessons for beginners" 19, "learn to sing" 8. Citations are driven by **free/online/beginner
    learn-to-sing intent** (AI recommends us as a free tool), NOT by technique or pain-point articles (sovt is the
    lone technique exception).
  - **Indexation audit:** most pages indexed fine (`chest-voice-exercises`, `chappell-roan` = "Indexed successfully").
    The lone straggler was **`/learn/why-does-my-voice-crack`: "Discovered but not crawled — URL cannot appear on
    Bing"** (discovered via IndexNow Aug 24, never crawled). **→ Requested indexing manually (Aug 26); quota 100/day.**
  - **Takeaways:** (1) indexation is NOT the main citation blocker — most content is indexed; getting cited is about
    answer-fit/authority. (2) The **/learn/ hub is our single biggest cited asset** (124) on "learn to sing free"
    intent. (3) DR 0 is flagged by BWT itself ("not enough inbound links from high-quality domains") — the real lever.
  - Next: **request-indexing on every new publish** (voice-crack proved IndexNow-discovery ≠ crawl for brand-new URLs);
    lean pain-point articles toward the proven "free/beginner/how-do-I" framing; check AI Performance weekly.

- **[OPEN · 2026-08-20] `/learn/sovt-exercises` entry growth.** Entries grew ~2 → 24 — **real**. The 27-min Ahrefs
  avg dwell is a **measurement artifact** (PostHog session-span: 12s median, 3.3min max) — idle left-open tabs
  inflating Ahrefs' mean, not deep reading. Real question: which channel drives the *entry* growth, and can we
  replicate it. Corollary: **distrust Ahrefs session-duration generally** — cross-check dwell against PostHog.

- **[PRIMARY · 1A · 2026-08-22] Inflow — grow citations & referrals.** Co-equal with retention (1B); actively
  being worked, NOT settled. Flat now (~16 ChatGPT ref/day, ~33 citations) with no organic flywheel — citations
  don't compound from clicks — so growth comes from INPUTS we ship: more indexed answer-content (query coverage),
  real authority (legit backlinks / brand mentions; DR is 0), primary-source assets, Bing indexation. Baseline
  (Aug 22): ChatGPT 33 cites / 4 pages · Copilot 5 / 3 · others 0 · ~16 ChatGPT ref/day · DR 0 · branded search
  "vocal habit" 14 clicks / 15 impr / pos 2 (Google — understates vs Bing). Lever gauges to track each run:
  citations-per-page, referral rate, branded-search growth.
- **[PRIMARY · 1B · 2026-08-22] Retention — do they stick & deepen.** Co-equal with inflow (1A). Growth =
  inflow × retention × word-of-mouth; with inflow flat, retention decides whether the trickle compounds.
  **Success criterion (Ryan): we're healthy iff BOTH
  (a) returning-session volume per week AND (b) depth per returning visit are rising.** A steady trickle into a
  bucket that holds is fine; a leaky bucket is not. Baselines (Aug 22): depth = **2.10 practice-starts / returning
  visit** (vs 1.16 new), rising 1.89→2.10; returning = **21%** of tagged pageviews. Measure as **per-week rates**,
  never cumulative. Depth metric = practice-starts/visit (logging is opt-in; regulars skip it, so logged/visit
  understates depth). Caveats: localStorage proxy is a per-device floor; true person-level retention isn't
  available cookieless. WoM proxy to stand up: branded-search ("vocal habit") growth in GSC/Bing.
  **⚠ Metric caveat (Ryan, Aug 24) — the returner definition is muddy.** `returning`/`visitNumber` count *site*
  visits, so the cohort conflates genuine tool-returners with first-time-tool users on site-visit 2 (e.g. read a
  Learn article, then tried the tool). Exercise completion by visit depth is 39%→50%→62% (visits 1→2→3) — the
  right direction, but n collapses (198/34/21), so directional only.
  **✅ FIX SHIPPED (PR #19 `feat/practice-counters`, merged + deployed 2026-08-24).** `lib/analytics/practiceCounters.ts`
  stamps `practiceNumber` / `hasPracticedBefore` on practice_started + pattern_completed, and `finishNumber` /
  `hasFinishedBefore` on true completions (completedAllKeys). Verified live in the prod bundle; property present on
  practice_started from Aug 24 (11/45, mid-day deploy) and **100% from Aug 25 (9/9)**. First read (n≈20, directional
  only): practiceNumber tail already reaches #9; hasPracticedBefore=true 15 starts / 5 ppl vs false 5 / 5.
  **Now measure 1B depth/completion on `practiceNumber` (genuine practice-returners), not `visitNumber`** — needs
  ~a week of accumulation before the 2nd+-practice cohort has usable n. Until then 1B stays directional on the
  site-visit proxy, but the honest metric is finally instrumented.

- **[WATCH · 2026-08-20] ChatGPT activation floor.** ~25% of ChatGPT arrivals start practicing / ~22% reach
  scoring (floors vs Ahrefs' ChatGPT visitor count). Strong for cold referral. Watch for drift up or down.

- **[RESOLVED · 2026-08-21] `untagged` events.** Was ~15% (87 pv) but all confined to the launch days
  (Aug 13–16); week 2 has **0 untagged**. Early-days artifact (pageviews before the super-property registered),
  now clean — not a growing problem.
- **[WATCH · 2026-08-21] Funnel deepening.** Per-day W1→W2: practice +19%, scoring +34%, logged +80% while
  pageviews held flat. Watch whether it holds as W2 fills (currently 2 of 7 days). Persisted in `weekly-snapshots.md`.
- **[OPEN · 2026-08-21] Re-aim onboarding pacing.** Drop-off is front-loaded (18 of 28 skippers bail at the first
  two steps), NOT at the late steps — so pacing isn't a drop-off fix. But steps 4–5 (Import, Song-segment) teach
  features with 5 opens / 0 song-saves. **Shipped Aug 22 to prod (PR #13):** voice → step 0 + default tenor→alto.
  Next: defer Import/Song-segment intros to a return visit; analyze onboarding funnel by `stepKey` (indices shifted).
- **[OPEN · 2026-08-22] Direct-traffic surge — bots?** W2 (Aug 20–22) direct = 51 visitors at **96% bounce, 0s
  avg session** — smells like a bot/spam wave or a burst of referrer-stripped junk, not real visitors. It dragged
  cumulative LLM share from ~52% to ~49%. Next: break `$direct` down by UA / `$virt_is_bot` / geo; don't count it
  as growth until characterized. **Update Aug 25:** persists — W2 (Aug 20–24) direct = **69 visitors at 94% bounce**,
  now roughly equal to LLM (72) and holding LLM share down to 44%. Still uncharacterized; still don't count as growth.
  **Update Aug 26:** persists — W2 (Aug 20–26) direct = **81 visitors at 93% bounce**; cumulative direct 130 @ 90%
  (+9 since last run). Holds W2 LLM share to ~50%. Still uncharacterized — break down by UA / bot flag / geo.

- **[WATCH · 2026-08-24] Organic / community mentions (WoM).** As the user base grows, public mentions — Reddit
  especially — are the leading sign word-of-mouth is taking hold, and a more public organic-mention venue than
  branded search. Track each run: reddit.com / HN / forum referrers in Ahrefs Web Analytics + a
  `site:reddit.com "vocal habit"` / `"vocalhabit.com"` sweep. **Baseline Aug 24: 0 Reddit mentions.** Pairs with
  branded search as the WoM gauge on the retention→growth path. Evaluating a metered tool-gateway (see below) for
  proper social listening. **Update Aug 26: still 0** — no reddit/HN/forum referrers in Ahrefs; `site:reddit.com`
  sweep empty. First artist-spotlight page (`/artists/chappell-roan`) drew its first 2 AI-referred entries.

## Findings (newest first)

### 2026-08-26 · product deep-dive (scoring realness + Guided mode)
- **First-party data is REAL — score distribution proves it.** 201 scored completions (meanAccuracyPct on
  `pattern_completed`, flowing since Aug 15): mean 55.5%, median 57%, p25–p75 = 36–78%, only 6/201 at exactly 0.
  A smooth human skill-curve, not a bot/silence spike at 0. Granting a mic + singing a pitch-matched pattern is the
  hardest thing to fake and the least worth faking — the trustworthy layer is trustworthy.
- **Grading was beginner-harsh → softened (code, pending deploy).** The `accuracyPct` is "% of frames within ±50¢
  of target" (time-on-pitch), NOT a grade — but a bare "57%" reads like an F. Fixes: (1) widened color bands to
  green ≤50¢ / yellow ≤100¢ / red >100¢ (unified `tone-utils` with `NoteResultsStrip`; DESIGN.md's own labels:
  green "in tune", yellow "close call", red "clearly off"); (2) the post-session badge now shows **avg ±X¢ off pitch**
  (the tuning metric) instead of a percent.
- **Guided (slow drill) mode was UNINSTRUMENTED — now fixed.** `GuidedSession` had zero `track()` calls, so the
  "0 guided / 488 standard" split was a blind spot, not proven zero use. Wired `practice_started` + `pattern_completed`
  with `mode:'guided'` (+ practiceNumber/finish counters). From next deploy we can finally see slow-mode usage and
  scoring. **Open:** nudge struggling beginners (high cents-off / low accuracy) toward Guided; measure conversion.

### 2026-08-26 · run 2 (PM)
- **Crawler tap is spoofed — major correction.** A credential-scanner fakes crawler UAs to hit `/.env`, `/.ssh`,
  `/aws/credentials`. Content-path filter: **ChatGPT-User 277 content hits is the ONLY real retrieval** (matches
  Bing's 277 citations); Claude 3/3, GPTBot 0, Perplexity 1. The 446/72/70 counts we'd been tracking were
  spoof-inflated. Crawler signal is content-filtered from now on (§C updated).
- **Claude never went live** — the Aug-26 "Claude 40/19 surge" was the scanner, not Anthropic. Genuine Claude
  retrieval still 3/3. Three sources agree (Bing, Ahrefs-via-Brave=0, content-filtered tap): ChatGPT is the engine.
- **Bing AI Performance is now a standing sweep step (§A4b)** — 277 real citations / ~4 pages, grounding on
  free/beginner "learn to sing free/online/course" intent; top page the /learn/ hub (124). Ahrefs' 38 samples the same.
- **3 pain-point articles shipped + Request-Indexed today** (first content inflow lever); in-article exercise
  instrumented (`embed_exercise_played` / `_open_full`), awaiting first data.
- **Same-day deltas otherwise flat:** Ahrefs byte-identical to the AM run (its own refresh lag); 1B retention steady
  (returning browse ~43% deeper, 3.05 vs 2.13 pv). Dashboard redeployed in place (same URL, run-2 content).

### 2026-08-26
- **1B (retention) PASSING — 4th run running.** Both bars up again: returning practice-starts **12.3→13.9/day
  (+13%)**, depth **2.32→2.49** practice-starts/returning visit, and returning **share recovered** 20.2→**23.0%**.
  Returning browse **39% deeper** (3.05 vs 2.20 pv/visit) and start **~150% more** practice/visit (2.49 vs 0.98).
  Untagged still 0.
- **Practice-returner counter is now READING** (Aug 24+ tagged window): repeat-practice starts already outnumber
  first-timers **27 vs 9**, `practiceNumber` tail reaching **#11**. Directional (n small) — a clean 1B depth/completion
  cut on genuine practice-returners is ~a week of accrual out, but the honest metric is confirmed live.
- **1A (inflow) still FLAT** — citations unchanged (ChatGPT 33/4pg, Copilot 5/3pg, others 0), branded search
  "vocal habit" pos 2 (8 clicks / 10 impr this window), DR 0, **0 Reddit mentions**. No lever shipped yet.
- **Anthropic still scraped-not-recommended** — `Claude-SearchBot`/`Claude-User` **3/3** (+1 User hit only), no real
  crawl 6 days post-allow, while `ChatGPT-User` retrieval climbed **393→446 (+13%)**. Zero-click retrieval rising;
  human referrals flat ~18/day.
- **Funnel deepening softened but holds** (6 full days of W2) — per-day vs W1: practice **+14%**, scoring **+23%**,
  logged **+100%**; pageviews flat (75→75/day). Logging doubled; engagement still outpacing traffic.
- **Direct surge persists** — cumulative direct 130 @ 90% bounce (+9); W2 81 @ 93%. Still open.
- **First artist-spotlight entries** — `/artists/chappell-roan` drew 2 AI-referred entries this window (new content
  type live). `/learn/chest-voice-exercises` holds as #3 Learn entry (11). Aug 23 remains biggest day (115 pv).

### 2026-08-25
- **1B (retention) still PASSING** — both bars up again: returning practice-starts **~10.9→~12.3/day (+13%)**,
  depth **2.14→2.32** practice-starts/returning visit. Returning still browse **34% deeper** (3.16 vs 2.36 pv/visit)
  and start **~110% more** practice/visit (2.32 vs 1.11) than new. Returning share dipped 22.5→**20.2%** — dilution
  from a new-visitor week, not fewer returns (returning volume rose). Untagged still 0.
- **✅ Practice-session counter is LIVE (PR #19, shipped Aug 24) — I mis-reported it as pending last run.**
  `practiceNumber` / `hasPracticedBefore` / `finishNumber` now stamp practice events; 100% coverage from Aug 25.
  This retires the "returner def is muddy" blocker — from next week, cut 1B depth/completion on `practiceNumber`
  (genuine practice-returners) instead of the `visitNumber` site-visit proxy. First read is n≈20 (directional only).
- **1A (inflow) still FLAT** — citations unchanged (ChatGPT 33/4pg, Copilot 5/3pg, others 0), branded search
  "vocal habit" steady at pos 2, DR 0. No lever shipped yet. **Anthropic still scraped-not-recommended:**
  `Claude-SearchBot`/`Claude-User` frozen at 3/2 (test level) 5 days post-allow, while `ChatGPT-User` retrieval
  climbed 350→**393 (+12%)**. Zero-click retrieval rising; human referrals flat ~14–16/day.
- **Funnel deepening holds at 5 full days of W2** — per-day vs W1: practice **+23%**, scoring **+30%**, logged
  **+96%**; pageviews now also up **+9%** (75→82/day). Engagement still outpacing traffic.
- **Direct surge persists** — W2 direct 69 @ 94% bounce, ~equal to LLM (72); LLM share held down to 44%. Still open.
- **`/learn/chest-voice-exercises` breaking out** — 11 entries this window, new #3 Learn entry page (after
  homepage 134 and sovt-exercises 41). Second content entry point worth watching.
- **Aug 24 solid** (79 pv / 45 practice / 15 logged); Aug 23 remains the biggest day (115 pv / 47 practice).

### 2026-08-24
- **1B (retention) is PASSING its bar** — both metrics rising: returning practice-starts **~7.75→~10.9/day
  (+40%)** week-over-week, and depth **2.14** practice-starts/returning visit (↑ 1.89→2.10→2.14). Returning
  share 21→**22.5%**. This is the win condition being met.
- **1A (inflow) is FLAT** — citations ~32 (from 33/34; noise), ChatGPT referrals steady ~16/day, branded search
  "vocal habit" unchanged at **14 clicks / pos 2**, DR still 0. No inflow lever has shipped yet, so flat is
  expected — not a failure, just no experiment run. Anthropic **still scraped-not-recommended**: `Claude-SearchBot`
  flat at test level 4 days on, while `ChatGPT-User` climbs 310→350 (retrieval up, not referrals).
- **Funnel deepening continues** (4 days of W2): per-day practice +22%, scoring +31%, logged +88% vs W1.
- **Direct surge persists** — 119 visitors at 90% bounce; still bot-like, investigation still open.
- **Aug 23 was the biggest day yet** (115 pageviews, 47 practice starts).

### 2026-08-22
- **Funnel deepening holds** at 3 days of W2: per-day practice +17%, scoring +27%, logged +72% vs W1, pageviews
  flat (~75→72/day). Real, sustained — engagement rising faster than traffic.
- **Returning engagement gap is widening** — returning now browse ~33% deeper (3.34 vs 2.51 pages/visit) and
  start ~81% more practice/visit (2.10 vs 1.16), up from +23%/+50% a day ago. The cohort matters more with volume.
- **Still scraped, not recommended** — ChatGPT-User crawler exploded (159→310); Anthropic's `ClaudeBot` (training)
  grew to 70, but `Claude-SearchBot`/`Claude-User` haven't fired for real since our Aug 20 test. Claude has still
  not recommended us to anyone.
- **Direct-traffic surge looks like junk** — W2 direct 51 at 96% bounce / 0s sessions; opened an investigation.
  Cumulative LLM share dipped to 49% purely from this dilution (LLM itself flat at ~16/day).
- **Shipped to prod:** onboarding voice-first + alto default (PR #13); analytics skill + logs (PR #14).

### 2026-08-21
- **Onboarding is bimodal, not leaky** — 71% finish all 6 steps; 29% skip and bail immediately (avg step 1.5),
  no mid-funnel drop-off. Voice is load-bearing: 69% pick, and **74% of pickers choose a non-default voice**
  (alto 39% > tenor 26% > baritone 23% > soprano 13%). Import/Song-segment steps teach near-unused features
  (5 import opens, 0 song saves in 9 days). **Shipped:** default tenor→alto; voice moved to step 0 (gates Next).
- **Funnel is deepening.** Per-day W1→W2: practice **+19%**, reached-scoring **+34%**, logged **+80%** while
  pageviews held flat (~75→73/day). Engagement rising faster than traffic. (W2 = 2 of 7 days; confirm as it fills.)
- **ChatGPT activation holding** — cumulative floors ~26% start / ~22% scoring / ~12% logged (37/32/17 of 142
  Ahrefs ChatGPT visitors). Not drifting.
- **`untagged` resolved** — 87 pv all in launch days; week 2 is 0 untagged. Returning cohort data is clean now.
- **Still scraped, not recommended** — `ChatGPT-User` climbing (126→159, real OpenAI end-user serving);
  `ClaudeBot` +2 (training only); `Claude-SearchBot`/`Claude-User` flat at test levels. Perplexity/GPTBot quiet since Aug 20.
- **Returning share fell 30%→14%** — but that's **dilution from a new-visitor surge** (162→305 new pv), not
  fewer returns (69→49). Returning still browse ~23% deeper and start ~50% more practice/visit.
- **Set up the persistent view** — `analytics/weekly-snapshots.md` (7-day buckets + point-in-time snapshots) and
  the dashboard trend now accumulates from launch instead of a rolling 7-day window.

### 2026-08-20
- **Returning visitors are meaningfully more engaged** than new ones: 3.5 vs 2.66 pages/visit, and 2.17 vs 1.24
  practice-starts per visitor-day (~75% higher). First real read on the returning feature — positive.
- **Claude has SCRAPED us but not RECOMMENDED us yet.** `ClaudeBot` (training) 39 hits is real — but training
  ≠ end-user citation (direct analog to `GPTBot` 33). The recommendation path — `Claude-SearchBot` (index) +
  `Claude-User` (a real question pulling the page) — is still ≈ our 5 setup tests. Nuance: `ClaudeBot` was
  already allowed *before* our robots.txt change and feeds *future* models, so it won't drive near-term recs; the
  `Claude-SearchBot`/`Claude-User` path we just enabled is the one to watch. Contrast: OpenAI is already serving
  end users (`ChatGPT-User` 126, `OAI-SearchBot` 37), not just training.
- **AI-crawler tap live** (`netlify/edge-functions/ai-crawler-tap.ts`): first-day landscape — ChatGPT-User 126,
  PerplexityBot 39, ClaudeBot 39, OAI-SearchBot ~36, GPTBot 33.
- **LLM still the #1 channel** — 128/243 visitors (53%), 2.8:1 over search; ChatGPT ≈ 99% of LLM.
- **`/learn/sovt-exercises` entries grew ~2→24** (real) — but its 27-min Ahrefs dwell is an idle-tab artifact
  (PostHog: 12s median). Lesson banked: Ahrefs session-duration ≠ real engagement; cross-check against PostHog.
- **Citations:** ChatGPT 33 across 4 pages, Copilot 5 across 3; Perplexity/Gemini/Google/Grok 0.
- **Infra shipped:** Claude crawlers allowed in robots.txt; 4 URLs submitted to Brave; crawler tap deployed.
