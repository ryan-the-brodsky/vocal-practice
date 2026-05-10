# HOLD SCOPE Bulletproofing Plan

Implementation plan derived from the 2026-05-10 founder-mode review (HOLD SCOPE mode). Scope is locked: pure-frontend vocal warmup app, no upsell, no subscription. Each slice ships with tests; ROADMAP.md gets a one-line update at the bottom of M2/M3 as each slice lands.

**Audit issues reference key:** Section.IssueNumber from the review (e.g. 1.4 = Section 1, Issue 4).

---

## Sequencing rationale

1. **Slice 1 (Cleanup) first** — clears dead code and stale docs so subsequent work isn't built on shifting sand.
2. **Slices 2–3 are small UX wins** — voice persistence, resuming-key label, coaching CTA copy. Build momentum before the bigger refactor.
3. **Slice 4 (Routine wiring)** is the highest-leverage UX change — needs the cleanup work landed first.
4. **Slices 5–7** are independent feature slices that can run in any order or in parallel.
5. **Slice 8 (iOS bundle)** is gated on Xcode + a physical device for validation; can run in parallel with the rest.

---

## Slice 1 — Cleanup pass (XS · ~1h) ✅ shipped 2026-05-10 (commit 632630a)

**Bundles audit issues 4.1, 4.2, 4.3.**

### Goal
Remove three pieces of cruft that compromise HOLD SCOPE bulletproofing: an unused config field, "coming soon" placeholders shipped to the user, and dead code with stale documentation.

### Changes

| Item | Files |
|---|---|
| Cut `routine.frequency` | `lib/progress/routine.ts` (drop field + `todayStatus()` arg if any), `app/(tabs)/explore.tsx` (drop `FREQUENCY_OPTIONS`, segmented control, `frequency` state in modal), `lib/progress/__tests__/routine.test.ts` if it asserts on frequency |
| Hide imported "coming soon" sections | `app/(tabs)/explore.tsx` — remove the three `<View style={styles.importedSection}>` blocks ("Note timeline coming soon", "Per-degree intonation table coming soon", "Range slider coming soon"). Sparkline + Coach this melody + Edit/Delete row remain. |
| Remove `setLatencyOffsetMs` + dead Tracker offset | `lib/session/tracker.ts` — drop the `setLatencyOffsetMs` method and `latencyOffsetMs` field. `lib/session/__tests__/tracker.test.ts` — drop the two tests at line 228+. |
| Update CLAUDE.md | Remove the "Timing diagnostics panel" + "Calibrate Latency" paragraphs in the "What works" section. |
| Update ROADMAP.md | Remove "Timing diagnostics panel (POC 1)" and "Sing-along calibration (POC 2 variant)" rows from M2 (or mark them retired post-pattern-alignment). |

