# Artist Spotlights + Voice-Teacher Partnerships — Research & Plan

**Status:** research + plan, not yet implemented (2026-06-28)
**Author:** autonomous feature session
**Depends on / plugs into:** the live `/vocal-range-test` tool, the `content/learn/*.md` → `learn:gen` → `/learn/[slug]` pipeline, `components/learn/EmbeddedExercise.tsx`, `components/tools/RangeTesterIsland.tsx`.
**Read first:** `seo/content-style-guide.md` (voice + the MANDATORY adversarial fact-check), `seo/keyword-research-2026-06.md` (the broader map), `seo/learning-library-plan.md` (the embedded-island pattern).
**Automation target:** a draft-only, approval-gated henchmen agent (mirrors `henchmen/agents/blog` + `fleet/approval-policy.md`).

---

## TL;DR — the thesis in five lines

1. **Lead with "specs," not "copy them" — three KD-0 clusters on one page.** People google an artist's *specs*: `"[artist] vocal range"` (Ariana/Mariah **1,500/mo**; Freddie/Taylor/Axl/Whitney/Beyoncé/Adele/Chappell Roan **300–1,000/mo at KD 0–7**) and `"[artist] voice type"` (Adele/Mariah/Ariana/Celine/Beyoncé **150–300/mo, KD 0–6**). They do **not** google "[artist] vocal techniques/analysis" (≈0). `"how to sing like [artist]"` is a real but artist-dependent long tail (strong for *technique* artists, weak for tone artists — Adele just 20/mo). One **Artist Spotlight** page targets all three; **both spec clusters are answered by the range tester we already own.**
2. **Each Spotlight is built around two embeds we already own / can commission.** The live **range tester** ("test your range against Mariah's") + a **commissioned guest-teacher demo video** breaking down the technique. Static SEO copy wraps both; the engine mounts as an island. This is the existing master-stroke pattern, applied to artists.
3. **The guest teacher is the growth engine, not a nice-to-have.** They give us an original video + E-E-A-T + a backlink when they share the co-created post. We give them an interactive embed, exposure to our (growing) audience, and a stack of short-form clips cut from their own demo. Both sides win, so the ask is easy.
4. **Start small, ratchet up.** Micro-coaches first (easy yes, real backlinks), use the published, link-earning, traffic-showing results as proof to land mid-tier, then macro creators. Legitimacy compounds.
5. **The unit is repurposable into the "many stupid platforms."** One ~6-min teacher demo → 4–8 platform-native shorts (YouTube Shorts / TikTok / IG Reels / etc.) → the social feed finally has *real* content, not generic "practice your pitch" pitches.
6. **Then hand the repeatable parts to a henchmen agent** that researches, drafts the article, drafts the outreach, and cuts the clip list — and **stops at every outward gate** (pick targets → send outreach → publish → post) for one-tap human approval.

---

## 1. The demand data (Ahrefs, US, 2026-06-28)

### 1a. `"[artist] vocal range"` — the volume cluster (the surprise)

This is bigger and softer than the "how to sing like" framing suggested. KD is near zero across the board.

| Keyword | Vol/mo | KD | Notes |
|---|---|---|---|
| ariana grande vocal range | 1,500 | 3 | flagship |
| mariah carey vocal range | 1,500 | 7 | flagship; the "whistle register" hook |
| freddie mercury vocal range | 1,000 | 0 | evergreen |
| taylor swift vocal range | 900 | 0 | huge fandom search |
| axl rose vocal range | 700 | 0 | rock |
| whitney houston vocal range | 600 | 1 | evergreen |
| beyonce vocal range | 450 | 0 | |
| adele vocal range | 350 | 0 | |
| cynthia erivo vocal range | 350 | — | **trending** (Wicked) |
| michael jackson vocal range | 300 | 0 | also tops "how to sing like" (100/mo) |
| **chappell roan vocal range** | 300 | — | **trending**; the user's seed — dramatic register leaps |
| mike patton / tim storms / etc. | 400–500 | 0–5 | "extreme range" novelty hooks |

Plus the head terms this cluster feeds and interlinks with — already on the roadmap via the range-test play: `vocal range test` (8,500/mo, KD 6), `vocal range chart` (3,500, KD 11), `what is my vocal range` (1,100, KD 6).

