# Usability & Hardening Plan — HOLD-SCOPE CEO Review

> Source: `/plan-ceo-review`, **HOLD SCOPE** (make the existing product bulletproof; do **not** add new feature surface).
> Companion: a **parallel design review** is producing its own plan. This document is written to be **merged** by a single orchestrator — see **§4 Merge Interface**.
> Review date: 2026-06-23. No code was changed during the review.

---

## 1. The Frame (constraints every slice must honor)

This product is, and will remain:

- **Web-only.** No iOS/native/TestFlight. The entire M1 native milestone is **out of scope** (dead).
- **Local-first, single-user.** One user (the owner). No accounts, no profiles, no multi-user.
- **No externally-maintained resources.** This is a hard product goal. **Nothing in this plan introduces a server, cloud database, or any service the owner must maintain.** (See §2 — the durable-storage work is 100% in-browser.) This plan in fact *removes* the one remaining external dependency (the piano-sample CDN).
- **Above-the-fold is sacred.** The Practice screen was deliberately designed so everything — **especially the Start button** — is reachable on boot without scrolling on desktop. Any layout change must preserve this at common laptop content heights (verify ≥720px **and** the shorter ~640px MacBook content area). If new content can't fit, it is truncated/collapsed — never stacked in a way that pushes Start below the fold.

**Guiding principle:** the gap to "bulletproof" is **resilience + friendliness**, not features. Every slice serves one of:
*never lose the user's data · never fail silently · never lie about a score · make the daily loop feel considered.*

---

## 2. Storage Architecture Decision (settled — local-only)

The review flagged the #1 risk: **all data lives in `localStorage` with no backup, and browsers evict `localStorage`** (Safari ITP after ~7 idle days; Chrome under storage pressure). For a progress app, that is silent, total, unrecoverable loss.

The fix is **100% local — no servers, no accounts, no maintenance:**

| Mechanism | What it is | External? |
|---|---|---|
| `navigator.storage.persist()` | One browser API call asking the browser not to evict this origin's storage. Protects the **same storage you already use** (the StorageManager box covers localStorage). **No migration required.** | **No** — pure browser API |
| Export → JSON file | "Download a file" of all app data into the owner's **own Downloads folder**, via the existing `downloadBlob()` helper (`lib/capture/download.ts`). | **No** — file on local disk |
| Import ← JSON file | File-picker read + validate + write keys back. | **No** — local file read |
| Backup-age nudge | Track last-export timestamp locally; show "Last backup: N days ago" on Progress. | **No** |

> **IndexedDB migration is explicitly NOT recommended.** `persist()` protects the current `localStorage` directly; migrating buys little for this data size and adds risk. Skip it.

**Storage-key inventory** (from the live codebase) — what export/import must cover:

Back up (durable user data):
```
vocal-training:sessions:v1          ← practice history (the crown jewels)
vocal-training:sessions:version     ← schema marker (include for safe restore)
vocal-training:songs:v1             ← imported songs
vocal-training:exercises:user:v1    ← user-imported exercises
vocal-training:routine:v1           ← today's routine config
vocal-training:coaching:saved:v1    ← bookmarked tips
vocal-training:coaching:rotation:v1 ← tip rotation state
vocal-training:voice-part:v1
vocal-training:octave-shift:v1
vocal-training:guided-tolerance:v1
vocal-training:mode:v1
vocal-training:settings:demo-enabled
vocal-training:onboarding:v1
```
Exclude (ephemeral / session-scoped):
```
vocal-training:settings:headphones-confirmed-session   ← cleared on unmount by design
```

The export envelope carries a `schemaVersion` so a future restore can migrate forward.

---

## 3. Sequenced Implementation

Three phases, ordered by **design-dependency**, so the engineering-only work starts immediately while the design-led work waits to merge the parallel design plan.

```
  PHASE A  ── engineering-led, START NOW ───────────────  (low/no design dependency)
    A1  Data durability        (persist + export/import + nudge)
    A2  Honest scoring         (octave-mismatch Phase 2)
    A3  Quiet resilience       (error boundary · bundle piano · last-key bug · prod strip)

  PHASE B  ── design-led, MERGE WITH DESIGN REVIEW ─────  (high design dependency)
    B1  Mic-failure recovery   (+ pre-Start mic level meter)
    B2  Desktop fill           (above-the-fold-safe · streak · completion warmth)
    B3  Warm states + icons     (empty/error states · decode C/F/On)

  PHASE C  ── delight polish ──────────────────────────  (after B)
    C1  Personal-best + spacebar
```

