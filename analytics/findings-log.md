---
dashboard_url: "https://claude.ai/code/artifact/0be8ed29-bc50-4925-9895-38e45607829e"   # every daily run re-publishes to this same URL (pass as `url`)
last_run: 2026-08-24
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
  as growth until characterized.

## Findings (newest first)

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
