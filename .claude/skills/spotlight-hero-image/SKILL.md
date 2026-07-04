---
name: spotlight-hero-image
description: >-
  Source and produce the hero + Open-Graph images for an artist spotlight from a rights-verified
  photo of the artist (Wikimedia Commons CC BY/BY-SA first, paid editorial license second,
  typographic treatment as fallback). Use as a subskill the artist-profile agent farms out during
  article build, or when the user asks to "make the hero image / OG image" for a spotlight.
  Outputs a 16:9 hero webp + 1200×630 OG jpg + the credit frontmatter block, rights-checked,
  staged for human approval. Never ships a scraped photo or an AI likeness.
metadata:
  version: 2.0.0
---

# Spotlight Hero / OG Image

Produce the spotlight's **hero photo** (top of the article + Learn-carousel card) and **OG share
image**. Full rights research behind these rules: `seo/hero-image-rights-research.md` (2026-07-03).
Ryan's direction: real photos of the artist ARE wanted on these pages — sourced only as below.

## Sourcing order (STRICT — this is the guideline, not a suggestion)

1. **Wikimedia Commons / Flickr CC photo — the default.** License must be **CC BY or CC BY-SA**
   (any version) or public domain with US status established. **Never NC** (NonCommercial — the
   site markets an app; ambiguous = unusable) and **never ND** (blocks cropping).
   **Provenance checklist — all must pass before using a file:**
   - License confirmed via the Commons API (`prop=imageinfo&iiprop=extmetadata`), not just the page.
   - "Own work" claims: EXIF present and plausible; uploader has a credible upload history.
   - Flickr-sourced files: original Flickr page still live and still showing the CC license.
   - Red flags → skip: agency watermarks, press-scan look, no EXIF + no source link, PD tags whose
     US status the file page itself questions (e.g. PD-Argentina).
2. **Paid editorial license** when no clean CC image exists: **Alamy individual editorial
   (~$22/image)** is the default; Getty ($199–499) only if a specific iconic shot justifies it.
   Editorial terms: illustrating the analysis only — never ads/endorsement implications.
3. **Typographic / brand treatment** (no photo) — fallback while an image is pending. DESIGN.md
   tokens only.

**Never, under any circumstances:** Google-Images/press grabs, re-hosted `gettyimages-*` files,
frame-grabs or thumbnails of OTHER people's videos, or **AI-generated artist likenesses** (right
of publicity + ELVIS-Act-class statutes make an AI likeness WORSE than an unlicensed photo).
Why scraping loses: fair use protects commentary ON a photo, not decorating commentary about the
person (Warhol 2023; Philpot v. IJR, 4th Cir. 2024) — see the research doc.

## Attribution (REQUIRED for CC — it's the entire license fee)

Fill the frontmatter credit block; the `artists/[slug]` route renders it as a visible linked
caption under the hero ("Photo: <credit>, <license>, via Wikimedia Commons"):

```yaml
heroImage: "/spotlights/<slug>-hero.webp"
ogImage: "/spotlights/<slug>-og.jpg"
heroAlt: "<literal description of the photo>"
heroCredit: "<photographer name>"
heroCreditLicense: "CC BY 2.0"
heroCreditLicenseUrl: "https://creativecommons.org/licenses/by/2.0/"
heroCreditSourceUrl: "https://commons.wikimedia.org/wiki/File:<file>"
```

A stripped or forgotten credit converts a free image into an infringement (CC enforcement firms
hunt exactly this). OG images carry no on-image credit — the article page's caption covers the
share card.

## Production (what to output)

- **Hero:** `public/spotlights/<slug>-hero.webp` — 16:9, ~1600px wide (never upscale past the
  source), quality ~82. Crop the source around the face/action (rule of thirds), NOT a blind
  center crop — portrait concert shots usually carry the face in the upper third.
- **OG:** `public/spotlights/<slug>-og.jpg` — 1200×630, < 300 KB.
- **No text overlays on photos** — DESIGN.md forbidden-pattern #10 (stock-photo hero + overlay
  text). Clean photo + caption is the house style. ImageMagick (`magick -crop … -resize …`) is on
  PATH.
- Also wire the carousel: `SpotlightCarousel` picks the image up automatically from `heroImage`.

## Handoff

Return to `artist-profile`: file paths, the full credit frontmatter block, `heroAlt`, and the
**rights basis** (which sourcing tier + the provenance evidence, e.g. "Commons API license check +
live Flickr original"). The human approves the image and its rights basis on the preview before
the spotlight is promoted. Draft-only — never publishes.