**Honest read:** individually these artist terms have low *organic traffic potential* (TP often 100–800 — the term is a parent-topic spoke, not a traffic firehose). Their value is fourfold and only partly organic: (a) **trivially winnable** (KD 0 — a DR-low site can rank), (b) they **catch trending + social search spikes** (Chappell Roan, Cynthia Erivo/Wicked) that the slow evergreen articles can't, (c) they are the **ideal host** for the guest video + range-tester embed, and (d) **the real prize is the backlink + the social-content engine**, with organic ranking as compounding upside. The big-volume head terms stay owned by `/vocal-range-test`; the artist pages are spokes that interlink into and strengthen that hub.

### 1b. `"[artist] voice type"` — the second volume cluster (the range tester already answers it)

A near-twin of the range cluster, equally soft (KD 0–6), and **our range tester already classifies voice type**, so one embed serves both 1a and 1b. The head terms carry the same traffic potential as the range hub: `voice type test` 800/mo (KD 7, **TP 21,000**), `what voice type am i` 400, `what is my voice type` 350 (KD 0, **TP 21,000**), `how to find your voice type` 150 (**TP 23,000**).

| Keyword | Vol/mo | KD | Keyword | Vol/mo | KD |
|---|---|---|---|---|---|
| bessie smith voice type | 300 | — | adele voice type | 200 | 1 |
| george strait voice type baritone | 300 | — | mariah carey voice type | 200 | 6 |
| josh turner voice type bass baritone | 250 | — | celine dion soprano voice type | 200 | — |
| kristin chenoweth voice type | 200 | — | adam levine tenor voice type | 200 | — |
| ariana grande voice type | 200 | 0 | beyonce / lady gaga / sabrina carpenter / cynthia erivo / laufey | 150 each | 0 |

Many *include the answer in the query* ("celine dion **soprano** voice type", "adam levine **tenor** voice type", "josh turner **bass-baritone**") — a quick-answer / featured-snippet gift, and exactly what our classifier outputs.

### 1c. `"how to sing like [artist]"` — the technique long tail (artist-dependent)

All KD 0. Individually small (20–100/mo) but there are *dozens*. **Key caveat from the data: this angle's strength tracks whether the artist has a signature, replicable *move*.** Technique artists pull 5× the tone artists: Ariana 100, Michael Jackson 100 vs. **Adele just 20**. So lead "how to sing like" only where there's a flashy move (runs, whistle, register leaps, screams); for tone-driven artists, demote it. The rock/metal "how do they DO that" tail is the hungriest and maps perfectly to a coach demonstrating the move.

| Pop / R&B | Vol | Rock / Metal | Vol |
|---|---|---|---|
| michael jackson | 100 | chester bennington | 90 |
| ariana grande | 100 | layne staley | 70 |
| frank sinatra | 70 | kurt cobain | 60 |
| billie eilish | 70 | chris cornell | 60 |
| bruno mars | 60 | axl rose | 50 |
| the weeknd | 50 | james hetfield | 40 |
| mariah carey | 40 | jeff buckley | 40 |
| **adele (tone artist — weak)** | **20** | eddie vedder / robert plant / serj tankian | 20–30 |

### 1d. The synthesis + the dead ends (verified, US/mo)

**Three interlocking KD-0 artist sub-clusters co-locate on one page,** and both volume clusters feed tools we already own:

1. `[artist] vocal range` (+ exact-notes variants like `adele vocal range c3 c6`, 150/mo — people search the literal note span) → embeds `/vocal-range-test`.
2. `[artist] voice type` (+ `what voice type is [artist]`) → embeds the **same** range tester's voice-type classifier.
3. `how to sing like [artist]` → the teacher-demo / technique layer (use prominently only for technique artists).

The page **leads with range + voice type** (where the volume is); "how to sing like" + the guest demo is the engagement/technique/social layer.

**Worked example — Adele (why "range" beats the alternatives):** `adele vocal range` 350 + `adele voice type` 200 + the what-is/exact-note variants ≈ **~1,300/mo combined at KD 0–1**, but `adele vocal technique(s)` / `adele vocal analysis` / `how does adele sing` / `adele belting` = **0–10/mo each. Do not target those.** `adele singing` (150) looks tempting but is **KD 82** entertainment/video intent (watch-her-sing), not our battle. The volume is in *"what are her specs,"* not *"how do I copy her."*

> Ahrefs units used this run: ~4,500 (overview + 3 matching-terms pulls). Lite-plan headroom remains large; expand the artist list before each batch.

---

## 2. The supply side — voice-teacher creators exist, in tiers, and already make this content

