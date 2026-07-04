# Hero images for artist spotlights — rights research (2026-07-03)

Research question: why is putting a public photo of the artist on a spotlight analysis article a
"legal gray area," what do comparable sites do, and is this really just a budget question?
Three parallel research passes: legal framework, comparable-site survey (fetched pages, inspected
img sources + credit lines), licensing costs + free options. Bottom line first.

## Bottom line

1. **"It's an analysis article, so fair use" is the standard misconception, and it loses.** Fair use
   protects commentary **on the photograph itself** (analyzing THAT image). It does not cover using a
   photo of the artist to *illustrate/identify* who the article is about — that use serves the same
   purpose as the original photo (depicting the person), so it isn't transformative. This exact fact
   pattern — a concert photo of a musician atop an editorial article — lost on every fair-use factor
   at the appellate level in 2024. Not gray; settled against.
2. **The copyright belongs to the photographer/agency, not the artist.** The article's relationship
   to the *singer* is irrelevant to the *photographer's* rights.
3. **It is NOT primarily a budget question — and the budget answer is $0 anyway.** Both current
   spotlight artists have provenance-verified, attribution-only CC BY photos on Wikimedia Commons.
   A visible one-line credit is the entire cost. Paid fallback for a specific iconic shot: Alamy
   individual editorial license ≈ $22/image (Getty is $199–$499/image and unnecessary at this scale).
4. **The YouTube coach embeds were never the same risk.** YouTube's Terms of Service grant an
   embedding sublicense whenever the uploader leaves embedding enabled, and the embed never copies
   the file to our server. Keep using standard iframe embeds; never download/re-host.

## The legal picture (what "gray area" actually meant)

- **Andy Warhol Foundation v. Goldsmith (SCOTUS 2023):** "new meaning" isn't enough; if the secondary
  use shares the original's purpose (depicting the person) and is commercial, factor one goes to the
  photographer. https://www.supremecourt.gov/opinions/22pdf/21-869_87ad.pdf
- **Philpot v. Independent Journal Review (4th Cir. 2024) — the on-point case:** concert photo of
  Ted Nugent used by an editorial site to identify him; photographer won a clean sweep. Cropping and
  new context didn't help because the photo was "used merely to depict and identify" the subject.
  https://law.justia.com/cases/federal/appellate-courts/ca4/21-2021/21-2021-2024-02-06.html
- **Barcroft Media v. Coed Media (S.D.N.Y. 2017):** celebrity photos as banner images beside gossip
  articles — fair use rejected; same purpose as original. https://www.copyright.gov/fair-use/summaries/barcroft-coed-sdny2017.pdf
- **Enforcement is automated and traffic-agnostic.** PicRights/Copytrack/Pixsy run reverse-image
  bots against agency catalogs; a 5-visits/month page gets flagged like a big one. Typical demands
  $600–$1,500/image (PicRights), escalating to $1,500–$20,000 via Higbee & Associates. Statutory
  damages for registered works: $750–$30,000 per work, $150,000 willful, plus attorneys' fees; the
  Copyright Claims Board makes small photo claims cheap to bring. Visible prevalence of grabbed
  photos on other sites is survivorship bias — you don't see their demand letters.
- **Why embeds differ:** (a) server test — an embed never stores a copy on our server (Perfect 10 v.
  Amazon, 9th Cir.; reaffirmed Hunley v. Instagram 2023; note S.D.N.Y. rejects it, so don't rely on
  it alone); (b) the durable ground — YouTube ToS grants a sublicensable license the uploader accepts,
  extended to everyone via the embeddable player (Richardson v. Townsquare, S.D.N.Y.). Conditions:
  standard iframe embed, uploader has embedding enabled, don't embed obviously pirated re-uploads.
- **Right of publicity (separate from copyright):** editorial analysis of a public figure is
  protected newsworthiness/commentary. The line to respect: artist names/faces must stay OUT of
  paid-acquisition surfaces (ads, app-store screenshots, homepage hero, social promos like
  "Sing like Chappell — get the app"). The per-article "not affiliated" disclaimer helps rebut
  false-endorsement claims — keep it. Freddie Mercury died UK-domiciled (historically no post-mortem
  publicity right), which further lowers exposure for him specifically; Chappell Roan is a living
  CA-based artist with full active rights.
- **Never AI-generate artist likenesses as a workaround.** It trades the (solvable) photographer-
  copyright problem for a worse right-of-publicity/deepfake-statute problem (Tennessee ELVIS Act
  2024, CA AB 1836/2602, etc., some with statutory damages). Higher risk than a licensed photo,
  not lower.

