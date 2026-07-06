# Indexability analysis — why vocalhabit.com has 0 organic keywords (2026-07-06)

Prompted by the weekly SEO sweep: *"0 organic keywords & 0 of 21 tracked keywords ranking — indexation is the blocker."* This doc verifies that claim against live crawl data + GSC + Ahrefs, and separates what's actually broken from what's just a young-site authority problem.

## TL;DR

**It is NOT a hard technical crawl-block.** robots.txt allows everything, there is no `noindex` / `X-Robots-Tag` anywhere, the sitemap is valid and served as XML, www/http→https 301s are correct, and Ahrefs Site Audit gives the site a 98/100 health score having crawled 44 URLs. All 21 `/learn/*` articles are compliant, self-canonical, 1,900–2,600-word pages with exactly one H1 each. Google *has* the site — GSC shows real impressions.

The real problems, in root-cause order:

1. **The homepage `/` is an empty 9-word shell** with no `<h1>` and — critically — **zero internal links to any content page** in its static HTML. It's the root (where external links + brand searches land), and Google's primary signal about the whole site is "blank page."
2. **The content section is a crawl-island.** The homepage links to nothing; the only hub (`/learn/` index) is reachable *only* via the sitemap. Link authority can't flow from the front door to the content.
3. **Crawl budget wasted** on ~13 `/?exerciseId=…` param URLs (9 words each, already canonical→`/`).
4. **Missing literal `<h1>`** on the two most important pages: `/vocal-range-test` (top SEO target) and `/learn/` index.
5. **Sitemap gaps:** the `/artists/*` spotlights were live + internally linked but absent from the sitemap.
6. **DR = 0.** 148 "referring domains" that pass no authority (scraper/junk links). The slow, off-repo lever.

## Evidence

### Live crawl signals (as Googlebot)
| Check | Result |
|---|---|
| `robots.txt` | `Allow: /` + sitemap ref — not blocking |
| `X-Robots-Tag` header | absent on all routes |
| `<meta name="robots">` | absent (no noindex) |
| `sitemap.xml` | HTTP 200, `application/xml`, valid |
| `www` / `http` | 301 → `https://vocalhabit.com` (correct) |
| `/learn/*` articles | full static HTML, `<title>`, canonical, 1 `<h1>`, 2k words |
| `/artists/*` spotlights | full static HTML, 1 `<h1>`, ~1.8k words |
| `/` homepage | **9 words, 0 `<h1>`, 0 content links** (empty app shell) |
| `/vocal-range-test` | content renders, but **0 `<h1>`** (used a plain `<Text>`) |
| `/learn/` index | content renders, but **0 `<h1>`** (same) |

### Ahrefs Site Audit (project 10013070, crawl 2026-07-03)
- Health **98/100**, 44 URLs crawled, 1 error (a duplicate-canonical notice with 0 affected pages).
- Page explorer: **all 21 `/learn/*` = `compliant: true`, self-canonical, 1,900–2,600 words, `nr_h1: 1`.** Textbook-clean.
- `/vocal-range-test` & `/learn/` = compliant but **`nr_h1: 0`**.
- `/` homepage = **`content_nr_word: 9`, `nr_h1: 0`, `incoming_links: 1`.**
- ~13 `/?exerciseId=…` URLs = `compliant: false`, 9 words, `canonical → /` (crawl-budget drain).

### Google Search Console (via Ahrefs)
- Impressions exist but tiny and **falling**: week of Jun 22 = **224 impr** (avg pos 19); week of Jun 29 = **33 impr** (avg pos 9.7); **0 clicks ever**.
- Only **2 pages** surface at all: `/vocal-range-test` (29 impr, avg pos **74**) and `/learn/sovt-exercises` (19 impr, pos 18.6). The other 20 articles ≈ 0 impressions.

### Authority
- **DR = 0.** `backlinks-stats` reports 150 live backlinks / 148 refdomains, but DR 0 means they pass ~no equity (scraper/directory junk). No real editorial links yet.

## Interpretation

The sweep's "indexation is the blocker" is directionally right but mis-attributed. Nothing is *blocking* indexation — Google is crawling and has impressions. The problem is that a **DR-0 site whose front door is a blank page, with no internal link graph feeding its content, gives Google almost no reason to index deeply or rank anything.** Position 74 for the range test = "indexed, but bottom of the pile for lack of authority/relevance signals." The falling impressions (224→33) are consistent with Google de-prioritizing a site it can't build a coherent picture of.

So the levers are: (a) **fix the on-site signals we control** (homepage content + internal linking + H1s + crawl hygiene) so Google can understand and consolidate the site, and (b) **earn real links** (off-repo, slow).

## Fixes shipped in this pass (safe, high-confidence)

