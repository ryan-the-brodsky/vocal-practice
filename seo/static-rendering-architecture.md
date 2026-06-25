# Static Rendering Architecture (Option A) — Implementation Plan

**Status:** approved 2026-06-24, not yet implemented
**Goal:** make marketing / Learn / tool pages indexable by migrating `web.output: "single"` → `"static"`, while the interactive app stays client-rendered.
**Companion docs:** `seo/keyword-research-2026-06.md` (why), `seo/learning-library-plan.md` (the Learn content), `seo/range-tester-plan.md` (the flagship tool page).

---

## Why Option A (recap)

- Single Expo codebase — no second framework/build system, and SEO pages reuse the engine modules directly.
- **Spike verdict (2026-06-24):** `npx expo export --platform web` with `output: "static"` builds clean — exit 0, 16 per-route HTML files, **no `tslib` bug** (that was `output: "server"` only).
- **Catch:** the exported HTML is currently empty (0 text, blank `<title>`) because `app/_layout.tsx:104` (`if (!loaded || !onboardingChecked) return null;`) gates the whole tree on client-only state. Effects don't run during static generation, so the root returns `null` and every route blanks out.

The entire plan below is in service of: **root renders real HTML at build time; only the interactive app keeps its client gate.**

---

## ✅ As-built (2026-06-24, branch `feat/static-rendering-migration`)

The foundational migration shipped with a **lighter variant** than the group-move proposed below, because the app's screens are imported by tests via `@/app/(tabs)/...` and moving them into an `(app)` group would have broken those imports.

**What was actually done:**
- `app.json` → `web.output: "static"`.
- `app/_layout.tsx` keeps the font/onboarding/splash gate for app routes but **bypasses it for a `STATIC_SEGMENTS` whitelist** (`new Set(['(marketing)'])`), detected via `useSegments()`. So `(marketing)` routes render synchronously to indexable HTML; app routes still `return null` during SSG (empty shells, no browser-API crashes). `useSegments()` works correctly during static generation — confirmed.
- **No app files moved**; tests untouched (`tsc` + 669 tests green).
- A `(marketing)/seo-probe` route was added to verify (exported real `<body>` text + a populated `<title>`; `index.html` body stayed empty), then removed. **The `(marketing)` group does not currently exist** — recreate it when building the first real page; `STATIC_SEGMENTS` is already wired for it.

**Still open before deploy:** Netlify routing validation. `public/_redirects` carries a non-forced SPA catch-all `/* /index.html 200` (a leftover from the SPA era, comment now updated). Netlify serves an existing static file before applying a non-forced rule, so pre-rendered routes *should* win and the catch-all *should* only cover client-only paths — but this is environment-specific and unverified on a live deploy. **Go/no-go check after deploy:** `curl -s https://vocalhabit.com/vocal-range-test | grep -o "<h1[^>]*>[^<]*"` must return the real `<h1>`, not the empty shell. If it returns the shell, the catch-all is shadowing — add an explicit file-serving rule for the marketing routes above the catch-all. (First real `(marketing)` page — the range tester — is now shipped.)

The group-move design below remains a valid alternative if the app ever needs its screens fully removed from the static graph; for now the segment whitelist is simpler and sufficient.

---

## Target route structure (original proposal — superseded by the as-built note above)

Today the gate lives in the root layout, so it taints everything. The fix is to **scope the gate to an app group** and let the root render statically.

