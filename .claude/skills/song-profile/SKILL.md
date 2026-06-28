---
name: song-profile
description: >-
  Build a draft single-song vocal "spotlight" content profile for vocalhabit.com from embeddable
  YouTube vocal-coach "how to sing <song>" sources. Use when the user says "song-profile <song>",
  "do a profile on <song>", or wants a draft article about how to sing a specific song built from
  coach breakdowns + an embedded exercise. This is the song-scoped mode of the artist-profile skill.
metadata:
  version: 1.0.0
---

# Song Profile

This is the **song-scoped mode** of the `artist-profile` skill. Follow the full workflow in
`.claude/skills/artist-profile/SKILL.md` with these adjustments:

- **Scope to one song.** Frontmatter `mode: song` + `song: "<Song>"` + `artist: "<Artist>"`.
- **Search angles:** lead with `"how to sing <song> <artist>"`, `"<song> vocal cover tutorial"`,
  `"vocal coach <song>"` — the per-song "how to sing" coach videos are usually the richest source and
  most often contain a **demonstrated exercise** (flag it `NEEDS VALIDATION`, don't fabricate a descriptor).
- **Page focus:** the song's specific vocal demands (the hard interval/belt/run/bridge), the section that
  trips singers up, and the matching practice exercise — rather than the artist's whole range/voice-type.
  Still link out to the artist's spotlight + `/vocal-range-test`.
- Everything else is identical: key-free `scripts/yt-extract.sh`, multi-coach consolidation, local-bank
  cross-reference, the **mandatory adversarial fact-check**, and **draft-only** output to
  `content/artist-profiles/<song-slug>.draft.md` (no publish, no commit).