---

### PHASE A — Foundation (start immediately; little/no design input needed)

#### A1 · Data durability — *highest stakes*
- **Goal:** the owner's history can never be silently lost, and is portable across browsers/machines.
- **Why:** today one cache-clear or Safari eviction = zero. The compounding value of the app *is* the history.
- **Build:**
  1. `lib/storage/persist.ts` — call `navigator.storage.persist()` once on app init; expose `persistedStatus()` (`navigator.storage.persisted()` + `estimate()`). Best-effort; log result.
  2. `lib/backup/exportImport.ts` — `exportAll()` reads the §2 key set → one JSON blob (`{schemaVersion, exportedAt, data:{…}}`) → `downloadBlob()`. `importAll(file)` parses, validates `schemaVersion`, writes keys back, returns a summary.
  3. Progress UI footer: `[⬇ Back up to file] [⬆ Restore]` + "Last backup: N days ago" (timestamp stored locally on export).
  4. Gentle nudge: if sessions changed since last export AND last export > 30 days (or never), show one dismissible line on Progress.
- **Files:** new `lib/storage/persist.ts`, `lib/backup/exportImport.ts`; edit `app/(tabs)/progress.tsx`, `app/_layout.tsx` (init call); reuse `lib/capture/download.ts`.
- **Design dependency:** **Low** — one footer block + one nudge line. Design review may style it; logic is independent.
- **Effort:** M.
- **Done =** export produces a file that, after `localStorage.clear()`, fully restores all history/routines/songs/settings; `persist()` is requested on boot; Import rejects a malformed/old-schema file gracefully; unit tests for round-trip export→import.

#### A2 · Honest scoring (octave-mismatch Phase 2)
- **Goal:** stop *masking* the case where the owner sings ~an octave below the notation; surface it instead of silently folding it.
- **Why:** owner's own memory flags this as "likely the biggest accuracy lever." A scorer that hides a real error isn't bulletproof. (See memory `octave-mismatch.md`, `last-key-degradation.md`.)
- **Build:** in `lib/scoring/align.ts`, when a segment matches its target only via the octave-fold (`snapOctave`/octave-aware `matchCost`), **record that an octave correction happened** on the `NoteScore`. Surface a non-judgmental signal ("you sang this an octave below — switch to *Down an octave* to practice in your register?") on the post-session surface, linking to the existing octave selector. Do **not** change the match math; just stop hiding the fact.
- **Files:** `lib/scoring/align.ts` (+ types), `lib/session/tracker.ts` (carry the flag), `components/practice/PostSessionPanel.tsx` / `NoteResultsStrip.tsx` (surface).
- **Design dependency:** **Low–Med** — one inline hint; copy + placement could be reviewed.
- **Effort:** M.
- **Done =** a take sung a full octave low shows the corrected score **and** an honest "octave below" note; in-register takes are unaffected; regression tests in `align.test.ts` assert the flag fires only on true octave folds.

#### A3 · Quiet resilience
- **Goal:** robustness the owner never notices — until they would have.
- **Build (four independent items):**
  - **Top-level error boundary** in `app/_layout.tsx` — a render error shows a recover-able card ("Something hiccuped — reload"), not a white screen. Include a "copy diagnostics" affordance.
  - **Bundle web piano samples** — drop the runtime `tonejs.github.io` CDN dependency so the app fetches nothing external (aligns with the local-only goal). Extend `assets/salamander/` coverage for web and point `lib/audio/player.web.ts` at bundled assets. *(Note: also relevant to the native sample-cap caveat, but native is out of scope.)*
  - **Last-key-degradation bug** (memory `last-key-degradation.md`) — investigate the "last scale of an exercise has the most artifacts" report; fix root cause.
  - **Confirm prod build strips dev-only surfaces** — verify the Netlify build hides "Record raw audio" and the Trill Lab tab (`__DEV__` gating holds in the production bundle).
