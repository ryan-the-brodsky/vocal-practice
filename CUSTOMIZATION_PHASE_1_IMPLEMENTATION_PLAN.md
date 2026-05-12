# Customization Registry — Phase 1 Implementation Plan

> Executable plan derived from `customization-registry-phase-1.md` (the design),
> `CUSTOMIZATION_REGISTRY_RESEARCH.md` + `AUTONOMOUS_FEEDBACK_LOOP_RESEARCH.md` (the research),
> and an audit of the current codebase. Decisions in §2 were confirmed with the user.

---

## 1. What exists today (the facts this plan builds on)

- **Stack:** Expo SDK 54, Expo Router 6, RN 0.81, React 19, TypeScript strict. Web-first; iOS deferred indefinitely (`project_ios_deferred_pwa_first` memory) — the declarative customization layer is cross-platform, only the (out-of-scope) Phase-3 plugin tier would be web-only.
- **Theme = static constants + a hook that hardcodes `'light'`.** `constants/theme.ts` exports `Colors`/`Fonts`/`Typography`/`Spacing`/`Radii`/`Motion`. `hooks/use-theme.ts` returns `{ scheme:'light', colors: Colors.light, ... }` — no context provider. `hooks/use-theme-color.ts` likewise. Two files import `Colors.light` directly (not via the hook): `app/_layout.tsx` and `app/(tabs)/_layout.tsx` — both are navigation chrome / protected shell, so they *stay* on `Colors.light`.
- **Boot sequence (`app/_layout.tsx`):** `SplashScreen.preventAutoHideAsync()` → `useFonts(...)` → `if (!loaded) return null` → `<ThemeProvider value={navTheme}><Stack>...</Stack></ThemeProvider>`. This is exactly where a `CustomizationProvider` slots in (load customizations alongside fonts, gate the splash on both).
- **Preferences today are scattered, not centralized:**

  | Current key | Where read/written | Becomes slot |
  |---|---|---|
  | `vocal-training:voice-part:v1` | `lib/settings/voicePart.ts` (clean load/save module) | `default-voice-part` |
  | `vocal-training:mode:v1` | inline in `app/(tabs)/index.tsx` | `default-mode` |
  | `vocal-training:settings:demo-enabled` | inline in `app/(tabs)/index.tsx` | `demo-on-by-default` |
  | `vocal-training:guided-tolerance:v1` | `components/practice/GuidedSession.tsx` | `default-guided-tolerance` |
  | `vocal-training:settings:headphones-confirmed-session` | `components/practice/HeadphonesBanner.tsx` | *stays runtime state* — the new `headphones-confirm-mode` slot only decides whether the modal shows at all |
  | `vocal-training:routine:v1` | `lib/progress/routine.ts` | *not a slot* — user data, leave it alone |
  | `vocal-training:sessions:v1`, `:coaching:saved:v1`, `:coaching:rotation:v1`, `:exercises:user:v1` | various | *not slots* — user data |

  No `home-route`, `ui-density`, `default-accompaniment-preset`, `show-staff-notation`, `lead-in-count`, `theme-overrides`, `type-overrides` exist yet — those are new slots.
- **Existing versioned-storage pattern to mirror** (`lib/progress/storage.ts`, `lib/progress/routine.ts`): never throw on bad data → fall back to default; best-effort write-back of migrations; `safeSetItem` quota wrapper that surfaces a friendly "storage full" message; a promise mutex so concurrent writes don't clobber.
- **Standalone-route pattern** (`app/coaching-saved.tsx`): a screen with a custom header (Back link, 44px touch target), `useTheme()` for colors, View-based; registered in `app/_layout.tsx`'s `<Stack>`. `app/customizations.tsx` follows this shape.
- **No AI feedback assistant widget exists.** No backend (no Cloudflare Worker, no Durable Objects, no Anthropic triage/judge code). The "autonomous feedback loop" is a 79 KB *research* doc, not shipped code.
- **`zod` is not installed.** No analytics/telemetry of any kind (and "audio never leaves device / no signup" are stated product differentiators).
- **Strong test culture:** 384 tests / 31 suites / 2 jest projects (`unit` = ts-jest/Node, `component` = jest-expo/web/jsdom); `coverageThreshold` gates the critical pure-TS files; `tsc --noEmit` clean; CI at `.github/workflows/test.yml` runs typecheck + jest. **UI/component tests stay deliberately sparse while the UX audits are in flux** (`feedback_ui_tests_sparse_until_ux_hardens` memory) — the Practice screen's component tests are a `describe.skip` placeholder for exactly this reason. New pure-TS gets full unit coverage; new screens get ~2–3 component cases matching `coaching.test.tsx`/`explore.test.tsx` density, plus a `// COMPONENT TEST:` cross-ref comment.

---

## 2. Decisions locked (confirmed with the user)

