# Paced Onboarding Plan — shelved next stage

> Authored 2026-08-14, after the first day of live PostHog data. **Nothing here is built yet.**
> Prerequisite instrumentation is Phase 0 below; the product change is Phase 2.
> Companion context: `CLAUDE.md` §Product analytics, `ROADMAP.md` §Cookieless Product Analytics.

---

## 1. The hypothesis

Today `/onboarding` is a **six-step wall** shown once, on first visit: Welcome → Voice → Routine → Standard-vs-Guided demo → Import intro → Song-segment intro. Every visitor sees all of it before they ever sing a note.

The proposal is to **spread it across visits**:

1. **Visit 1** — strip to the minimum that makes the first practice loop work (voice part, maybe routine). Everything else is deferred. Optimize purely for time-to-first-note.
2. **Visit 2+** — on return, surface one capability at a time. "Did you know you can import a song?" Paced to actual usage rather than dumped up front.

This trades one thing against another, and the trade is genuinely uncertain:

| Front-loaded (today) | Paced (proposed) |
|---|---|
| Communicates full value up front: "this is a real app, worth trying" | Fastest path to the first loop; least friction before the thing they came for |
| Risks people bouncing before they sing anything | Risks people never discovering import / song segments at all |
| One-shot: if they don't return, they at least saw the scope | Depends on return visits, which we currently cannot measure |

**Why it matters now:** in the first 7 hours of analytics, `/onboarding` drew 10 pageviews from 8 people against 13 pageviews on `/` from 8 people. Essentially **every arrival is a first-run user**. Onboarding is not a side path, it is the widest part of the funnel, and until PR #8 it was completely dark.

---

## 2. The measurement problem (read this before planning around visits)

`cookieless_mode: 'always'` identifies people with a **server-side hash over a daily-rotating salt**. The same person on Tuesday and Thursday is two different people to PostHog.

**Consequence: return rate, visit count, and any cross-day cohort are structurally unmeasurable in PostHog as configured.** The entire premise of "pace onboarding to their visit number" is invisible to the analytics that would validate it.

Three ways out:

- **(a) Accept it.** Build paced onboarding on local state, measure nothing across sessions. Cheap, blind.
- **(b) Consent banner.** Switch to `cookieless_mode: 'on_reject'`, get real cross-session identity for those who accept. Costs the banner-free posture that was deliberately chosen, and biases the data toward people who click Accept.
- **(c) Local visit counter as an event property.** ← **chosen.** The app stores a visit count in its own first-party storage (alongside the onboarding flag and practice history it already keeps) and attaches the value to every outgoing event. PostHog still never identifies anyone across days; the *event* simply carries `visitNumber: 3`. Aggregate cohort analysis works, the banner stays gone.

**Honest caveat on (c):** the counter is being added *before* the feature it will drive, so for an interim period it is analytics-motivated storage rather than functional storage. Whether that needs consent is a judgment call, not settled law. Once paced onboarding ships, the counter is unambiguously functional — it is the mechanism. Owner's call; this document does not pretend to legal certainty.

---

## 3. Phase 0 — instrumentation (prerequisite, small)

Ship before any product change, so the baseline is measured against today's front-loaded flow.

**Visit context**, attached to every event as super properties:
- `visitNumber` — 1, 2, 3… incremented once per browser session, not per pageview
- `daysSinceFirstVisit`
- `returning` — boolean convenience

**Feature-discovery events.** Paced onboarding *removes* the only thing that currently surfaces import and song segments. Before deferring that teaching, we need to know whether anyone finds those features unaided:
- `import_opened`, `song_saved` — does anyone discover and complete an import?
- `routine_edited` — does anyone customize their routine?
- `coaching_started` — is the coaching surface ever reached?
- `feedback_opened` — the floating button that is already producing a trickle of responses

**Already shipped in PR #8** and feeding this: `onboarding_finished` with `skipped` + `stepReached`, `pattern_completed` with `completedAllKeys`, `session_logged`, `range_test_started` / `range_test_completed`.

---

## 4. Phase 1 — read the baseline

Questions the data can answer **within a single session**, needing nothing beyond Phase 0:

1. **Where do people abandon onboarding?** `stepReached` distribution. If there is a cliff at step 4 (the Import intro), that alone justifies the change.
2. **What share hit "Skip to singing"?** `skipped` rate.
3. **Do skippers practice more than completers?** Compare `practice_started` rate between the two. This is the front-load-versus-friction question in its purest form, and it needs no experiment.
4. **Time from first `$pageview` to first `practice_started`.** The friction metric.
5. **Does anyone discover import/segments unaided?** If the answer is already "no", deferring the teaching costs nothing that isn't already lost.

Cross-session, once `visitNumber` accumulates:

6. **What fraction of visitors ever reach `visitNumber: 2`?** If return rate is near zero, paced onboarding has no delivery mechanism and the whole idea collapses. **This is the gating question — check it first.**
7. Do returning visitors practice at a higher rate than first-timers?

---

## 5. Phase 2 — the product change (only after Phase 1)

Sketch, deliberately not detailed until the baseline is read:

- Split the step list into `essential` (voice, and possibly routine) and `deferred` (mode demo, import, song segments).
- Store progress as a set of *seen* capability keys, not a single boolean. `vocal-training:onboarding:v1` becomes a richer record; needs a migration that treats the existing "seen" flag as "saw everything" so current users are not re-onboarded.
- Deferred items surface as a **dismissible card on Practice**, not a blocking modal. One per visit, at most.
- Keep "Skip to singing" available at every point. It is the current design's best feature.

---

## 6. What the data will *not* settle

At roughly 400 visitors/month, a properly powered A/B test between front-loaded and paced onboarding **will not reach significance in a useful timeframe**. Detecting a 20% relative change in activation needs thousands per arm. PostHog gives us experiments free, and wiring one up would mostly produce a year of overlapping confidence intervals.

**Therefore:** treat Phase 1 as *directional evidence*, then make a product judgment. If 60% of visitors hit Skip on step one, the answer is already in hand and no test is required. Build the paced version because the descriptive data points that way, not because an experiment blessed it.

Do not let "we should A/B test this" become the reason nothing ships.

---

## 7. Open questions

- Does a first-visit user who skips onboarding entirely ever set a voice part? If not, their first practice is in the wrong range and the scoring will look broken to them. That may be an argument for keeping Voice as an essential step regardless.
- Is `/onboarding` being counted for people who arrive on a Learn article and never touch the app? (It shouldn't be — the gate is in `app/_layout.tsx` and skips `(marketing)` — but worth confirming against real data rather than the code.)
- Should the deferred cards be capability-aware (surface Import only after N logged sessions) or purely visit-count-driven? Capability-aware is better product, more state, and harder to measure.
