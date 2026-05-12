# Customization Registry Phase 1

> Plan for user-specific app customization through the bottom-right AI feedback assistant.
> Created for later review and implementation.

## Summary

Build the customization system as a root-level, web-first personalization layer with three increasing levels of power:

1. Typed registry slots for known preferences.
2. Declarative recipes that can alter approved UI outlets, behavior toggles, copy, layout, theme values, and simple conditional logic.
3. Future web-only signed plugins for deeper monkey patching, added after the safe customization kernel is proven.

Phase 1 should ship levels 1 and 2. This does not block arbitrary monkey patching later. It creates the foundation that deeper runtime patching will need anyway: early boot loading, versioned storage, capability manifests, validation, safe mode, and an immutable customization manager.

The key architectural rule is that the app can only be changed dynamically through known customization surfaces. If a user asks for something outside those surfaces, the agent opens a draft PR that adds the missing surface. Once merged, future users can customize that same thing without a code change.

## Decision Bar

The scaled-down decision does not bar future arbitrary monkey patching. It intentionally separates the layers:

- Phase 1: safe, declarative, cross-platform personalization.
- Phase 2: richer declarative primitives and more outlets.
- Phase 3: web-only signed plugin modules, if the product needs true runtime code extension.

The "foundational" pieces are identical across all three phases:

- A root `CustomizationProvider` loaded before the app renders.
- A versioned local store for customization records.
- A capability manifest that tells the agent what can be changed.
- A protected Customizations screen that always remains reachable.
- A safe mode that disables every customization except the manager and feedback widget.
- A validation harness that proves a customization can load before it is offered to the user.

The main thing Phase 1 refuses is executing arbitrary agent-written JavaScript directly inside the production app. That is a safety and App Store compatibility boundary, not a dead end.

## User-Facing Flow

1. User opens the bottom-right assistant and asks for a change, such as:
   - "Make the app use a deep green theme."
   - "Make the note names bigger."
   - "Start me on Coaching instead of Practice."
   - "Hide staff notation on the Practice screen."
2. Client posts the request plus route, platform, app version, anonymous ID, registry hash, active customization metadata, and current capability manifest version.
3. Backend triage returns one of:
   - `proposal`: one or more validated slot changes or recipes.
   - `clarification`: one short question if the request is materially ambiguous.
   - `requiresNewCapability`: a draft PR should add a new outlet, primitive, or registry slot.
   - `reject`: the request violates project principles.
4. App shows an Apply/Cancel card.
5. On Apply, the app writes the customization locally and applies it immediately when possible.
6. User can later visit Customizations to disable, delete, reset, or export diagnostic JSON.

Every customization is reversible. The server never writes user customization state directly.

## Protected Kernel

The following surfaces are trusted and cannot be hidden, replaced, reordered away, intercepted, or restyled into unreadability:

- Customizations manager.
- Feedback assistant launcher and response panel.
- Safe-mode affordance.
- Privacy/export diagnostic surface.
- Fatal-error fallback screen.

The manager must include:

- Active customization list.
- Per-customization disable/delete/reset controls.
- "Disable all customizations" panic button.
- Export diagnostic info.
- Clear indication when a customization needs reload.
- Safe-mode instructions, including a URL flag such as `?safeCustomizations=1`.

If a recipe attempts to target a protected surface, validation rejects it before the user sees an Apply card.

## Runtime Model

Load order:

1. Generate/load `vocal-training:anonymous-id:v1`.
2. Load customization registry and stored customization records.
3. Validate and migrate stored values.
4. Build effective customization state.
5. Mount `CustomizationProvider`.
6. Hide splash and render routes.

Apply timing:

- `live`: density, colors, type scale, visibility toggles, copy labels, recipe UI at mounted outlets.
- `boot`: home route, early navigation defaults, startup-only audio/practice defaults.
- `reload`: schema migrations or changes that affect module-level initialization.

On web, many live changes can update immediately through React context. On native, the same declarative values work, but arbitrary downloaded code should not be part of the TestFlight/App Store path.

## Storage

Use AsyncStorage so web maps to localStorage and native stays consistent.

Keys:

- `vocal-training:anonymous-id:v1`
- `vocal-training:user-customization:<slot>:v<schemaVersion>`
- `vocal-training:user-recipe:<recipeId>:v<schemaVersion>`
- `vocal-training:customization-index:v1`

Loader behavior:

- Never throw on bad stored data.
- Invalid values fall back to defaults and mark the record as invalid in diagnostics.
- Migrators return a valid current value or `null`.
- Removed slots are ignored, then optionally pruned by a maintenance pass.

## Registry Slots

Add `lib/customization/registry.ts` with Zod-validated slot definitions:

```ts
export interface CustomizationDef<T> {
  schemaVersion: number;
  label: string;
  description: string;
  schema: z.ZodType<T>;
  defaultValue: T;
  applyAt: "boot" | "live" | "reload";
  migrate: ((stored: unknown, fromVersion: number) => T | null) | null;
  protected?: boolean;
  defaultRevertCopy: string;
  deprecated?: boolean;
}
```

