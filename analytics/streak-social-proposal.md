# Proposal — Streaks & Social Sharing as retention/growth levers (2026-08-24)

Light research + proposal, requested alongside the practice-counter retention work. Companion to
`HANDOFF.md` (1B retention) and `findings-log.md`. **This is a proposal, not a plan of record** —
nothing here is scheduled until we've measured that streaks correlate with return (see Track A0).

## TL;DR
- We already compute a **daily streak** (`currentStreak()` in `lib/progress/stats.ts`) but it's
  under-surfaced (one small pill in the *desktop* console), **uninstrumented** (no analytics event —
  we can't prove it does anything), and has **no milestone or grace mechanic**.
- The single highest-leverage first move is **instrumenting the streak** (attach it to
  `practice_started`/`pattern_completed`, same emit-time pattern the practice-counters PR just used).
  That lets us answer "do streak-holders come back and finish more?" *before* we build celebration UI.
- For growth from a small base, the **only account-free viral loop available to us is a shareable
  result card** (canvas → PNG, no backend). The **Vocal Range Test result** is the best surface —
  it's already our top marketing/LLM-recommended page, and a shared range card links straight back to it.
- **Honest constraint that shapes everything:** no accounts, cookieless, web-only, **no push/reminder
  channel**. The biggest proven streak lever elsewhere is the "your streak will break tonight"
  reminder — and we structurally *cannot send it*. So our streak play is about **on-site salience +
  loss-aversion framing + a shareable artifact**, not notifications. Don't copy Duolingo's playbook
  wholesale; most of it depends on a push channel we don't have.

## The constraints that shape every option (read first)
1. **No accounts.** Nothing is server-side per-user. Streaks and counters live in `localStorage`
   (`SessionRecord`s already do). Fragile: clearing the browser or switching device resets to zero.
   Also means **no leaderboards, no friend graph, no accountability partners** without building auth —
   out of scope for a local-first app.
2. **Cookieless analytics.** PostHog can't identify a person across days; retention is inferred from
   the first-party counters (`visits.ts`, and now `practiceCounters.ts`). Any streak metric we report
   is a per-device floor, same caveat.
3. **Web, no push.** Web Push exists but is unbuilt, heavy, and iOS-Safari-hostile; without accounts
   there's no re-engagement channel at all. **We can't remind a lapsing user.** This kills the
   reminder-driven half of streak retention — plan around it, don't pretend otherwise.
4. **The base is tiny (~390 visitors/30d, ChatGPT-referral-dominated).** Viral math on a small base is
   unforgiving: a shareable card is worth building for the *branding + backlink* value and the option
   value as traffic grows, not because it will 10× us next month. Set expectations accordingly.

## What exists today
- `currentStreak(sessions, nowMs)` — consecutive local-calendar days with ≥1 logged session, alive if
  it reaches today or yesterday. Pure/tested (`lib/progress/__tests__/stats.test.ts`).
- Surfaced **only** as an "N day streak" pill in the desktop command-console "Last time" panel
  (`app/(tabs)/index.tsx` `ConsoleLastTime`). Not on Progress, not on mobile, no post-session moment.
- **No** streak analytics, **no** milestone/celebration, **no** grace/freeze, **no** share anywhere
  (the `share` grep hits are OG-meta and substrings — there is no user-facing share feature).

---

## Track A — Streaks (retention)
Tiered so each rung is independently shippable and earns the next. **Do A0 before anything visual.**

### A0 · Instrument the streak (do first — cheap, unblocks the rest)
Attach the current streak to `practice_started` and `pattern_completed` at emit time — exactly the
pattern PR #19 (`practiceCounters.ts`) just established. New props: `streakDays` (number),
`streakBucket` (`0` | `1` | `2-6` | `7-13` | `14-29` | `30+`, so PostHog breakdowns are clean).
- **Question it answers:** do users with a live streak start more sessions and *finish* more
  (`completedAllKeys`) than streak-0 users — and does that hold among genuine returners
  (`hasPracticedBefore=true`)? This is the empirical case for (or against) investing in streak UI.
- **Effort:** tiny (one import + spread into two `track()` calls). No new storage — reads existing
  sessions. **Infra:** none.
- **Caveat to bake into the read:** streak and completion are both downstream of "engaged user," so
  correlation ≠ the streak *causing* return. Treat A0 as a screen, not proof; the causal test is
  whether *introducing* the milestone/grace mechanics (A2/A3) moves returner completion.

### A1 · Surface it where the habit forms
- Add the streak to **Progress** (top of the summary card) and to the **mobile** layout (today it's
  desktop-console-only), and show a **post-session** streak beat ("🔥 3-day streak — come back
  tomorrow to make it 4") in the Standard-mode completion panel. Loss-aversion framing ("keep it
  alive"), not vanity.
- **Effort:** small (reuse `currentStreak`, DESIGN.md tokens — read it first). **Infra:** none.
- Research anchor: a *visible* streak surface (Duolingo's streak widget) drove ~+60% commitment; the
  lever is salience at the decision moment, which for us is Progress + the post-session moment.

### A2 · Milestones + celebration
- Fire a one-time celebration at 3 / 7 / 14 / 30 / 100 days (the 7-day mark is where loss aversion
  measurably kicks in). Each milestone is the natural **hook into Track B's share card**.
- New event `streak_milestone` (`days`, `bucket`) so we can see reach.
- **Effort:** small–medium. **Infra:** a `localStorage` "last milestone celebrated" marker so it fires
  once. **Infra:** none beyond that.

### A3 · A grace mechanic (the account-free "streak freeze")
- Duolingo's Streak Freeze cut at-risk churn ~21% — but theirs is a currency tied to reminders. Our
  version has to be **automatic and forgiving** because we can't remind: e.g. one missed day doesn't
  break the streak (a built-in one-day cushion), or an explicit "freeze" the user can bank.
- **Decide with A0/A2 data, not now.** A too-generous grace makes the streak meaningless; too strict,
  and a no-reminder app breaks streaks users never got a chance to save. Needs a small experiment.
- **Effort:** medium (changes `currentStreak` semantics + tests). **Infra:** none.

---

## Track B — Social sharing (growth / the viral loop)
With no accounts, the **only** viral loop is "user exports an artifact that carries the brand + a link
back." That's the Strava-summary / Duolingo-milestone-post pattern, adapted to no-backend.

### B1 · Shareable result card (canvas → PNG), starting with the Range Test
- Generate a branded card **client-side** (`<canvas>` → `toBlob` → `navigator.share` on mobile /
  download + "copy image" on desktop). No server, no account, self-contained — fits the static-export
  + CSP posture.
- **Best first surface: the Vocal Range Test result** ("My range: E2–C5 · Baritone — vocalhabit.com").
  Rationale: it's already our top LLM-recommended / marketing page, the result is *identity-shaped*
  (people share their voice type), and every share is a branded backlink to the exact page we want
  ranked. Second surface: **streak milestones** (A2) and **personal-best** moments.
- New event `result_shared` (`surface: range_test | streak | personal_best`, `method: web_share |
  download | copy`).
- **Effort:** medium (one reusable card renderer + share util; the range test already computes the
  payload). **Infra:** none. Note the artifact-CSP lesson from CLAUDE.md if any of this ever lands in
  an Artifact, but in-app it's just canvas.
- **Reality check:** at ~390 visitors/mo even a great share rate is a handful of shares. Build B1 for
  the **branded-backlink + option value**, and because the range card is genuinely the most
  screenshot-worthy thing we make — not on a promise of near-term viral growth. Revisit priority once
  the base is 5–10×.

### B2 (later) · Only if B1 shows traction
Referral/invite framing, "challenge a friend to beat your range," OG-image polish for the shared link.
All gated on B1's `result_shared` numbers actually being non-trivial. Do not pre-build.

---

## Recommended sequencing
1. **A0 (instrument streak)** — ship with, or right behind, the practice-counters deploy so the
   retention re-cut can include streak-vs-completion from day one. Cheapest, unblocks the decision.
2. **A1 (surface on Progress/mobile + post-session beat)** — low-risk habit salience.
3. **B1 (range-test share card)** — the growth bet; parallelizable with A1, different files.
4. **A2 (milestones)** → hooks into B1's card. **A3 (grace)** and **B2** are data-gated; don't commit.

## What NOT to do (yet)
- No leaderboards / friends / accountability partners — needs accounts; off-strategy for local-first.
- No push-notification reminders — we can't, and half-building it is worse than not.
- No streak currency/economy — over-engineering for the base size.
- Don't let a rising *cumulative* streak count read as growth (the standing dashboard discipline):
  report streak **distribution** (how many live 7+ day streaks *this week*), not a total.

## Open questions for the user
- Appetite for a **grace mechanic** philosophically (forgiving vs. strict streak) given we can't remind?
- Is the **range card** the right first share surface, or would you rather lead with streak milestones?
- Any objection to two small new events (`streak_milestone`, `result_shared`) on the cookieless setup?

## Sources (light research)
- Duolingo streak retention & loss aversion (7-day → ~2.4× next-day retention; widget → ~+60%
  commitment; 600+ streak experiments): [deconstructoroffun](https://duolingo.deconstructoroffun.com/mechanics/streaks),
  [justanotherpm](https://www.justanotherpm.com/blog/the-psychology-behind-duolingos-streak-feature),
  [digia.tech on reminders](https://www.digia.tech/post/duolingo-habit-forming-reminders-retention-architecture/)
- Streak Freeze reduced at-risk churn ~21%: [apptitude teardown](https://apptitude.io/blog/how-duolingos-streak-mechanic-actually-works/)
- Account-free local habit apps share via export, not social graph (Loop):
  [MakeUseOf social habit trackers](https://www.makeuseof.com/best-social-habit-tracking-apps/)
- Shareable-milestone-image as viral loop (Strava summary pattern):
  [Placid — design apps for viral sharing](https://placid.app/blog/design-your-apps-for-viral-growth-with-social-sharing),
  [Tapp — viral loop examples](https://www.tapp.so/blog/viral-loop-examples/)
