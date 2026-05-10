# PWA Shell Plan

Implementation plan for turning the Expo SDK 54 web app into an installable, offline-capable PWA. Personal-use, single-user, no upsell. iOS Safari add-to-home-screen + desktop browsers are the deployment surface; iOS native is deferred indefinitely (BULLETPROOFING_PLAN.md Slice 8 stays parked).

**Audit issues reference key:** Topic.IssueNumber from the prompt (1 = Manifest, 2 = Service Worker, 3 = Install UX, 4 = Web Push, 5 = Offline storage, 6 = Performance, 7 = iOS quirks).

## Status — drafted 2026-05-10

Plan only. Nothing shipped yet. Eight slices below; recommended starting slice is **Slice 1 (manifest + iOS meta)** because it's a 1-hour wedge that produces an installable shell with zero risk and zero behavior change, and every later slice depends on the install-as-PWA pathway working first.

| Slice | Status | Size | Notes |
|---|---|---|---|
| 1. Web App Manifest + iOS meta tags | open | XS | Wedge. No behavior change. |
| 2. Service Worker — app-shell precache | open | S | Workbox via expo-router custom `+html` |
| 3. Service Worker — Salamander runtime cache | open | S | Stale-while-revalidate with 1.6 MB cap |
| 4. Install prompt UX (dual path) | open | M | iOS overlay + Chrome `beforeinstallprompt` |
| 5. Offline-first sanity pass + audit banner | open | S | Confirm AsyncStorage/localStorage holds; flag CDN fallback |
| 6. Performance: code-split + critical-path audit | open | M | Optional polish; only do if cold-load feels slow |
| 7. Local notification reminders (open-app required) | open | M | Notifications API + setTimeout in SW; no server. |
| 8. Web push reminders (background-firing) | open | L · maybe-skip | iOS 16.4+ installed-PWA only; needs VAPID + a free push tier. **Recommend skipping unless Slice 7 proves insufficient.** |

---

## Decisions you need to make before Slice 1

These cascade into later slices. Get answers before starting:

1. **Reminder firing model — Slice 7 (local) vs. Slice 8 (true push)?**
   - **Local notifications via SW timers** fire only when the user has the app open or recently-active. Firing at "9 AM tomorrow" *requires the user to open the PWA before then* (or, on iOS standalone, requires the OS to let the SW wake). Zero backend, zero VAPID key, zero cost. **Recommendation: start here.**
   - **True web push** (Slice 8) wakes the SW when the app is closed but requires (a) a push service like FCM/web-push (free tier exists), (b) a VAPID keypair, (c) somewhere to schedule the push trigger. The "no backend" constraint means using a free cron service (e.g. cron-job.org, GitHub Actions schedule) hitting a serverless function (Vercel/Cloudflare Workers free tier). It's a backend in everything but name. **Plus: iOS Safari only delivers web push to PWAs that have been added to the home screen and run in standalone mode — and the delivery is unreliable when the device is in low-power mode or the PWA hasn't been opened recently.**
   - For a single-user vocal warmup app the right answer is almost certainly Slice 7. Skip Slice 8 unless you find that "the reminder didn't fire because I hadn't opened the app" is actually happening.

2. **Salamander samples on web — bundle, runtime-cache, or keep CDN-only?**
   - **Keep CDN-only:** zero bundle bloat, but every cold install pulls 1.6 MB from `tonejs.github.io` (which has only `max-age=600`) and the app fails offline.
   - **Runtime-cache via SW (Slice 3):** first session online pulls samples once, subsequent sessions hit the SW cache. ~1.6 MB on disk after first-use, transparent to user. **Recommendation.**
   - **Precache at install time:** all 21 samples downloaded the first time the SW activates (before user has touched the Practice tab). Adds ~1.6 MB to the install bar. Overkill for personal use — runtime-cache is invisible and identical-feeling after first session.

3. **Manifest `start_url` — `/` or `/?source=pwa`?**
   - The query-param variant is conventional for PWA analytics, but you have no analytics and don't need them. Use `/` and keep it simple.

4. **Manifest `display` mode — `standalone` or `fullscreen`?**
   - `standalone` keeps the iOS status bar visible, which lets you see the time mid-warmup. `fullscreen` is more immersive but suppresses the status bar; on iOS Safari standalone (the only display mode iOS actually honors) `fullscreen` falls back to `standalone` anyway. **Recommendation: `standalone`.**

5. **Should the install overlay nag, or be dismissable-forever?**
   - First-run banner that auto-dismisses after first session OR after manual close, with a re-trigger affordance in Settings/About if the user wants to revisit. **Recommendation: one-shot, persisted in `vocal-training:pwa:install-dismissed:v1`, with the affordance mounted in the Progress tab footer.**

---

## Sequencing rationale

1. **Slice 1 (manifest + iOS meta) first** — XS, behavior-neutral, makes the app installable. Every other slice assumes the user has installed.
2. **Slice 2 (SW + app-shell precache) second** — establishes the SW lifecycle and registration plumbing without taking on the messy Salamander runtime-cache logic. Once registered correctly, future cache strategies are additive.
3. **Slice 3 (Salamander runtime cache) third** — the highest-leverage offline win, but easier to debug after Slice 2's plumbing is proven.
4. **Slice 4 (install UX) fourth** — once the manifest + SW work, the prompt UX has something real to install. Doing this first would prompt the user to install a non-PWA.
5. **Slice 5 (offline audit)** — a verification pass that uncovers any remaining network dependencies before reminders ship.
6. **Slice 6 (perf)** — optional. Only do if cold-load measures slow on iOS Safari.
7. **Slice 7 (local reminders)** — the daily warmup nudge. Independent of pull-down notifications; works when app is open or recently-active.
8. **Slice 8 (web push)** — only if Slice 7's "user must open app first" model proves insufficient. Probably skip.