- **Files:** `app/_layout.tsx`, `lib/audio/player.web.ts`, `assets/salamander/`, `lib/scoring/*` or `lib/pitch/*` (last-key investigation), build/CI config check.
- **Design dependency:** **None** (error-boundary card copy is trivial).
- **Effort:** S–M.
- **Done =** throwing in a screen renders the recovery card; airplane-mode (no network) still plays piano; the last-key artifact is reproduced-then-fixed with a test; a production build shows no dev affordances.

---

### PHASE B — The friendly daily surface (merge the design review here)

> **These three slices are where the parallel design review overlaps most.** The orchestrator should treat the design plan as the **owner of visual/layout/copy decisions** for B1–B3, and this plan as the owner of **behavior, data, and acceptance criteria.** See §4.

#### B1 · Mic-failure recovery + pre-Start mic level meter — *core dependency*
- **Goal:** the single most important failure (blocked/missing/dead mic) becomes a first-class, recoverable state — and the owner can *see* the mic is listening before singing.
- **Why:** today a denied mic = a tiny corner "Permission denied," no explanation, no recovery. (Review screenshot 10.)
- **Build:**
  - **Preflight on Start:** attempt mic acquisition *before* the piano plays; if it fails, never start the sequence (so the owner is never scored on silence).
  - **In-staff failure state:** replace the corner text with a prominent state in the staff card: what happened + **per-browser** "re-enable mic" steps + **Retry**.
  - **Pre-Start level meter:** a live input-level bar near Start (green when it hears you; flat/grey → "we can't hear your mic"). **Build on existing primitives:** `components/practice/MicStatus.tsx`, `lib/pitch/sniff.ts` (`sniffMicrophone`), and the existing "Check mic" button already exist — extend, don't rebuild.
- **Files:** `app/(tabs)/index.tsx` (`handleStart`, error state), `lib/pitch/detector.web.ts`, `components/practice/MicStatus.tsx`, `lib/pitch/sniff.ts`.
- **Design dependency:** **High** — the failure-state visual, the meter visual, and the recovery copy are design-owned.
- **Effort:** M.
- **Done =** denying the mic shows the explained recovery state (not corner text) and never plays/scores; granting after Retry works without reload; the meter reflects live input; a dead/silent mic is caught before a take.

#### B2 · Fill the desktop void — above-the-fold-safe (+ streak + completion warmth)
- **Goal:** the dead cream space below/beside the staff (review screenshots 8/10/11) becomes glanceable, motivating content — **without ever pushing Start below the fold.**
- **Why:** desktop reads as unfinished today, and the daily payoff (progress/streak) lives a tab away.
- **Build (content; visual layout is design-owned):**
  - Last session: "Last time: 84% · G3–C4 · 2 days ago."
  - "What this exercise trains · ~N min · # keys" (the description already exists under the picker; promote a one-line form).
  - Routine progress at a glance.
  - **🔥 N-day streak** (new calc in `lib/progress/stats.ts`; on-brand brass treatment, not emoji-spam).
  - **Completion warmth:** a warm line + subtle amber shimmer (200ms, DESIGN.md motion, reduced-motion aware) when the day's routine finishes.
- **Files:** `app/(tabs)/index.tsx` (right column), new small components under `components/practice/`, `lib/progress/stats.ts` (streak).
- **Design dependency:** **High** — exact layout, what content earns its place, visual hierarchy. **Hard constraint to hand the designer:** Start stays above the fold on boot at ~640px and ~720px content heights; overflow truncates/collapses.
- **Effort:** M.
- **Done =** desktop Practice shows useful glanceable content in the former void; **automated/visual check confirms Start is above the fold at 640px and 720px**; streak increments/breaks correctly (tested); completion warmth fires once per routine completion and honors reduced motion.

#### B3 · Warm the cold states + decode the settings icons
- **Goal:** the spots where "friendly" dies become inviting.
- **Build:**
  - Progress empty: "0 / 0% / 0" void → an inviting first-run prompt ("Sing your first warmup to start tracking — here's what you'll see").
  - Coaching no-session: raw **"No session id provided."** → the rotating "Today's tip" empty state the code already has (`EmptyStateTip`, `lib/coaching/rotation.ts`).
  - Settings cluster: label the **C / F / On** icons (e.g. "Piano: Classical" / "Guide: Full" / "Demo: On") so they're decodable without hover (and on touch).
