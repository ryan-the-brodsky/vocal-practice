---
name: spotlight-hero-image
description: >-
  Compose the hero / Open-Graph share image for an artist spotlight — an artist visual with bold
  superimposed text teasing the technique, in the high-contrast "YouTube thumbnail" style. Use as a
  subskill the artist-profile agent farms out to a subagent during article build, or when the user asks
  to "make the hero image / OG image / share thumbnail" for a spotlight. Outputs a 1200×630 OG image + a
  card crop, rights-checked, staged for human approval. Never ships a scraped celebrity photo.
metadata:
  version: 1.0.0
---

# Spotlight Hero / OG Image

Compose the **share image** for an artist spotlight: the picture that shows up as the article's hero on the
Learn "Artist Spotlight" carousel **and** as the Open-Graph/Twitter card when someone shares the link. It
must do two jobs at once — sell the click on social, and look right on the page.

Farmed out by `artist-profile` (step "Social + hero image") to a **subagent** with: `{ artist, slug,
technique-teaser, coach-thumbnail option, DESIGN.md tokens }`. Returns the image file(s) + headline + alt
text + the **rights basis**, staged for human approval. Draft-only — never publishes.

## ⚠️ Rights guardrail (read first — this is the easy place to get it wrong)
- **Never scrape and republish a copyrighted press/paparazzi photo of the artist.** A brand site reusing a
  celebrity photo as its OG image is a copyright **and** likeness risk — different from a YouTuber's fair-use
  thumbnail.
- **Allowed bases, in order of preference:**
  1. **Typographic / brand treatment** (no photo) — bold technique-teaser headline + brand motif + the song
     title, on a DESIGN.md-tokened background. **Safe default; use when no rights-cleared image exists.**
  2. **The coach's video thumbnail, used WITH the coach's written permission** — ties into the partnership
     (they're a collaborator) and is the most on-brand "real" image.
  3. **Properly licensed stock / editorial image** with a license that covers web + social use.
  4. **AI-generated *stylized, non-photoreal* artwork evoking the vibe** — not a realistic likeness (likeness
     rights still apply); approve case-by-case.
- **Always** return the rights basis with the image and flag it for human sign-off. If unsure → typographic.

## Composition rules (studied from YouTube thumbnails — what makes them click)
- **Canvas:** OG = **1200×630** (1.91:1). Also export a **16:9 card** (e.g. 1280×720) for the carousel.
- **One focal subject**, off-center (rule of thirds). If a face/figure is used, it goes on one side; text on
  the other — never text over the eyes.
- **3–6 word headline, huge and bold**, teasing the *technique*, not just the name: "Chappell Roan's Register
  Flip", "How Ariana Hits the Whistle", "Mariah's Belt — Decoded". Readable at phone-feed size.
- **High contrast + saturation.** Dark scrim/gradient behind text so it's legible over any base. One accent
  color (DESIGN.md token), not a rainbow.
- **Minimal clutter** — headline + subject + small brand mark ("Vocal Habit"). No paragraphs.
- **Optional thumbnail device:** a single highlight (circle/arrow) on the technique moment, used sparingly.
- **Brand-consistent** so a row of spotlights looks like a set (same type treatment, logo position, accent).
- **Safe zones:** keep text ~7% off the edges; assume the platform may crop to square — keep the headline
  centered enough to survive a 1:1 crop.

## Output
- `public/spotlights/<slug>-og.png` — 1200×630 (the `og:image` / `twitter:image`).
- `public/spotlights/<slug>-hero.webp` — 16:9 card for the Learn carousel.
- `alt`: a literal description for `<img alt>` + accessibility.
- `headline` + `rightsBasis` (which allowed source above) returned to the parent skill for the handoff.

## Tooling (compose, don't hand-wave)
- Build the overlay as **SVG** (background/base image + gradient scrim + headline text in a DESIGN.md font +
  brand mark), then rasterize **SVG → PNG/WebP** (sharp / resvg / `rsvg-convert`; mirrors the henchmen
  `blog/scripts/house-image.sh` pattern). Or render an HTML card and screenshot it (Playwright) — whichever
  is available. The **text overlay is fully ours to generate**; only the *base image* is rights-sensitive.
- Keep file sizes lean (OG < ~300 KB). Use DESIGN.md tokens for color/type — no hex/font literals.

## Handoff
Return to `artist-profile`: the file paths, `headline`, `alt`, and `rightsBasis`. If no rights-cleared base
image was available, return the **typographic** version + a note: "needs artist image / coach-thumbnail
permission for a photo version." The human approves the image (and its rights basis) on the preview before
the spotlight is promoted.