1. **Scope this round = the doc's Slices 1–4 + a "Slice 0" (the presupposed feedback widget + the request/response API + an endpoint that *represents* the agentic backend).** The endpoint is "a Claude-managed agent endpoint with an environment all its own — not a dedicated server at this point": Phase 1 builds the client side of the contract + a local mock resolver + a swappable endpoint adapter, and *specs* (does not deploy) the real Claude-managed agent. The doc's **Slice 6 (capability-extension PR automation) is out** — `requiresNewCapability` responses surface a spec to the user, who adds the slot/outlet with Claude Code.
2. **Manager entry point = a "Customizations" row at the bottom of the Progress tab** (`app/(tabs)/explore.tsx`) — Progress is already the meta/config tab (routine config lives there). The manager documents the `?safeCustomizations=1` URL escape hatch.
3. **Add `zod`** as a top-level dependency (documented in CLAUDE.md's Stack section). Schema-as-contract is the registry's whole point; migrations and the future agent tool-schema generation both want it.
4. **Style overrides = light scheme + bundled fonts only.** Override the light semantic tokens + type-scale multipliers + a couple of role remaps (e.g. bigger note names); font family limited to the 3 bundled families + `system`/`system-serif`. No dark-mode creation, no remote fonts. Protected surfaces (manager, feedback widget, nav chrome, error fallback) opt out of the theming context entirely (`Colors.light` directly), so no override can ever make them unreadable; named palettes are contrast-checked at authoring time and a runtime contrast gate rejects bad custom palettes wholesale.

Also decided (lower-stakes, my recommendations the user can veto):
- `applyAt` taxonomy = **`"boot" | "live"`** (the doc said `"boot"|"live"|"reload"`; the research doc's actual registry used `"boot"|"always"`). `"reload"` is not introduced until a slot needs it. `"boot"` = a screen reads the value once on mount; `"live"` = the screen subscribes and re-renders on change.
- **No telemetry/PostHog in Phase 1.** "Promote to default" is a manual, N=1 review for now. `vocal-training:anonymous-id:v1` is generated lazily in Step 1 (cheap, harmless, ready for when the backend lands) but isn't transmitted anywhere yet.
- **The 9 outlet *insertion points* ship in Step 1** (empty `<CustomizationOutlet name="…"/>` components that render nothing until a recipe exists), so Step 5 (recipes) doesn't touch screen files at all.

---

## 3. Module layout

```
lib/customization/
  registry.ts            # CustomizationDef<T>, CUSTOMIZATION_REGISTRY (all slots), CustomizationSlot, CustomizationValue<S>, registryHash()
  storage.ts             # versioned AsyncStorage loader/writer; legacy-key migration; never-throw; quota-safe; index
  CustomizationProvider.tsx  # React context: loadAll() → effective state; setSlot/resetSlot/disableSlot/deleteSlot; setRecipe/...; diagnostics; safeMode; bootHomeRoute
  useCustomization.ts    # useCustomization(slot) → effective value; useCustomizationManager() → the mutators + diagnostics
  safeMode.ts            # isSafeMode() — web URL flag; native = false (documented gap)
  diagnostics.ts         # buildDiagnostic() for the export button + (future) error-event payloads
  theme.ts               # resolveTheme(base, overrides) → ThemeColors | {ok:false, failures}; PALETTES; wcagContrastRatio()
  type.ts                # resolveTypography(base, fonts, overrides) → {typography, fonts, noteNameMultiplier}; SCALE_MULTIPLIERS; per-role clamps
  contract.ts            # ResolveCustomizationRequest/Response, CustomizationProposal, zod schemas to PARSE the response (defense in depth)
  resolver.ts            # CustomizationResolver interface; MockResolver (local, deterministic); RemoteResolver (fetch EXPO_PUBLIC_RESOLVER_URL)
  recipes/
    schema.ts            # DeclarativeRecipe, RecipeNode union (the 9 primitives), Outlet enum, RecipeAction union, validateRecipe()
    jsonlogic.ts         # tiny no-eval JsonLogic subset (==, !=, and, or, not, var) over a fixed context
    Renderer.tsx         # <RecipeRenderer node context/> → app-owned primitives via useTheme(); per-recipe error boundary
  __tests__/             # registry / storage / safeMode / theme / type / contract / resolver / recipes.* + Provider/Manager/Widget component tests

components/customization/
  FeedbackWidget.tsx     # bottom-right launcher + panel + Apply/Cancel card (uses Colors.light directly — protected)
  CustomizationOutlet.tsx  # renders active recipes for a named outlet (empty no-op until Step 5)

app/customizations.tsx   # the protected manager screen (custom header like coaching-saved.tsx; uses Colors.light directly)
```

Threading:
- **`app/_layout.tsx`**: `<CustomizationProvider><ErrorBoundary><ThemeProvider value={navTheme}><Stack>…<Stack.Screen name="customizations"/></Stack></ThemeProvider></ErrorBoundary></CustomizationProvider>`. `navTheme` stays on `Colors.light` (nav chrome = protected shell, not customizable in v1 — documented scope cut). Splash gate becomes `if (!loaded || !customizationsReady) return null`.
- **`hooks/use-theme.ts` / `use-theme-color.ts`**: read the effective theme from `CustomizationContext`; **fall back to the static light theme when there's no provider** (tests, the error boundary, protected screens). Call sites are unchanged. The two `Colors.light` direct importers (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`) intentionally stay direct — they're protected chrome.
- **Screens** read `useCustomization(slot)`; `"boot"` slots are seeded into `useState(initial)` once, `"live"` slots are used directly so they re-render on change.
- **`<BootRouter/>`** (a tiny component inside `<Stack>`): `useEffect(() => { if (bootHomeRoute !== "/") router.replace(bootHomeRoute) }, [])` — may flash Practice for ~1 frame; acceptable & documented.

---

## 4. Concrete `lib/customization/registry.ts` (starting point)

```ts
import { z } from "zod";
import { ACCOMPANIMENT_PRESETS } from "@/lib/exercises/types"; // confirm exact ids during impl

export interface CustomizationDef<T> {
  schemaVersion: number;
  label: string;            // shown in the manager
  description: string;      // shown on the Apply card + in the manager
  schema: z.ZodType<T>;
  defaultValue: T;
  applyAt: "boot" | "live"; // "boot" = read once on mount; "live" = subscribe & re-render
  /** AsyncStorage key from before this slot existed; the loader migrates it on first boot, then deletes it. */
  legacyKey?: string;
  legacyMigrate?: (raw: string) => T | null;
  /** v(n-1)→v(n) migrator; null = no migrations yet. Returns a valid current value or null (→ default). */
  migrate: ((stored: unknown, fromVersion: number) => T | null) | null;
  defaultRevertCopy: string;
  protected?: boolean;      // reserved; nothing user-settable targets protected surfaces
  deprecated?: boolean;     // loader still respects it; removed in a follow-up PR after ~30 days
}

function def<T>(d: CustomizationDef<T>): CustomizationDef<T> { return d; }

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const TOKEN_NAMES = ["canvas","bgSurface","bgElevated","bgEmphasis","textPrimary","textSecondary","textTertiary","accent","accentHover","success","warning","error"] as const;
const TokenName = z.enum(TOKEN_NAMES);
const TokenRef = z.object({ from: TokenName });
const ThemeOverrides = z.object({
  palette: z.enum(["forest","high-contrast","cool-studio"]).optional(),
  tokens: z.record(TokenName, z.union([Hex, TokenRef])).optional(),
}).strict();
const TypeOverrides = z.object({
  scale: z.enum(["small","standard","large","extra-large"]).optional(),
  noteNameSize: z.enum(["standard","large","huge"]).optional(),
  bodyFamily: z.enum(["general-sans","system"]).optional(),
  displayFamily: z.enum(["fraunces","system-serif"]).optional(),
}).strict();

export const CUSTOMIZATION_REGISTRY = {
  "home-route": def({
    schemaVersion: 1, label: "Default screen on app open",
    description: "Land on a different screen at launch instead of Practice.",
    schema: z.enum(["/", "/explore", "/coaching"]), defaultValue: "/",
    applyAt: "boot", migrate: null, defaultRevertCopy: "Reset to Practice",
  }),
  "default-voice-part": def({
    schemaVersion: 1, label: "Default voice part",
    description: "The voice-part picker starts on this selection.",
    schema: z.enum(["soprano","alto","tenor","baritone"]), defaultValue: "tenor",
    applyAt: "boot", legacyKey: "vocal-training:voice-part:v1",
    legacyMigrate: (r) => (["soprano","alto","tenor","baritone"].includes(r) ? r as any : null),
    migrate: null, defaultRevertCopy: "Reset to tenor",
  }),
  "default-mode": def({
    schemaVersion: 1, label: "Default practice mode",
    description: "Start in Standard or Guided mode.",
    schema: z.enum(["standard","guided"]), defaultValue: "standard",
    applyAt: "boot", legacyKey: "vocal-training:mode:v1",
    legacyMigrate: (r) => (r === "guided" ? "guided" : "standard"),
    migrate: null, defaultRevertCopy: "Reset to Standard",
  }),
  "default-accompaniment-preset": def({
    schemaVersion: 1, label: "Default accompaniment",
    description: "The accompaniment the picker starts on each session.",
    schema: z.enum([/* …ACCOMPANIMENT_PRESETS ids…, */ "off"] as any), defaultValue: "classical" as any,
    applyAt: "boot", migrate: null, defaultRevertCopy: "Reset to classical",
  }),
  "default-guided-tolerance": def({
    schemaVersion: 1, label: "Default Guided tolerance",
    description: "Cents threshold for hold-and-match in Guided mode.",
    schema: z.enum(["25","50","75","100"]), defaultValue: "50",
    applyAt: "boot", legacyKey: "vocal-training:guided-tolerance:v1",
    legacyMigrate: (r) => (["25","50","75","100"].includes(r) ? r as any : null),
    migrate: null, defaultRevertCopy: "Reset to ±50¢",
  }),
  "demo-on-by-default": def({
    schemaVersion: 1, label: "Play demo before each pattern",
    description: "Demo-playback default on Practice startup.",
    schema: z.boolean(), defaultValue: true, // matches current code default
    applyAt: "boot", legacyKey: "vocal-training:settings:demo-enabled",
    legacyMigrate: (r) => (r === "false" ? false : true),
    migrate: null, defaultRevertCopy: "Reset to on",
  }),
  "click-track-on-by-default": def({
    schemaVersion: 1, label: "Lead-in click track on by default",
    description: "Whether the lead-in clicks play before each pattern.",
    schema: z.boolean(), defaultValue: true,
    applyAt: "boot", migrate: null, defaultRevertCopy: "Reset to on",
  }),
  "lead-in-count": def({
    schemaVersion: 1, label: "Lead-in click count",
    description: "Number of click-track ticks before each pattern.",
    schema: z.enum(["0","1","2","3","4"]), defaultValue: "2",
    applyAt: "boot", migrate: null, defaultRevertCopy: "Reset to 2",
  }),
  "show-staff-notation": def({
    schemaVersion: 1, label: "Show staff notation",
    description: "The SMuFL staff above the syllable strip.",
    schema: z.boolean(), defaultValue: true,
    applyAt: "live", migrate: null, defaultRevertCopy: "Reset to on",
  }),
  "headphones-confirm-mode": def({
    schemaVersion: 1, label: "Headphones prompt",
    description: "Always ask, ask once per session, or never ask.",
    schema: z.enum(["always","session","never"]), defaultValue: "session",
    applyAt: "boot", migrate: null, defaultRevertCopy: "Reset to once per session",
  }),
  "ui-density": def({
    schemaVersion: 1, label: "UI density",
    description: "Spacing on the Practice and Coaching surfaces.",
    schema: z.enum(["compact","standard","comfortable"]), defaultValue: "standard",
    applyAt: "live", migrate: null, defaultRevertCopy: "Reset to standard",
  }),
  "theme-overrides": def({
    schemaVersion: 1, label: "Theme",
    description: "Custom colors. Falls back to the default theme if contrast checks fail.",
    schema: ThemeOverrides, defaultValue: {},
    applyAt: "live", migrate: null, defaultRevertCopy: "Reset to the default theme",
  }),
  "type-overrides": def({
    schemaVersion: 1, label: "Text size & fonts",
    description: "Type scale, note-name size, and font family (bundled fonts only).",
    schema: TypeOverrides, defaultValue: {},
    applyAt: "live", migrate: null, defaultRevertCopy: "Reset to the default text settings",
  }),
} as const satisfies Record<string, CustomizationDef<any>>;

export type CustomizationSlot = keyof typeof CUSTOMIZATION_REGISTRY;
export type CustomizationValue<S extends CustomizationSlot> = z.infer<(typeof CUSTOMIZATION_REGISTRY)[S]["schema"]>;

/** Stable hash of {slot,schemaVersion} pairs — for the diagnostic export and (future) registry-drift detection by the agent. */
export function registryHash(): string { /* sort entries, JSON.stringify {slot,schemaVersion}[], sha-ish */ }
```

13 slots (cap is 30). `diagnose-iteration-cap` (from the research doc) is *not* shipped — easy add later if wanted. Confirm the `ACCOMPANIMENT_PRESETS` ids and the `/coaching` route literal during implementation.

---

## 5. Storage & loader spec (`lib/customization/storage.ts`)

Keys: `vocal-training:user-customization:<slot>:v<schemaVersion>`, `vocal-training:user-recipe:<recipeId>:v<schemaVersion>`, `vocal-training:customization-index:v1`, `vocal-training:anonymous-id:v1`.

- **`customization-index:v1`** is the single source of truth for *what's active*: `{ slots: Record<slot, { enabled: boolean; schemaVersion: number; invalid?: true }>, recipes: Record<recipeId, { enabled: boolean; schemaVersion: number; outlet: string; invalid?: true }> }`. The per-slot value keys hold the data; the index holds the on/off + bookkeeping.
- **`loadAll()`** (never throws):
  1. ensure `anonymous-id` exists (generate a UUID if not).
  2. for each registry slot:
     - if a `legacyKey` exists and the current-version key does *not* → read `legacyKey`, run `legacyMigrate`, if it yields a valid value write it to `…:<slot>:v<schemaVersion>` and `AsyncStorage.removeItem(legacyKey)`.
     - scan for the highest `…:<slot>:v*` key present; if `fromVersion < schemaVersion` run `migrate`; if it yields a valid value, write the new key + delete the old; if `migrate` returns `null` → treat as no value.
     - validate the (possibly migrated) value against `schema`. On any failure → use `defaultValue` and set `index.slots[slot].invalid = true`.
  3. load recipes analogously (validate via `validateRecipe`; failures → `invalid`, excluded from effective state).
  4. build **effective state**: for each slot, if `index.slots[slot].enabled === false` → `defaultValue`; else the stored/migrated value (or `defaultValue` if absent/invalid). If `isSafeMode()` → every slot = `defaultValue`, every recipe excluded.
  5. compute `bootHomeRoute = effective["home-route"]`.
- **Mutators** (`setSlot`, `resetSlot` (= delete the value key + set `enabled:true`), `disableSlot` (= keep value, `enabled:false`), `deleteSlot` (= delete value key + index entry); analogous `setRecipe`/`removeRecipe`/`disableRecipe`; `disableAll` = set every `enabled:false`): validate → write the value key → update the index → return the new effective state. Use a `safeSetItem` quota wrapper (copy the small function from `lib/progress/storage.ts` — duplication beats a premature shared util) and a promise mutex for index writes.
- **`prune()`** (maintenance, *not* run on every boot): scan `vocal-training:user-customization:*` and `…user-recipe:*`, remove any whose slot/recipe isn't in the current registry or whose version is below the current; called only from the manager's "clean up storage" action. (Deferred per research-doc Q9 but the function ships now.)
- Mirrors the project's existing discipline: never throw, fall back to default, best-effort write-back of migrations, quota-safe writes, friendly "storage full" message.

---

## 6. Build sequence

Hard dependency chain: **Step 1 → Step 2 → Step 3**; Step 4 needs Step 1 (more useful after 2–3); Step 5 needs Steps 1 + 4. Shippable checkpoints: after Step 3 (a working *manual* personalization engine) or after Step 4 (+ the conversational loop); Step 5 (recipes) is a fast-follow. Every step's PR keeps `CLAUDE.md` + `ROADMAP.md` (+ the near-copy `AGENTS.md`) in sync as part of the slice — Architecture map, "What works" list, test count, ROADMAP shipped/next — per the project's docs-in-the-PR rule.

### Step 1 — Customization kernel  *(≈ doc Slice 1)*

**Goal:** the foundation everything else writes into; a working protected manager screen; the 9 outlet insertion points (no-ops for now).

**Add:**
- `package.json`: `zod` (dep). `expo-clipboard` (tiny, for the manager's "export diagnostic" — or use `navigator.clipboard.writeText` on web with a copy-from-`TextInput` fallback; `expo-clipboard` is the RN-idiomatic, Expo-blessed choice — decide during impl).
- `lib/customization/registry.ts` (full slot list from §4 — all 13 slots, including `theme-overrides`/`type-overrides`, which Step 3 wires up).
- `lib/customization/storage.ts` (§5).
- `lib/customization/safeMode.ts`, `diagnostics.ts`, `CustomizationProvider.tsx`, `useCustomization.ts`.
- `components/customization/CustomizationOutlet.tsx` — renders `null` until Step 5.
- `app/customizations.tsx` — the protected manager (custom header like `coaching-saved.tsx`; uses `Colors.light` directly, *never* `useTheme()`). Sections: (a) active customizations list — per row: label, current value, `Reset to default` / `Disable` / `Delete`, an "invalid value — reverted to default" warning, a "needs reload" badge for `applyAt:"reload"` (none yet — the affordance exists); (b) `Disable all customizations` panic button; (c) `Export diagnostic info` (copies the `buildDiagnostic()` JSON); (d) safe-mode instructions incl. `?safeCustomizations=1`; (e) (stub) "Ask the assistant to change something →" — disabled link until Step 4. The active-recipes section is added in Step 5.
- A minimal `ErrorBoundary` in `app/_layout.tsx`: on render error, show a plain un-themed screen — "Something went wrong" + `Reset all customizations` + `Reload` + `Copy diagnostic info`. (The project has no error boundary today; this is the protected-kernel "fatal-error fallback".)

**Change:**
- `app/_layout.tsx`: wrap `<Stack>` in `<CustomizationProvider>` + `<ErrorBoundary>`; gate the splash on `loaded && customizationsReady`; add `<Stack.Screen name="customizations" options={{ headerShown:false }}/>`; add a `<BootRouter/>` child that `router.replace`s if `bootHomeRoute !== "/"`. `navTheme` stays on `Colors.light`.
- `app/(tabs)/explore.tsx`: add a "Customizations" row at the bottom that `router.push("/customizations")`.
- Add the 9 `<CustomizationOutlet name="…"/>` insertion points to `app/(tabs)/index.tsx` (`practice.console.before-start`, `practice.console.after-start`, `practice.staff.above`, `practice.staff.below`, `practice.results.after-summary`), `app/(tabs)/explore.tsx` (`progress.top`, `progress.after-routine`), `app/(tabs)/coaching.tsx` (`coaching.after-headline`, `coaching.after-causes`). They render nothing until Step 5.

**Decisions:** outlet insertion points ship now (so Step 5 doesn't touch screens); the manager + feedback widget + nav chrome + error fallback are "protected" by *opting out of the theming context* (`Colors.light` directly) — the simplest possible "can't be made unreadable"; `anonymous-id` generated lazily, not transmitted; `prune()` ships but isn't called on boot.

**Tests:** `registry.test.ts` (every slot: write→read round-trip, default-when-empty, default-when-invalid, migrate-if-applicable — the §research-Q10 bar), `storage.test.ts` (loader never throws on garbage; index disable/enable/delete; `disableAll`; `prune()` removes orphans; quota error → friendly message; `anonymous-id` generated once and reused), `safeMode.test.ts` (URL flag detection; safe mode → all defaults), `CustomizationProvider.test.tsx` (component, jest-expo/web: renders fallback then children once loaded; `setSlot` updates effective state; `home-route` boot redirect fires via the mock router), `app/__tests__/customizations.test.tsx` (~2 cases: renders the active list; "disable all" clears effective state). Extend `coverageThreshold` to `registry.ts` + `storage.ts`. `// COMPONENT TEST:` cross-ref comments on `app/customizations.tsx` and `CustomizationProvider.tsx`.

**QA:** web — open `/customizations`, toggle a slot's enabled flag, reset it, "disable all", export the diagnostic JSON; visit `?safeCustomizations=1` and confirm the manager still renders and says safe mode is active; force a render error and confirm the error fallback shows.

### Step 2 — Existing prefs → slots  *(≈ doc Slice 2)*

**Goal:** the registry actually controls the existing preferences; old keys migrate transparently.

**Change:**
- `lib/settings/voicePart.ts` → either delete it and have callers use `useCustomization("default-voice-part")` / `setSlot`, **or** keep it as a thin wrapper over `getSlot`/`setSlot` (less churn — decide during impl; lean wrapper).
- `app/(tabs)/index.tsx` (the 1758-line Practice screen — *do this carefully*): replace the inline `AsyncStorage.getItem(MODE_STORAGE_KEY)` / `DEMO_ENABLED_KEY` mount-effect reads with `useCustomization("default-mode")` / `useCustomization("demo-on-by-default")` seeded into `useState`; `handleSetMode`/`handleSetDemoEnabled` call `setSlot(...)`. Wire `default-voice-part` (replace `loadVoicePart`/`saveVoicePart`), `default-accompaniment-preset` (currently `useState("classical")`), `show-staff-notation` (currently the staff always renders → guard `<MelodyDisplay/>` with the slot), `ui-density` (currently fixed → map `compact/standard/comfortable` to a between-sections spacing multiplier on this screen + Coaching only — explicitly *not* global), `lead-in-count` + `click-track-on-by-default` (currently lead-in is always 2 ticks except Classical → respect the slot), `home-route` (the redirect is in `<BootRouter/>` from Step 1 — nothing here).
- `components/practice/GuidedSession.tsx`: `TOLERANCE_STORAGE_KEY` reads → `useCustomization("default-guided-tolerance")` + `setSlot` on change.
- `components/practice/HeadphonesBanner.tsx`: gate the modal on `useCustomization("headphones-confirm-mode")` — `"never"`→never, `"always"`→always, `"session"`→existing behavior (the session flag stays as runtime state).
- `app/(tabs)/coaching.tsx`: nothing unless `diagnose-iteration-cap` is later added.

**Tests:** migration tests in `storage.test.ts` (legacy key present → migrated value written, legacy key deleted; legacy key garbage → default; both keys present → new wins, legacy deleted) for each of `default-voice-part`, `default-mode`, `demo-on-by-default`, `default-guided-tolerance`. The screen-integration changes are **not** component-tested (Practice is `describe.skip` — keep it that way per the memory); the migration + `getSlot`/`setSlot` round-trips are fully unit-tested.

**QA:** web — confirm an existing install's voice-part/mode/demo/tolerance survive the upgrade (seed the old keys in localStorage, reload, check the new keys exist and the old ones are gone, settings unchanged); toggle each new slot from the manager and confirm Practice reacts (`live` ones immediately, `boot` ones on reload); `home-route` redirect works (note the ~1-frame Practice flash).

### Step 3 — Style overrides  *(≈ doc Slice 3)*

**Goal:** `theme-overrides` + `type-overrides` work; `useTheme()` becomes context-backed (with a static fallback so nothing breaks outside the provider).

**Add:**
- `lib/customization/theme.ts`: `resolveTheme(base = Colors.light, overrides) → ThemeColors | { ok:false, failures }` — start from `Colors.light`; apply a named `palette` preset if set (`PALETTES = { forest, "high-contrast", "cool-studio" }` — small hand-tuned, contrast-checked-at-authoring token sets); apply `tokens` on top (resolve `{from}` refs against the already-merged map); derive `accentMuted` from the final `accent` (10% alpha) and `accentOnEmphasis` from `accent` (a brighter shade); keep shipped values for `borderSubtle`/`borderStrong`/`borderOnEmphasis`/`textOnEmphasis*` unless overridden. **Contrast gate** (`wcagContrastRatio()` — ~15-line WCAG relative-luminance helper, no dep): check `textPrimary↔canvas` (≥7), `textPrimary↔bgSurface` (≥7), `textOnEmphasis↔bgEmphasis` (≥10), `accent↔canvas` (≥4.5) against the DESIGN.md thresholds; **any failure → the whole `theme-overrides` slot is treated invalid → revert to `Colors.light`, mark invalid in diagnostics** (all-or-nothing; partial application is a rabbit hole).
- `lib/customization/type.ts`: `resolveTypography(base = Typography, fonts = Fonts, overrides) → { typography, fonts, noteNameMultiplier }` — `scale` multiplier (`small` 0.9 / `standard` 1.0 / `large` 1.15 / `extra-large` 1.3) applied to every `Typography.*.size` + `lineHeight`, then clamped per role (e.g. `xs` ∈ [10,16], `display` ∈ [48,110]); `noteNameSize` → `noteNameMultiplier` (`standard` 1.0 / `large` ≈ next tier / `huge` ≈ two tiers) consumed only by the note-name display components; `bodyFamily`/`displayFamily` remap `Fonts.body`/`Fonts.display` (`general-sans`/`fraunces` = shipped; `system` = `Platform.OS==='web' ? 'system-ui' : 'System'`; `system-serif` = `Georgia, serif` / `Georgia`). No remote fonts.

**Change:**
- `hooks/use-theme.ts`: `const ctx = useContext(CustomizationContext); return ctx?.effectiveTheme ?? STATIC_LIGHT_THEME;` — where the provider computes `effectiveTheme = { scheme:'light', colors: resolveThemeOrFallback(...), fonts: resolvedFonts, typography: resolvedTypography, spacing: densityAdjustedSpacing, radii, motion, noteNameMultiplier }`. `hooks/use-theme-color.ts` likewise (`ctx?.effectiveTheme.colors[name] ?? Colors.light[name]`). **No call-site changes.** The two `Colors.light` direct importers (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`) stay direct — protected chrome.
- Note-name display components (`components/SyllableDisplay.tsx`, the tonic display in `app/(tabs)/index.tsx`, `components/practice/NoteChip.tsx`, etc. — grep for the note-name `Fonts.display` usages): multiply their font size by `theme.noteNameMultiplier`.
- `app/customizations.tsx`: add a minimal **Theme** section (3 named-palette chips + a "custom (set via the assistant)" indicator + `Reset to the default theme`) and a **Text size** section (4-chip scale picker + a note-name-size picker + `Reset`) — so style overrides are usable without the feedback widget. No free-form hex editor in the manager (that's the widget's job in Step 4, or `setSlot` from devtools).

**Tests:** `theme.test.ts` (hex regex; `{from}` ref resolution; **all 3 named palettes pass the contrast gate**; a custom override that fails contrast → `{ok:false}` and the resolver/loader reverts to `Colors.light`; `accentMuted`/`accentOnEmphasis` derived correctly), `type.test.ts` (scale multipliers + per-role clamps; family remapping incl. `system`/`system-serif`; `noteNameSize` tiers), `use-theme.test.ts` (returns the static light theme with no provider; returns the merged theme inside the provider; falls back to `Colors.light` when `theme-overrides` is invalid). Component: extend `app/__tests__/customizations.test.tsx` with ~1 case (selecting a named palette updates effective theme). Extend `coverageThreshold` to `theme.ts` + `type.ts`. **No Practice-screen theme-reactivity component tests** (Practice is skip — manual web QA covers it).

**QA:** web — pick each named palette from the manager and confirm the Practice/Coaching/Progress surfaces re-skin while the manager itself stays on the default palette; `setSlot("theme-overrides", { tokens: { canvas: "#0a0a0a", textPrimary: "#0b0b0b" }})` from devtools and confirm it's rejected (contrast gate) and the manager flags it invalid; bump the type scale to `extra-large` and confirm text grows but stays within the clamps and the layout doesn't break; switch `bodyFamily` to `system` and confirm fallback works.

### Step 4 — Feedback loop (the user's "Slice 0": widget + API + mock resolver)  *(≈ doc Slice 5 + the presupposed widget)*

**Goal:** the conversational front end — ask for a change, get a validated Apply/Cancel card; a swappable endpoint so the real Claude-managed agent drops in later with a one-line config change.

**Add:**
- `lib/customization/contract.ts`: the shared types (`ResolveCustomizationRequest` = `{ message, anonId, appVersion, platform, route, registryHash, recipeSchemaVersion, activeCustomizations: {id,type,target,enabled,version}[], context? }`; `ResolveCustomizationResponse` = `{kind:"proposal", proposal}` | `{kind:"clarification", question, choices: string[]}` | `{kind:"requiresNewCapability", proposal: CapabilityProposal}` | `{kind:"reject", rationale}`; `CustomizationProposal` = `{ id, summary, confirmationCopy, requiresReload, slotUpdates?: {slot,value}[], recipes?: DeclarativeRecipe[], validation: {schemaValid, protectedSurfaceSafe, designSafe, dryRunPassed} }`). Plus **zod schemas to parse the response client-side** — defense in depth: never trust the endpoint blindly; validate every `slotUpdate.value` against the *slot's own* schema and every recipe via `validateRecipe` before showing an Apply card; if any fails, reject the whole proposal and show "the assistant proposed something invalid — try rephrasing."
- `lib/customization/resolver.ts`:
  - `interface CustomizationResolver { resolve(req): Promise<ResolveCustomizationResponse> }`.
  - `MockResolver` — local, deterministic; the "endpoint that represents the agentic backend". Pattern-matches a handful of phrasings: "green theme / forest" → `theme-overrides` palette proposal; "bigger note names" → `type-overrides {noteNameSize:"huge"}`; "start me on coaching / progress" → `home-route`; "hide staff" → `show-staff-notation:false`; "default to alto/soprano/…" → `default-voice-part`; "ask once about headphones" → `headphones-confirm-mode:"session"`; "metronome / BPM readout above the staff" → a `practice.staff.above` recipe (added in Step 5); unrecognized → `{kind:"requiresNewCapability", proposal: <spec stub>}` or `{kind:"clarification"}`. It runs the *same* client-side validation as the real resolver's output, so the Apply card is identical regardless of source.
  - `RemoteResolver` — `fetch(RESOLVER_ENDPOINT_URL, {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(req)})` → parse → validate. `RESOLVER_ENDPOINT_URL = process.env.EXPO_PUBLIC_RESOLVER_URL`; **unset → use `MockResolver`** (dev default). When set, it points at "a Claude-managed agent endpoint with an environment all its own" (see §7) — the client treats it as a black box behind the contract.
- `components/customization/FeedbackWidget.tsx` — a small floating launcher at the bottom-right (mounted as an overlay sibling in `app/(tabs)/_layout.tsx`; **part of the protected kernel — can't be hidden/restyled by customizations; uses `Colors.light` directly**). Tapping opens a panel: a `TextInput` ("What would you like to change?") + send. On send → `resolver.resolve(buildRequest())` → render:
  - `proposal` → an Apply/Cancel card: summary, `confirmationCopy`, a "takes effect next launch" note for `boot`-only slots (and for `home-route`, a "go there now" affordance), the list of slot updates / recipes it'll apply, and the `validation` checkmarks. **Apply** → `setSlot(...)` for each update (+ `setRecipe(...)` in Step 5) → close → `live` ones take effect immediately, `boot` ones show a toast.
  - `clarification` → the question + choice chips; picking one re-submits with the choice appended.
  - `requiresNewCapability` → "This needs a new customization surface — here's what it'd take: «spec». [Copy spec]" (hand it to Claude Code).
  - `reject` → the rationale, plainly.
- `app/(tabs)/_layout.tsx`: mount `<FeedbackWidget/>` as an overlay (and add it to the protected-kernel list — recipes/theme can't target it).
- Cross-links: the manager → "Ask the assistant to change something →" (now enabled); the widget → "Manage your customizations →".

**Tests:** `contract.test.ts` (a valid proposal parses; a proposal whose `slotUpdate.value` is out-of-schema is rejected; clarification/reject parse; a malformed response → safe "couldn't understand" path), `resolver.test.ts` (`MockResolver`: "green theme" → a valid `theme-overrides` proposal that passes client-side validation; gibberish → `requiresNewCapability`; *every* `MockResolver` proposal passes validation), `FeedbackWidget.test.tsx` (component, ~3 cases: type a request → Apply card appears → Apply → `setSlot` called → effective state updated, using the DI'd mock resolver; a `clarification` flow; a `reject` shows the rationale). `// COMPONENT TEST:` cross-ref on `FeedbackWidget.tsx`. Extend `coverageThreshold` to `contract.ts` + `resolver.ts`.

**QA:** web — open the widget, type "make it a forest green theme" → Apply → confirm the surfaces re-skin and the manager shows the override; type "start me on Progress" → Apply → confirm next launch lands on Progress; type something nonsensical → confirm a graceful clarification or capability-spec response; confirm the widget is unaffected by an active theme override.

### Step 5 — Declarative recipes  *(≈ doc Slice 4 — heaviest; last)*

**Goal:** recipes can insert small app-owned panels into the 9 approved outlets, with hide/show, labels, callouts, allowlisted actions, and a no-eval conditional subset.

**Add:**
- `lib/customization/recipes/schema.ts`: `DeclarativeRecipe = { id, schemaVersion, outlet: Outlet, condition?: JsonLogicNode, body: RecipeNode }`. `RecipeNode` = discriminated union over `{type:"Text"|"Stack"|"InlineStat"|"Button"|"Divider"|"Callout"|"Toggle"|"NoteName"|"ProgressDots", …props}` — all props plain data; `Text.content` is a plain string rendered as inert text (RN has no `dangerouslySetInnerHTML` equivalent — part of why this is safe). `Outlet = z.enum([the 9])`. `RecipeAction = z.discriminatedUnion("action", [navigate({to}), setSlot({slot,value}) — value validated against the slot's schema, toggleRecipe({recipeId}), openCustomizations(), openFeedback()])`. **No images in Phase 1** (deferred per the doc's open question). `validateRecipe(recipe) → { schemaValid, outletKnown, protectedSurfaceSafe (outlet ∉ protected — none of the 9 are), noRawCode (jsonlogic ops allowlisted; no script-ish strings), sizeOk (serialized < ~8 KB), dryRunRendered (renders to react-test-renderer without throwing) }` — the resolver won't return a recipe unless this passes; the loader won't load a stored recipe that fails; the manager can show & delete one that's now failing.
- `lib/customization/recipes/jsonlogic.ts`: a tiny no-eval subset — `{"==":[a,b]}`, `{"!=":[…]}`, `{"and":[…]}`, `{"or":[…]}`, `{"not":x}`, `{"var":"path"}` over a fixed context `{ route, platform, slots: {…effective…} }`. ~40 recursive lines; never `eval`/`Function`/`new Function`; any operator not in the allowlist → reject at parse time; depth-limited so adversarial nesting terminates.
- `lib/customization/recipes/Renderer.tsx`: `<RecipeRenderer node context/>` — `switch (node.type)`, render the corresponding *app-owned* primitive using `useTheme()` tokens (recipes are *content* — they can be themed; they can't target *chrome* — enforced by the outlet allowlist). Primitives are thin wrappers: `Text`→`<ThemedText>`, `Stack`→a flex `View`, `InlineStat`→a label+value pair, `Button`→the existing button component, `Divider`→a hairline, `Callout`→the DESIGN.md banner pattern, `Toggle`→a switch wired to `setSlot`/`toggleRecipe`, `NoteName`→the note-name component (respects `noteNameMultiplier`), `ProgressDots`→the routine dot-bar component. Actions dispatch through `dispatch(action)` doing the allowlisted thing. **Per-recipe error boundary** — a recipe that throws while rendering is caught, dropped, and marked invalid in diagnostics.
- `components/customization/CustomizationOutlet.tsx` (was a no-op since Step 1): now reads the active recipes for its `name` from the provider, filters by `validateRecipe` + the `condition`, and renders each via `<RecipeRenderer>`.
- Extend `MockResolver` (Step 4) with one recipe example ("add a metronome BPM readout above the staff" → an `InlineStat` recipe at `practice.staff.above`) so the path is exercised end-to-end.
- `app/customizations.tsx`: add the active-recipes section (per row: outlet, a "what it does" summary, `Disable`/`Delete`, invalid-warning).

**Tests:** `recipes/schema.test.ts` (a valid recipe parses; unknown outlet rejected; a *protected* outlet rejected — test the mechanism with a synthetic protected outlet; oversized rejected; a `Text.content` containing a `<script>`-ish string is *allowed* but the renderer renders it as inert text — assert nothing executes; a `setSlot` action with an out-of-schema value rejected; `validateRecipe` flags each failure mode), `recipes/jsonlogic.test.ts` (each allowed op; `{"var":"slots.ui-density"}` resolution; an unknown op → reject; deep nesting still terminates), `recipes/Renderer.test.tsx` (~2-3 cases: each primitive renders; a recipe whose render throws is caught and dropped; an action dispatch calls the right thing; `<CustomizationOutlet>` renders an active recipe and skips a condition-false one). Extend `coverageThreshold` to `recipes/schema.ts` + `recipes/jsonlogic.ts`. `// COMPONENT TEST:` cross-ref on `CustomizationOutlet.tsx`.

**QA:** web — install a recipe via the widget ("metronome readout above the staff") → confirm it appears at `practice.staff.above`, respects its condition, can be disabled/deleted from the manager, and that a deliberately-malformed recipe (set via devtools) is rejected by the loader and flagged invalid; confirm a recipe with a script-ish `Text.content` renders the text literally.

---

## 7. The resolver endpoint (the "agentic backend" — spec'd here, deployed later)

Phase 1 ships the **client** (`contract.ts` + `resolver.ts` + the widget) and a **local mock**. The real endpoint is "a Claude-managed agent endpoint with an environment all its own — not a dedicated server": an Anthropic-hosted agent (Claude Agent SDK / managed agent) reachable at `EXPO_PUBLIC_RESOLVER_URL`, which:

- receives `ResolveCustomizationRequest` (POST JSON);
- has, as cached system context: the **registry manifest** (slot names, schemas as JSON Schema via `zodToJsonSchema` over the registry, defaults, `applyAt`, `protected`), the **recipe schema** + the **9-outlet manifest**, the **protected-surface rules**, the **design-token rules** (the allowed 12 token names + the contrast thresholds + "no gradients/blobs/raw CSS", lifted from DESIGN.md), and `appVersion`/`platform`/`registryHash` from the request;
- runs the two-stage flow from `AUTONOMOUS_FEEDBACK_LOOP_RESEARCH.md` + `CUSTOMIZATION_REGISTRY_RESEARCH.md §4/§9`: a cheap **triage** model with strict tool output (`apply_customization` — a discriminated union over the registry; `propose_recipe`; `clarify`; `propose_new_capability` with a `popularityEstimate` gate per research-doc Q7; `reject_with_rationale` — distinctly named per research-doc §8's wrong-tool-selection lesson), then a **bedrock-principles judge** (the prompt in research-doc §9: hard-rejects upsell/auth/native-only/server-side-writes; flags ad/social/telemetry-join) on every non-reject result;
- returns the structured `ResolveCustomizationResponse`. It **never** returns executable code to the client. Abuse defense (Turnstile, per-`anonId` rate-limit, cost cap) lives at the endpoint, not the client.

The client validates everything the endpoint returns against the slot schemas + `validateRecipe` regardless (defense in depth). Swapping the mock for the real endpoint is setting one env var. (Out of scope for this round: standing up that endpoint, and the doc's Slice 6 — turning `requiresNewCapability` into an auto-opened draft PR; in v1 the user adds the slot/outlet by hand with Claude Code.)

---

## 8. Risks & watch-items

1. **The `useTheme()` context refactor (Step 3).** Keep the static-light fallback so nothing breaks outside the provider (tests, error boundary, protected screens). Verify nothing imports `Colors.light` directly except the two protected-chrome files; those stay direct *by design*. The tab bar's module-level `c = Colors.light` is fine — it's protected chrome.
2. **Step 2 surgery on the 1758-line Practice screen.** The pure logic (migrations, `getSlot`/`setSlot`) is unit-tested; the screen integration can't be component-tested (Practice is `describe.skip`, and per the memory it stays that way until the UX audits land). Manual web QA is mandatory per the project's "test the UI in a browser" rule. Don't take the opportunity to refactor the screen — wire the slots in and stop.
3. **`home-route` boot redirect flashes Practice for ~1 frame.** Expo Router's `unstable_settings.anchor` doesn't cleanly support a conditional initial route; the `<BootRouter/>` `router.replace` is the pragmatic choice. Documented, acceptable for v1.
4. **The recipe renderer (Step 5) is the largest new surface.** Keep the primitive set to exactly the 9 named; no `dangerouslySetInnerHTML`-equivalents (RN has none — lean on that); per-recipe error boundaries; the JsonLogic subset is allowlist-only and depth-limited; `validateRecipe` gates the resolver, the loader, *and* the renderer. If Step 5 starts ballooning, it's the natural cut point — Steps 1–4 ship a complete personalization engine + conversational loop without it.
5. **`zod` bundle size.** ~13 KB gz for the parts we use; tree-shakeable; one new top-level dep — document it in CLAUDE.md's Stack section with the rationale (schema-as-contract; migration safety; future agent tool-schema generation).
6. **Native safe-mode.** `?safeCustomizations=1` is web-only; native has no URL. The never-throw loader means a bad *value* can't brick boot (it falls back to default) — only a loader/provider *bug* could, and the error boundary catches render errors. Documented gap; revisit if/when iOS work resumes (which the `project_ios_deferred_pwa_first` memory says is on hold indefinitely).
7. **Docs drift.** Every step's PR updates `CLAUDE.md` (Architecture map, "What works", test count, Stack section for `zod`), `ROADMAP.md` (shipped/next), and the near-copy `AGENTS.md` — per the project's docs-in-the-PR rule, not as a follow-up.

---

## 9. Open questions still to settle (smaller than the §2 set)

- **Manager `Export diagnostic info` clipboard mechanism** — `expo-clipboard` (tiny new dep, RN-idiomatic) vs. `navigator.clipboard.writeText` on web + a copy-from-`TextInput` fallback. Lean: `expo-clipboard`.
- **`lib/settings/voicePart.ts`** — delete (callers move to `useCustomization`) vs. keep as a thin wrapper over `getSlot`/`setSlot`. Lean: wrapper, to minimize churn in Step 2; revisit if it earns its keep.
- **`ui-density` reach** — confirmed "Practice + Coaching between-sections spacing only" in this plan. If the user wants it to also affect Progress or modals, that's a small extension; flag it during Step 2.
- **Named palettes** — which 3 (`forest` / `high-contrast` / `cool-studio` are the working names)? Each needs hand-tuning + a contrast pass at authoring time. Could be 2, could be 4 — decide when building Step 3's `PALETTES`.
- **Should the manager get a free-form hex editor in v1**, or is "3 named palettes + reset; custom hex only via the assistant/devtools" enough? Lean: the latter — a hex picker is fiddly UI for a feature with one user; the assistant covers it.
- **`diagnose-iteration-cap` slot** — ship it now (it's in the research doc's registry, not the Phase-1 doc's list) or leave it as an easy later add? Lean: later add.