1. **Real `<h1>` (+ `<h2>` hierarchy)** on `/vocal-range-test` and `/learn/` index — switched the heading `<Text>` to `accessibilityRole="header" aria-level={n}`, the same pattern `MarkdownView` uses to emit real `<h1>`/`<h2>` in react-native-web.
2. **robots.txt** — `Disallow: /*?exerciseId=` so Googlebot stops spending a young site's tiny crawl budget on ~13 thin, already-canonicalized param URLs.
3. **Sitemap** — `gen-sitemap.mjs` now includes **published** `/artists/*` spotlights (draft-gated, mirroring the production `EXPO_PUBLIC_INCLUDE_DRAFTS` rule) and refreshes `lastmod`.

## The big one — SHIPPED (root-cause fix)

**Gave the homepage real, crawlable content + an internal-link hub** (option A). `components/home/HomeHeroSEO.tsx` is a self-contained, system-font-safe static intro (eyebrow + real `<h1>` + intro paragraph + two `<h2>` sections: an "Explore" card hub → `/vocal-range-test`, `/learn/`, the spotlights, and a "Popular guides" list → 5 top articles). `app/_layout.tsx` renders it during the SSG/first-paint hold **for the index route only** (`onIndex`), so `/` exports with real HTML; the interactive Practice app replaces it on hydration. This converts the site's most-linked URL from a blank liability into its primary relevance + internal-linking asset.

Verified in the export: `dist/index.html` went from **9 words / 0 `<h1>` / 0 content links** → **~638 words / 1 `<h1>` / 2 `<h2>` / 8 internal content links**. In-browser: first-run → onboarding (unchanged), returning user → Practice (unchanged); the hero shows only during the brief font/onboarding hold. `tsc` clean · 702 tests pass.

Rejected alternatives: **B.** dedicated static landing route + app behind a CTA (cleaner separation, but a big UX change to a daily-use app that should open straight to Practice); **C.** link-hub-only footer via `+html.tsx` (would render on every screen incl. the app, or need hidden-content tricks).

**Known limitation:** the hero helps the **raw-HTML** pass (indexing + link discovery + link flow, which Bing/Ahrefs/LLM crawlers lean on heavily). After hydration the app replaces it, so Google's *rendered-DOM* pass still sees the Practice shell — a future option is to keep a slim crawlable intro/footer persistently in the app chrome if the rendered-DOM signal proves to matter.

## GSC Coverage export (2026-07-06) — the "issues preventing indexing", triaged

Ground truth straight from Google (Coverage → All known pages). It **reframes the picture positively**: indexation is working, not blocked.

- **24 pages indexed** / 13 not indexed (as of 2026-06-29). (Earlier `site:` came up empty only because the WebSearch tool doesn't run a true `site:` — GSC is authoritative.)

The 13 "not indexed" break down as (all benign or minor — none block the content):

| Reason | Pages | What it actually is | Action |
|---|---|---|---|
| **Page with redirect** | 9 | Alternate URL variants Google discovered (www→apex, http→https, and trailing-slash: `/learn`→`/learn/`, `/vocal-range-test/`→`/vocal-range-test`, `/learn/x/`→`/learn/x`) that **correctly 301** to the canonical. Largely fueled by the 148 junk backlinks pointing at variant URLs. Verified: **no sitemap URL, canonical tag, or internal link points to a redirecting URL** — every canonical/sitemap entry returns 200. | None — expected hygiene. The canonical version is what gets indexed. |
| **Duplicate, Google chose different canonical** | 1 | The Netlify default subdomain `vocal-practice.netlify.app` serves a full 200 copy of the site. **Already mitigated** — its pages carry absolute canonicals → `https://vocalhabit.com/...` (verified). | To fully close: Netlify → Domain management → **"Redirect default subdomain to primary domain"** (dashboard toggle; correctly excludes deploy-preview subdomains, so it won't break the artist-spotlight preview/draft workflow). Optional. |
| **Crawled — currently not indexed** | 2 | Thin, client-only app shells (e.g. `/onboarding`, `/plan`) Google crawled and correctly judged low-value. | None needed; the `?exerciseId=` robots disallow already trims the biggest crawl-waste. |
| **Discovered — currently not indexed** | 1 | Known from the sitemap, not yet crawled — normal crawl-budget lag for a DR-0 site. | Resolves with authority + time; a GSC "Request indexing" nudge helps. |

**Conclusion: there is no remaining indexation *blocker*.** The content pages are indexed; the not-indexed set is redirect variants + the Netlify-subdomain duplicate + two thin shells. The gap to organic traffic is **ranking/authority (DR 0)**, not indexing — exactly the lever the homepage/internal-link fixes above and off-repo backlinks address.

## Off-repo (not code) — the authority lever
- In GSC: resubmit `sitemap.xml`, and hit **"Validate Fix"** on the redirect/duplicate items so Google re-checks the affected URLs; use URL Inspection → Request Indexing on the top pages.
- (Optional) flip the Netlify "redirect default subdomain to primary domain" toggle to collapse the `vocal-practice.netlify.app` duplicate.
- Earn a handful of real links (the artist-spotlight partnership play in `seo/artist-spotlight-partnerships-plan.md`, directories, a Product Hunt / community post).
- Prune/monitor the 148 junk refdomains only if they grow into a spam-signal problem.
