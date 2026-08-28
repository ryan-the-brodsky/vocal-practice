# Session Handoff — vocalhabit growth/analytics (as of 2026-08-24)

Read this + `analytics/findings-log.md` + `analytics/weekly-snapshots.md` to resume. This is the "clear
context and keep going" brief. Everything below is the real state, not aspiration.

## The strategic frame (don't re-derive)
Two **co-equal** growth bets, tracked honestly:
- **1A · Inflow** — citations / AI referrals / branded search / community mentions. Currently **flat** (~16
  ChatGPT referrals/day, ~32 citations, DR 0). No organic flywheel from citations; growth here needs **content
  coverage + authority**, not clicks. Anthropic still **scraped-not-recommended** (ClaudeBot crawls; Claude-User/
  SearchBot flat since our Aug-20 test).
- **1B · Retention** — do returning users stick & deepen. Health bar: returning-session **volume/week** AND
  **depth/visit** both rising. Status: **directional, NOT confirmed** — the `returning` flag counts *site* visits,
  which conflates genuine tool-returners with Learn→tool first-time practicers. The fix is shipping (see below).

**Discipline (enforced in the skill + dashboard):** *cumulative ≠ growth* — always report per-day/per-week
rates, never let a rising total read as momentum. Separate *retrieval* (crawler hits) from *human referrals*.

## Living assets
- **Dashboard** (data-driven, source in repo): `analytics/dashboard.html` → published at
  https://claude.ai/code/artifact/0be8ed29-bc50-4925-9895-38e45607829e . To update: edit the `D = {…}` object at
  the top, re-publish to that same URL. URL is stored in `findings-log.md` frontmatter.
- **`analytics/findings-log.md`** — investigations (1A, 1B, direct-surge, Claude-citations, WoM/mentions,
  onboarding-pacing) + dated findings. **`analytics/weekly-snapshots.md`** — week-over-week + point-in-time snapshots.
- **Skills:** `analytics-report` (daily sweep → refreshes dashboard + log; project-level), `content-fact-check`
  (adversarial gate), plus USER-LEVEL `~/.claude/skills/pain-point-research` (voice-of-customer → ranked
  content/product opportunities; iterated this session with first-party metrics, competitor-review mining, a
  no-first-party-data mode, and "dedup against the real inventory, not the citation list").
- Credentials for user-level skills live in **`~/.claude/.env`** (chmod 600; documented in `~/.claude/CLAUDE.md`).