Initial slots:

- `home-route`: `"/" | "/explore" | "/coaching"`
- `default-voice-part`: `"soprano" | "alto" | "tenor" | "baritone"`
- `ui-density`: `"compact" | "standard" | "comfortable"`
- `default-accompaniment-preset`
- `default-guided-tolerance`
- `demo-on-by-default`
- `click-track-on-by-default`
- `show-staff-notation`
- `headphones-confirm-mode`
- `lead-in-count`
- `theme-overrides`
- `type-overrides`

## Style Customization

User color and typography requests should be supported in Phase 1. These are likely to be among the first things people test.

Important distinction:

- Base shipped code still follows `DESIGN.md` and must not introduce random hardcoded hex values.
- User customizations may store custom colors, font sizes, and font choices as data, validated by the customization layer.

### Theme Overrides

Support a `theme-overrides` slot and/or recipe action that can set semantic tokens, not arbitrary component internals.

Allowed token targets:

- `canvas`
- `bgSurface`
- `bgElevated`
- `bgEmphasis`
- `textPrimary`
- `textSecondary`
- `textTertiary`
- `accent`
- `accentHover`
- `success`
- `warning`
- `error`

Value forms:

- Hex colors such as `#145c43`.
- Token references such as `{ "from": "accent" }`.
- Optional generated palettes with named intent, such as `"forest"`, `"high-contrast"`, or `"cool-studio"`.

Validation:

- Hex must parse.
- Text/background pairs must meet contrast thresholds.
- Protected manager must keep its own readable fallback palette if the custom palette fails contrast.
- No arbitrary CSS strings.
- No gradients or decorative blobs by default, per frontend guidance.

### Type Overrides

Support a `type-overrides` slot for font sizing and family preferences.

Allowed changes:

- Type scale multipliers, clamped by role.
- Role remapping, such as note names one level larger.
- Font family choice from approved bundled families.
- Web-only custom font family only if it is a safe system-family string or an approved remote font integration added by PR.

Disallowed in Phase 1:

- Raw CSS injection.
- Unbounded `fontSize`.
- Remote font loading from arbitrary URLs.
- Replacing the protected manager's font stack.

Example shape:

```ts
type TypeOverrides = {
  scale?: "small" | "standard" | "large" | "extra-large";
  noteNameSize?: "standard" | "large" | "huge";
  bodyFamily?: "general-sans" | "system" | "fraunces";
  displayFamily?: "fraunces" | "general-sans" | "system-serif";
};
```

## Declarative Recipes

Recipes are stored JSON documents rendered by app-owned primitives. They allow broad customization without eval.

Example capabilities:

- Insert a small panel into an approved outlet.
- Hide or show non-critical UI blocks.
- Reorder approved sibling blocks.
- Change labels/copy for specific controls.
- Apply semantic style overrides.
- Set route defaults.
- Define simple conditional display logic.

Outlets:

- `practice.console.before-start`
- `practice.console.after-start`
- `practice.staff.above`
- `practice.staff.below`
- `practice.results.after-summary`
- `progress.top`
- `progress.after-routine`
- `coaching.after-headline`
- `coaching.after-causes`

Use a small Adaptive-Cards-inspired renderer:

- `Text`
- `Stack`
- `InlineStat`
- `Button`
- `Divider`
- `Callout`
- `Toggle`
- `NoteName`
- `ProgressDots`

Actions are allowlisted:

- `navigate`
- `setSlot`
- `toggleRecipe`
- `openCustomizations`
- `openFeedback`

Conditional logic uses a JsonLogic-style no-eval subset.

## API Shape

Request:

```ts
type ResolveCustomizationRequest = {
  message: string;
  anonId: string;
  appVersion: string;
  platform: "web" | "ios" | "android";
  route: string;
  registryHash: string;
  recipeSchemaVersion: number;
  activeCustomizations: Array<{
    id: string;
    type: "slot" | "recipe";
    target: string;
    enabled: boolean;
    version: number;
  }>;
  context?: Record<string, unknown>;
};
```

Response:

```ts
type ResolveCustomizationResponse =
  | { kind: "proposal"; proposal: CustomizationProposal }
  | { kind: "clarification"; question: string; choices: string[] }
  | { kind: "requiresNewCapability"; proposal: CapabilityProposal }
  | { kind: "reject"; rationale: string };
```

Proposal:

```ts
type CustomizationProposal = {
  id: string;
  summary: string;
  confirmationCopy: string;
  requiresReload: boolean;
  slotUpdates?: Array<{ slot: string; value: unknown }>;
  recipes?: DeclarativeRecipe[];
  validation: {
    schemaValid: boolean;
    protectedSurfaceSafe: boolean;
    designSafe: boolean;
    dryRunPassed: boolean;
  };
};
```

## Agent Architecture

Use the existing autonomous feedback-loop direction:

- Cloudflare Worker intake.
- Durable Object per ticket and per-anonymous-id rate limiting.
- Turnstile for abuse defense.
- Triage model with strict schema output.
- Bedrock-principles judge on every non-reject result.
- Draft PR path for new capabilities.

