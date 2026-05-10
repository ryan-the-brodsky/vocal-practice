# Design System — Vocal Training

Single source of truth for all visual decisions. **Always read this before making any UI changes.**

Last update: 2026-05-09 · Created via `/design-consultation`.

---

## Product Context

- **What this is:** A personal vocal-warmup tool with pitch detection, scoring, and piano accompaniment for daily practice
- **Who it's for:** Vocal students using it directly + coaches recommending it to students
- **Space:** Music education / contemporary commercial music (CCM — pop, rock, R&B, country, musical-theater belt). Not operatic, not bel-canto
- **Project type:** Web app + native iOS app. Mobile-first. Daily-use utility, NOT a marketing site
- **Key differentiator:** Fully frontend, no signup, no subscription, audio never leaves device. Static-site deployable.

---

## Aesthetic Direction

- **Direction:** Modern Editorial / Studio Hybrid
- **Decoration level:** Intentional (not minimal, not expressive — subtle texture and considered hierarchy; the data should pop, not the chrome)
- **Mood:** A serious craftsperson's tool, music-tradition-literate, used daily in dim practice rooms by people who actually sing. Lineage: beautiful music exercise books + modern indie software (Linear, Are.na, Cron). Avoids generic SaaS, stage-glittery, toy-like.
- **Reference vibe:** Imagine a leather-bound practice notebook on warm cream paper, with a single brass amber bookmark.

---

## Typography

Three voices, three jobs. Each one has a clear role; never mix.

