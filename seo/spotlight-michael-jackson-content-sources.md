# Content Sources & Fact-Check Verdicts — Michael Jackson Spotlight

**File:** `content/artist-profiles/michael-jackson.draft.md` (draft) · **Status:** fact-checked, pending human approval
**Process:** per `seo/content-style-guide.md` — every substantive claim adversarially refuted through 2 independent
lenses (A: voice-science/acoustics · B: applied-pedagogy + quote/citation verification), keep SUPPORTED, hedge
OVERSTATED, fix/cut REFUTED. Never fabricate a citation; health claims reflect current clinical guidance.
**Date:** 2026-07-30

> **Honest caveat up front — and it shapes the whole page.** Unlike the Freddie Mercury spotlight, there is
> **no peer-reviewed acoustic anchor** for this one. A hard falsification attempt (PubMed, *Journal of Voice*,
> *Logopedics Phoniatrics Vocology*, Google Scholar) turned up nothing: the only academic literature on
> Jackson's voice is musicology, not acoustics. Every range and register figure in circulation is
> enthusiast-tier or single-analyst-tier. The article is therefore built on **attributed observation plus
> generally established voice science**, never on asserted measurement — and it says so to the reader rather
> than papering over it. The genuinely solid, citable science here is in the **technique and health** claims,
> not the range claims.
>
> **Scope note:** both lenses were instructed to research singing technique, vocal acoustics, vocal-health
> guidance, and the documentary record of how Jackson sang, trained and recorded — and nothing about his
> personal life, legal history, appearance or medical history. None of that was researched and none of it
> appears in the draft.

---

## Lens A — voice science / acoustics

