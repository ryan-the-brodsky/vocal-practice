# Vocal Range Test — Content Fact-Check & Sources

The science claims on `/vocal-range-test` were checked by **adversarial review**: three independent fact-checkers — a voice-science/acoustics lens, an applied-pedagogy lens, and a hard-skeptic lens — were each told to *refute* every claim and verify named authorities against the literature, not confirm them. All three converged on the same corrections. (The skeptic finished late, after the page's first round of fixes; its one additional refinement — Claim 2 — was then folded in.)

## Claims corrected after review

| Claim | Verdict | Fix applied |
|---|---|---|
| Hoarseness → see a doctor after ~2 weeks | **Refuted** — current guideline is **4 weeks** (AAO-HNS 2018, Stachler et al.); 2 weeks applies to higher-risk patients | Disclaimer now says ~4 weeks, sooner for heavy voice users |
| Untrained 1.5–2 / trained 2.5–3 octaves | **Overstated** — those figures come from consumer sites, not peer-reviewed data; a controlled study (Watts et al. 2016, PMC4782147) found *no significant pitch-range difference* between trained and untrained singers (the difference was in dynamics/control). The popular numbers conflate comfortable tessitura with full phonated range. | Reframed: comfortable range ≈1.5–2 octaves, full phonated range often wider; training reliably grows *usable* range + control/dynamics, but evidence on widening the absolute span is mixed |
| Voice-type ranges (baritone G2–G4, alto F3–F5) | **Overstated** — baritone floor too high (→ A2), alto floor too high (→ E3); and these are **classical/choral** norms | Table values corrected; added explicit CCM-uses-these-loosely caveat |
| Vowel modification EE→IH / AH→UH as cross-method "consensus" | **Overstated** — that's a classical/bel-canto recipe; belting often does the opposite (brighter/open). The *principle* (formant–harmonic alignment) is shared; the specifics are not | Reframed as the shared principle + "one school's recipe, not a universal law; belting often does the opposite" |
| Passaggio "bridge early" as universal | **Overstated** — that's SLS-flavored; classical uses "cover," Estill/CVT frame it differently | Reframed as a genuine point of disagreement between schools |

## Claims that passed as written (SUPPORTED both passes)

Range vs. tessitura vs. voice type are distinct (Claim 1); usable < absolute range and it varies day-to-day (3); voice types overlap and depend on more than extremes (4); range expands via coordination and forcing risks injury (6); SOVT lowers phonation threshold pressure, attributed to Titze/NCVS (7) — with the nuance that SOVTs aren't all biomechanically identical and aren't "safe" on a damaged voice; head-voice/mix up top, clean closure down low (9); short frequent practice + gradual progress (11), framed as pedagogic recommendation; mic pitch-detection octave errors at the extremes (12). Named methods Estill, CVT (Cathrine Sadolin), SLS (Seth Riggs) confirmed real — with the note that their evidence bases differ (Estill strongest; SLS more practitioner-lore).

## Sources cited on the page (verified real)

1. Titze, I.R. — "Major Benefits of Semi-Occluded Vocal Tract Exercises," National Center for Voice and Speech / University of Utah Vocology. https://vocology.utah.edu/_resources/documents/major_benefits_of_sovtes_titze.pdf
2. Stachler, R.J. et al. (2018) — "Clinical Practice Guideline: Hoarseness (Dysphonia) (Update)," *Otolaryngology–Head and Neck Surgery* (AAO-HNSF). DOI: 10.1177/0194599817751030 · https://pubmed.ncbi.nlm.nih.gov/29494321/
3. Sundberg, J. (1987) — *The Science of the Singing Voice*, Northern Illinois University Press.
4. Maxfield, L. & colleagues — "Evidence-Based Voice Pedagogy," NATS / *Journal of Singing*. https://vocology.utah.edu/_resources/documents/ebvp_part_one_maxfield_ragan.pdf

Supporting references consulted (not all cited on-page): Roers, Mürbe & Sundberg (2009) on vocal-fold length vs. voice type; Araujo et al. (2014) electroglottographic SOVT comparison; Watts et al. (2016) trained-vs-untrained voice range profile study (PMC4782147 — basis for the Claim 2 refinement); Miller, *The Structure of Singing* (1986).

## Process note

All three background validator agents completed, but none reliably delivered their final message — every verdict was recovered from the agent transcripts (`subagents/*.jsonl`, last assistant block); the skeptic in particular finished well after going "idle." If this content is expanded later, re-run the same adversarial pass on any new claims, and do not add a citation that hasn't been verified by a refutation-oriented check.