The "Vocal Coach Reacts / breaks down [artist]" genre is a large, established YouTube category. That matters: **the guest content we want (a teacher demonstrating an artist's technique on camera) is content these creators already produce.** We're not asking them to invent a format — we're giving their existing format a better home (an interactive, embeddable companion) plus a link exchange and free repurposed clips.

Verified-real examples spanning the tiers (illustrative, not a final list — vet each before outreach):

- **Micro (≈1k–25k):** "Honest Vocal Coach," "More Than Just A Vocal Coach" (Missy MacQuarrie), "Rock Reacts" (Jim — 30-yr pro), plus the long tail of teaching studios with blogs (Lessonface / VoiceLessons.com "Teacher of the Year" winners, independent studio sites). **Start here** — fastest yes, real backlinks, lowest brand risk.
- **Mid (≈25k–250k):** established educators with their own sites + courses + blogs that pass real link equity — e.g. **John Henny**, **Robert Lunte / The Vocalist Studio**, **Jacob Burton Studios**, the **Full Voice Music** teacher community. These have audiences and domains worth a backlink.
- **Macro (250k+):** the names with reach and authority — **New York Vocal Coaching / Justin Stoney** ("Voice Lessons to the World"), **Cheryl Porter**, Charismatic Voice (Elizabeth Zharoff), Beth Roars, Tristan Paredes, etc. **Earn these last**, with proof in hand.

**Why a teacher says yes (the value exchange, stated plainly):**

| We give the teacher | We get from the teacher |
|---|---|
| A free, embeddable interactive tool (range tester) co-branded into the post | An original demo video (E-E-A-T + something the text-only competitors can't match) |
| Exposure to our audience + a dofollow credit/link back to their channel/site | A backlink when they share the co-created post to their site/socials |
| A pack of ready-to-post short-form clips cut from their own demo (we do the editing) | Real, credible content for our social feeds (not generic advice) |
| Co-marketing of a piece they're proud of | A repeatable relationship → future collabs |

This is a genuinely balanced trade, which is what makes the outreach convert and the flywheel turn with low friction.

---

## 3. The content unit — the "Artist Spotlight" page

One page = one artist, reusing the existing Learn pipeline with two additions.

### 3a. Anatomy (static HTML + hydrated islands)

```
H1: "[Artist]'s Vocal Range and Voice Type — Explained"   ← targets "[artist] vocal range" (the volume term)
  Lead: who they are + the one-line answer (range in notes + voice-type label, both hedged)
  H2: "[Artist]'s vocal range"        ← range in notes incl. the exact span people search (e.g. "C3–C6")
      → island: <RangeTester compareTo="[artist]"> ("test YOUR range against theirs")
  H2: "What voice type is [artist]?"   ← targets "[artist] voice type"; label APPROXIMATE/overlapping (style-guide rule)
      → same range tester also outputs the visitor's voice type (one embed serves both spec clusters)
  H2: "The signature move" (technique artists only) ← Chappell Roan's leaps; Mariah's whistle; Ariana's runs
      → island: <GuestVideo>           ← the teacher demo (licensed or commissioned — see §6a) (NEW component)
  H2: "How to sing like [artist]" (technique artists only) ← the safe, healthy version of the move
      → island: <EmbeddedExercise>     ← the closest matching real exercise (e.g. octave-leap-wow, agility-run)
  H2: "Common mistakes / don't hurt yourself" ← health-honest; routes risky belt/whistle to the disclaimer
  FAQ: real queries → FAQPage JSON-LD ("What is [artist]'s vocal range?", "What voice type is [artist]?")
  Sources + teacher credit/byline (E-E-A-T) + medical disclaimer
```

> For **tone artists** (Adele, Sinatra, country crooners) the page is mostly the two spec sections + the range tester; the "signature move / how to sing like" sections shrink or drop, and the guest demo (if any) focuses on tone/phrasing/breath rather than a flashy move. For **technique artists** (Ariana, Mariah, Chappell Roan, rock screamers) the demo + how-to sections carry real keyword weight and are the social-clip goldmine.

- **SEO rule (non-negotiable):** all prose, headings, FAQ render as **static HTML** at build time. The range tester, the video, and the exercise are **hydrated islands**. Never bury ranking copy inside a client-only widget (the empty-shell failure mode).
- **JSON-LD via the child-string form** `<script type="application/ld+json">{JSON.stringify(x)}</script>` (the only form that flushes to static HTML). Emit `Article` + `FAQPage`; add `VideoObject` for the guest video (helps video rich results + AI answers). **Do not** emit anything implying the artist endorses us.

### 3b. Reuse vs. build

- **Reuse:** `content/learn/<slug>.md` frontmatter + `npm run learn:gen` + `/learn/[slug]` route + `RangeTesterIsland` + `EmbeddedExercise`. Add a new `category: artist-spotlight` (content-only tag, like `foundations` / `pitch-ear` in `learning-library-plan.md`).
- **Build (small, one-time):** a `<GuestVideo>` island — SSG renders a static placeholder card (title + teacher credit + poster frame) so there's indexable HTML; post-hydration it mounts the player (self-host the file or embed the teacher's YouTube — see §6 rights). Add the matching `VideoObject` JSON-LD. Honors DESIGN.md tokens; lazy-loads.
- **Hub:** group Spotlights under a pillar on `/learn` (or a dedicated `/artists` index later). Bidirectionally link each Spotlight ↔ `/vocal-range-test` ("don't know your range? test it" / "compare your range to the pros").
- **Internal-link the evergreen cluster (required):** every Spotlight links our own Learn technique articles for the techniques it discusses — inline the first time each technique appears + a "Go deeper" block. This is the spotlight → cluster bridge that builds topical authority and crawl paths; the `artist-profile` skill enforces it (step 3 + a `relatedArticles` frontmatter field).

### 3c. Quality gates (same as every Learn page)

Every Spotlight runs the **content-style-guide** gate before publish: "Jeff Nippard for singing" voice; voice-type labels presented as **approximate / overlapping** (never "X has a 5-octave range" as hard fact — these claims are contested and frequently inflated online; attribute and hedge); CCM framing; the **adversarial fact-check (≥2 refutation lenses)** on every range/technique/health claim, verdicts recorded in `seo/spotlight-<artist>-content-sources.md`; current medical disclaimer on anything belt/whistle/scream-adjacent.

### 3d. Exercise integration + the "add to routine" conversion hook (DECIDED 2026-06-28)

The spotlight's drills are **native app exercises**, not article-local imports. **Decision: native-first.**

**Why native (the deciding constraint):** the routine is id-based — `RoutineConfig = { exerciseIds: string[] }` at `vocal-training:routine:v1` (`lib/progress/routine.ts`). "Add to routine" = append an id + `saveRoutine()`. That **one-tap** only resolves if the id already exists app-side. A native drill → tap appends its `data/exercises/<id>` id → app resolves instantly. An imported "custom" drill has **no id until the user imports it** → the CTA degrades to *import → mint id → add*, two steps and fragile. The `<EmbeddedExercise>` island has the same constraint (it resolves by id via `getExercise`). Both the embed and the CTA point to native.

**The "massive list" worry dissolves with reuse-first tiering.** Most artist signatures are *already* covered by an existing exercise; only a genuinely novel move becomes a new descriptor:

| Artist signature | Reuse this native exercise | New descriptor? |
|---|---|---|
| Chappell Roan chest↔falsetto flips | `octave-leap-wow` / `passaggio-leap-and-back` | No (reuse + suggested start key) |
| Ariana runs | `agility-run` / `staccato-arpeggio` | No |
| Mariah belt | `belt-arpeggio-mah` | No |
| Genuinely novel move | — | Yes — author **one** bespoke, validated descriptor |

So most profiles ship **zero** new descriptors. The library stays small + curated; the human-validation gate (already agreed) covers the rare bespoke ones.

**The "Artist Spotlight" picker category = a manifest-driven *browse* section, not a per-exercise tag.** A generated `artist → [exerciseIds]` manifest (from published profiles) powers a "By Artist" browse surface in Plan/Practice (artist → its drills → back-link to the article). This keeps the *pedagogical* capability taxonomy honest (a register-flip drill stays `head-voice`, not retagged "Chappell Roan") and the main picker uncluttered, while still giving the artist category. *Avoid* adding `artist-spotlight` as a capability — it's cross-cutting, not pedagogical.

**The conversion mechanic (the sly funnel):** Learn pages + the app are **same-origin** (vocalhabit.com), so an "Add to routine" button *in the article island* calls `loadRoutine()` → append the drill id → `saveRoutine()` (the same localStorage the app reads) → deep-links to `/`. A cold lander who taps it arrives in the app with the drill already in their routine — discovering the whole app, with nothing being sold. *(Build-time check: confirm the marketing island can write the app's `vocal-training:routine:v1` key same-origin.)*

**Keep the import/custom path for genuine user content** (their own songs via the Import modal / song store) — not for our curated artist drills, which we want version-controlled, QA'd, and updatable (imported copies would go stale in users' localStorage).

**Agent final-step change:** each profile proposes a **menu of 4–6 candidate drills** (reuse-first, each labeled with what-it-drills / origin / suggested-key / why-this-artist) rendered **in the draft** with an **Add-to-routine** affordance, so the human keeps the 2–3 that fit **in-context** (no back-and-forth). Bespoke descriptors are emitted as **`NEEDS VALIDATION`**, never auto-published.

### 3e. Preview domain — how drafts get approved (phone-first)

The human approves drafts (article + candidate exercises) by **trying them on a phone**, not by reading raw markdown. So drafts must be **safely publishable to a preview surface that production never exposes.**

**Draft-gating mechanism (context-flagged static render):**
- Profiles live as `content/artist-profiles/<slug>.draft.md` with `status: draft`.
- The `artists/[slug]` route's `generateStaticParams()` **includes drafts only when a build flag is set** (e.g. `EXPO_PUBLIC_INCLUDE_DRAFTS=1`, or Netlify's `CONTEXT !== "production"`). Production builds filter `status: draft` out → **nothing renders publicly** until promoted. Mirrors the MVP-Club `PUBLISHED_SLUGS` gate, driven by build context.