| # | Claim | Verdict | Treatment in draft (required) | Source(s) |
|---|---|---|---|---|
| A1 | No peer-reviewed acoustic study of Jackson's voice exists (unlike Herbst et al. 2017 for Mercury) | **SUPPORTED** — survived a hard falsification attempt | State as a *search result*, not an ontological claim: "as far as we can find, none has been published." The asymmetry with Mercury is a good, verifiable hook and justifies the page's hedged tone. | PubMed `"Michael Jackson" voice singing` → 0 results; `"Michael Jackson"[Title/Abstract]` → 30 results, none voice/larynx/acoustics. *J Voice* + *Logoped Phoniatr Vocol* → nothing. Only academic MJ-voice work found is musicology (*Popular Music and Society* 35(2), DOI 10.1080/03007766.2011.618053). Herbst et al. 2017 verified real: PMID 27079680. |
| A2 | ~B2–A♭5 (~3 octaves) in one analyzed warm-up recording; top notes head voice "not falsetto" (Fil Henley / Wings of Pegasus) | **OVERSTATED as measurement** — usable only as attributed observation. "Never falsetto" **UNVERIFIABLE from this method** | Attribute by name and hedge. **Do not** write "his measured range is B2–A♭5." **Cut "never falsetto" as fact** — a pitch tracker outputs f0, and f0 cannot distinguish laryngeal mechanism; that is expert *auditory* opinion, legitimate to quote but not data. | Video-only source; secondary coverage does not reproduce the figures. See method limits below. |
| A2b | Method limits on software pitch-tracking off a YouTube recording | — | Worth one honest sentence: octave errors are the dominant failure mode of autocorrelation/MPM-class trackers and bite hardest at range extremes (this app hits the same bug — `lib/pitch/postprocess.ts`); mp3 compression preserves f0 well but degrades the *tails* of the f0 distribution 6.9–7.6%, i.e. exactly what a range claim rests on; a warm-up is one session on one day — a floor on demonstrated range, not a ceiling on capability. | Fuchs & Maxwell (2016), *Speech Prosody 2016* 523–527, DOI 10.21437/SpeechProsody.2016-107. |
| A3 | Popular figure "nearly four octaves," commonly quoted E2–C6 | **OVERSTATED as fact** — SUPPORTED only as attributed lore | Present as lore, then puncture it with the source's own disclaimer. Explain *why* it inflates: it is a union of extremes across a whole recorded catalogue, mixing chest notes, falsetto flips, ad-libs and overdubbed backing vocals — not a contiguous range demonstrated in one performance. | Singing Carrots artist page (E2–C6, 3.7 octaves) — verbatim disclaimer verified 2026-07-30: *"we are estimating the vocal range for the artists based on what we know about the songs they perform. The 'real' vocal range of the person of course might be different."* |
| A4a | A speaking pitch around C3 is normal adult-male territory | **SUPPORTED with a hedge** — C3 is inside the normal band but toward its **upper end** | Write "within normal adult-male range, if toward the higher end of it" — not "completely average." C3 = 130.8 Hz; normative adult-male speaking f0 ≈116 Hz mean (~93–135 Hz, SD ≈12). Also hedge the input: one interview clip is a single sample. | Holmberg, Hillman & Perkell (1988), *JASA* 84(2):511–529, PMID 3170944. Hollien & Shipp (1972), PMID 5012800. |
| A4b | "Thin timbre, not high pitch" is a defensible acoustic distinction | **SUPPORTED — the most scientifically solid idea in the set** | Keep and lean on it; name the mechanism. Source–filter theory separates them: folds set **pitch (f0)**, the vocal tract sets **timbre (formants)**. Listeners judge speaker size largely from formant scaling *independently of* pulse rate. **Never write that formants determine pitch or that resonance "extends range."** | Smith & Patterson (2005), *JASA* 118(5):3177–3186, PMID 16334696. Source–filter: Fant (1960) / Titze. Sundberg (1974), *JASA* 55(4):838–844, PMID 4833080 (singer's formant). |
| A5 | "Arytenoid rattle" is a real described effect, distinct from ventricular distortion, growl and grunt | **SUPPORTED — citation real and accurate — with 3 precision fixes and a provenance flag** | Paper exists exactly as cited. **FIX 1:** the effect is named **"rattle,"** not "arytenoid rattle" → write "rattle (arytenoid-on-arytenoid vibration)." **FIX 2:** don't say arytenoids are what makes rattle unique — *growl also uses them*, against the epiglottis. **FIX 3:** drop "…and their mucosa." **PROVENANCE:** this is Complete Vocal Technique vocabulary (all authors CVT-affiliated, n=20, no independent replication) — say "terminology from CVT that has been described in the peer-reviewed literature," **not** "generally accepted." **The literature says nothing about Jackson**; labelling his recorded sound "rattle" by ear is an inference — attribute it to whoever made it. | Aaen, McGlashan & Sadolin (2020), *J Voice* 34(1):162.e5–162.e14, PMID 30448317, DOI 10.1016/j.jvoice.2017.12.020. Follow-up taxonomy: Aaen, Sadolin & McGlashan (2025), *Perspect ASHA SIGs* 10(2):490–510, DOI 10.1044/2024_PERSP-24-00140. |
| A6 | Grit is safer placed low and produced intentionally than when it arises from reaching for high notes | **PARTLY SUPPORTED (mechanism) · OVERSTATED as an established finding** | Keep the coach's reasoning *as reasoning*, anchored to real mechanism: vocal-dose measures are computed from f0 and SPL, so the same phonation time accumulates more exposure higher and louder; and "intentional vs unintentional" is an explicit axis in the supraglottic taxonomy. **Say plainly that no study has directly compared low-placed vs high-placed distortion for injury.** | Titze, Švec & Popolo (2003), *JSLHR* 46(4):919–932, PMID 12959470. Hillman et al. (2020), *AJSLP* 29(4), DOI 10.1044/2020_AJSLP-20-00104. Aaen et al. (2022, 2024) longitudinal/EGG studies — small n, self-selected, method's own institute. |
| A7 | A quiet head-voice check works as a vocal-swelling self-test | **SUPPORTED — and better founded than "one coach said so"** | This is the clinical **"swelling check."** Upgrade the attribution to Bastian et al. (1990). Three refinements: **(1)** the signal is high **and very quiet** — loudness masks the deficit; **(2)** it is **not specific to distortion** — it flags mucosal disturbance generally; **(3)** it is a self-monitoring heuristic, **not a diagnosis** — pair it with the 4-week referral line. | Bastian, Keidar & Verdolini-Marston (1990), *J Voice* 4(2):172–183 (n=43, no modern replication found). Laryngopedia (Bastian Voice Institute), "Swelling Checks." |
| A8 | Male voices lose upper range through puberty; a coach said Jackson "lost roughly an octave" | **General science SUPPORTED but the usual framing is wrong · person-specific claim UNVERIFIABLE** | Fix the framing: the whole voice **translates downward** by roughly an octave — notes are added at the bottom as they go at the top — not "an octave subtracted from the top." Range gaps during active voice change are *transient*. Person-specific figure: attribute to the coach by name in-sentence, or cut. **Draft cuts it.** | Harries et al. (1997), *Arch Dis Child* 77(5):445–447, PMID 9487971. Cooksey six-stage model (1999). |
| A9 | Head voice vs falsetto on the top notes — analyst and teacher flatly contradict each other | **Primarily a TERMINOLOGY CLASH over a question recordings cannot settle. Do not adjudicate.** | Report both, explain why they may not actually conflict: SLS reserves "falsetto" for the disconnected/breathy upper register; many contemporary coaches reserve "head voice" for a connected one; Estill and CVT don't use the axis at all. Underneath sits a real question (mechanism M1 vs M2) — but M1 and M2 **overlap across a wide frequency region**, so a note name settles nothing, and telling them apart needs EGG or endoscopy, which does not exist here. **Declare no winner.** | Roubeau, Henrich & Castellengo (2009), *J Voice* 23(4):425–438, PMID 18538982. |
| A10 | Persistent hoarseness ≥4 weeks warrants professional evaluation | **SUPPORTED — citation real, threshold correct, still current as of 2026-07-30** | Use non-alarmist and near-verbatim. Keep **4 weeks** (the folk "2 weeks" is wrong; the superseded 2009 guideline allowed up to three months). **Do not cite a "2026 guideline"** — one aggregator shows a page-metadata refresh, not a new document. | Stachler et al. (2018), *Otolaryngol Head Neck Surg* 158(1_suppl):S1–S42, DOI 10.1177/0194599817751030. Currency verified on entnet.org, 2026-07-30. |

---

## Lens B — pedagogy + quote/citation verification

Every quote below was read **at the source URL**, not accepted secondhand.

| # | Claim | Verdict | Treatment in draft (required) | Source(s) |
|---|---|---|---|---|
| B1 | Voice type usually given as "light lyric tenor" / "high tenor" | **SUPPORTED only as enthusiast-tier attribution** | Wikipedia's Michael Jackson article was checked and contains **no** range or voice-type claim at all — verified. The "tenor" label traces to Singing Carrots and fan profiles, back-derived from the same inflated range figures, with no tessitura or passaggio analysis behind it. Attribute and hedge, or lead with the mismatch instead. | Singing Carrots singing guide ("Michael Jackson was a tenor"); en.wikipedia.org/wiki/Michael_Jackson (verified silent on voice type, 2026-07-30). |
| B2 | The "four octaves" figure originates with Seth Riggs's estimates | **Quote SUPPORTED verbatim · origin attribution UNVERIFIABLE → soften** | Quote verified at the Red Bull interview: *"Michael had this enormous range. He would go from low E flat to E flats and Gs above high C?"* But "originates with" cannot be established. **Soften to "commonly attributed to" or simply present Riggs's recollection alongside the lore without claiming causation.** | Red Bull Music Academy Daily, Seth Riggs interview (2017) — read at source. |
| B3 | Riggs: he could "vocalize down to a low C, a basso low C" when his larynx stayed down | **SUPPORTED — quote verified verbatim** | Full context verified: *"Immediately, I would say that when his larynx didn't go up, he was able to vocalize down to a low C, a basso low C."* Present as teacher recollection in an interview decades later, not measurement. | Red Bull Music Academy Daily (2017) — read at source. |
| B3b | Riggs: "If you don't reach for notes in the first bridge, meaning if you don't pull up chest voice, you will never lose your bottom" | **SUPPORTED — quote verified verbatim** | Safe to quote directly. Excellent anchor for the don't-drag-chest-up pitfall. | Red Bull Music Academy Daily (2017) — read at source. |
| B3c | Riggs: he "goes in the chest and then flips into falsetto so he wouldn't hurt himself" | **SUPPORTED — quote verified verbatim** | Quote directly; this is one half of the A9 disagreement. | Red Bull Music Academy Daily (2017) — read at source. |
| B4 | Riggs was his voice teacher, engaged via Quincy Jones; some sources say ~25 years / "his only voice teacher" | **Engagement SUPPORTED · "only teacher" is Wikipedia-tier · "~25 years" UNVERIFIABLE → cut** | Verified on Wikipedia: *"In the early 1980s producer Quincy Jones called Riggs to work with Michael Jackson. Jones wanted Riggs to work with Jackson two hours a day, six days a week, in preparation for and through the entire time recording the Thriller album."* Wikipedia also says he "stayed as Michael Jackson's only voice teacher throughout Jackson's career" — **Wikipedia-tier, not primary; attribute or omit.** The Red Bull interview does **not** state a duration. **The "~25 years" figure has no source and the draft cuts it.** | en.wikipedia.org/wiki/Seth_Riggs; Red Bull interview (silent on duration) — both read at source. |
| B5 | Speech Level Singing = larynx stays near its speaking level; mixes head and chest for an even range | **Description SUPPORTED · evidence base NOT assessed → make no evidence claim either way** | Verified description: *"Riggs' technique mixes head voice and chest voice… A key element… is that the larynx stays on the same general level as speech—therefore the technique came to be called Speech Level Singing."* Per the style guide, label it **one method among several** (Estill, CVT, classical) and do not imply they agree more than they do. Neither lens researched SLS's evidence base, so the draft must **not** assert that it is validated *or* that it is unsupported. | en.wikipedia.org/wiki/Seth_Riggs — read at source. |
| B6 | Swedien: a vocal coach was there every vocal day, he warmed up an hour beforehand, and memorized lyrics the night before | **SUPPORTED — quotes verified verbatim** | Verified at *Sound on Sound*: *"every day that we recorded vocals his vocal coach was there, and he warmed up for an hour beforehand"* and *"I don't think I ever saw Michael with the lyrics in front of him. He'd always been up the night before memorising the lyrics and he sang the songs from memory."* Strong first-party source (the engineer in the room). Safe to quote and lean on. | *Sound on Sound*, "Bruce Swedien: Recording Michael Jackson" — read at source. |
| B7 | Vocal hiccup: started 1973; a trademark by *Off the Wall*; Buddy Holly the earlier user; Diana Ross claimed he took it from her | **SUPPORTED at Wikipedia-tier, with a real underlying book citation** | All four elements verified. Start: 1973, "It's Too Late to Change the Time" (*G.I.T.: Get It Together*). Described as *"somewhat like a gulping for air or gasping."* Holly's is *"a clipped 'uh' sound used to emphasize certain words."* Ross claim: *"Diana Ross claimed on The Today Show that Michael Jackson took the vocal hiccup technique from her."* Geoff Brown, *The Complete Guide To The Music of Michael Jackson & The Jackson Family* (Omnibus, 1996), pp. 29–30, is genuinely cited as reference 5. **Three claimants, no resolution — present it that way.** | en.wikipedia.org/wiki/Vocal_hiccup — read at source. |
| B8 | Beatboxing on "Working Day and Night" was influenced by early hip-hop heard at Studio 54 | **SUPPORTED verbatim (Wikipedia-tier)** | Verified: *"During his time in New York, Jackson frequented the Studio 54 nightclub, where he heard early hip-hop; this influenced his beatboxing on later tracks such as 'Working Day and Night'."* | en.wikipedia.org/wiki/Michael_Jackson — read at source. |
| B8b | The officially released "Beat It" demo is vocals-only, with him beatboxing the drum part | **UNVERIFIED → cut** | Neither lens reached the official track page. **Not in the draft.** Re-verify before any future use. | — |
| B9 | His stacked backing vocals are layers of himself, not session singers | **NOT SUPPORTED by the production source → attribute to the coach only, or cut** | Checked the *Sound on Sound* Swedien interview specifically for this: it discusses background vocals recorded separately but **does not** attribute them to Jackson multi-tracking himself. **Draft does not state this as production fact.** | *Sound on Sound* — read at source, claim absent. |
| B10 | His body or finger-clicks were mic'd so his movement was captured on the record | **REFUTED as sourced fact → CUT** | The coach who said it self-hedged ("I've heard reports"). Checked the Swedien interview directly: **absent**. **Cut entirely.** Not in the draft. | *Sound on Sound* — read at source, claim absent. |
| B11 | He sang a line through a cardboard tube on "Billie Jean" | **SUPPORTED — and the research brief had the lyric wrong** | Verified verbatim: *"The special effect on the 'Don't think twice!' interjection in verse two of 'Billie Jean', for instance, was created by singing through a five‑foot long cardboard tube."* The brief said "do think twice" — **the correct line is "Don't think twice!"** and the tube was **five feet** long. | *Sound on Sound* — read at source. |
| B11b | Swedien used a Shure SM7 on most lead vocals | **SUPPORTED verbatim** | *"I used a Shure SM7 on most of Michael's lead vocals — 'Billie Jean', 'The Way You Make Me Feel.'"* Peripheral; draft uses it only in passing if at all. | *Sound on Sound* — read at source. |
| B12 | vocalrangetester.com, vocalrangecalculator.com, singingrangetest.com, vocalrangetest.com are uncitable | **Editorial decision — never cited** | These publish mutually contradictory figures with no stated method. Not cited anywhere in the draft. divadevotee.com would not load for either researcher; also not cited. | — |

---

## `mustFix` applied in the draft

1. No range is stated as measured. Henley's figures are attributed by name and hedged; E2–C6 is presented as lore and punctured with Singing Carrots' own disclaimer.
2. "Never falsetto" is not asserted — it appears only as one analyst's auditory opinion, inside the A9 disagreement, which the draft explicitly declines to settle.
3. "Rattle," not "arytenoid rattle"; growl also involves the arytenoids; "mucosa" dropped; CVT provenance named; the MJ-specific attribution credited to the coach who made it by ear.
4. The low-and-intentional grit reasoning is framed as coach reasoning consistent with vocal-dose modelling, with the "no study has compared them" caveat stated.
5. The "lost an octave through puberty" person-specific claim is **cut**. The general puberty science, where used, is framed as downward translation, not subtraction.
6. The swelling check is attributed to Bastian et al. (1990), specified as high **and very quiet**, described as non-specific to distortion, and paired with the 4-week referral line.
7. "~25 years" and "his only voice teacher" are cut; the Quincy Jones engagement and the *Thriller*-era schedule are used instead.
8. The body-mic / finger-clicks claim is **cut**. The self-multi-tracked backing vocals claim is **not** presented as production fact.
9. "Don't think twice!", verse two, five-foot tube — corrected from the brief.
10. The studio-manipulation caveat (varispeed and pitch shift transpose whole vocal tracks) is included — it is the most useful single thing the page can tell a reader arguing about octaves online.
11. No grit/distortion drill ships, so no dosage problem arises. The omission is stated in the prose rather than left to look like an oversight.
12. Voice type is presented as approximate and overlapping, with the speaking-pitch/timbre mismatch as the actual story.

---

## Verified reference URLs

**Peer-reviewed / clinical**
- Aaen, McGlashan & Sadolin (2020), *J Voice* 34(1):162.e5–162.e14 — https://pubmed.ncbi.nlm.nih.gov/30448317/
- Aaen, Sadolin & McGlashan (2025), *Perspect ASHA SIGs* 10(2):490–510 — https://pubs.asha.org/doi/10.1044/2024_PERSP-24-00140
- Roubeau, Henrich & Castellengo (2009), *J Voice* 23(4):425–438 — https://pubmed.ncbi.nlm.nih.gov/18538982/
- Bastian, Keidar & Verdolini-Marston (1990), *J Voice* 4(2):172–183 — https://www.sciencedirect.com/science/article/abs/pii/S0892199705801444
- Titze, Švec & Popolo (2003), *JSLHR* 46(4):919–932 — https://pubmed.ncbi.nlm.nih.gov/12959470/
- Hillman, Stepp, Van Stan, Zañartu & Mehta (2020), *AJSLP* 29(4) — https://pubs.asha.org/doi/10.1044/2020_AJSLP-20-00104
- Smith & Patterson (2005), *JASA* 118(5):3177–3186 — https://pubmed.ncbi.nlm.nih.gov/16334696/
- Sundberg (1974), *JASA* 55(4):838–844 — https://pubmed.ncbi.nlm.nih.gov/4833080/
- Holmberg, Hillman & Perkell (1988), *JASA* 84(2):511–529 — https://pubmed.ncbi.nlm.nih.gov/3170944/
- Harries et al. (1997), *Arch Dis Child* 77(5):445–447 — https://pubmed.ncbi.nlm.nih.gov/9487971/
- Fuchs & Maxwell (2016), *Speech Prosody 2016* — https://www.isca-archive.org/speechprosody_2016/fuchs16b_speechprosody.html
- Herbst et al. (2017) — the Mercury comparison — https://pubmed.ncbi.nlm.nih.gov/27079680/
- Stachler et al. (2018), AAO-HNSF Hoarseness CPG — https://aao-hnsfjournals.onlinelibrary.wiley.com/doi/10.1177/0194599817751030
- AAO-HNS guideline landing page (currency check 2026-07-30) — https://www.entnet.org/quality-practice/quality-products/clinical-practice-guidelines/hoarseness-dysphonia/

**Primary interviews / documentary record (all read at source)**
- Seth Riggs interview, Red Bull Music Academy Daily (2017) — https://daily.redbullmusicacademy.com/2017/08/seth-riggs-interview/
- "Bruce Swedien: Recording Michael Jackson," *Sound on Sound* — https://www.soundonsound.com/people/bruce-swedien-recording-michael-jackson
- Seth Riggs — Wikipedia — https://en.wikipedia.org/wiki/Seth_Riggs
- Vocal hiccup — Wikipedia (cites Geoff Brown 1996, pp. 29–30) — https://en.wikipedia.org/wiki/Vocal_hiccup
- Michael Jackson — Wikipedia (Studio 54 / beatboxing; verified silent on voice type) — https://en.wikipedia.org/wiki/Michael_Jackson

**Non-peer-reviewed, cited only as attributed lore/pedagogy**
- Singing Carrots artist range (E2–C6, 3.7 octaves, with self-disclaimer) — https://singingcarrots.com/artist-range?artist=Michael+Jackson
- Laryngopedia (Bastian Voice Institute), "Swelling Checks" — https://laryngopedia.com/swelling-checks/
- Voice Science lexicon — adult speaking-F0 norms — https://www.voicescience.org/lexicon/average-speaking-frequencies/

**Explicitly NOT cited** — vocalrangetester.com, vocalrangecalculator.com, singingrangetest.com, vocalrangetest.com (contradictory figures, no stated method); divadevotee.com (would not load for either researcher); MJJCommunity forum threads (fan discussion, not a source).

---

## Open items for human validation

1. **Fil Henley's exact note names are unverified.** The source is video-only and no text source reproduces the figures. The draft attributes them to him by name and hedges, but if you want to be stricter, watch the video and confirm the notes and whether he hedges — or drop the specific note names for "roughly three octaves."
2. **The "rattle" attribution to Jackson is a coach's ear, not a laryngoscopy.** The draft credits it to Beth Roars explicitly and describes the sound. Confirm you're comfortable with an ear-judgment effect label at all; the alternative is to describe the sound without the CVT term.
3. **CVT independence.** All the rough-effects literature comes from the Complete Vocal Institute group. A non-CVT corroboration candidate exists (Caffier et al. 2018, *J Voice* 32(3)) but **was not verified** — do not cite it without checking.
4. **"Only voice teacher throughout Jackson's career"** is Wikipedia-tier. The draft avoids it. If you want it in, it needs a primary source.
5. **SLS evidence base was not assessed by either lens.** The draft describes the method neutrally and makes no claim about its validation status in either direction. If a future revision wants to say more, that needs its own check.
6. **Lens B ran as orchestrator-executed fetches** rather than a subagent — two subagent attempts terminated on an API content filter before writing anything. Every quote in the Lens B table was read at the source URL in this session, but a second human spot-check of the two most load-bearing quotes (Riggs's "first bridge" line, Swedien's "warmed up for an hour") is cheap insurance.
7. **Health-guidance currency re-check.** Verified current 2026-07-30. If publication slips more than a few months, re-check entnet.org before shipping the health line.