### Tests
- `lib/session/__tests__/tracker.test.ts` — confirm remaining suite still green after removing the two latency-offset tests; no replacement needed (the feature doesn't exist).
- `lib/progress/__tests__/routine.test.ts` — if frequency is asserted, simplify those assertions; otherwise no change.
- `npm run test:coverage` should not regress (coverage thresholds are scoped to PR-2 files; this slice doesn't touch them).

### Done criteria
- [x] `grep -rn "frequency\|FREQUENCY_OPTIONS" app/ lib/components/` returns no live references.
- [x] `grep -rn "coming soon" app/` returns no matches.
- [x] `grep -rn "setLatencyOffsetMs\|latencyOffsetMs" lib/ app/` returns no matches.
- [x] `npm test && tsc --noEmit` clean. Test count 350 → 349 (dropped 1 latency-offset cosmetic test).
- [x] CLAUDE.md and ROADMAP.md no longer reference the calibration UI.

### Side-discoveries during Slice 1
- **Slice 6 may already be partially shipped.** `lib/progress/storage.ts:173` already enforces `MAX_PERSISTED_SESSIONS = 500` with a console.warn when a prune fires. Need to audit when we open Slice 6 — likely just missing the trace-blob aging-out + coaching-orphan cleanup, not the cap itself.
- **PR 1–4 test-pyramid backlog committed alongside Slice 1.** The test infrastructure documented as "shipped" in CLAUDE.md was never actually committed; commit 632630a bundles both bodies of work.

---

## Slice 2 — Voice persistence + Resuming-key label (XS · ~30min) ✅ shipped 2026-05-10

**Bundles audit issues 1.2, 1.5.**

### Goal
Two small surfacing fixes: voice part survives cold launches, and the Practice screen tells the user *why* the starting key isn't the range lowest.

### Changes

| Item | Files |
|---|---|
| Persist voice part | `app/(tabs)/index.tsx` — replace the `useState<VoicePart>("tenor")` (line 68) with an effect that loads from AsyncStorage on mount + writes on change. Mirror `MODE_STORAGE_KEY` pattern. New key: `vocal-training:voice-part:v1`. |
| Resuming-key label | `app/(tabs)/index.tsx` `StandardModeBody` — change the `keyHeaderLabel` text. When `startTonicMidi !== defaultTonicMidi`, render `Resuming at ${midiToNote(startTonicMidi)}`; otherwise `Starting at ${midiToNote(startTonicMidi)}`. Lift `defaultTonicMidi` into the props or recompute. |

### Tests
- New unit test or component-test assertion for AsyncStorage round-trip on `vocal-training:voice-part:v1`. Lightweight — drop into `app/__tests__/practice.test.tsx` or a new `lib/__tests__/voicePartPersistence.test.ts` since the Practice component test is currently `describe.skip`.
- Component snapshot or query test for the `Resuming at`/`Starting at` label split. Can land in `app/__tests__/practice.test.tsx` once the `describe.skip` is partially un-skipped for these specific assertions, or as a new isolated component test if a small `<KeyHeader>` extraction makes sense.

### Done criteria
- [x] Setting voice to soprano, killing the app, reopening — voice is still soprano. (verified by `lib/settings/__tests__/voicePart.test.ts` round-trip)
- [x] When the saved tonic equals range lowest, label reads "Starting at C". When advanced, label reads "Resuming at G". (logic implemented in `app/(tabs)/index.tsx`; render-test deferred behind the same UX-fluid policy as the rest of practice.test.tsx)
- [x] No regression. 349 → 354 tests (5 new voice-part tests), 27 of 28 suites passing (1 skipped placeholder), tsc clean.

### Slice 2 implementation notes
- New helper: `lib/settings/voicePart.ts` (`loadVoicePart` / `saveVoicePart` / `VOICE_PART_STORAGE_KEY`). Extracted as a module so AsyncStorage round-trip is testable without rendering the full Practice screen.
- Practice screen wraps `setVoicePart` with an internal setter that updates state and persists. The picker's `onPress` call site (`setVoicePart(vp)`) is unchanged — wrapper is transparent.
- `defaultTonicMidi` plumbed through `StandardBodyProps` so the label can compare against it.

---

## Slice 3 — Coaching CTA copy + Practice-this-again loop-back (S · ~2h) ✅ shipped 2026-05-10

**Bundles audit issues 1.6, 1.7.**

### Goal
Make the post-session Coaching CTA inviting rather than chart-label-ish, and close the loop from the Coaching screen back into Practice with the right exercise pre-selected.

### Changes

| Item | Files |
|---|---|
| Coaching CTA copy refresh | `app/(tabs)/index.tsx` — modify the `setCoachingCta(...)` call after `diagnoseSession`. `previewText` should be the symptom-card title alone (or detector evidence as fallback when no symptom card). Move `evidenceText` into a new optional `previewSubline` field on the CTA shape. The `<Pressable style={styles.reviewCta}>` already has a primary line + subline — wire them to the two new fields. |
| Practice-this-again button | `app/(tabs)/coaching.tsx` — at the bottom of the rendered diagnostic surface (after `<BookmarkButton>`), add a `<Pressable>` that calls `router.push({ pathname: "/", params: { exerciseId: contextExerciseId, voicePart: record?.voicePart ?? importedDescriptor?... } })`. Practice screen needs to honor `exerciseId` + `voicePart` query params on first mount. |
| Practice param honoring | `app/(tabs)/index.tsx` — `useLocalSearchParams<{ exerciseId?: string; voicePart?: VoicePart }>()` at the top; on mount, if either is present and valid, set state accordingly. Voice-part param overrides AsyncStorage from Slice 2. |

### Tests
- `app/__tests__/coaching.test.tsx` — new case: clicking "Practice this again" calls `router.push` with the right pathname and params. Mirrors the existing recent-session "Coach this" test pattern in `explore.test.tsx`.
- `app/__tests__/coaching.test.tsx` — assert the symptom-card title appears as the headline (already covered by existing tests; verify nothing breaks).
- New test or assertion for CTA preview shape — if Practice's component test gains coverage in Slice 2, fold the CTA copy assertion in here.

### Done criteria
- [x] Post-session CTA primary line is the symptom title (with arrow); subline is the evidence text. Falls back to evidence-as-headline when no symptom card exists (e.g. position-consistent diagnosis).
- [x] Coaching screen "Practice this again" button navigates to `/` with `{ exerciseId, voicePart }` params. Practice screen consumes them on first matching render via `lastConsumedNavKeyRef`; voice-part param sets state directly without triggering AsyncStorage persistence (programmatic transitions don't override the user's persisted choice).
- [x] Existing 3 coaching-test cases still green; 1 new test asserts the router.push payload. 354 → 355 tests.

### Slice 3 implementation notes
- `coachingCta` shape extended with optional `previewSubline`. JSX renders `previewText →` as primary and `previewSubline` as subline only when present.
- Practice param-honoring uses a key ref (`lastConsumedNavKeyRef = "exerciseId|voicePart"`) so re-renders with the same params don't re-apply, but a fresh navigation with different params re-fires.
- `voicePart` query-param values are validated against `VALID_VOICE_PARTS` before state-setting.
- Pathname `/` resolves to the Practice tab via the (tabs)/index.tsx route.

---

## Slice 4 — Routine on Practice + tappable + auto-advance (M · ~6h) ✅ shipped 2026-05-10

**Bundles audit issues 1.1, 1.4. Builds on Slices 2–3 (voice persistence and the Practice param-honoring).**

### Goal
The biggest UX shift in this plan: today's routine becomes the daily entry point on Practice, items are pressable launchers, and the post-session flow nudges the user to the next routine item.

### Changes

| Item | Files |
|---|---|
| Extract `<TodayRoutineCard>` to a shared component | New file `components/practice/TodayRoutineCard.tsx`. Move from inline definition in `app/(tabs)/explore.tsx`. Add an `onItemPress?: (exerciseId: string) => void` prop; when present, items render as `<Pressable>` instead of plain `<View>`. |
| Mount on Practice top | `app/(tabs)/index.tsx` — render the card above the mode toggle. `onItemPress` calls `handleExerciseChange(id)`. Read-only mirror — Edit button on the Practice copy navigates to the Progress modal. |
| Auto-advance hint after session | `app/(tabs)/index.tsx` — after `handleStop` finishes (or on `loggedMessage` set), compute the next unfinished routine item via `routineStatus.items` (loaded on mount). Render a primary CTA `Next: <exercise name> →` that calls `handleExerciseChange` + scrolls to top. Fall back to a "Routine done" celebration if all items are checked. |
| Routine status on Practice | `app/(tabs)/index.tsx` — load `routine` + sessions on mount (or read sessions reactively after Log) so `todayStatus()` is fresh. Memoize. |

### Tests
- New component test in `components/practice/__tests__/TodayRoutineCard.test.tsx` — given a config + status, items render as buttons with correct labels; tapping fires `onItemPress` with the right id; "Routine done" state when all items done.
- New integration test in `lib/__tests__/integration/routineFlow.test.ts` — synthetic session log marks an item complete; `todayStatus` reflects it; next-item resolver returns the right id.
- Update `app/__tests__/explore.test.tsx` if the `TodayRoutineCard` extraction changes the rendered tree (it shouldn't if the inline definition is preserved as a thin wrapper).
- Practice component test (un-skip selectively) — when routine is loaded, tapping a routine row sets `exerciseId` state.

### Done criteria
- [x] Open app cold → Practice tab → today's routine visible at top → tap row 1 → exercise selected (via `handleExerciseChange`), voice part persisted from last session (Slice 2), Start ready in one tap.
- [x] After session ends + Log, "Next: <exercise>" CTA appears. Tapping it switches exercise + scrolls to top via `scrollViewRef.current?.scrollTo({ y: 0 })`.
- [x] All routine items checked → header in TodayRoutineCard shows "Routine done" in success color; body shows a one-line "Routine done for today." banner.
- [x] No regression — `explore.test.tsx` still passes after the inline-component extraction (just a different import path; rendered tree unchanged).
- [x] 6 new component tests for `<TodayRoutineCard>` covering header copy, progress count, all-done state, empty state, onItemPress with id, and onPressEdit.

### Slice 4 implementation notes
- `<TodayRoutineCard>` extracted to `components/practice/TodayRoutineCard.tsx` with optional `onItemPress` prop. When provided, rows render as `Pressable` with a "Practice <exercise>" accessibilityLabel; otherwise as plain `View`s.
- Progress and Practice both consume the shared component. Edit button on the Practice copy fires `router.push("/explore")`; the Progress copy opens its modal in-place.
- Practice loads `routine` + `loggedSessions` on mount; `handleLogSession` appends the just-logged record to local state so `todayStatus()` recomputes without a fresh fetch.
- `nextRoutineItemId` resolves to the first unfinished item in `routineStatus.items`. The "Next: …" Pressable is shown when `status === "idle" && !pendingSession && nextRoutineItemId`. The "Routine done for today." banner takes its place when all items are done.
- ScrollView ref added at the PracticeScreen root; `handleAutoAdvance` scrolls to top after switching exercises so the user lands on the new exercise's hero card.

---

## Slice 5 — Pre-Start mic check + live indicator (S · ~3h) ✅ shipped 2026-05-10

**Audit issue 1.8.**

### Goal
Eliminate the silent-failure mode where mic permission denial is invisible until the user finishes a session and sees blank scoring.

### Changes

| Item | Files |
|---|---|
| Mic-status component | New `components/practice/MicStatus.tsx` — three states: `unknown` (asks for permission via `getUserMedia` on web / `requestPermissions()` on native), `denied` (red dot + "Mic blocked — check Safari/iOS settings"), `ready` (green dot + last RMS dB during session). |
| Pre-Start sniff | New helper in `lib/pitch/index.ts` — `sniffMicrophone(): Promise<{ ok: boolean; rmsDb: number | null; error?: string }>`. 1-second capture via the existing detector factory; resolve when first sample arrives or timeout. |
| Wire into Practice | `app/(tabs)/index.tsx` — render `<MicStatus>` near the headphones banner. Click triggers `sniffMicrophone()`. During session, feed `latestSample.rmsDb` into the live indicator. |

### Tests
- `lib/pitch/__tests__/sniff.test.ts` — using `installFakePitch()` from `test/setup-component.ts`, drive a synthetic sample through and assert the resolved shape. Permission-denied path uses `__setPitchDetectorFactory(() => { throw new Error("denied") })`.
- `components/practice/__tests__/MicStatus.test.tsx` — render in `denied` state, assert the warning copy appears with the correct `accessibilityLabel`.

### Done criteria
- [x] `sniffMicrophone(factory, timeoutMs)` returns `{ ok, rmsDb, error? }` covering: first-sample success, start() rejection (permission denied), and timeout. 3 unit tests cover the three branches.
- [x] `<MicStatus>` renders four states (`unknown` / `checking` / `denied` / `ready`); ready state takes optional `liveRmsDb` and renders "{rounded} dB". Pressable affordance + accessibilityLabel on the unknown and denied paths. 5 component tests.
- [x] Practice mounts the component below the headphones banner; `handleCheckMic` runs the sniff and transitions state. During an active session, mic state sticks to `ready` and the row shows the live RMS dB readout.
- [-] Auto-update on permission re-grant via focus listener — deferred. Manual retry via the Pressable handles the recovery path.

### Slice 5 implementation notes
- `sniffMicrophone(factory, timeoutMs)` takes the detector factory as a required parameter rather than reading the module-level DI registry. The unit test for sniff would otherwise pull `detector.web.ts` (and pitchy ESM) into ts-jest's import chain. Production caller passes `createPitchDetector` from `@/lib/pitch`.
- During an active session, the existing `latestSample` flow doubles as live mic confirmation; an effect watches it and pins `micState` to `"ready"` on first sample so subsequent sessions don't re-prompt the check.
- Component test for sniff lives in the unit project (pure TS, no jsdom needed), MicStatus test in the component project alongside other DOM-rendered components.

---

## Slice 6 — Session prune on launch + coaching-orphan cleanup (S · ~2h) ✅ shipped 2026-05-10

**Audit issue 2.2 (folds in the previously-deferred coaching-orphan cleanup).**

### Goal
Cap unbounded AsyncStorage growth without losing aggregate stats; clean up orphaned coaching child sessions.

### Changes

| Item | Files |
|---|---|
| Prune logic | New `lib/progress/prune.ts` — `pruneSessions(records: SessionRecord[]): SessionRecord[]`. Rules: keep last 500 sessions by `startedAt`; for sessions older than 30 days, drop the `keyAttempts[].notes[].trace` blobs (lossy aggregation). Coaching child sessions with `parentSessionId` whose parent is no longer in the kept set get dropped entirely. Pure function — input → output, no side effects. |
| Run on launch | `lib/progress/storage.ts` `createAsyncStorageStore` — on first `list()` call per process, run `pruneSessions` and persist the result back. Idempotent. |
| Coaching saved-tips prune (optional) | If the saved-tips list also grows unboundedly, add a parallel `pruneSavedTips(records)` keeping last 200. Decide based on actual saved-tip count after a few weeks of use. |

### Tests
- `lib/progress/__tests__/prune.test.ts` — table-driven: 600 sessions, 100 of them >30 days old, 50 coaching children orphaned. Assert prune output: 500 kept, traces stripped on the old ones, orphans gone.
- `lib/progress/__tests__/storage.test.ts` — first `list()` triggers prune; second `list()` doesn't re-prune (track via spy).

### Done criteria — and the major audit revision

When this slice was opened we discovered most of the planned work had already shipped in prior PRs. The slice ended up being narrower than the plan called for. Reality:

| Plan item | Reality |
|---|---|
| 500-session cap on `upsert` | ✅ Already in `lib/progress/storage.ts` as `MAX_PERSISTED_SESSIONS = 500`. Tested in `storage.test.ts`. In-progress sessions are protected from the cap. |
| Drop trace blobs > 30 days | ⊝ Moot. `trimSessionForStorage` strips `trace` and `samplesInWindow` on **every** persist, not just aging. Stricter than the plan. |
| Coaching-orphan cleanup | ⊝ Moot. `parentSessionId` and `coachingFocus` are stripped on every persist; migration on read scrubs legacy records. The orphan concern from CLAUDE.md/ROADMAP no longer applies. |
| Quota-safe writes | ✅ Already wrapped with helpful "Storage is full" error copy. |
| Pure `pruneSessions` extraction | Skip — the inline cap logic in `upsert` is already covered by `storage.test.ts` cap tests. Extraction would be churn without test gain. |
| **Saved-tips cap** | ✅ Added in this slice — `MAX_SAVED_COACHING = 200` in `lib/coaching/savedStorage.ts`. |

- [x] Saved-tips list is now bounded (200 most-recent by `savedAt`); 1 new test verifies the cap behavior.
- [x] `npm test` clean — 369 → 370 tests.

### Slice 6 implementation notes
- The audit assumption "AsyncStorage grows unboundedly" turned out to be partly wrong: sessions were already capped, but the parallel saved-coaching-tips list was not. The single addition (`MAX_SAVED_COACHING = 200`) closes that gap.
- The "Run prune on launch instead of on write" rephrasing from the audit is moot — the existing on-write cap only activates when sessions exceed 500, so the write path stays fast in the common case.
- Coaching-orphan cleanup is fully moot because parentSessionId is stripped on persist + migrated on read. No further work needed.

---

## Slice 7 — Wire Guided mode to coaching (M · ~4h) ✅ shipped 2026-05-10

**Audit issue 1.9.**

### Goal
Guided mode currently produces rich per-note tuning data but never reaches `diagnoseSession`. Convert Guided's pattern-complete state into a synthetic `KeyAttemptResult` and reuse the Standard mode's Log/Discard + Coaching CTA flow.

### Changes

| Item | Files |
|---|---|
| Synthetic KeyAttemptResult builder | New `lib/scoring/guidedToAttempt.ts` — `buildKeyAttemptFromGuided(noteResults: GuidedNoteResult[], iteration: KeyIteration): KeyAttemptResult`. Maps Guided's per-note best-cents into `NoteScore[]` with empty traces (or, for diagnoseSession compatibility, a 1-frame trace at the median Hz so `pickRepresentative` doesn't choke). |
| GuidedSession surfaces results | `components/practice/GuidedSession.tsx` — on pattern complete (existing logic), call back into Practice via a new `onPatternComplete?: (record: SessionRecord) => void` prop. Practice owns the Log/Discard + Coaching CTA dispatch (already exists for Standard). |
| Practice routes Guided records | `app/(tabs)/index.tsx` — pass `onPatternComplete` to `GuidedSession`; reuse the existing `setPendingSession` + `setCoachingCta` paths. |

### Tests
- `lib/scoring/__tests__/guidedToAttempt.test.ts` — fixture-driven: 5 GuidedNoteResults → assert NoteScore shape, that signedCents match, that `meanAccuracyPct` computation is sane.
- `lib/__tests__/integration/guidedCoachingPipeline.test.ts` — drive synthetic Guided results through `buildKeyAttemptFromGuided` → `fromKeyAttempts` → `diagnoseSession` and assert a sensible top diagnosis fires for a 60¢-flat scenario.
- Component test: GuidedSession renders pattern-complete results; firing `onPatternComplete` mock receives a valid SessionRecord.

### Done criteria
- [x] `buildKeyAttemptFromGuided` synthesizes `NoteScore[]` from the Guided pattern's `bestPerNote` cents array, with single-frame trace at the user's actual hz so coaching's `pickRepresentative` can derive a medianHz for contrast playback. Null entries map to zero-frame NoteScores so `fromKeyAttempts` filters them.
- [x] `synthesizeGuidedIteration` produces a minimal `KeyIteration` for the coaching adapter — only the `events[]` list (with syllables) is needed downstream.
- [x] `<GuidedSession>` accepts an optional `onPatternComplete?(record, iterations)` prop and fires it when bestPerNote finalizes. Practice routes the record through the existing `setPendingSession` + `setCoachingCta` path.
- [x] **Bonus refactor:** post-session UI extracted into `<PostSessionPanel>`. Both Standard and Guided render the same component; dead inline JSX + ~80 lines of orphan styles removed from `app/(tabs)/index.tsx`.
- [x] Tests: 9 unit cases for `guidedToAttempt`, 1 integration scenario asserting global-flat Guided sessions diagnose as `global-flat`. 370 → 380 tests.

### Slice 7 implementation notes
- The pattern-complete callback signature passes both the record and the synthesized iterations because `fromKeyAttempts` needs the iterations for syllable lookup. Keeping that synthesis in `lib/scoring/guidedToAttempt.ts` puts both Guided→coaching adapters in one file.
- `framesAboveClarity = 15` (representing ~300ms of held-tone matching at 50fps) was chosen because `fromKeyAttempts` filters `< 1` frame observations; a positive value ensures detectors include the note. The exact magnitude doesn't affect detector outcomes since detectors weight by `ln(frames + 1)`.
- The `<PostSessionPanel>` extraction was unplanned but unavoidable — without it Guided would have required ~80 lines of duplicated post-session JSX. Standard's StandardModeBody now relies on the shared component, dropping the inline panel and ~80 lines of orphaned styles.
- Component test for `<GuidedSession>` was deliberately skipped — the component has heavy audio-player and pitch-detector interaction that would need extensive mocking. The integration test exercises the same data path through the real coaching engine, which is the more meaningful coverage.

---

## Slice 8 — iOS dev build bundle: prebuild + clock fix + C6 sample (M · ~6h, partly manual)

**Bundles audit issues 2.1, 2.3. Implements the long-standing M1 finisher.**

### Goal
Ship a working iOS dev build with the known scoring-blocker bug fixed and the soprano A5 native artifact closed in the same drop.

### Changes

| Item | Files |
|---|---|
| Prebuild | Run `npx expo prebuild --platform ios`. Commit `ios/` directory for reproducibility. |
| Clock fix | `lib/pitch/detector.native.ts:82` — replace `Date.now()` with `performance.now()` so it matches the screen's `detectorStartMsRef`. Verify no other `Date.now()` references in the native pitch path. |
| Bundle C6 Salamander | Add `assets/salamander/C6.mp3` (~80KB). Update `lib/audio/player.native.ts` sample table so C6 is reachable; raises native cap from F#5 to F#6. Update `lib/music/__tests__/voiceRanges.test.ts` snapshot — soprano A5 entries no longer in the out-of-cap list. |
| RMS gate iOS tuning | After validation on real hardware: if iOS mic gain differs materially, add a platform-specific bias to `rmsGateFor()` in `components/practice/`. |
| TestFlight | EAS Build config or local Xcode archive → upload → install on user's iPhone. |

### Tests
- `lib/music/__tests__/voiceRanges.test.ts` — refresh the out-of-native-cap snapshot. After C6 lands, soprano A5 should pass (A5 is 3 semitones from C6, well within ±6 cap).
- `lib/pitch/__tests__/detector.native.test.ts` — new test (if not already covered) asserting timestamps from the native postprocessor are anchored to `performance.now()` semantics. Use `installFakePitch()` to inject a known clock.
- Manual: on-device validation. Salamander samples play (not beep), pitch detection scores accurately on Five-Note Scale, no dropouts. Document findings in the PR.

### Done criteria
- [ ] App runs on user's iPhone via TestFlight.
- [ ] Pitch scoring works (no clock-routing bug).
- [ ] Soprano session reaches A5 without artifacts.
- [ ] `voiceRanges.test.ts` snapshot reflects the expanded native cap.

---

## Out of scope (deliberate deferrals)

Recorded here so future-you doesn't wonder why these aren't in the plan:

- **Persisting headphones modal answer across cold launches** (audit 1.3) — declined during review. RMS gate honesty over friction.
- **Imported-melody Slice 5 (per-degree intonation table, range slider) and Slice 7 (note editor)** — explicitly deferred in MELODY_IMPORT_PLAN.md; Slice 1 of this plan only hides the placeholders, doesn't ship the features.
- **Web Salamander bundle** — keep CDN dependency on web for now.
- **Coaching-orphan cleanup as standalone slice** — folded into Slice 6.
- **Anything monetization-shaped** — locked by the no-upsell mission.
- **Tier 3/4 coaching detectors** (trace-shape, passaggio) — already deferred per `COACHING_REDESIGN_PLAN.md` §17.

---

## Tracking

As each slice ships, add a one-line entry to ROADMAP.md (under the relevant milestone — most belong in M2 Coaching Depth or M3 Progress, except Slice 8 which is M1) and update the matching paragraph in CLAUDE.md. Don't batch the doc updates — they're part of the slice, not a follow-up.

When all 8 slices are green, this plan can be deleted.