- **Files:** `app/(tabs)/progress.tsx`, `app/(tabs)/coaching.tsx`, the `PracticeControls`/settings-cluster component.
- **Design dependency:** **Med** — copy + the icon-label treatment are design-owned.
- **Effort:** S.
- **Done =** no screen shows a raw/dev error string to the user; the settings row is self-explanatory without hover; empty Progress invites the first session.

---

### PHASE C — Delight polish (after B)

#### C1 · Personal-best moment + spacebar Start/Stop
- **Build:**
  - **Personal-best badge** on the post-session panel when a take beats the stored best-ever for that exercise ("Personal best — 87%, up from 82%"). Reuses existing best-ever calc.
  - **Keyboard shortcuts** (desktop): `Space` = Start/Stop, `→` = next routine exercise. Pure logic; respects focus (don't hijack when typing in a field).
- **Files:** `components/practice/PostSessionPanel.tsx`, `lib/progress/stats.ts`, `app/(tabs)/index.tsx`.
- **Design dependency:** **Low–Med** — badge visual is design-owned; spacebar is invisible.
- **Effort:** S.
- **Done =** beating best-ever surfaces the badge; `Space`/`→` drive the primary actions without interfering with text inputs.

---

## 4. Merge Interface (for the orchestrator combining this with the design review)

**Ownership split — apply per slice:**

| Slice | This plan owns | Design review owns | Merge risk |
|---|---|---|---|
| A1 durability | all logic + the export/import behavior | styling of the Progress backup footer | Low |
| A2 honest scoring | the scoring-flag logic | the hint copy/placement | Low |
| A3 resilience | all | error-card copy (trivial) | None |
| **B1 mic recovery** | preflight + behavior + acceptance | **failure-state visual, meter visual, recovery copy** | **High — reconcile here** |
| **B2 desktop fill** | which data, streak calc, **above-the-fold constraint** | **layout, hierarchy, what content shows, visual treatment** | **High — reconcile here** |
| **B3 warm states** | which states, the rotating-tip wiring | **copy + icon-label treatment** | **Med** |
| C1 delight | best-ever logic, shortcut behavior | badge visual | Low |

**Recommended global sequence for the merged plan:**
1. **Phase A in parallel, now** — none of it blocks on design; it removes the scariest risks (data loss, dishonest scores, silent crashes, external dependency).
2. **Merge the design plan into Phase B**, then build B1 → B2 → B3. B1 first (it's the core-dependency fix and also produces the mic meter B2's "what this trains" panel can sit beside).
3. **Phase C last** — its visuals ride on the B surfaces (post-session panel, desktop layout).

**Flag for the orchestrator:** if the design review proposes anything that grows Practice page height on desktop, it **must** be checked against the above-the-fold constraint (§1) before acceptance.

---

## 5. Explicitly NOT in Scope (considered, deferred)

- **iOS / native / TestFlight / Salamander-native / on-device validation** — killed by the web-only reframe. Frees all of M1.
- **New PRD exercises / direction toggle / siren type (M4)** — scope expansion, not hardening.
- **Multi-profile / multi-user / accounts** — there are no other users.
- **Cloud sync / hosted database of any kind** — violates the no-external-resources goal; the local export/import in A1 is the chosen durability path.
- **IndexedDB migration** — unnecessary; `persist()` protects current storage.
- **Deepening Song Import (Slices 5/7 — note editor, trim)** — feature is sufficient; harden, don't extend.
- **Playwright E2E (PR 5)** — valuable for agentic dev, not a usability/delight lever now.
- **Dark mode** — already deferred per DESIGN.md.
- **Headphones-modal change** — retracted during review; it already persists the answer within a session as intended.

---

## 6. Open Items for the Orchestrator
- Confirm the design review's outputs map onto B1–B3 as the table in §4 expects; if it introduces a new surface (e.g., a Library tab), that's a **scope-expansion** decision outside this HOLD-SCOPE plan and should be raised separately.
- Decide whether A2's "octave below" hint also writes to the session record (for Progress trends) or is post-session-only (recommend post-session-only first; revisit if useful).