**Does Netlify support this natively? Yes — and it's toggle-on from the repo.** Two native features cover it:
**Deploy Previews** (an automatic `deploy-preview-N--<site>.netlify.app` URL per pull request) and **Branch
Deploys** (any branch → `<branch>--<site>.netlify.app`, optionally a custom subdomain). Both read
**context-scoped env vars** from a `netlify.toml`, so we flip the draft flag off-production with no app code:

```toml
# netlify.toml (repo root) — env-only; inherits the existing UI build command/publish dir (don't override
# a build that already ships prod). Just flips the draft flag per deploy context.
[build.environment]
  EXPO_PUBLIC_INCLUDE_DRAFTS = "0"          # production: drafts hidden
[context.deploy-preview.environment]
  EXPO_PUBLIC_INCLUDE_DRAFTS = "1"          # PR previews: drafts visible
[context.branch-deploy.environment]
  EXPO_PUBLIC_INCLUDE_DRAFTS = "1"          # the `preview` branch: drafts visible
```

**Prerequisite — CONFIRMED met (2026-06-28):** vocalhabit.com is **git-connected to the GitHub repo on
Netlify**, so Deploy Previews + Branch Deploys are already available; we only add the config. **Safety note:**
ship the `netlify.toml` as **env-only** (just the `[build.environment]` + `[context.*.environment]` draft-flag
blocks) and *omit* `[build] command`/`publish` so it inherits the working UI build settings — don't risk
changing a build that already deploys prod. Land it in the feature PR alongside the route + draft-gate so the
flag and its consumer arrive together.

