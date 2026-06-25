# Learning Library Plan — Articles with Embedded Exercises

**Status:** approved 2026-06-24, not yet implemented
**Depends on:** `seo/static-rendering-architecture.md` (the Learn routes only earn SEO value once static rendering + de-gating ship).
**Why these topics:** `seo/keyword-research-2026-06.md`.
**How to write them:** `seo/content-style-guide.md` — required reading for voice/tone + the mandatory adversarial fact-check process. Every article records its claim verdicts + verified sources in a `*-content-sources.md` (template: `seo/range-tester-content-sources.md`).

The Learn library serves the **informational** keyword clusters (where articles win) and is the connective tissue that internally links the tool pages (`/vocal-range-test`, `/vocal-warm-ups`) and the app. The differentiator — and the reason this beats the text-only blogs we compete with — is that **each article embeds the matching live exercise** from our existing library.

---

## The embedded-exercise pattern (the master stroke) — and the SEO rule

A `<EmbeddedExercise exerciseId="head-voice-vwohm" />` island mounts the real practice widget (mic + piano + scoring, reusing the engine) inside an article.

**SEO rule that makes it safe:**
- ✅ The article's prose, headings, and FAQ render as **static HTML** at build time → fully indexable.
- ✅ The exercise is a **hydrated island** → interactive enhancement, loads lazily on/after hydration.
- ❌ Never put substantive ranking copy *inside* the client-only widget — that's the empty-shell failure mode the spike exposed.

Upside beyond parity: a working embedded exercise improves dwell time and "does this page satisfy intent" signals, and makes a `head voice exercises` page genuinely more useful than the blog posts ranking today — a moat, not a checkbox.

**Component spec (`components/learn/EmbeddedExercise.tsx`):**
- Props: `exerciseId` (one of the `data/exercises/*.json` ids), optional `voicePart`, optional `title`/caption.
- SSG render: a static placeholder card (exercise name + "what this trains" blurb from `lib/exercises/capabilities.ts` + a "▶ Try it" affordance) so there's meaningful HTML even pre-hydration.
- Post-hydration: lazy-`import()` the heavy audio path and mount the live exercise (a trimmed Practice surface; reuse `planExercise` + `AudioPlayer` + `PitchDetector` + scoring). Honors `pitchDetection: false` exercises as follow-along (e.g. `rossini-lip-trill`, `straight-tone-vibrato`).
- Respects DESIGN.md tokens; no hex/spacing literals.

---

## Information architecture

```
/learn                      # Hub: pillars + article cards, internal links to tool pages + app
/learn/[slug]               # Article — generateStaticParams() pre-renders each
```

- Group articles on the hub by **pillar** (mirrors the capability taxonomy so it stays honest): Foundations · Warm-ups · Chest / Mix / Head · Belt & Style · Vibrato & Control · Range · Pitch & Ear.
- Hub links out to `/vocal-range-test`, `/vocal-warm-ups`, `/vocal-exercises`, and the app.
- On-site search is a later UX nicety, NOT an SEO lever — discoverability comes from each article being its own indexable URL + internal links + the sitemap.

---

## Content model (v1: typed TSX content, no new build deps)

Each article is a module under `content/learn/<slug>.tsx` exporting:
- `meta`: `{ slug, title, metaDescription, h1, targetKeyword, volume, kd, pillar, embeddedExerciseIds: string[], faq: {q,a}[], updated }`
- `Body`: a component composed of shared primitives (`<P>`, `<H2>`, `<Lead>`, `<FAQ>`, `<EmbeddedExercise>`, `<RelatedLinks>`) — all DESIGN.md-tokenized.

`app/(marketing)/learn/[slug].tsx`:
- `generateStaticParams()` returns every `meta.slug` → one HTML file per article.
- Renders `<Head>` from `meta` (title/description/canonical/OG + JSON-LD) then `<ArticleLayout><Body/></ArticleLayout>`.

`content/learn/index.ts` exports the ordered `meta[]` for the hub + sitemap. (MDX is a possible later upgrade for nicer authoring; TSX avoids a Metro MDX transformer for now.)

---

## Per-article on-page SEO template

- **`<title>`**: `<Target Keyword, Title Case> — <angle> | Vocal Habit` (lead with "free / no signup" where it fits the term).
- **meta description**: 140–155 chars, includes the target term + the "try it free in your browser" hook.
- **One `<h1>`** = the target keyword (natural phrasing).
- **`<h2>`s** from the cluster variants (e.g. for head voice: "What is head voice?", "Head voice exercises to try", "Head voice vs falsetto", "Common mistakes").
- **FAQ** mapping real low-KD informational queries (each becomes `FAQPage` JSON-LD).
- **Schema**: `Article` (+ `HowTo` for routine/how-to pieces, `FAQPage` for the FAQ). The embedded tool also justifies a `SoftwareApplication` reference linking to the app.
- **Internal links**: each article → its pillar's tool page + 2–3 sibling articles + a CTA into the app.

---

## Article roadmap (mapped to keywords + embedded exercises)

Volumes/KD = US, from the keyword research. "Embed" = `data/exercises/*.json` id.

### Phase 1 — quick, highest ROI (low KD, strong embed fit)