Agent prompt receives:

- Registry manifest.
- Recipe schema.
- Outlet manifest.
- Protected surface rules.
- Design token rules.
- Current app version and platform.

The agent can return:

- Existing slot update.
- Declarative recipe.
- Clarification.
- New capability proposal.
- Rejection.

It cannot return executable code to the client in Phase 1.

## Future Arbitrary Monkey Patching

Phase 1 should leave room for a Phase 3 web-only plugin tier.

Possible future shape:

- Signed plugin manifest.
- Dynamic `import()` or import-map-based loading on web.
- Plugin declares required app capabilities and compatible app versions.
- Plugin only receives an app-provided API object, never raw globals.
- Plugin cannot target protected kernel surfaces.
- Plugin runs behind a separate "Customization Lab" opt-in.
- Plugin validation includes build, typecheck, unit tests, Playwright smoke, visual screenshot, and manager reachability check.

This is not recommended for iOS/TestFlight because Apple guideline 2.5.2 restricts downloading or executing code that changes app features/functionality. The native path should continue using shipped declarative primitives and registry slots.

The future plugin tier should be treated as an extension of the same customization kernel, not a replacement for it.

## Implementation Slices

### Slice 1: Customization Kernel

- Add registry, loader, provider, storage helpers, safe mode, and tests.
- Mount provider in `app/_layout.tsx`.
- Add `app/customizations.tsx`.
- Add a visible route/link to Customizations from the feedback assistant and Progress or settings area.

### Slice 2: Existing Preferences As Slots

- Migrate voice part, mode, demo, click track, staff visibility, and route defaults into slots.
- Preserve existing keys as migration sources.
- Add unit tests for defaults, invalid values, and migration.

### Slice 3: Style Overrides

- Add `theme-overrides` and `type-overrides`.
- Thread overrides through `useTheme()`.
- Validate color contrast and size clamps.
- Add manager fallback palette.

### Slice 4: Declarative Recipes

- Add recipe schema and renderer.
- Add first outlet set to Practice, Progress, and Coaching.
- Support insertion, hide/show, simple labels, callouts, and allowed actions.
- Add recipe dry-run tests.

### Slice 5: Feedback API Contract

- Add request/response types shared by client and Worker.
- Build local mock resolver for development.
- Add UI Apply/Cancel flow in the assistant.
- Add backend triage later using the existing Cloudflare/agent architecture.

### Slice 6: Capability Extension PR Flow

- If a request cannot be represented, open a draft PR that adds the missing slot/outlet/primitive.
- PR must include registry tests, renderer tests, and an example fixture.
- Future requests can then resolve without code changes.

## Test Plan

Unit tests:

- Registry default/read/write/migrate.
- Invalid stored values never crash boot.
- Custom hex validation and contrast checks.
- Type scale clamps.
- Recipe parser rejects raw JS, CSS strings, unknown outlets, protected targets, and oversized payloads.
- Safe mode disables all non-kernel customizations.

Component tests:

- Provider loads customizations before first render.
- Practice screen reacts to density/type/theme overrides.
- Customizations screen can delete a bad recipe.
- Protected manager remains readable under extreme theme overrides.

E2E tests:

- Ask for a color change, apply it, reload, confirm persistence, delete it, reload, confirm removal.
- Ask for bigger note names, confirm type override applies.
- Ask for an unsupported customization, confirm the app returns a new-capability proposal.
- Safe-mode URL boots with customizations disabled.

Backend tests:

- Prompt-injection fixtures.
- Strict schema rejection.
- Bedrock judge hard reject.
- Clarification routing.
- Rate-limit and cost-cap behavior.

## Acceptance Criteria

- User can request a supported customization and apply it without deploy.
- User can change colors and type scale through validated theme/type overrides.
- User can always reach Customizations and disable/delete every customization.
- Bad stored customization data cannot crash app boot.
- Unsupported customization requests become capability-extension proposals.
- No raw agent-written JavaScript runs in the client in Phase 1.
- The architecture remains compatible with future web-only signed plugins.

## Open Questions

- Which exact UI affordance should open Customizations before the assistant exists?
- Should the first public build expose custom font-family choices beyond bundled fonts?
- Should theme customization include dark-mode creation, or only override the current light scheme?
- How strict should contrast validation be for accent-only colors?
- Should recipe UI support images in Phase 1, or defer until asset safety is designed?

## References

- `CUSTOMIZATION_REGISTRY_RESEARCH.md`
- `AUTONOMOUS_FEEDBACK_LOOP_RESEARCH.md`
- `DESIGN.md`
- MDN dynamic import: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
- MDN import maps: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap
- React lazy loading: https://react.dev/reference/react/lazy
- Apple App Review Guidelines 2.5.2: https://developer.apple.com/app-store/review/guidelines/
- Expo Metro dynamic import caveat: https://docs.expo.dev/versions/latest/config/metro/
- Adaptive Cards overview: https://learn.microsoft.com/en-us/adaptive-cards/
- JsonLogic: https://jsonlogic.com/