```
app/
  _layout.tsx            # ROOT — renders children at build time. NO font/onboarding null-gate.
                         #        Keeps ThemeProvider, ErrorBoundary, Stack, StatusBar.
  (app)/                 # NEW group — the interactive product. Client-gated.
    _layout.tsx          #   Moves here: useFonts gate, onboarding check + redirect, splash/cover.
    (tabs)/              #   Existing tabs (index/plan/progress/coaching/triallab) move under (app).
    coaching-saved.tsx
    song-editor.tsx
    onboarding.tsx
  (marketing)/           # NEW group — static SEO routes. Renders synchronously, no gate.
    _layout.tsx          #   Light layout: SEO header/footer nav, no fonts/storage dependency.
    vocal-range-test.tsx #   Flagship tool page (see range-tester-plan.md)
    vocal-warm-ups.tsx   #   Tool/landing page
    vocal-exercises.tsx  #   Hub/landing page
    learn/
      index.tsx          #   Learn hub
      [slug].tsx         #   Articles — generateStaticParams() pre-renders each
  +not-found.tsx
  +html.tsx              # (optional) custom document shell for global <head>/lang/meta defaults
```

Notes:
- `unstable_settings = { anchor: '(tabs)' }` in the current root moves to `(app)/_layout.tsx` (anchor becomes `'(app)/(tabs)'` or just stays scoped to the app group).
- Groups `(app)` and `(marketing)` are URL-transparent (parentheses = no path segment), so the app keeps its existing URLs (`/`, `/plan`, `/progress`, …) and marketing pages get clean top-level paths (`/vocal-range-test`, `/learn/...`). Confirm `/` resolves to the app's tabs index, not a marketing page.

---

## Step-by-step

### 1. De-gate the root layout (the prerequisite)
- Remove `if (!loaded || !onboardingChecked) return null;` from `app/_layout.tsx`.
- Root now always renders `ThemeProvider > ErrorBoundary > View > Stack` + children. Register both groups in the Stack.
- Move into `(app)/_layout.tsx`: `useFonts(...)`, the `hasSeenOnboarding()` effect + `router.replace('/onboarding')` redirect, the `showCover` canvas, and the `requestPersistentStorage()` call. The null-gate (`return null` / splash hold) lives **here**, wrapping only the app.
- `FeedbackButton`: keep it app-only (render inside `(app)`), not on marketing/Learn pages.
- **Behavioral win:** a visitor landing on `/learn/how-to-sing-in-tune` is no longer hijacked into onboarding — onboarding only triggers on entering the product.

### 2. Flip the switch
- `app.json` → `expo.web.output: "static"`.
- Keep `experiments.typedRoutes` and `reactCompiler` on for now; watch for reactCompiler interactions during static render (see Risks).

### 3. Per-route `<head>`
- Use `expo-router/head`'s `<Head>` in each marketing/Learn route for `<title>`, `<meta name="description">`, canonical, Open Graph/Twitter, and JSON-LD `<script type="application/ld+json">`.
- App screens can keep setting `document.title` client-side; SEO routes must set it via `<Head>` so it's in the static HTML.
- Consider an `app/+html.tsx` for global defaults (lang="en", viewport, default OG image, favicon already configured).

### 4. Dynamic Learn articles
- `app/(marketing)/learn/[slug].tsx` exports `export async function generateStaticParams()` returning every article slug, so each pre-renders to `dist/learn/<slug>.html`. Source the slug list from the content module (see `learning-library-plan.md`).
- The article body renders from a content collection (static import), NOT fetched at runtime.

### 5. Keep SEO routes light + synchronous
- Ranking content (copy, headings, FAQ) renders on first paint with **fallback system fonts**. Custom fonts (Fraunces / General Sans / Bravura) may load progressively but must never gate content.
- **Lazy-load heavy audio deps** (`tone`, `pitchy`, `react-native-audio-api`, Salamander samples) so a marketing/Learn route doesn't ship the 4.3 MB engine bundle. Mount interactive widgets via `React.lazy` / dynamic `import()` inside an island component that only loads on interaction or after hydration.
- Guard any browser-only API (`window`, `document`, `navigator.mediaDevices`, `AudioContext`) behind `typeof window !== 'undefined'` or inside effects/handlers so static render doesn't throw.