## Shipped this session
- Onboarding **voice-first + alto default** (PR #13, deployed + browser-verified).
- **AI-crawler edge tap** → PostHog `ai_crawler_hit` (earlier); robots.txt allows Claude crawlers; 4 URLs submitted to Brave.
- Analytics system committed (PRs #14, #15).
- Data-driven dashboard in repo (PRs #16, #17 fix).
- **NEW Learn article "Why Does My Voice Crack When I Sing?"** — PR #18 **MERGED + DEPLOYED + VERIFIED LIVE**
  (HTTP 200, 69 KB real static HTML, title + JSON-LD flushed, in production sitemap → IndexNow pinged Bing).
  Scaffolded from our own vetted articles (6/9 sources reused), passed content-fact-check + anti-slop; verdicts
  in `seo/voice-cracks-content-sources.md`. URL: vocalhabit.com/learn/why-does-my-voice-crack

## In flight (verify these first on resume)
1. **`feat/practice-counters` — PR #19, OPEN + MERGEABLE, reviewed and ready.** The subagent shipped it (opus,
   worktree): `practiceNumber`/`hasPracticedBefore` on `practice_started`, `finishNumber`/`hasFinishedBefore` on
   `pattern_completed` (finish only when `completedAllKeys===true`), localStorage like `visits.ts`, no-op native
   stub, 11 new tests, `tsc` clean, 768 pass. I reviewed `practiceCounters.ts` — clean, fails safe, SSG-guarded.
   **The auto-merge was blocked by the classifier, so it's left for your explicit merge.** `gh pr merge 19
   --squash --delete-branch`. This is the fix that turns 1B retention from "directional" into a clean
   genuine-tool-returner metric — merge it, let it collect ~a week, then re-cut retention on `practiceNumber ≥ 2`.
2. **Uncommitted working-tree edits** (deliberately not in PR #18): the `findings-log.md` 1B metric-caveat
   correction, `.claude/skills/analytics-report/SKILL.md` A6 community-mentions step, and the user-level
   pain-point-research skill iterations (user-level, separate from the repo). Commit the two repo ones next.


## Competitive + niche-profile thread (2026-08-27, Fable session; pick up from these docs, not from memory)

- **Why singing wins ChatGPT citations at DR 0, and how to find the next niche:** `seo/niche-replication-profile-2026-08.md`
  (90-domain Ahrefs calibration; §7 = the broad non-music sweep; two load-bearing traits: the model *searches*
  for the question and the skill is video-native so the text web is thin).
- **Direct test on the model:** `seo/chatgpt-citation-behavior-test.md` (protocol + 21-prompt Chrome pilot in §7:
  phrasing is the switch; "how do I / why does my" never searches, "best free way to learn X online" does;
  raw rows in `seo/data/chatgpt-citation-pilot-2026-08-27.jsonl`). Next: put more niches through it.
- **Competitors:** `seo/competitors.md` (baseline table) → `seo/citation-brokers-and-vosci.md` (VoSci profile,
  history, pivot, tool fingerprint, aggregators as citation brokers that pass no links) →
  `seo/vosci-content-audit.md` (his 31 articles vs our 25, measured; topic gaps; the "apps miss the point"
  argument to answer) → `seo/data/vosci-references-2026-08-27.md` (58 leads, verify-then-cite).
- **DONE 2026-08-27: plain-language editorial pass on all 25 Learn articles** (Workflow wf_18497462-c29, 25 Opus editors +
  25 Sonnet verifiers, 0 errors). Corpus went from avg 19.9 → 14.0 words/sentence and 24.7 → 9.7 jargon/1k, length
  +7%; Sources, frontmatter, FAQ headings and exercise markers verified byte-preserved per article; body prose has 0
  em dashes; 16 metaDescriptions and 4 marker labels de-dashed afterwards. `learn:gen` ok, `tsc` clean, 770 tests
  pass. **Uncommitted in the working tree, awaiting Ryan's review + commit** (`git diff --stat -- content/learn`).
  Brief: `seo/plain-language-pass-brief.md`; baseline: `seo/data/plain-language-baseline-2026-08-27.json`.
- **TODO found during the pass: we cite the competitor.** Seven Learn articles list VoiceScience.org lexicon/article
  pages in `references:` + `## Sources` (head-voice, belting, chest-voice x2, vibrato x2 plus a prose mention
  "Titze and voicescience.org also summarize", how-to-increase-vocal-range/passaggio, vocal-resonance x3,
  why-does-my-voice-crack/voice-change-in-boys), and two spotlight source docs (Ariana Grande, Freddie Mercury)
  do too. Those are followed outbound links handing him authority from our own pages. Replace each with the
  primary paper (leads in `seo/data/vosci-references-2026-08-27.md`; Björkner 2008 is already cited alongside)
  and re-run `content-fact-check`. Also: 4 pain-point metaDescriptions exceed 165
chars (why-cant-i-sing-high-notes 183, why-do-i-sing-flat 200, recorded-voice 222, voice-crack 184); trim.
- **Analytics coverage audit (2026-08-27, PostHog project 556732 confirmed):** `$pageview` fires on every
  route change (`capture_pageview: 'history_change'`), so Learn/spotlight/range-test arrivals are covered.
  `embed_exercise_played` is LIVE in production (first events 2026-08-27, surface=learn, slug=chest-voice-exercises);
  `embed_exercise_open_full` is wired (EmbeddedExercise.tsx:119) but has never fired yet. Spotlights pass
  `surface="spotlight"` through SpotlightDrill, so they are covered by the same two events. **Not instrumented
  at all:** Plan tab (browse, "Add to routine"), Progress tab (sparkline expands, "Coach this" is covered via
  coaching_started), PathwaysCard "Practice this path" (calls saveRoutine directly, bypasses routine_edited),
  TodayRoutineCard item taps, TempoControl, octave selector, HeadphonesBanner "continue without", backup
  export/import, LearnHub search/category chips. Candidate next events: `pathway_selected`, `plan_exercise_added`,
  `tempo_changed`, `octave_shift_set`, `headphones_skipped`.
- **Queued product ideas from VoSci:** loudness axis on the range test (we already have `rmsDb`), adaptive
  routine sequencing, glossary of 100-150 `DefinedTerm` pages, Help Scout Beacon-style feedback widget,
  teacher/studio tier as the validated monetization wedge. Listing actions: AlternativeTo (self-serve),
  Class Central (email contact@classcentral.com as an independent provider), Product Hunt.

## Next recommended actions (priority order)
1. **Merge the practice-counters PR**, then re-cut the 1B retention read on genuine tool-returners (completion +
   depth among `hasPracticedBefore=true` / `practiceNumber ≥ 2`). This answers the mid-exercise-abandonment
   question properly (new-user 39% completion is mostly curiosity; watch *returner* completion).
2. **Title/framing audit (highest-leverage inflow play).** We have 22 solid Learn articles but ~12 get cited;
   the voice-cracks case proved why — they're titled by *technique* (mix voice, SOVT, passaggio), not the
   *question* a singer Googles. Map all 22 to real user-question phrasings (from the pain-point run + PAA) and
   flag mismatches; add question-framed entry points or FAQ hooks that funnel to the deep content. This can lift
   citations library-wide without new research.
3. **Diagnose why `how-to-sing-in-tune` (good, question-titled) isn't cited** — indexing / freshness / losing to
   bigger domains. Check Bing Webmaster AI Performance + Brave index inclusion.
4. **Daily analytics sweep** (`analytics-report` skill) — keep the streak; once counters land, add the genuine-
   returner completion line and the community-mentions/branded-search gauges.
5. **More question-framed articles** from the pain-point table only where a genuine gap exists (dedup against
   `content/learn/*.md` — most topics already exist; the win is reframing, not net-new).
6. **Onboarding/default-experience:** ng-siren + hum are canonical warm-ups but under-surfaced; almost nobody
   edits their routine (routine_edited=6), so the default routine carries the whole first experience — worth tuning.

## Gotchas / hard-won facts
- **PostHog:** ALWAYS `switch-project {projectId: 556732}` before querying (account-global, drifts to Gradical 558041).
- **Cookieless:** no true cross-day person-level retention; `returning`/`visitNumber` are localStorage per-device
  floors and count *site* visits (hence the practice-counter fix).
- **Reddit API is a dead end for us:** Devvit is for in-Reddit apps; the Data API is approval-gated,
  non-commercial-only, and being wound down. Use open web + competitor reviews, or a paid 3rd-party Reddit API.
- **No `deep-research` skill exists** — the real research harness is opus agents + WebSearch/WebFetch + `content-fact-check` + `seo/content-style-guide.md`.
- **Ahrefs dwell is idle-tab inflated** — ignore "avg session"; cross-check against PostHog event-span.
- **Article publish flow:** write `content/learn/<slug>.md` (frontmatter mirrors an existing one) → `npm run
  learn:gen` → `npm run seo:sitemap` → PR → merge (Netlify deploy fires IndexNow). Fact-check verdicts go in `seo/<slug>-content-sources.md`.
- **Ship gate:** always `curl` production after deploy — "committed ≠ shipped" has bitten repeatedly.
