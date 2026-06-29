---
name: artist-research
description: >-
  Phase 1 (research) of the artist-spotlight pipeline. Given an artist (or song), discover embeddable
  YouTube vocal-coach sources, transcribe + consolidate their analyses, gather verified range/voice-type
  facts, and emit a single structured "research brief" that every downstream worker consumes. Use when the
  orchestrator (artist-profile) needs the research brief, or when asked to "research <artist>'s voice" /
  "find coach videos for <artist>". Read-only + drafting; no publishing.
metadata:
  version: 1.0.0
---

# Artist Research — the shared brief

**Phase 1 of the pipeline (see `artist-profile` orchestrator).** This is the *blocking* first step:
everything downstream (drills, hero image, fact-check, draft) consumes the one **research brief** you
produce here. Compute it once; do it well.

**Read:** `seo/artist-spotlight-partnerships-plan.md` (strategy) + `seo/content-style-guide.md` (hedging rules).

## Tool — `scripts/yt-extract.sh` (key-free)
```bash
bash scripts/yt-extract.sh search "vocal coach <artist> vocal range" --n 8
bash scripts/yt-extract.sh search "<artist> vocal analysis" --n 8
bash scripts/yt-extract.sh search "how to sing like <artist>" --n 8      # technique artists
bash scripts/yt-extract.sh search "how to sing <song> <artist>" --n 8    # song mode
bash scripts/yt-extract.sh batch <url|id> ... --json                     # metadata + transcripts
```

## Steps
1. **Discover + vet.** Run 2–4 search angles. Pick **3–6 credible coach videos** (real vocal coach,
   analysis/how-to format — not fan reactions or lyric videos). Pull transcripts (`batch --json`); keep the
   ones with usable captions (skip `available:false`). Prefer `manual` captions. Record `embed_url` + flag
   each **"confirm embed allowed"** (we don't hard-verify embeddability).
2. **Consolidate.** Synthesize across coaches: **agreements** (→ the confident claims), **disagreements**
   (surface them — the style guide rewards it), and the **specific vocal facts** (range in notes, voice type,
   the signature move, common pitfalls). Attribute non-obvious claims to the coach who said it.
3. **Spec facts (hedged + sourced).** Establish range + voice type from verifiable sources (enthusiast DBs
   like Singing Carrots, Wikipedia, the coaches) — **as estimates, attributed, never as hard fact** (range ≠
   voice type; labels are loose in CCM). Note anything you can't verify (don't assert it).
4. **Technique→article map.** For each technique that comes up, record the matching evergreen Learn slug
   (chest→`chest-voice-exercises`, mix→`mix-voice-exercises`, head/passaggio→`head-voice-exercises`,
   belt→`belting-exercises`, runs→`vocal-agility-exercises`, range→`how-to-increase-vocal-range`,
   pitch→`how-to-sing-in-tune`). The draft worker uses this for internal links.
5. **Artist class.** Tag **technique artist** (signature replicable move — runs/whistle/flips/screams →
   "how to sing like" carries weight) vs **tone artist** (Adele/Sinatra — demote the technique sections).

## Output — the research brief (structured)
```
{ artist, song?, artistClass: "technique"|"tone",
  range: { notes, hedge, sources[] }, voiceType: { label, hedge, sources[] },
  signatureMove, consolidatedPoints: [{ point, coach? }], disagreements: [...], pitfalls: [...],
  coachSources: [{ channel, url, embedUrl, id, captions, confirmEmbed }],
  techniqueArticleMap: [{ technique, slug }],
  specClaims: [{ claim, basis }],   // hands to content-fact-check
  references: [{ citation, url }] }
```
Hand this brief back to the orchestrator. Do **not** draft the article or fabricate anything unverifiable.