**Preview surface options (pick per the Netlify setup — there's no `netlify.toml` in the repo today):**
- **A (recommended, if Netlify is git-connected to `ryan-the-brodsky/vocal-practice`):** add a `netlify.toml` that sets `EXPO_PUBLIC_INCLUDE_DRAFTS=1` for `branch-deploy`/`deploy-preview` contexts (and `0` for production). Push a `preview` branch → Netlify branch deploy → map a stable **`preview.vocalhabit.com`** (Namecheap CNAME → Netlify) so it's bookmarkable on the phone. Drafts visible there, never on `vocalhabit.com`.
- **B (manual, no git connection):** a second Netlify "staging" site; `EXPO_PUBLIC_INCLUDE_DRAFTS=1 npx expo export` → `netlify deploy` to it. More manual but isolates prod.
- **C (quickest, ephemeral):** `netlify deploy --alias <slug>` deploy previews → a unique throwaway URL per draft.

**Approval flow:** agent writes draft → preview build → human opens `preview.vocalhabit.com/artists/<slug>` on phone → tries the candidate exercises + reads the article → picks the keeper drills + edits → on approval, flip `status` + drop the draft suffix (promote into the rendered set), and (if a bespoke drill was kept) author + validate its descriptor. **Nothing reaches `vocalhabit.com` without that explicit promote.**

> Needs the human's hands (cannot be done from the repo alone): confirm whether Netlify auto-builds from GitHub, and the `preview.vocalhabit.com` DNS + Netlify domain alias. The draft-gate + `netlify.toml` are repo-side and can ship in the feature PR.

### 3f. The Learn "Artist Spotlight" section — a reason to come back

Spotlights are a **growing, dated collection**, so the Learn surface treats them differently from the
evergreen articles: a place people bookmark and return to for "what's new."

- **A first-class `Artist Spotlight` category** on `/learn` (alongside the evergreen pillars), filterable.
- **Newest-first** ordering by the `published` date (each card shows the date written), so the page has a
  visible cadence. A **"Latest spotlights" carousel** (hero cards) sits at the top of the section / Learn hub.
- **Hero cards** use the spotlight's `heroImage` (the 16:9 card from the `spotlight-hero-image` subskill) +
  the artist + the `heroHeadline` technique teaser — the same image that becomes the social share card.
- **Each article carries:** `published` (and `updated`), `heroImage` + `ogImage` (OG/Twitter card so shares
  look right), and a static **`## Share`** row (X / Facebook / Reddit / copy-link, prefilled). The hero image
  and the social-share preview are the **same asset** — composed once per spotlight.
- **Dedicated index** option later: `/artists` (or `/learn/artist-spotlights`) listing all spotlights by date
  + the manifest-driven "By Artist" exercise browse (§3d) — one place that says "there's a whole series here."

This is what turns one-off SEO landers into return visitors: a dated, growing, visually distinct shelf. The
`artist-profile` skill already emits the fields this needs (`published`, `heroImage`, `ogImage`,
`heroHeadline`, `category: artist-spotlight`); the Learn-page UI (category + carousel + hero cards + share
row) is the build step.

---

## 4. Short-form repurposing — feeding the "many stupid platforms"

The user's third goal: real social content beyond generic pitch-practice clips. One teacher demo is the raw material.

- **One ~5–7 min demo → 4–8 vertical clips:** the hook ("Here's the exact move Chappell Roan does"), the slow-mo breakdown, the "try it yourself," the before/after, a myth-bust. Each ends with a soft CTA + a tracked link to the Spotlight (`?utm_source=tiktok&utm_campaign=spotlight-<artist>` — UTM discipline so Ahrefs Web Analytics / GA can attribute referral traffic).
- **Platforms:** YouTube Shorts, TikTok, Instagram Reels, plus optional Facebook/Pinterest/X. Native captions baked in (most watch muted). The teacher posts the same clips to *their* channels (more reach + an implicit second backlink in bios/descriptions).
- **Cadence:** drip the clips across the week the article publishes; the article is the evergreen anchor, the clips are the discovery surface. This is also the format that catches the **trending spike** (a fresh Chappell Roan clip the week she's in the news).
- **Editing:** the henchmen agent can produce a **cut-list** (timestamps + hook copy + caption + CTA) automatically; actual rendering can be a human step or an editing tool — keep the agent's job to *drafting the plan*, not autonomous publishing.

---

## 5. The outreach ladder (start small → leverage into bigger)

The legitimacy ratchet, in four moves:

1. **Pilot (manual, 1 artist × 1 micro-coach).** Prove the unit end-to-end: commission one demo, ship one Spotlight, get one backlink, cut the clips, measure. This is the template everything else copies.
2. **Micro wave (3–5 Spotlights).** Different micro-coaches, different artists across genres (one pop, one rock, one R&B, one trending). Now we have published proof: live pages, real embeds, shared posts, early rankings/referral numbers.
3. **Mid-tier (warm, proof-backed).** Lead with the proof: "Here's a co-created piece we did with [coach] — it ranks, it's been shared X times, here's the interactive embed and the clip pack we made them. Want one for your [signature artist]?" The interactive embed + done-for-you clips are the differentiator no other outreach offers.
4. **Macro (earned, selective).** Only after the catalog and a little domain authority exist. By now the offer sells itself, and a macro collab becomes a genuine link/traffic event.

**The cold-outreach offer (one paragraph, their language):** *We're building a free, no-signup vocal-practice tool. We want to publish an "[Artist] Spotlight" featuring a short demo from you breaking down [their signature move], wrapped around an interactive "test your range against [artist]" widget. You keep the video for your own channels, we cut you a pack of ready-to-post shorts from it, and we credit + link you prominently. Interested?* (Tighten with the `cold-email` skill; keep it short, specific, flattering, low-ask.)

**Backlink mechanics:** the win is the teacher linking the published Spotlight from their **site/blog and/or social bios + video descriptions** (where their domain passes equity). Ask explicitly but politely for a credit link; reciprocate with a dofollow credit to them on the page. Never buy links or do anything that reads as a paid scheme — this is genuine co-created content, which is exactly the kind Google rewards and the `vocal training app` roundup SERPs (see keyword research §"App / commercial") reward too.

---

## 6. Rights, legal & brand guardrails (do not skip)

- **Use the teacher's *demonstration*, never the artist's master recording.** The page is "here's a coach singing/demonstrating the technique," not a host for copyrighted audio. No artist studio audio, no full-song karaoke beds. This keeps us clear of music copyright.
- **No implied endorsement.** The artist is the *subject*, not a partner. Avoid logos/branding that imply the artist or label is involved. "Spotlight on [artist]'s technique" framing, editorial/educational.
- **Written usage rights from the teacher.** A short release: we may embed the video on the Spotlight page + cut and post short-form clips with credit; they retain ownership + may post anywhere. Get it in writing before publishing. (The henchmen agent drafts this; a human sends/signs.)
- **Name/likeness + factual claims.** Range/voice-type claims are editorial commentary (fine) but must be **hedged + sourced** per the style guide — inflated "X-octave range" myths are a credibility trap. Run the adversarial fact-check.
- **Hero / OG image rights.** Never scrape a copyrighted press photo of the artist for the share image — that's a copyright + likeness risk (a brand's OG image isn't a YouTuber's fair-use thumbnail). Default to a **typographic/brand** treatment or the **coach's thumbnail with written permission**; licensed stock or *non-photoreal* stylized art only with case-by-case sign-off. Enforced by the `spotlight-hero-image` subskill; human-approved before publish.
- **Disclosure + UTM.** Mark co-created content honestly; tag every outbound social link with UTMs.

### 6a. License pre-made vs. commission fresh — the deciding rule

The deciding factor is **not** "pre-made vs. fresh." It's: **does the footage we want to *clip* contain the artist's master recording?** Most existing "coach reacts to [artist]" videos play the copyrighted record while the coach talks over it. That changes what's legal:

| Tier | What it is | License needed? | Can we cut shorts? | Use when |
|---|---|---|---|---|
| **A — Embed existing** | YouTube-embed the coach's existing reaction video on the Spotlight page | **None** — embedding is covered by YouTube's player license | ❌ No — re-cutting redistributes the master outside that license | Launch fast / a great video already exists / you only need page engagement + a credit link |
| **B — License a clean cut** | A short *own-voice* demo segment (no master playing) — a repackaged clean excerpt or a quick bespoke 60–90s record | Yes (cheap or a trade) | ✅ Yes — it's the coach's own performance | You want to feed the short-form engine without full production |
| **C — Commission fresh** | A demo shot to spec, tailored to our tool + exercise, fully ours | Yes | ✅ Yes | Flagship artists / deeper partnerships |

**Rule of thumb:** *license pre-made for the page embed* (fast, cheap, often free via standard YouTube embed) — your instinct is right that this saves commissioning cost — **but require clean, own-voice footage (licensed or fresh) for anything you'll cut into shorts.** Embed-only gets you the page + the backlink today; the social engine specifically needs master-free footage. A practical default: **Tier A to ship the page now, Tier B to unlock the clips** — only escalate to Tier C for flagship/mid-macro partners. (This also de-risks the relationship: the first ask is tiny — "can we embed your existing video?" — and the bigger asks come after the win.)

---

## 7. The automation — a henchmen "spotlight" agent

Ultimate goal: the flywheel runs in the background, human only at gates. This maps cleanly onto the existing fleet model (`henchmen/agents/blog` is draft-only; `fleet/approval-policy.md` = read/draft freely, **every outward action stops for one-tap approval**).

### 7a. Pipeline, with the gates marked

| # | Stage | Class | Who |
|---|---|---|---|
| 1 | **Pick the next artist** (Ahrefs trend + cluster + calendar of what's hot) → shortlist | draft | agent proposes |
| → | **GATE 1: approve artist + target teacher** | outward-adjacent | **human one-tap** |
| 2 | Draft the **outreach** message (cold-email skill) + propose the **video tier** (§6a: A embed-only / B clean-cut / C commission) + the matching usage-rights release | draft | agent |
| → | **GATE 2: approve + send outreach** | outward | **human one-tap** |
| 3 | draft the **Spotlight article** (`artist-profile` skill: consolidate + cross-link + candidate drills + fact-check + sources file) | draft | agent |
| 3b | compose the **hero / OG image** (`spotlight-hero-image` subskill in a sub-subagent) + the **`## Share`** links + carousel metadata (`published`/`heroImage`/`ogImage`) | draft | agent → subagent |
| 4 | Draft the **short-form cut-list** (timestamps + hooks + captions + UTM CTAs) — *partnership phase only* | draft | agent |
| → | **GATE 3: approve on preview (§3e) + publish article** | outward | **human one-tap** |
| → | **GATE 4: approve + post/schedule shorts** | outward | **human one-tap** |
| 5 | **Measure** (Ahrefs rank tracker + backlink check + Web Analytics UTM referral) → report | read-only | agent, unattended |

Stages 1–4 + 5 are **unattended drafting/reading**; the four gates are the only human touches — exactly the "approval at gates like outreach and publishing" the user asked for. Each gate prompt shows the *exact* payload (the message, the draft, the post text) per the approval policy — never "approve this batch."

> **MVP background agent (YT-embed era — what we're building toward first):** simpler than the full
> partnership pipeline above. It's the `artist-profile` skill on a schedule with **no outreach gates** — pick
> a trending/under-served artist (Ahrefs) → run the skill (discover + embed coach videos + draft + hero image
> + fact-check) → push to the **preview** branch → **one gate: human approves on phone + publishes.** That is
> the end state the user described: "a new artist spotlight article generated by a background agent as part of
> the henchmen harness," with the human only at the publish gate. The commissioning/outreach gates light up
> later when we move from embedding coaches' videos to co-creating with them.

### 7b. Reuse from the fleet

- Same **draft-only default + publish gate** as the `blog` agent; same Slack approval UX; same kill-switch (disable the routine / env flag).
- The **measure** stage is just the existing read-only `analytics-seo` pattern pointed at the new Spotlight URLs + the teachers' referring domains.
- Scheduling via Cloud Routines (`/schedule`), subscription-billed, no API credits — the whole henchmen thesis.

### 7c. What stays human (by design)

Relationship judgment (which teacher, tone of a reply), the actual video edit/render, signing the release, and the final publish/post taps. The agent removes the *busywork* (research, first drafts, clip planning, reporting), not the *judgment*.

---

## 8. Metrics & success criteria

- **Backlinks earned** per Spotlight (Ahrefs Site Explorer → referring domains from teacher sites/socials). *Primary* — this is a link-building play first.
- **Referral + social traffic** to Spotlight URLs (Ahrefs Web Analytics UTM params / GA) — proves the social repurposing works.
- **Rankings** for `"[artist] vocal range"` / `"how to sing like [artist]"` (add to Ahrefs Rank Tracker on publish).
- **Range-tester engagement** from Spotlight referrers (does the embed convert spotlight readers into app users?).
- **Relationship pipeline:** # teachers contacted → # said yes → # repeat collabs (the leverage metric for moving up tiers).
- **Leading indicator of the trend play:** time-from-artist-trending to Spotlight-live (the faster, the more spike traffic captured).

---

## 9. Phased rollout

- **Phase 0 — Pilot (manual, ~1–2 weeks).** Build `<GuestVideo>` + `artist-spotlight` category. Hand-pick **one** artist (suggest **Chappell Roan** — trending, the user's instinct, vivid register-leap demo) + **one** micro-coach. Run the whole loop manually. Ship one Spotlight, earn one backlink, cut the clips. This *is* the template.
- **Phase 1 — Micro wave (manual-with-skills, ~1 month).** 3–5 Spotlights across genres (pop / rock / R&B / trending). Use the `cold-email`, `social-content`, `ai-seo`/`schema-markup` skills. Build the proof deck.
- **Phase 2 — Henchmen agent (semi-autonomous).** Scaffold the `spotlight` agent (draft-only, 4 gates) per §7. Agent drafts; human taps. Mid-tier outreach begins.
- **Phase 3 — Scale + climb.** Catalog grows, domain authority rises, macro creators become reachable. Re-pull the artist list quarterly (trends move).

---

## 10. Risks & open questions

- **Low individual organic volume.** Honest: most single artist terms are TP 100–800. Mitigation: treat organic as upside; the backlink + social-content + trend-capture are the real returns, and the cluster compounds (50 KD-0 spokes interlinking into the range-test hub is real topical authority).
- **Teacher supply / reply rates.** Cold outreach is a numbers game; the interactive-embed + free-clips offer is the differentiator that should lift reply rates. Start micro where the yes is easy.
- **Video production friction.** The teacher shoots it (their format already) — we don't film. Our cost is editing the shorts; can be tool-assisted.
- **Rights discipline at scale.** A standardized release + "demo, never master recording" rule keeps it clean. Bake into the agent's draft.
- **Brand-voice / fact-check at volume.** The adversarial gate is non-negotiable per the style guide; the agent must run it and record verdicts, not skip it. (Style-guide lesson: "I spawned a checker" ≠ "it was checked.")
- **Open:** dedicated `/artists` hub vs. a pillar inside `/learn`? Self-host video vs. embed teacher's YouTube (rights + page-weight + control trade-off)? Revenue-share / paid option for macro creators if free-collab stalls? Decide at Phase 1→2.

---

### One-line recommendation

Ship the **Chappell Roan** pilot manually end-to-end (one micro-coach, one Spotlight, one backlink, one clip pack), prove the unit and the value exchange, *then* template it and hand the busywork to a gated henchmen `spotlight` agent. Start small, let legitimacy compound, keep the human on the four gates that matter.