## What comparable sites actually do (verified by inspecting pages)

- **Pros (MusicRadar/Guitar World, American Songwriter, Smooth Radio):** always a licensed Getty
  photo with a visible credit ("Katja Ogrin/Redferns/Getty Images", "Fox Photos/Hulton Archive/Getty
  Images"). They pay (Getty editorial subscription ≈ $575/mo tier).
- **Our actual peer group (Singing Carrots, Beth Roars, Ramsey Voice, Moufarrege, the range-test
  tool sites):** almost never a licensed celebrity hero. They use no artist photo at all (pure
  data/diagram pages), original analytical assets (spectrograms, range charts), AI/stock art, or
  their own YouTube thumbnails.
- **The legit free route to a real face:** Wikimedia/Flickr CC concert photos WITH a visible credit
  (ConcertHotels' famous vocal-ranges page; e.g. credit format "Kingkongphoto … CC BY-SA 2.0 via
  Wikimedia Commons").
- **The grab tier:** sites re-hosting literal `gettyimages-*.jpg` files or Wikimedia renders with
  attribution stripped. Common, infringing, and exactly what the enforcement bots auto-flag.
- **Movie-site norm doesn't transfer:** ScreenRant et al. run studio promotional stills under the
  film industry's promo-still tradition; music has no equivalent stream of freely usable label stills.

## Licensing costs (if we ever want a specific iconic shot)

| Source | Single image | 20-image library |
|---|---|---|
| Alamy individual editorial (websites/apps/social, 5-yr web term) | ~£17 / ~$22 | ~$350–$450 |
| Shutterstock editorial | $199 ($99 in 25-pack) | ~$2,475 (pack) |
| Getty on-demand editorial | $199–$499 | $575/mo sub (50 dl) |

Editorial licenses permit illustrating analysis; they do NOT permit implying endorsement or use in ads.

## Chosen images (verified provenance, ready to use)

- **Freddie Mercury:** `Queen - Freddie Mercury.jpg` — Carl Lender, New Haven, Nov 16 1977,
  **CC BY 2.0** (attribution only, NO ShareAlike → free to crop/tone for the hero treatment).
  Provenance verified: original Flickr source still live and still CC BY 2.0.
  https://commons.wikimedia.org/wiki/File:Queen_-_Freddie_Mercury.jpg
  Credit line: `Photo: Carl Lender, CC BY 2.0, via Wikimedia Commons` (link name → Flickr/Commons,
  license → deed, "Wikimedia Commons" → file page).
- **Chappell Roan:** `Chappell Roan performing at Capitol Hill Block Party.jpg` — Junefreund,
  Seattle, Jul 19 2024, **CC BY 4.0** (attribution only, NO ShareAlike).
  https://commons.wikimedia.org/wiki/File:Chappell_Roan_performing_at_Capitol_Hill_Block_Party.jpg
  Credit line: `Photo: Junefreund, CC BY 4.0, via Wikimedia Commons`.
- Avoid: `Freddie Mercury 1981.jpg` on Commons (PD-Argentina tag, US status not established) and
  any CC **NC** (NonCommercial — ambiguous for a site marketing an app) or **ND** (blocks cropping)
  variants.
- ShareAlike note (for future picks): SA binds only *derivatives of the image*, never the page or
  article text; but prefer plain CC BY when we intend to crop/tone.

## Rules for the pipeline (feed into spotlight-hero-image subskill)

1. Source hero photos ONLY from: Wikimedia Commons / Flickr CC (BY or BY-SA; never NC/ND) with
   provenance checks (original source still CC, EXIF plausible, uploader history) — or a paid
   editorial license (Alamy default).
2. Visible attribution caption on the page, with links, every time. Attribution lives on the article
   page; og:image variants are covered by the on-page credit.
3. Never: Google-Images/press grabs, `gettyimages-*` re-hosts, YouTube frame-grabs of others'
   videos, AI-generated artist likenesses.
4. Keep artist faces/names out of ads, store listings, and app-surface promos (editorial pages only).
5. Keep the "not affiliated" disclaimer on every spotlight.
6. Original analytical art (staff notation, range charts, spectrogram-style treatments) remains a
   first-class alternative — it's the differentiated house move our peer group uses.

*Research: three parallel passes, 2026-07-03. This is research synthesis, not legal advice.*