---

## Slice 1 — Web App Manifest + iOS meta tags (XS · ~1h)

**Bundles topic 1.**

### Goal
Make the web app installable as a PWA on iOS Safari + desktop Chrome/Edge, with correct icon, name, theme color, and orientation. Behavior-neutral — the live web experience does not change for non-installing users.

### Background — what's known
- Expo Router 6 generates the default HTML head via `expo-router/build/static/html.js`. It does NOT emit a `<link rel="manifest">` or any iOS-specific tags out of the box.
- Expo's web build with `web.output: "single"` (current setting in `app.json`) produces a static SPA bundle in `dist/` via `npx expo export --platform web`. The HTML template is what gets served.
- To inject custom `<head>` content, the supported path is a project-level `app/+html.tsx` (Expo Router's HTML override). This file is server-rendered at export time, so synchronous `<link>`/`<meta>` tags work cleanly.
- Alternative: `expo-router/head` for per-route overrides (we don't need per-route — the manifest is global).

### Changes

| Item | Files |
|---|---|
| Project HTML override | New `app/+html.tsx` — wraps Expo Router's default `<Html>` component, injects `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#a86a24">` (matches `Colors.light.accent`), iOS-specific tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`), and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`. Keep the existing `ScrollViewStyleReset`. |
| Static manifest | New `public/manifest.webmanifest` — JSON: `name: "Vocal Training"`, `short_name: "Warmup"`, `start_url: "/"`, `display: "standalone"`, `orientation: "portrait"`, `theme_color: "#a86a24"`, `background_color: "#f3ede0"` (matches `Colors.light.canvas`), `icons` (192/512/maskable). |
| App icons | New `assets/images/pwa-icon-192.png`, `pwa-icon-512.png`, `pwa-icon-maskable.png`, `apple-touch-icon-180.png`. Generated from `assets/images/icon.png` (393 KB existing). Maskable variant needs ≥10% safe-area padding. |
| Public-asset wiring | Confirm Expo's `metro.config.js` serves `public/` as static — Expo SDK 54 honors `public/` by default in web exports. Verify with `npx expo export --platform web` and check `dist/manifest.webmanifest` lands. If not, add a custom Metro middleware or move to the documented `public/` dir convention. |
| Theme-color follows DESIGN tokens | The `theme-color` value comes from `Colors.light.accent` (`#a86a24`). Don't hardcode — pull from `constants/theme.ts` or risk drift. (Note: `+html.tsx` is server-rendered so it can `import { Colors } from "@/constants/theme"` directly.) |

### iOS-specific meta tags (full list to add)

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Warmup" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png" />
<meta name="theme-color" content="#a86a24" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
```

`apple-mobile-web-app-status-bar-style` options: `default` (white bar, dark text — fits the cream `#f3ede0` canvas), `black` (black bar, white text), `black-translucent` (status bar overlays content — only useful with custom bar color management). Use `default`.

### Tests
- Manual: run `npx expo export --platform web && npx serve dist`, open Chrome DevTools → Application → Manifest, confirm all fields render and "Installable" is green.
- Manual: Lighthouse PWA audit — should report installable=true after this slice + Slice 2.
- Add `/Users/ryanbrodsky/Documents/programming/ai-ai-ai/vocal-training/lib/__tests__/manifest.test.ts` — fetch `public/manifest.webmanifest`, parse JSON, assert required fields (`name`, `start_url`, `display`, `icons` with 192 + 512). Single low-friction unit test that catches regressions if someone edits the manifest by hand.

### Done criteria
- [ ] `dist/manifest.webmanifest` present after `npx expo export --platform web`.
- [ ] Chrome DevTools → Manifest shows valid manifest with no errors.
- [ ] On iPhone Safari: visit ngrok HTTPS URL → Share → Add to Home Screen → tap the home-screen icon → app launches in standalone mode (no Safari chrome).
- [ ] Status bar reads "default" style; theme color matches accent on Android Chrome's address bar (when not yet installed).
- [ ] No regression — `npm test && tsc --noEmit` clean.

---

## Slice 2 — Service Worker + app-shell precache (S · ~3h)

**Bundles topic 2 (precache half).**

### Goal
Register a service worker on web that precaches the app shell (HTML, JS bundle, CSS, fonts, exercise JSON) so the app launches offline and feels instant on warm boots. No Salamander caching yet (Slice 3).

### Background — what's known
- Expo Router 6 web builds output a Vite-like static bundle with content-hashed filenames in `dist/_expo/static/js/web/` and `dist/_expo/static/css/`. The hashes change every build, so a hand-maintained precache list is brittle.
- **Workbox with `injectManifest`** is the right tool: a SW source file references `self.__WB_MANIFEST` placeholder, a build-time script substitutes the actual list of bundle URLs + hashes. Workbox is platform-agnostic; we don't need any Expo-specific integration.
- The SW must be served from origin root (`/sw.js`) so it can claim the entire scope. Expo's `public/` dir convention serves files at root.
- **Registration timing matters.** Register after the app's first paint to avoid blocking initial render. Web-only — wrap in `Platform.OS === "web"`.

### What needs investigation
- Does Expo's static export emit a stable manifest of bundle filenames we can read at build time? (Likely yes via the `dist/.expo/routes.json` or by globbing `dist/_expo/static/**`.) If not, we glob `dist/` post-export.
- Does the existing `metro.config.js` need adjustment to copy a `sw.js` source from `public/` to `dist/`? Most likely no — Expo handles `public/` automatically.

### Changes

| Item | Files |
|---|---|
| SW source | New `public/sw.js` — Workbox-flavored. Imports Workbox via CDN (`importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js")`) for zero-bundling overhead, or vendored locally if you prefer not to depend on a CDN at SW-bootstrap. Defines `precacheAndRoute(self.__WB_MANIFEST)` and a `skipWaiting()` + `clients.claim()` flow. |
| Build-time manifest injection | New `scripts/inject-sw-manifest.js` — runs after `npx expo export --platform web`. Globs `dist/**/*.{html,js,css,woff2,otf,json}`, computes content hashes, replaces `self.__WB_MANIFEST` in `dist/sw.js`. Wired into a new `build:web` npm script: `expo export --platform web && node scripts/inject-sw-manifest.js`. |
| SW registration | New `lib/pwa/registerSW.ts` — `if (typeof window !== "undefined" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")`. Called from `app/_layout.tsx` inside a `useEffect` gated on `Platform.OS === "web"`. Logs registration result (no UI). |
| Cache versioning | SW uses Workbox's automatic content-hash-based versioning. On deploy, new bundle hashes invalidate old precache entries. Manual "force update" via incrementing a `CACHE_VERSION` constant in `sw.js`. |
| Eviction | Workbox's `precacheAndRoute` handles its own eviction — old entries are pruned when the SW activates and the new manifest doesn't reference them. No manual logic needed. |

### What gets precached
- `index.html` (the SPA entry — Expo's static export emits exactly one HTML file with `web.output: "single"`)
- All hashed JS/CSS in `dist/_expo/static/{js,css}/web/*`
- Bundled fonts: `BravuraText.woff2`, `GeneralSans-{Regular,Medium,Semibold}.otf`, the Fraunces + JetBrains Mono Google fonts (these get bundled by `@expo-google-fonts` so they'll appear in the dist glob)
- `manifest.webmanifest`, app icons
- Exercise JSON (`data/exercises/*.json`) — these get bundled into the JS by Metro, so they're already covered by the JS precache

### What does NOT get precached
- Salamander MP3s from `https://tonejs.github.io/` (Slice 3 handles them with a separate runtime-cache strategy)
- AsyncStorage data (lives in localStorage, not SW cache; survives independently)

### Tests
- New `scripts/__tests__/inject-sw-manifest.test.js` — given a fixture `dist/` directory, run the inject script, parse the resulting `sw.js`, assert the manifest entries match expected hashes. Use a tmpdir + mocked file tree.
- Manual: `npm run build:web && npx serve dist`, open DevTools → Application → Service Workers, confirm SW registers and reaches "activated and running". Network panel → reload → all app-shell assets served `(from ServiceWorker)`.
- Manual: throttle network to "Offline" → reload → app still loads (only Salamander streaming fails for now; that's expected, comes in Slice 3).

### Done criteria
- [ ] SW registers on first visit, activates within ~2s.
- [ ] On second visit (online), all app-shell requests served from SW cache.
- [ ] Offline reload — app shell renders, exercise picker works, settings persist (localStorage). Salamander samples fail to load (acceptable for this slice).
- [ ] CI: typecheck + jest still clean. `inject-sw-manifest.test.js` covers the manifest-injection happy path.

### Risks / iOS Safari quirks worth flagging in this slice
- **iOS Safari kills the SW after ~30 seconds of inactivity.** This is fine for our app — we don't have any long-running SW logic.
- **iOS Safari evicts SW caches under disk pressure** — no signal to the app, samples just disappear. The runtime-cache fallback in Slice 3 will refetch on next online use. Acceptable.
- **Update prompts** are not in scope — assume "background update on next reload" semantics. If the user reports stale-cache bugs, add an explicit `controllerchange` listener that prompts a reload.

---

## Slice 3 — Salamander runtime cache (S · ~2h)

**Bundles topic 2 (runtime-cache half) and topic 5 (the network-fallback piece).**

### Goal
Cache Salamander samples on first online use so subsequent sessions work offline. No precache (samples download lazily as the user practices); 30-day expiry; ~1.6 MB total ceiling.

### Background — what's known
- `lib/audio/player.web.ts` requests samples from `https://tonejs.github.io/audio/salamander/{noteName}.mp3` via Tone.Sampler's internal fetch. The request goes through the SW because the SW scope is origin-wide and the fetch is cross-origin (which the SW *can* intercept).
- The CDN sets `access-control-allow-origin: *` (verified) and `cache-control: max-age=600` (only 10 min). We override with our own SW-side cache TTL.
- 21 samples, average 80 KB, total ~1.6 MB. Each sample is requested by Tone.Sampler when first needed.

### Changes

| Item | Files |
|---|---|
| Runtime route in SW | `public/sw.js` — add `registerRoute(({url}) => url.host === "tonejs.github.io" && url.pathname.startsWith("/audio/salamander/"), new StaleWhileRevalidate({ cacheName: "salamander-v1", plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })] }))`. |
| Cache-versioning naming convention | Cache name embeds version (`salamander-v1`). Bump to `salamander-v2` if the sample format ever changes. Old caches auto-deleted via Workbox's `cacheCleanup` on activate. |
| Eviction | `ExpirationPlugin` with `maxEntries: 30` (above 21 — safety margin) and 30-day TTL. Either constraint forces eviction of LRU entries. |
| Pre-warm on first visit (optional, recommended) | New `lib/pwa/prewarmSalamander.ts` — on first SW-controlled load AFTER the user grants mic permission (i.e. they're committed to using the app), `fetch()` all 21 sample URLs in parallel. This populates the SW cache without needing the user to wait through Tone.Sampler's lazy load. Gate on `vocal-training:pwa:salamander-prewarmed:v1` localStorage flag. |

### Strategy decision: precache vs. runtime-cache vs. precache-after-grant

Three options, tradeoffs:

| Strategy | First-paint cost | First-session UX | Offline-on-day-2 | Disk |
|---|---|---|---|---|
| **Precache at install** | +1.6 MB on every install | Instant samples first session | Yes | 1.6 MB always |
| **Pure runtime-cache (StaleWhileRevalidate)** | 0 | Tone.Sampler streams as-needed (200-500 ms first-note delay first time) | Yes | 1.6 MB after first full session |
| **Runtime + post-grant pre-warm** | 0 | Streams first session; pre-warm in background runs after user's first granted mic | Yes | 1.6 MB after first session |

**Recommendation: pure runtime-cache + post-grant pre-warm** (the third row). Best blend of zero install cost and offline-by-day-2.

### Tests
- Manual: clear all SW caches, load app, run a Five-Note Scale → DevTools → Application → Cache Storage → `salamander-v1` → 8+ entries (only the notes the exercise hit). Reload offline, run the same exercise, all samples play from cache.
- New unit: `scripts/__tests__/sw-strategy.test.js` (optional, low-priority) — parse `sw.js`, assert the Salamander route definition exists and points at the right host.
- Manual: leave the app installed for 30 days, open offline, samples should still play. (Hard to automate; document as a known TTL.)

### Done criteria
- [ ] After first online session, all played samples cached. Offline second session plays samples from cache.
- [ ] Pre-warm fetches the full 21-sample set in the background after the user's first mic grant; localStorage flag prevents re-fetch.
- [ ] DevTools → Cache Storage shows `salamander-v1` cache with 21 entries after pre-warm.
- [ ] Cache size stays ≤ 30 entries (eviction works).

### Open questions for this slice
- Should we pre-warm only the 8-note subset that's bundled in `assets/salamander/` (the same notes used on native), or all 21? Pre-warming 21 covers more soprano range and uses the high-quality Tone.Sampler interpolation. Disk hit is only 1.6 MB. Pre-warm all 21 — it's noise.

---

## Slice 4 — Install prompt UX (M · ~5h)

**Bundles topic 3.**

### Goal
Surface an install affordance to the user. Two paths required because iOS Safari does not fire `beforeinstallprompt`:

- **iOS Safari**: manual instruction overlay (Share → Add to Home Screen) on first visit, dismissable, persisted.
- **Desktop Chrome/Edge** (and Android Chrome): use the native `beforeinstallprompt` event to wire a one-click "Install app" button.

### Background — what's known
- `beforeinstallprompt` fires on Chrome/Edge desktop and Android Chrome when the manifest + SW criteria are met (we cover both via Slices 1+2). It does NOT fire on iOS Safari, Firefox, or any iOS browser regardless of vendor (because iOS forces all browsers to use WebKit and WebKit doesn't support the prompt event).
- Detecting "this is iOS Safari, not yet installed": `/iPad|iPhone|iPod/.test(navigator.userAgent)` AND `!window.matchMedia("(display-mode: standalone)").matches` AND `!window.navigator.standalone`.
- Detecting "already installed and running standalone": `window.matchMedia("(display-mode: standalone)").matches` (cross-browser) OR iOS legacy `window.navigator.standalone`.
- The Practice tab top is the wrong location for this nag — it interrupts the warmup flow. The Progress tab footer is better (user is in browse mode).

### Where to put the prompt
- **First-run banner**: appears at the *top* of the Progress tab when (a) not installed, (b) `vocal-training:pwa:install-dismissed:v1` is unset. Same-tab decision because the user is more likely to be ambient-browsing there. NOT on the Practice tab — too distracting.
- **Settings/About re-trigger**: a small "Install on home screen" row in the Progress tab footer (below the existing "Saved coaching tips" link), always visible when not installed. This is the escape hatch for users who dismissed the banner.

### Changes

| Item | Files |
|---|---|
| Install state hook | New `hooks/useInstallState.ts` — exposes `{ canPromptDesktop, isIOS, isStandalone, dismissed, dismiss(): void, prompt(): Promise<void> }`. Wires `beforeinstallprompt` event listener (web, browser-supports), reads/writes `vocal-training:pwa:install-dismissed:v1`. Gated on `Platform.OS === "web"` (returns inert object on native — though we no longer ship native, defensive habit). |
| iOS install overlay | New `components/pwa/IOSInstallOverlay.tsx` — modal-ish card with "Add to home screen for the best experience" headline, illustration of the iOS Share → "Add to Home Screen" flow, dismiss button. Visible when `isIOS && !isStandalone && !dismissed`. |
| Desktop install button | New `components/pwa/DesktopInstallButton.tsx` — `<Pressable>` with "Install app" label, calls `prompt()` from the hook (which triggers the deferred `beforeinstallprompt`). Visible when `canPromptDesktop && !isStandalone && !dismissed`. |
| Mount points | `app/(tabs)/explore.tsx` — render the iOS overlay or desktop button at the top of the Progress tab when applicable. Add a "Install on home screen" row to the Progress footer (below Saved Tips) for re-trigger. |
| First-run gate | Hook reads `vocal-training:sessions:v1` count; if 0, treat as first-run and surface the banner in Practice's empty state instead. **Optional polish — punt on this.** |

### iOS overlay design notes
- Reference DESIGN.md for typography + color tokens. Match the existing Headphones modal's visual style (you already have a card-with-illustrate-headline pattern from Slice 5 of BULLETPROOFING).
- Illustration: ASCII-or-SVG sketch of the iOS Share button (`⎙` or `⤴`) → "Add to Home Screen" row. Don't over-engineer; one annotated screenshot or SVG is fine.
- Dismiss button: "Got it" — sets `dismissed: true` permanently.

### Tests
- New `hooks/__tests__/useInstallState.test.tsx` — mock `navigator.userAgent`, `window.matchMedia`, `localStorage`. Assert state transitions on `beforeinstallprompt` event, on dismiss, on install-completed event.
- New `components/pwa/__tests__/IOSInstallOverlay.test.tsx` — render in `isIOS={true}, isStandalone={false}, dismissed={false}` state, assert the headline + illustration render. Render again in dismissed state, assert nothing.
- Component test for `DesktopInstallButton` — render in `canPromptDesktop={true}` state, fire press, assert `prompt` callback invoked.

### Done criteria
- [ ] On iOS Safari (verified via ngrok HTTPS URL on phone), Progress tab shows the "Add to Home Screen" overlay on first visit.
- [ ] After install, the overlay disappears (display-mode: standalone returns true).
- [ ] On desktop Chrome (eligibility met after Slice 2's SW), Progress tab shows "Install app" button. Clicking triggers Chrome's native install prompt.
- [ ] Dismiss persists across cold launches (localStorage flag).
- [ ] Re-trigger row appears in Progress footer when not installed.

### Known gotchas to flag
- **Safari iOS doesn't expose an install-success event.** We rely on `display-mode: standalone` matching after the user comes back to a re-opened PWA. Slight lag (one mount cycle).
- **Chrome's `beforeinstallprompt` only fires once per page-load.** If we don't capture and defer it on first fire, the user never gets the button. The hook needs to run early (in `_layout.tsx` mount).

---

## Slice 5 — Offline-first sanity pass + audit banner (S · ~2h)

**Bundles topic 5.**

### Goal
Verify every user-visible operation works offline once Slices 1–3 are shipped. Add a non-intrusive online-status banner so the user knows when they're offline. Document any operation that *requires* network so it can be flagged in-product.

### What's already offline-safe
- AsyncStorage (sessions, routine, settings, voice part, headphones-confirmed, saved coaching tips) — backed by localStorage on web, fully offline.
- Exercise JSON descriptors — bundled into the JS bundle by Metro, served from SW precache.
- Pitch detection — pure compute on `getUserMedia` stream, no network.
- Scoring, coaching diagnosis — pure functions in `lib/`.
- Bundled fonts (BravuraText, GeneralSans, Fraunces, JetBrains Mono) — precached.

### What needs network (without Slice 3 caching)
- Salamander samples — covered by Slice 3 runtime-cache after first online session.
- ngrok tunnel for phone Safari testing — irrelevant for installed PWA but flag it.

### What this slice adds
| Item | Files |
|---|---|
| Online-status hook | New `hooks/useOnlineStatus.ts` — exposes `{ isOnline: boolean }` via `navigator.onLine` + `online`/`offline` events. SSR-safe (returns true on server-render, since SW takeover hasn't happened yet). |
| Offline banner | New `components/pwa/OfflineBanner.tsx` — small bottom-of-screen banner: "Offline — using cached samples". Renders only on web (`Platform.OS === "web"`) and only when `!isOnline`. Auto-hides on reconnect. |
| Mount banner | `app/_layout.tsx` — render `<OfflineBanner />` outside the `<Stack>` so it's persistent across navigations. |
| Salamander first-use detection | Optional: if we detect a network failure for a Salamander URL AND the SW cache doesn't have it, show a one-time toast "Some piano samples need an internet connection on first use. Open the app online once to download them." Defer to Slice 3 +1d as polish. |

### Tests
- New `hooks/__tests__/useOnlineStatus.test.tsx` — mock `navigator.onLine`, dispatch `online`/`offline` events, assert state transitions.
- Manual: install on iPhone, kill wifi + cellular, reopen app from home screen, run a Five-Note Scale (post-Slice-3 pre-warm). All 8 sample notes play. Banner shows "Offline" badge.
- Manual: clear SW cache, set network offline, open app — confirm app-shell still loads (Slice 2 precache works); confirm Salamander samples fail to load and the (optional) toast appears.

### Done criteria
- [ ] App boot offline → reaches Practice tab → can pick exercise + see staff notation + see syllable strip. Tap Start → samples play (assuming Slice 3 pre-warm completed online).
- [ ] Offline banner visible when offline; auto-hides on reconnect.
- [ ] All AsyncStorage-backed surfaces (sessions, routine, settings, voice part, saved tips) work identically online vs. offline.

---

## Slice 6 — Performance + first-paint audit (M · ~4h, optional)

**Bundles topic 6. Skip if cold-load already feels fast enough — this is polish.**

### Goal
Measure and improve cold-load on iOS Safari. Target: page-load to "Start button tappable" in <2s on a real iPhone over good wifi.

### What's known about current state
- `web.output: "single"` produces one HTML file + one JS bundle (chunked by Metro). No SSR.
- Tone.js (~250 KB minified+gzipped on its own) ships in the main bundle. It's only used on web in `lib/audio/player.web.ts`.
- BravuraText WOFF2 (~700 KB) and GeneralSans OTFs are loaded eagerly via `expo-font.useFonts()` in `_layout.tsx`. The render is gated on `if (!loaded) return null`.

### High-leverage opportunities
1. **Lazy-load Tone.js**: `import("tone")` inside `lib/audio/player.web.ts.init()`. Doesn't ship Tone in the cold-load critical path. Saves ~250 KB. **Recommendation: do this.**
2. **Defer non-critical fonts**: BravuraText is only needed when staff notation renders, which happens after pick-an-exercise. Move to a deferred load via `expo-font.loadAsync()` in a `useEffect` post-mount. The fonts.useFonts gate could pass with just GeneralSans + Fraunces. Saves ~700 KB from initial render gate.
3. **Code-split route bundles**: Expo Router does this automatically per-route. Confirm the Coaching tab's heavy detector library doesn't ship in the Practice tab's bundle.
4. **Preconnect to Salamander CDN**: `<link rel="preconnect" href="https://tonejs.github.io">` in `+html.tsx` — saves ~100ms on first sample fetch. Cheap.
5. **Service Worker precache priority**: precache tells the browser to fetch high-priority. Confirm SW cache strategy doesn't compete with first-paint.

### Changes

| Item | Files |
|---|---|
| Lazy Tone import | `lib/audio/player.web.ts` — change `import * as Tone from "tone"` to `let Tone: typeof import("tone") | null = null` + dynamic import inside `init()`. Delays Tone load until first Start tap. |
| Deferred BravuraText | `app/_layout.tsx` — split the `useFonts` call. Block render only on critical fonts (GeneralSans + Fraunces). Load BravuraText + JetBrains Mono via `Font.loadAsync()` in a post-mount `useEffect`. Components that depend on BravuraText (`MelodyDisplay`) need a fallback render until the font is loaded — likely already handled by react-native-svg falling back to default font. |
| Preconnect | `app/+html.tsx` — add `<link rel="preconnect" href="https://tonejs.github.io" crossOrigin="anonymous">`. |
| Bundle analysis | New `scripts/analyze-bundle.sh` — runs `npx expo export --platform web` + walks `dist/_expo/static/js/web/*.js` reporting size by file. Output as a CI artifact for trend tracking. |

### Measurement
- Lighthouse Performance audit on the deployed PWA (Chrome DevTools → Lighthouse → Mobile/Slow-4G profile). Target: LCP < 2.5s, TTI < 3.5s.
- Real-device measurement: Safari → Develop menu (Mac) → connected iPhone → Web Inspector → Network panel. Cold-cache reload, time to first interactive.

### Tests
- New `lib/audio/__tests__/player.web.test.ts` (component project) — `installFakeAudio()` already covers most paths; add a test that the WebAudioPlayer's `init()` resolves without crashing when Tone is dynamically imported.

### Done criteria — depends on measurement findings
- [ ] Bundle-size delta after lazy-Tone: ≥200 KB removed from initial bundle.
- [ ] BravuraText deferred — initial render no longer blocks on it.
- [ ] LCP < 2.5s on iPhone over wifi, measured with installed PWA.
- [ ] No regression in tests / typecheck.

### When to skip this slice
- If cold-load already feels fine on your iPhone, skip. The work has nontrivial test surface (font fallback, lazy import error paths) and the user-perceived gain on a personal-use app may be ~0.

---

## Slice 7 — Local notification reminders (M · ~5h)

**Bundles topic 4 (the "no backend" half).**

### Goal
Daily warmup reminder that fires when the user opens the PWA OR via a registered SW timer (browser-supports-dependent). No server, no VAPID, no FCM. Single-user, single-device, single-time-of-day.

### Background — what's known and what's wishful
- The Notifications API works in iOS Safari 16.4+, but **only inside an installed PWA running in standalone mode**. Pre-installed Safari tab gets nothing.
- `Notification.requestPermission()` works the same in PWA mode. Granted permission persists.
- Showing a notification requires an SW (we have one from Slice 2). Call `registration.showNotification(...)` from the SW or from the page (page can only show while page is open).
- **There is NO reliable cross-browser scheduling primitive that wakes a closed PWA**. The Notification Triggers API (`showTrigger: new TimestampTrigger(...)`) is Chrome-only and behind a flag. The Web Periodic Background Sync API requires user installation count thresholds and isn't supported on iOS Safari at all.
- **What works on iOS Safari standalone**: when the user opens the PWA, a `useEffect` checks "is it 9 AM and have we already nudged today?" and if not, fires `registration.showNotification()`. **The reminder fires when the user opens the app, not at the configured time.** This degrades the UX from "app reminds me" to "app reminds me when I open it" — fine for a personal habit-tracker but not equivalent to a phone alarm.

### What this slice provides
- **Per-app-open opportunistic reminder**: when the user opens the PWA on a day they haven't practiced yet AND it's after the configured reminder time (default 9 AM), show a notification + a top-of-Practice banner ("Time for your warmup").
- **Inside-session-open scheduling**: while the app is open, set a `setTimeout` that fires `showNotification()` at the configured time. Effective only when the PWA tab/standalone window is open OR the OS lets the SW survive backgrounded (browser-dependent).

### Changes

| Item | Files |
|---|---|
| Reminder config storage | New `lib/reminders/storage.ts` — `vocal-training:reminders:v1` AsyncStorage key. Shape: `{ enabled: boolean, hour: number, minute: number, lastFiredAt: string | null }`. |
| Permission request flow | New `components/pwa/ReminderSettings.tsx` — Toggle in Progress tab. On toggle-on: calls `Notification.requestPermission()`. On grant: writes `enabled: true`. On deny: shows a "denied" state with instructions to re-enable in Safari settings. |
| Opportunistic check | New `hooks/useReminderCheck.ts` — runs in `app/_layout.tsx`. On mount (and every navigation): if `enabled && now >= today's scheduled time && lastFiredAt < today`, call `navigator.serviceWorker.ready.then(reg => reg.showNotification("Time for your warmup", {...}))` and update `lastFiredAt`. Notification clicks open the app (NotificationClick event in SW + `clients.openWindow("/")`). |
| In-app schedule for same-day | If reminder time is in the future today AND app is open, set a `setTimeout` that fires the same notification path. Cleared on unmount. |
| SW notification click handler | `public/sw.js` — `self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(clients.matchAll({type: "window"}).then(c => c.length ? c[0].focus() : clients.openWindow("/"))); })`. |

### What this does NOT do
- **Does not fire when the app is closed and you haven't opened it.** This is the core limitation. If you go a week without opening the app, no reminders fire on iOS Safari (Chrome's Notification Triggers API would, but iOS doesn't support it).
- **Does not support multiple reminder times** — single daily slot.
- **Does not handle timezone changes mid-day** — recompute on every mount; good enough.

### Tests
- New `lib/reminders/__tests__/storage.test.ts` — round-trip of reminder config.
- New `hooks/__tests__/useReminderCheck.test.tsx` — mock `Date.now`, mock `navigator.serviceWorker.ready`, assert `showNotification` is called when crossing the threshold.
- Manual: enable reminder for "1 minute from now", lock phone, watch for notification — likely won't fire on iOS Safari (PWA suspended); reopen app, watch for the catch-up notification.

### Done criteria
- [ ] Reminder toggle in Progress tab. Permission grant flow visible in iOS Safari standalone.
- [ ] Opening the app after the configured time on a non-practiced day shows the notification.
- [ ] Notification click reopens the PWA on the Practice tab.
- [ ] `lastFiredAt` prevents same-day duplicates.

### Recommendation
Ship this slice. Live with it for 2-4 weeks. If "the reminder never fired because I forgot to open the app" turns out to be a real problem, escalate to Slice 8.

---

## Slice 8 — Web push reminders (L · ~10h, recommended skip)

**Bundles topic 4 (the "real push" half). Conditional — only if Slice 7 proves insufficient.**

### Goal
Trigger a daily reminder push that wakes the SW even when the user hasn't opened the app, via Apple's Web Push protocol on iOS 16.4+ for installed PWAs.

### Why this is hard for a no-backend, single-user app
1. **VAPID keypair required.** Generate via `web-push` CLI; keep the private key secret. Personal-use means storing it in a `.env.local` (gitignored).
2. **Push subscription persistence.** When the user grants permission, the browser returns a `PushSubscription` object containing the endpoint URL. This needs to live somewhere persistent. AsyncStorage is fine for personal use — store on grant, retrieve on send.
3. **Trigger needs a backend.** Free options:
   - **GitHub Actions cron** (`schedule: cron: "0 9 * * *"`) — fires once a day, runs a Node script that reads the stored subscription (manually committed to a private repo) and POSTs to the push endpoint. Works but requires committing your subscription to a repo.
   - **Cloudflare Workers Cron Triggers** (free tier: 1 cron + 100k requests/day). Wire the subscription via Worker KV. More setup, more capable.
   - **cron-job.org** + a Vercel free serverless function. Simpler than CF Workers but two services instead of one.
4. **iOS Safari delivery is unreliable.** From Apple's docs (iOS 16.4 release notes) and developer threads: web push to standalone PWAs delivers, but with caveats — devices in low-power mode can defer indefinitely; the PWA must have been opened in the last few days; the push payload size is limited; click handlers are flaky.

### What's surprising and why I recommend skipping
**iOS Safari web push for installed PWAs is NOT a reliable replacement for a phone alarm.** Even with everything wired up correctly, Apple aggressively defers push delivery for PWAs that haven't been "recently active". Real-world reports indicate 60-80% delivery rate on the configured day, with multi-hour latency common. For a daily-warmup reminder, this is worse than Slice 7's "fires when you open the app" model because Slice 7 at least fires deterministically on app-open.

If you want a reliable phone alarm, **use a phone alarm**. The PWA is for the practice surface, not the wake-up surface.

### If you proceed anyway

| Item | Files |
|---|---|
| VAPID keypair | New `.env.local` (gitignored) with `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. Generated via `npx web-push generate-vapid-keys`. |
| Push subscription on grant | `components/pwa/ReminderSettings.tsx` (extend Slice 7) — on permission grant, also call `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`. Persist the resulting `PushSubscription` to AsyncStorage. |
| Push handler in SW | `public/sw.js` — `self.addEventListener("push", e => { const data = e.data?.json() ?? { title: "Time for your warmup" }; e.waitUntil(self.registration.showNotification(data.title, {...})); })`. |
| Backend trigger | New repo `vocal-training-push-cron/` (private, separate repo) — Node script + GitHub Actions cron. Reads the stored subscription, sends a daily push at 9 AM local time (need timezone offset stored too). |
| Re-subscribe on push subscription expiry | The PushSubscription can expire. SW listens for `pushsubscriptionchange` and re-subscribes; the new subscription needs to flow back to the cron repo (manual recommit, ugh). |

### Tests
- Unit: mock `pushManager.subscribe`, assert subscription is persisted.
- Manual: configure cron, install PWA on iPhone, leave app closed for 24h, wait for the push, see if it actually arrives. Repeat for 2 weeks to measure delivery rate.

### Done criteria
- [ ] Push permission granted; subscription stored.
- [ ] Daily cron sends a push payload at the configured time.
- [ ] On iOS, the push fires a notification even when the PWA is closed.
- [ ] Documented delivery rate over 2-week observation window.

### Out of scope for this slice
- Server with database for multi-device subscriptions.
- Re-subscribe automation (manual recommit is fine for single-user).
- Push payload encryption beyond VAPID's defaults.

---

## iOS Safari quirks (apply across all slices)

These are sharp edges that bite specific slices but warrant their own enumeration.

### Audio context user-gesture requirement
- iOS Safari requires a user gesture (touch/click) to unlock the AudioContext. Tone.js handles this in `Tone.start()`, called from `WebAudioPlayer.init()`. Slice 1 doesn't change this; Slice 6's lazy-Tone import preserves the gesture chain because `init()` is called from the Start button's onPress.
- **Standalone-mode quirk**: in installed PWAs, the first launch tap registers as the user gesture; subsequent reloads via the home-screen icon need a fresh gesture before audio unlocks. The existing Headphones modal already serves as a first-tap-of-session unlock gesture — keep that behavior.

### Microphone permission in standalone mode
- `getUserMedia` requires HTTPS (not an issue for installed PWA — the install URL is HTTPS by definition).
- iOS Safari standalone PWAs may re-prompt for mic permission per launch on iOS 16.x; iOS 17+ persists across launches. Document this in the install overlay copy if you observe it: "You may be asked for mic access each time you open the app on iOS 16."

### Service worker lifecycle weirdness
- iOS Safari kills SWs aggressively (~30s of inactivity). The runtime-cache strategy in Slice 3 doesn't care — the SW restarts on next fetch. Anything in Slice 7 that uses `setTimeout` in the SW will die with the SW; only fetch/notification handlers are guaranteed to wake.
- iOS WebKit doesn't support Periodic Background Sync, Background Fetch, or Notification Triggers. None of the "schedule something for later" SW APIs work. Slice 7's design accommodates this.

### Storage eviction under disk pressure
- iOS Safari clears all SW caches AND localStorage when the system is under storage pressure, with no warning. Sessions could vanish. Already-mitigated by:
  - Sessions cap at 500 (Slice 6 of BULLETPROOFING).
  - Saved tips cap at 200 (same).
- Document in CLAUDE.md "Known limitations": "Storage may be cleared by iOS under disk pressure; export sessions externally if you need long-term archives." Out of scope for this plan.

### Viewport-meta gotchas in standalone mode
- `viewport-fit=cover` (added in Slice 1) is required to handle the iPhone notch + home-indicator inset properly when in standalone mode.
- `user-scalable=no` prevents pinch-zoom — appropriate for the practice UI which is fixed-layout.
- Status bar height in standalone mode varies (with/without notch, with/without home indicator). Use `safe-area-inset-top` CSS env var via `react-native-safe-area-context` (already a dep) — verify the existing layout already respects this. If not, that's a separate fix outside this PWA plan.

### Status bar handling
- `apple-mobile-web-app-status-bar-style: default` keeps the status bar visible with dark text on light background. Matches our cream `#f3ede0` canvas.
- DO NOT use `black-translucent` unless you're prepared to manage content underflow into the status bar. Skip it.

### `display-mode: standalone` detection
- Cross-browser: `window.matchMedia("(display-mode: standalone)").matches`.
- iOS legacy fallback: `window.navigator.standalone === true` (added decades ago, still works).
- Used in Slice 4 (install overlay gating) and Slice 5 (offline banner adjustments).

---

## Out of scope (deliberate deferrals)

- **Multi-user / multi-device sync.** Personal use, single device.
- **Web Bluetooth / Web USB / Web Audio scheduling beyond Tone.js.** Not relevant.
- **Chrome custom protocols / handlers.** Not relevant.
- **PWA share-target API** (so user could share an audio file from another app to import as a melody). Interesting future feature, but the existing import flow uses `<input type="file">` which works in standalone mode. Punt.
- **Background sync for offline-logged sessions.** AsyncStorage sessions write synchronously to localStorage — there's nothing to sync because there's no server. Moot.
- **Push notification rich content** (images, action buttons). Single line of text is plenty.
- **iOS native build path.** Locked deferred per BULLETPROOFING_PLAN.md Slice 8.
- **Android-specific PWA polish** (TWA, adaptive icon Android-specific tweaks). The manifest is sufficient for Android Chrome; no separate work.
- **Lighthouse 100 PWA score chasing.** Aim for "installable=yes"; don't optimize for the score itself.

---

## Tracking

As each slice ships, add a one-line entry to ROADMAP.md (likely under a new "M5: PWA Shell" milestone, since none of the existing milestones cover deployment surface). Update CLAUDE.md's "Platform Support" section as PWA capabilities land. Don't batch the doc updates.

When all 7 in-scope slices are green (Slice 8 may stay deferred forever — that's fine), this plan can be deleted or marked "shipped — see ROADMAP M5".