### 6. The interactive island contract
- A small set of island components wrap the engine for static pages:
  - `<RangeTesterIsland>` — mic → low/high pitch capture → voice-type classification (see range-tester-plan.md).
  - `<EmbeddedExercise exerciseId="...">` — mounts the live practice widget for a single exercise inside an article (see learning-library-plan.md).
- Islands import `lib/pitch/*`, `lib/exercises/music.ts`, `lib/music/voiceRanges.ts` directly (framework-agnostic TS). They render a static placeholder during SSG and a "Start" affordance after hydration.

### 7. Deploy
- Build: `npx expo export --platform web` → `dist/`.
- Netlify: publish `dist/`. Add `netlify.toml` if needed for: trailing-slash policy, a SPA-style fallback **only within the app group** (so deep client links into the app resolve), and a 404 → `+not-found.html`. Marketing/Learn routes are real files and need no fallback.
- Sanity-check that `dist/_sitemap.html` / sitemap output includes the marketing + Learn URLs; submit the sitemap in Search Console once live.

---

## QA checklist (gate the PR on these)

- [ ] `npx expo export --platform web` exits 0 with no new warnings.
- [ ] **View-source proof:** `dist/vocal-range-test.html`, `dist/learn/<slug>.html`, etc. contain the actual H1/body copy and a populated `<title>` — verify by `grep`/`curl`, NOT devtools (devtools shows post-hydration DOM and will lie).
- [ ] Each SEO route has a unique, keyword-aligned `<title>` + meta description in the static HTML.
- [ ] JSON-LD validates (Rich Results Test) for the schema types used.
- [ ] The app still works: `/`, tabs, onboarding first-run gate, song editor, coaching all behave as before; first-run user still routed to onboarding.
- [ ] Marketing/Learn routes do NOT pull the heavy audio bundle on initial load (check network tab / bundle analysis); the island loads on interaction.
- [ ] Interactive islands work after hydration (range tester captures pitch; embedded exercise plays + scores).
- [ ] Lighthouse SEO ≥ 95 and reasonable LCP on a marketing route.
- [ ] `npm test` + `tsc --noEmit` clean. Add component tests per existing conventions for any new SEO route that has logic (see CLAUDE.md "Component-test conventions").

---

## Risks & open questions

- **reactCompiler + static render:** `experiments.reactCompiler` is on. Spike built fine while returning null; once real components render at build time, watch for compiler-related SSR quirks. Fallback: disable reactCompiler for web export if it misbehaves.
- **Browser-only calls during render:** the empty-shell spike masked this (root returned null). After de-gating, audit rendered SEO components for top-level `window`/`document`/Web Audio access; guard them.
- **`/` resolution:** confirm the root index still maps to the app's tabs index after introducing `(app)`/`(marketing)` groups, and that no marketing route shadows `/`.
- **Onboarding redirect scope:** moving the redirect into `(app)` is intended, but verify deep links straight into an app sub-route still onboard first-run users correctly.
- **Netlify routing:** decide trailing-slash policy up front (affects canonical URLs); keep it consistent with what `<Head>` canonical emits.
- **Heavy-dep code-splitting:** confirm Metro/Expo actually tree-splits the lazy island (verify the marketing route bundle doesn't statically include `tone`/`pitchy`).

---

## Suggested PR slicing

1. **PR-1 — De-gate + group restructure (no output change yet).** Move the gate into `(app)`, introduce `(app)`/`(marketing)` groups, keep `output: "single"`. App behaves identically. Pure refactor; covered by existing tests.
2. **PR-2 — Flip to `output: "static"` + first static route.** Ship one trivial marketing page (e.g. a placeholder `/vocal-range-test` shell) to prove indexable HTML end-to-end + Netlify deploy + view-source QA.
3. **PR-3 — Range tester island** (per `range-tester-plan.md`).
4. **PR-4+ — Learn hub + articles with embedded exercises** (per `learning-library-plan.md`), rolled out by cluster.