### Display — Fraunces
- **Role:** Note names (`G4`, `A4`), exercise titles, section headers, big diagnosis headlines, hero numbers
- **Font:** [Fraunces](https://fonts.google.com/specimen/Fraunces) — variable serif with `opsz` (optical size) and `SOFT` axes
- **Why:** Reads literary and modern, never precious. SOFT axis lets us soften at large sizes (display) and tighten at small sizes (note labels). Differentiates instantly from every music app on the market — none of them use an expressive serif.
- **CDN:** `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&display=swap`
- **Settings:** `font-optical-sizing: auto; font-variation-settings: "SOFT" 50;` for default; tune SOFT 30–100 by context

### Body / UI — General Sans
- **Role:** All UI labels, buttons, banners, form copy, card titles, body paragraphs
- **Font:** [General Sans](https://www.fontshare.com/fonts/general-sans) (Indian Type Foundry, free via Fontshare)
- **Why:** Modern geometric sans with personality. Weights 200–700 cover everything we need. Avoids the overused defaults (Inter, Roboto, Arial, Helvetica, system).
- **CDN:** `https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap`

### Data / Numerals — JetBrains Mono
- **Role:** Cents readouts (`−34¢`), BPM, MIDI numbers, frame counts, scale-degree integers, monospace data tables, code blocks
- **Font:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (free)
- **Why:** Tabular numerals by default — every digit takes the same width. Critical when cents readouts update in real time and shouldn't shift the layout pixel-by-pixel. Battle-tested for serious dev/design work.
- **CDN:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap`
- **Settings:** `font-feature-settings: "tnum";` always

### Type Scale (modular, mobile-first)

| Level | Size (px) | Line height | Usage |
|---|---|---|---|
| `text-xs` | 11 | 1.4 | Eyebrows, micro-labels, tertiary metadata |
| `text-sm` | 13 | 1.5 | Secondary text, captions, footnotes |
| `text-base` | 15 | 1.6 | Body copy, default UI |
| `text-md` | 17 | 1.55 | Lead paragraphs, slightly larger body |
| `text-lg` | 22 | 1.4 | Emphasized body, sub-headlines |
| `text-xl` | 28 | 1.2 | Card titles, diagnosis headlines |
| `text-2xl` | 40 | 1.1 | Section headers |
| `text-3xl` | 56 | 1.05 | Tonic display, big stats |
| `text-display` | 64–96 | 1.0 | Hero, full-bleed display moments |

Display sizes scale up by `clamp(40px, 6vw, 64px)` style on web. Native uses fixed scale.

### Weights
- Fraunces: 300 (light), 400 (regular), 500 (medium), 600 (semibold). Italic = 300 with `font-variation-settings: "SOFT" 100;`
- General Sans: 400 (default body), 500 (UI buttons + labels), 600 (emphasized titles), 700 (rare display use)
- JetBrains Mono: 400, 500 only

---

## Color

**Cream is the canvas (the warmth lives there). Brown is a deliberate emphasis-panel surface (used to spotlight a section). Burnt amber is the accent.** This is a critical decision — never use brown as a default canvas. It reads "70s wood-panel" not "warm musical."

### Light tokens (default — primary register)

| Token | Hex | Role |
|---|---|---|
| `--bg-canvas` | `#f3ede0` | Warm cream paper. Page background. |
| `--bg-surface` | `#fbf7ec` | Slightly elevated paper. Cards on canvas. |
| `--bg-elevated` | `#ffffff` | Modal/popover. Highest layer. |
| `--bg-emphasis` | `#2c2118` | Deep warm brown. **Use only for spotlight panels** — diagnosis card, contrast playback panel, weekly stat card. |
| `--bg-emphasis-inset` | `#1f1610` | Darker inset for elements within emphasis panels. |
| `--text-primary` | `#1d130a` | Deep ink. Body + display. |
| `--text-secondary` | `#5a4d3d` | Warm gray-brown. Labels, captions. |
| `--text-tertiary` | `#8a7d70` | Subtle warm gray. Metadata, micro-labels. |
| `--text-on-emphasis` | `#f5efe4` | Cream text on brown emphasis panels. |
| `--text-on-emphasis-dim` | `#c4b3a0` | Dimmed cream on brown panels. |
| `--border-subtle` | `#e8dfca` | Paper-grain divider. |
| `--border-strong` | `#c8b89a` | Stronger separator. |
| `--border-on-emphasis` | `#4a3d33` | Border within brown panels. |
| `--accent` | `#a86a24` | Burnt amber, performer's stage light. Buttons, links, focus highlights. |
| `--accent-hover` | `#8d5818` | Darker amber. Hover state. |
| `--accent-on-emphasis` | `#e09238` | Brighter amber when accent is on a brown panel. |
| `--accent-muted` | `rgba(168, 106, 36, 0.10)` | Tints, accent-colored backgrounds. |
| `--success` | `#5a8a5a` | Sage. "In tune", positive state. |
| `--warning` | `#b07020` | Burnt sienna. "Close call." |
| `--error` | `#a04030` | Rust. "Clearly off." |

### Dark tokens (alternative — dim-room mode)

| Token | Hex | Role |
|---|---|---|
| `--bg-canvas` | `#1a1612` | Neutral warm dark. NOT 70s brown. |
| `--bg-surface` | `#221d17` | Raised surface. |
| `--bg-elevated` | `#2c261e` | Modal/popover. |
| `--bg-emphasis` | `#3a2c1f` | Same emphasis-panel role as light mode. Slightly lifted brown. |
| `--bg-emphasis-inset` | `#2c2118` | Inset within emphasis panels. |
| `--text-primary` | `#f5efe4` | Cream. |
| `--text-secondary` | `#c4b3a0` | Dimmed cream. |
| `--text-tertiary` | `#8a7965` | Subtle. |
| `--text-on-emphasis` | `#f5efe4` | Same as light. |
| `--text-on-emphasis-dim` | `#c4b3a0` | Same as light. |
| `--border-subtle` | `#2c261e` | Barely-there. |
| `--border-strong` | `#4a3d33` | Stronger separator. |
| `--border-on-emphasis` | `#5a4536` | Border within brown panels. |
| `--accent` | `#e09238` | Brighter amber for dark canvas. |
| `--accent-hover` | `#f0a44a` | |
| `--accent-on-emphasis` | `#f0a44a` | Same as accent — brown panels are similar luminance. |
| `--accent-muted` | `rgba(224, 146, 56, 0.18)` | |
| `--success` | `#7ba87b` | Lifted sage. |
| `--warning` | `#d49a48` | Lifted burnt sienna. |
| `--error` | `#c2624d` | Lifted rust. |

### When to use the brown emphasis panel

Brown is **NEVER** the canvas. It's used surgically to spotlight a section, the way a leather binding would set off a single page in a book. Apply `--bg-emphasis` to:
- The diagnosis card on the Coaching screen
- The contrast playback panel ("Listen" with the 4 buttons)
- The weekly summary card on Progress (when the big stat number should pop)
- A hero stat callout
- A code/data terminal block

Do NOT use it on:
- Practice screen background
- Standard cards listing items
- Form inputs / pickers
- Modals (use `--bg-elevated`)

### Contrast targets

- Body text on canvas: ≥7:1 (deep ink on cream is ~14:1 — comfortable)
- Body text on surface: ≥7:1
- Text on emphasis (cream on brown): ≥10:1
- Accent on canvas (amber on cream): ≥4.5:1 — verify in dark mode where amber is brighter
- Touch targets: minimum 44 × 44 on native, 36 × 36 on web

---

## Spacing

Base unit `4px`. Never use values outside this scale.

| Token | px |
|---|---|
| `space-3xs` | 2 |
| `space-2xs` | 4 |
| `space-xs` | 8 |
| `space-sm` | 12 |
| `space-md` | 16 |
| `space-lg` | 24 |
| `space-xl` | 32 |
| `space-2xl` | 48 |
| `space-3xl` | 64 |
| `space-4xl` | 96 |

**Density guidelines:**
- Practice screen: comfortable. `space-lg` between sections, `space-md` within cards
- Coaching screen: comfortable. Same as Practice
- Progress screen: tighter. `space-md` between sections, `space-sm` within data lists
- Modals: spacious. `space-lg` minimum padding

---

## Layout

- **Approach:** Hybrid — grid-disciplined for data screens (Progress, Saved Tips), more editorial for the Practice and Coaching screens (the daily-use surfaces)
- **Mobile breakpoint:** ≤640 px. Single-column. Native-style.
- **Tablet breakpoint:** 641–1023 px. Single-column with wider gutters.
- **Desktop breakpoint:** ≥1024 px. Center the content column at `max-width: 720px` for screens that aren't meant to be wide. Wider only when data density warrants (Progress per-exercise list, Saved Tips list).
- **Border radius scale:** `radius-sm: 6px` (chips, inline buttons), `radius-md: 10px` (cards, inputs), `radius-lg: 14px` (large surfaces, modals), `radius-pill: 999px` (chips, badges, theme toggle)

---

## Motion

- **Approach:** Intentional. Subtle entrance for primary content, deliberate state transitions, no flashy choreography.
- **Easing:**
  - Enter: `cubic-bezier(0.2, 0, 0, 1)` (custom ease-out, snappy entry)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in)
  - State change: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Duration:**
  - Micro (toggle, color change): 100ms
  - Short (entrance, dismiss): 200ms
  - Medium (panel open, modal): 300ms
  - Long (page transition, sequence): 500ms — use sparingly
- **Motion specifications:**
  - Card/panel entrance: opacity 0→1 + translateY 8px→0 over 200ms
  - Tap state on buttons: scale 1.0 → 0.97 over 100ms (haptic feel)
  - Coaching focus-syllable pulse: 600ms ease-in-out, opacity 1.0 → 0.7, repeating; pauses on tap-to-stop
  - Theme toggle: 300ms cross-fade on background-color and color properties
- **Reduced motion:** Honor `prefers-reduced-motion: reduce` — disable entrance animations, swap pulses for static highlights, use instant theme toggle

---

## Iconography

- **Source:** `@expo/vector-icons` (already in stack — Feather and Ionicons families)
- **Default size:** 20px for inline, 24px for primary actions, 32px for hero use
- **Stroke weight:** Match the body weight where possible (Feather is thin — pairs well with General Sans 500)
- **Color:** Inherit from text — do not assign accent unless the icon is the primary action affordance

---

## Component Vocabulary

### Buttons

| Variant | Background | Border | Text |
|---|---|---|---|
| Primary | `--accent` | `--accent` | `--bg-canvas` |
| Secondary | `--bg-surface` | `--border-strong` | `--text-primary` |
| Ghost | `transparent` | `transparent` | `--text-secondary` (hover: `--accent`) |
| Danger | `--error` | `--error` | `#fff` |

Padding: `space-sm` × `space-md` (10/12 × 18/20). Radius: `radius-md`. Font: General Sans 500 at `text-base`.

### Cards

- Default: `--bg-surface` background, `1px solid --border-subtle`, `radius-md`, `padding: space-md` to `space-lg`
- Emphasis: `--bg-emphasis` background, `1px solid --border-on-emphasis`, used surgically (see emphasis panel rules)

### Form inputs

- Background: `--bg-canvas` (deeper than surface — looks like a labeled cutout in the page)
- Border: `1px solid --border-strong`
- Focus border: `--accent`
- Padding: `space-sm` × `space-md`
- Radius: `radius-md`

### Banners / Alerts

- Background: `--bg-surface`
- `border-left: 3px solid` of semantic color (`--success`, `--warning`, `--error`, or `--accent` for info)
- Padding: `space-sm` × `space-md`
- Radius: `radius-md`

### Pills / chips

- Background: `--bg-surface`, border `1px solid --border-subtle`
- Active: background `--accent-muted`, border `--accent`, text `--accent`
- Padding: `space-2xs` × `space-sm`
- Radius: `radius-pill`

---

## Accessibility

- **Touch targets:** ≥ 44 × 44 px on native, ≥ 36 × 36 px on web. The "Back" link cannot be `paddingVertical: 4`.
- **Color contrast:** All body text ≥ 7:1, accent on canvas ≥ 4.5:1. Verify dark-mode pairs explicitly — amber gets brighter, ink gets cream.
- **Keyboard navigation:** Every interactive element reachable via Tab. Focus ring uses `--accent` outline at 2px with 2px offset.
- **Screen reader semantics:** Every Pressable gets an `accessibilityLabel`. The contrast playback panel announces the current variant. Diagnosis evidence is read in a structured order.
- **Reduced motion:** see Motion section.
- **Color is never the only signal:** The ±25¢ tuning meter is green, but also says "in tune" in text. The diagnosis "flat" / "sharp" is a word, not just an arrow direction.

---

## AI-slop blacklist (never ship these)

These patterns scream "AI-generated SaaS." Verify against this list during any visual review:

1. Purple/violet/indigo gradient backgrounds. (Indigo `#4338ca` is the previous default — do not reintroduce.)
2. The 3-column feature grid: icon-in-colored-circle + bold title + 2-line description × 3, symmetric.
3. Centered-everything layout (text-align: center on every heading).
4. Uniform bubbly border-radius on every element (same large radius on everything).
5. Decorative blobs, floating circles, wavy SVG dividers.
6. Emoji as design elements (rockets, stars, microphones in headings).
7. Colored left-border on every card (different colors per category).
8. Generic copy ("Welcome to your dashboard", "Unlock the power of...").
9. Cookie-cutter section rhythm where every section has the same height and pattern.
10. Stock-photo hero sections with translucent text overlays.

If any review surfaces one of these, fix it before shipping.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-09 | Initial design system created via `/design-consultation` | Project had no DESIGN.md; coaching redesign needed an anchor; Slice 5+ work needed visual guardrails before implementation |
| 2026-05-09 | Cream-canvas, brown-emphasis-panel, amber-accent | Inverted from initial proposal where canvas was brown — that read 70s-dated. Cream is the warmth, brown is reserved for spotlight panels (diagnosis card, contrast playback, weekly stat). User-tested in HTML preview before lock. |
| 2026-05-09 | Fraunces / General Sans / JetBrains Mono | Differentiation from generic SaaS. Avoids overused defaults (Inter, Roboto, Helvetica). All free. Roles: display / UI body / data. |
| 2026-05-09 | Burnt amber accent (`#a86a24` light / `#e09238` dark), not indigo | Prior default was indigo `#4338ca` — overused, generic SaaS. Amber is uncommon in music apps and reads warm + performer's-stage. |
| 2026-05-09 | Light is the only active theme; dark deferred to opt-in toggle | After the migration shipped, the app inherited OS dark mode via `useColorScheme()` and rendered the dark `bgCanvas` (warm-dark) — the user immediately rejected this as the same brown-canvas mistake the cream-inversion fixed. Decision: hardcode light in `useTheme()`, `useThemeColor()`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `components/parallax-scroll-view.tsx`. Dark tokens stay defined in the palette for a future Theme preference (System / Light / Dark) — not auto-routed via OS. |

---

## How to use this file

- **For code:** Always read this before changing any visual decision. New components extend the vocabulary; do not invent.
- **For QA:** Flag any code that uses a hex value that isn't in this file, or a font that isn't in the three-stack.
- **For Slice 5+ planning:** This is the calibration anchor. `/plan-design-review` runs against this; Slice 5 (subset practice), Slice 7 (note editor), and any new screen MUST cite the tokens used.
- **For updates:** Any change to this file should add a row to the Decisions Log with rationale. Never modify a color or font silently.
