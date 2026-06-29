---
name: spotlight-drills
description: >-
  Phase 2 worker (parallel) of the artist-spotlight pipeline. Given the research brief, propose a menu of
  4–6 candidate practice drills mapped to the artist's signature technique — native exercises first (reuse),
  bespoke only when nothing fits (flagged NEEDS VALIDATION, never fabricated). Use when the orchestrator needs
  the drill menu, or when asked to "pick exercises for <artist>". Drafting only.
metadata:
  version: 1.0.0
---

# Spotlight Drills — the candidate menu

**Phase 2 worker (runs in parallel with hero-image + fact-check).** Input: the `artist-research` brief
(signature move, consolidated coach points). Output: a **menu of 4–6 candidate drills** the human keeps
2–3 of, in-context. Do **not** pre-pick the final set.

## Native-first (the hard rule — see plan §3d)
Bias to **existing native exercises** — the routine + the in-article embed both resolve **by id**, so an
article-local "custom import" can't deliver the one-tap "Add to routine" CTA. Most artist signatures are
already covered, so most profiles ship **zero** new descriptors. Available ids:
`agility-run, belt-arpeggio-mah, belt-nyah-descending, bub-mix-voice, chest-descent-mah, chest-voice-mum,
descending-five-to-one-nay, five-note-scale-mee-may-mah, goog-octave-arpeggio, head-voice-vwohm,
high-belt-wee, hum-warmup, messa-di-voce, nay-1-3-5-3-1, ng-siren, octave-leap-wow, passaggio-leap-and-back,
rossini-lip-trill, staccato-arpeggio, staccato-onset, stepwise-passaggio-ascent, straight-tone-vibrato`.

Rough map: belts → `belt-arpeggio-mah`/`high-belt-wee`; runs/agility → `agility-run`/`staccato-arpeggio`;
register leaps/passaggio → `octave-leap-wow`/`passaggio-leap-and-back`; head voice → `head-voice-vwohm`;
mix → `bub-mix-voice`/`goog-octave-arpeggio`; range-building → `stepwise-passaggio-ascent`.

## For each candidate
`{ exerciseId, label (what it drills), origin: reuse|bespoke, key (suggested start key for the song),
why (tie to a specific coach point from the brief) }`. Aim for 4–6 spanning the artist's move(s).

## The goldmine — coach-demonstrated drills (FLAG, never fabricate)
If a transcript shows a coach teaching a *specific* drill that no native exercise covers, propose it as a
**bespoke** candidate `{ origin: bespoke, status: NEEDS_VALIDATION }` with the coach quote — but **do not
author a `data/exercises` descriptor from video** (pure-audio derivation is unreliable). The human validates
+ authors it. Reuse should cover the rest.

## Output
`{ candidates: [ ...as above ] }` → back to the orchestrator (the draft worker renders them as
`[[DRILL exerciseId=… key=…]]` markers + "Add to routine").