| Slug | Target keyword | Vol | KD | Pillar | Embed |
|---|---|---|---|---|---|
| `how-to-sing-in-tune` | how to sing in tune | 300 | 0 | Pitch & Ear | `nay-1-3-5-3-1` (USP: live pitch scoring) |
| `can-anyone-learn-to-sing` | can anyone learn to sing | 1,600 | 0 | Foundations | `five-note-scale-mee-may-mah` |
| `head-voice-exercises` | head voice exercises | 70 | 0 | Head | `head-voice-vwohm`, `octave-leap-wow` |
| `chest-voice-exercises` | chest voice exercises | 40 | 0 | Chest | `chest-voice-mum`, `chest-descent-mah` |
| `mix-voice-exercises` | mix voice exercises | 30 | 0 | Mix | `bub-mix-voice`, `goog-octave-arpeggio` |
| `sovt-exercises` | semi occluded vocal tract exercises | 150 | 2 | Warm-ups | `rossini-lip-trill`, `hum-warmup` |
| `vibrato-exercises` | vibrato exercises | 80 | 0 | Vibrato & Control | `straight-tone-vibrato` |
| `5-minute-vocal-warm-up` | 5 minute vocal warm up | 200 | 0 | Warm-ups | `hum-warmup` + a scale (`five-note-scale-mee-may-mah`) |

### Phase 2 — solid informational depth

| Slug | Target keyword | Vol | KD | Pillar | Embed |
|---|---|---|---|---|---|
| `how-to-improve-singing-voice` | how to improve singing voice | 500 | 3 | Foundations | routine (2–3 exercises) |
| `how-to-practice-singing` | how to practice singing | 350 | 6 | Foundations | `five-note-scale-mee-may-mah` + CTA to routine |
| `how-to-increase-vocal-range` | vocal exercises to increase range | 70 | 0 | Range | `stepwise-passaggio-ascent`, `octave-leap-wow` (+ link to /vocal-range-test) |
| `belting-exercises` | vocal belting exercises | 60 | — | Belt & Style | `belt-arpeggio-mah`, `belt-nyah-descending`, `high-belt-wee` |
| `vocal-agility-exercises` | vocal agility exercises | 70 | 0 | (Agility) | `agility-run`, `staccato-arpeggio` |
| `vocal-resonance-exercises` | vocal resonance exercises | 90 | 0 | (Resonance) | `five-note-scale-mee-may-mah` |
| `can-you-learn-to-sing-as-an-adult` | can you learn to sing as an adult | 150 | 0 | Foundations | `nay-1-3-5-3-1` |

### Phase 3 — long-tail fill + voice-specific

| Slug | Target keyword | Vol | KD | Pillar | Embed |
|---|---|---|---|---|---|
| `10-minute-vocal-warm-up` | 10 minute vocal warm up | 70 | 0 | Warm-ups | warm-up sequence |
| `vocal-warm-ups-for-beginners` | beginner vocal warm up exercises | 60 | 19 | Warm-ups | `hum-warmup`, `five-note-scale-mee-may-mah` |
| `how-to-warm-up-your-voice` | how to warm up vocal cords | 60 | 16 | Warm-ups | `hum-warmup` |
| `can-tone-deaf-people-learn-to-sing` | can tone deaf people learn to sing | 70 | 0 | Foundations | `nay-1-3-5-3-1` (pitch feedback as the hook) |
| `pitch-training-for-singers` | pitch training | 150 | 17 | Pitch & Ear | `nay-1-3-5-3-1` |
| `breathing-exercises-for-singing` | vocal breathing exercises | 80 | 6 | Foundations | `messa-di-voce` (dynamics/control) |

> Roughly 20 articles. Don't silently cap — if a cluster proves it converts, expand it (e.g. voice-specific `soprano vocal warm up` 80, `male vocal warm up` 40, `baritone vocal warm up` 60 are easy Phase-4 spin-offs reusing the warm-up embeds).

---

## Internal linking strategy

- **Hub → articles** (grouped by pillar) and **hub → tool pages**.
- **Each article →** its pillar tool page (e.g. head/chest/mix articles → `/vocal-exercises`; warm-up articles → `/vocal-warm-ups`; range article → `/vocal-range-test`) + 2–3 sibling articles + an in-content CTA into the app for the embedded exercise.
- **Tool pages → relevant articles** ("New to this? Read …").
- Keep the register cluster tightly interlinked (Chest ↔ Mix ↔ Head) — mirrors how singers think and concentrates topical authority.

---

## QA / acceptance (per article)

- [ ] `dist/learn/<slug>.html` contains the full prose + H1 + FAQ in **static HTML** (view-source/curl), with a unique `<title>` + meta description.
- [ ] JSON-LD (`Article` + `FAQPage` [+ `HowTo`]) validates in Rich Results Test.
- [ ] The `<EmbeddedExercise>` placeholder renders meaningful static text; the live widget mounts + works after hydration; the marketing route doesn't ship the heavy audio bundle on initial load.
- [ ] Internal links resolve; article appears on the hub + in the sitemap.
- [ ] DESIGN.md compliance (no hex/spacing/font literals); `tsc --noEmit` + `npm test` clean; add a light component test if the article carries logic.

---

## Open questions

- **Authoring DX:** TSX content modules (v1, recommended) vs adopting an MDX transformer later if non-engineers will write articles.
- **`<EmbeddedExercise>` scope:** how much of the Practice surface to reuse vs a slimmed "lite" player (probably lite: piano + mic + per-note result, no routine chrome).
- **Voice-part default** in embeds: pick a sensible default (e.g. let the visitor choose, or default to a mid voice) since Learn visitors haven't set a voice part.
- **Author/E-E-A-T:** consider a short credentialed byline/about for the pedagogy content (helps both Google and AI-answer citations).
- **AI-answer optimization:** these FAQ-rich, well-structured pages are also the ones that get cited by AI search — there's an `ai-seo` skill if we want to optimize specifically for that later.
