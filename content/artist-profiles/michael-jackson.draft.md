<!--
DRAFT artist-profile (status: draft). Not published, not committed. Scope is singing technique only:
how he sang, trained and recorded. Nothing about personal life, legal history, appearance or medical
history was researched or written; keep it that way in review.
Island render contract (markers the artists/[slug] route maps to hydrated islands):
  [[COACH-VIDEO id=<ytid> by="<channel>" title="…"]] -> YouTube embed card
  [[DRILL exerciseId=<id> key="<key>"]]              -> EmbeddedExercise + "Add to routine" button
  [[SHARE]]                                          -> share row
  NOTE: SpotlightBody does NOT pass `key` through to the island, so every suggested start key is also
  written into the surrounding prose. Don't strip those.
Fact-check verdicts (binding): seo/spotlight-michael-jackson-content-sources.md
Hero rights: Larry Davis / Los Angeles Times via UCLA Library Digital Collections, CC BY 4.0. The route
renders the visible attribution caption from the heroCredit* frontmatter below.
Open items for the human on preview:
  1. Fil Henley's note names (B2, A♭5, ~C3 speaking) are video-only and unverified. The draft attributes
     and hedges them; drop to "roughly three octaves" if you want stricter.
  2. The "rattle" label on his live grit is Beth Roars' ear, not a laryngoscopy. The draft says so
     explicitly. Confirm you're comfortable with an ear-judgment effect label at all.
  3. Confirm all six [[COACH-VIDEO]] embeds actually play in the preview (two more sources are text
     citations only, by design).
-->
---
title: "Michael Jackson's Vocal Range and Voice Type, Explained"
seoTitle: "Michael Jackson Vocal Range & Voice Type | Vocal Habit"
slug: michael-jackson
category: artist-profile
mode: artist
artist: "Michael Jackson"
targetKeywords: ["michael jackson vocal range", "michael jackson voice type", "how to sing like michael jackson"]
coachSources:   # first six are embedded via [[COACH-VIDEO]]; last two are text citations only (Sources section)
  - { channel: "New York Vocal Coaching", title: "Michael Jackson Vocal Analysis - Voice Lessons Online Ep. 16", url: "https://www.youtube.com/watch?v=tOIS-44X-TI", embedUrl: "https://www.youtube.com/embed/tOIS-44X-TI", captions: manual, confirmEmbed: true }
  - { channel: "Ken Tamplin Vocal Academy", title: "How To Sing Like Michael Jackson", url: "https://www.youtube.com/watch?v=SpNLOEpDAVs", embedUrl: "https://www.youtube.com/embed/SpNLOEpDAVs", captions: manual, confirmEmbed: true }
  - { channel: "Chris Liepe", title: "It's not like it sounds!! How to PROPERLY learn from Michael Jackson & Seth Riggs", url: "https://www.youtube.com/watch?v=Jz9_nKD-hIs", embedUrl: "https://www.youtube.com/embed/Jz9_nKD-hIs", captions: auto, confirmEmbed: true }
  - { channel: "Chris Liepe", title: "We need to talk about Michael's PRIVACY Distortion (using multitrack vocals)", url: "https://www.youtube.com/watch?v=4Swvq5wMp8c", embedUrl: "https://www.youtube.com/embed/4Swvq5wMp8c", captions: auto, confirmEmbed: true }
  - { channel: "Beth Roars", title: "Smooth Criminal. Vocal Coach Breaks Down THAT Munich Performance", url: "https://www.youtube.com/watch?v=26GAUaqFQoo", embedUrl: "https://www.youtube.com/embed/26GAUaqFQoo", captions: manual, confirmEmbed: true }
  - { channel: "Wings of Pegasus", title: "Detailed vocal analysis REVEALS Michael Jackson's LOW voice!", url: "https://www.youtube.com/watch?v=CWP_mSlKK-c", embedUrl: "https://www.youtube.com/embed/CWP_mSlKK-c", captions: auto, confirmEmbed: true }
  - { channel: "Beth Roars", title: "I thought 'Billie Jean' was restrained... then I heard the backing vocals", url: "https://www.youtube.com/watch?v=1mKe07Po-2g", embedUrl: "https://www.youtube.com/embed/1mKe07Po-2g", captions: manual, confirmEmbed: true }
  - { channel: "Chris Liepe", title: "Why Late 80s era LIVE Michael Jackson is PEAK (Vocal Analysis, 'Beat It' Wembley)", url: "https://www.youtube.com/watch?v=jDanDRFLu-g", embedUrl: "https://www.youtube.com/embed/jDanDRFLu-g", captions: auto, confirmEmbed: true }
candidateDrills:   # keep-what-fits at approval; all reuse, no bespoke. Grit/rattle deliberately NOT drilled.
  - { exerciseId: bub-mix-voice, label: "top-down mix: carry head resonance down without adding weight", origin: reuse, key: "E3", why: "Liepe on the Riggs tape ('he's already in a mixed voice there… he's not straining here'), plus his head-voice-first warm-up preference. The 8-5-3-1 descent enters on the octave in head-mix and walks it down, the opposite of Tamplin's 'pulling up a bunch of girth.'" }
  - { exerciseId: head-voice-vwohm, label: "bright, connected head voice: landing from above so the larynx stays put", origin: reuse, key: "A3", why: "Henley on the top of that warm-up recording: 'the higher he goes, the brighter and more pristine that sound becomes.' The vw→ohm slides descend into each target so nothing gets reached for, which is Tamplin's neutral larynx." }
  - { exerciseId: passaggio-leap-and-back, label: "cross the first bridge on a narrow 'oo': the anti-pull-up drill", origin: reuse, key: "F3", why: "Riggs's own rule: 'if you don't pull up chest voice, you will never lose your bottom.' At F3 the leap lands on F4, right in the male first bridge, and the slow 84 bpm is literally Liepe's fix ('do not do it fast. Do it slow.')." }
  - { exerciseId: staccato-onset, label: "consonants as drumbeats: clean glottal onsets, no squeeze", origin: reuse, key: "A3", why: "Beth Roars: 'Each consonant and vowel is almost like a drumbeat… really precise and tight.' Trains fold closure on demand so the percussion comes from articulation, not weight." }
  - { exerciseId: staccato-arpeggio, label: "the 'hee': percussive isms on pitch, in time, across the octave", origin: reuse, key: "G3", why: "Sung on 'hee' at 140 bpm over a 1-3-5-8-5-3-1 arc; Liepe's 'percussive little isms.' Counteracts doing the hee-hee as a detached party trick. Baritones drop to E3/F3; G3 is above the baritone tonic ceiling (F#3) for this one." }
  - { exerciseId: agility-run, label: "fast, small, even runs, and the legato half of the legato/staccato pair", origin: reuse, key: "A3", why: "Beth Roars after transcribing them: 'It's just super, super fast.' His runs are narrow and quick, not wide; a nine-note stepwise run at 144 bpm is the honest shape. Run it back-to-back with staccato-arpeggio for Velazquez's legato/staccato contrast." }
embeddedExerciseId: bub-mix-voice   # first drill; back-link default
relatedArticles:   # our evergreen Learn guides for the techniques in this profile (the spotlight → cluster bridge)
  - { slug: mix-voice-exercises, label: "mix voice exercises" }
  - { slug: head-voice-exercises, label: "head voice exercises" }
  - { slug: chest-voice-exercises, label: "chest voice exercises" }
  - { slug: vocal-resonance-exercises, label: "vocal resonance exercises" }
  - { slug: vocal-agility-exercises, label: "vocal agility exercises" }
  - { slug: vibrato-exercises, label: "vibrato exercises" }
  - { slug: sovt-exercises, label: "SOVT exercises" }
  - { slug: breathing-exercises-for-singing, label: "breathing exercises for singing" }
  - { slug: how-to-warm-up-your-voice, label: "how to warm up your voice" }
  - { slug: how-to-practice-singing, label: "how to practice singing" }
  - { slug: how-to-increase-vocal-range, label: "how to increase your range" }
  - { slug: how-to-sing-in-tune, label: "how to sing in tune" }
  - { slug: how-to-improve-singing-voice, label: "how to improve your singing voice" }
heroImage: "/spotlights/michael-jackson-hero.webp"
ogImage: "/spotlights/michael-jackson-og.jpg"
heroHeadline: "Michael Jackson's Voice as a Drum Kit"
heroAlt: "Michael Jackson singing into a handheld microphone mid-phrase, mouth open and his white-gloved right hand raised beside the mic, wearing a black sequined jacket on stage in front of the drum kit during the Jacksons' Victory Tour at Arrowhead Stadium, Kansas City, July 1984"
heroCredit: "Larry Davis / Los Angeles Times, UCLA Library Digital Collections"
heroCreditLicense: "CC BY 4.0"
heroCreditLicenseUrl: "https://creativecommons.org/licenses/by/4.0/"
heroCreditSourceUrl: "https://commons.wikimedia.org/wiki/File:Michael_Jackson,_Victory_Tour,_Arrowhead_Stadium,_1984.jpg"
metaDescription: "Michael Jackson's vocal range and voice type: why the four-octave figure doesn't hold up, what coaches hear in his percussive delivery and deliberate grit, and free in-browser drills."
status: draft
published: 2026-07-30
updated: 2026-07-30
---

# Michael Jackson's Vocal Range and Voice Type, Explained

The number you'll see everywhere is **nearly four octaves, roughly E2 to C6**. It doesn't hold up: it's
a union of extremes scraped across a whole catalogue, and the site it traces back to says so itself.
The most careful public attempt to measure him landed nearer **three octaves**, and that's one
analyst's software read of one tape. The **light lyric tenor** label is back-derived from the same
inflated numbers. What the coaches actually study is his *rhythm*: grunts, gasps, clipped consonants,
ad-libs placed with drummer-grade timing, from a man whose speaking voice sat in ordinary adult-male
territory. Most of that is trainable.

[[SHARE]]

## Michael Jackson's vocal range

**As far as we can find, no peer-reviewed acoustic study of his singing has ever been published.** We
searched PubMed, the *Journal of Voice* and Google Scholar; the only academic work on his voice is
musicology. Freddie Mercury, by contrast, has a 2017 acoustic study with measured numbers in it. So
every figure here is **attributed observation**, never asserted measurement.

**The lore: E2–C6, about 3.7 octaves.** That's the Singing Carrots figure, and the site attaches its
own disclaimer: *"we are estimating the vocal range for the artists based on what we know about the
songs they perform."* A catalogue-wide number is a union of extremes: a low chest note in one song, a
falsetto flick in another, an ad-lib, a stacked backing vocal. Not a contiguous range anyone
demonstrated in one take.

**The closest thing to a measurement.** Fil Henley (Wings of Pegasus) ran pitch-tracking software over
a circulated warm-up recording and reported a low of **B2** and a top of **A♭5**, *"three octaves worth
of range."* That's his read, not a published result. Hold it loosely: octave errors are the dominant
failure mode of this class of tracker and bite hardest at range extremes (the detector inside this app
fights the same bug), mp3 encoding distorts the *tails* of the pitch distribution by around 7% (Fuchs &
Maxwell, 2016), and a warm-up is one session on one day.

Studio vocals also get transposed: varispeed and pitch shifting move a whole track up or down, so a
"note" on a record isn't necessarily one anyone produced at that pitch. Three-ish octaves is still
wide, and [extending your own](/learn/how-to-increase-vocal-range) is more trainable than his sense of
time is.

## What voice type was Michael Jackson?

The usual answer is **light lyric tenor** or **high tenor**. Be careful with it: Wikipedia's article on
him carries no range or voice-type claim at all, and the label is back-derived from the same enthusiast
range figures, with no tessitura or passaggio analysis behind it. Voice-type labels are classical and
choral conventions built on where a voice *lives* (tessitura), its timbre, and where its passaggio (the
gear-change between registers) sits. Pop uses them loosely at best.

The mismatch is the better story. Henley, tracking an interview clip, puts his speaking voice around
**C3**: *"he's talking in exactly the same place where most guys talk."* One clip is one sample, and C3
(130.8 Hz) sits inside the normal adult-male band but toward its **upper** end, since normative studies
put the male mean nearer 116 Hz. His summary: **"his high voice is low but it sounds high… it's just a
thinner place."**

Source-filter theory separates what gets conflated there: the vocal folds set **pitch**, the vocal
tract sets **timbre**. Listeners judge how big a voice is largely from formant scaling, more or less
independently of pitch (Smith & Patterson, 2005), so a light, forward
[resonance](/learn/vocal-resonance-exercises) reads as *high* even when the note isn't. Which is the
reverse of a common claim: resonance does **not** extend your range. It changes what it sounds like.

## What the coaches say: the voice as a drum kit

Six coach breakdowns converge on his **timing** rather than his high notes. The register work, the grit
and the runs hang off it.

> [[COACH-VIDEO id=26GAUaqFQoo by="Beth Roars" title="Smooth Criminal. Vocal Coach Breaks Down THAT Munich Performance"]]

**Beth Roars**, on the Munich "Smooth Criminal": *"Each consonant and vowel is almost like a
drumbeat."* The percussion comes from articulation and onset timing rather than volume; hit harder to
get it and you get shouting. The ad-libs are colored to the song, *"little overspills of emotion that
he instantly pulls back."* Her summary: **"It is discipline meets danger."**

> [[COACH-VIDEO id=tOIS-44X-TI by="New York Vocal Coaching" title="Michael Jackson Vocal Analysis - Voice Lessons Online Ep. 16"]]

**Kacey Velazquez** at **New York Vocal Coaching** frames the rhythm as a pair, *"his use of legato and
staccato singing,"* switched at will, which is why two of the drills below run back to back. **David
McCall** goes at the unglamorous part: *"good breath control while dancing requires physical fitness
and stamina."* [Breath management](/learn/breathing-exercises-for-singing) is what the performance
runs on, at a full cardio load.

> [[COACH-VIDEO id=SpNLOEpDAVs by="Ken Tamplin Vocal Academy" title="How To Sing Like Michael Jackson"]]

**Ken Tamplin** demonstrates the register question better than he explains it. To get near the timbre
he strips weight: *"I gotta really sing into the mask… I'm shedding all that weight,"* height without
heft, *"not sounding like I'm pulling up a bunch of girth,"* with the larynx neither rising nor
dropping. Forward placement, a still larynx, and explicitly not dragging
[chest voice](/learn/chest-voice-exercises) up into the [mix](/learn/mix-voice-exercises).

> [[COACH-VIDEO id=4Swvq5wMp8c by="Chris Liepe" title="We need to talk about Michael's PRIVACY Distortion (using multitrack vocals)"]]

**Chris Liepe's** multitrack breakdown of "Privacy" is the most technically useful source we found,
since he's working from isolated stems rather than a finished mix. The grit is **three techniques
switched between mid-phrase**: a sigh compressed into phonation, a low nasal grunt approached from
below (*"like a buzzer sound"*), and a higher constricted-whisper rasp where *"you hardly hear a note
there at all."* His evidence that it's deliberate: *"there are lots of clean notes in the midst of his
distortion, so he has full command over what he's doing."*

He also argues that grit placed low and produced on purpose is safer than grit that arrives because
you're reaching, and hedges himself: *"I can't be completely certain."* Take it as reasoning, not a
finding. Vocal-dose measures are computed from frequency and sound pressure level, so the same
phonation time costs more the higher and louder you sing (Titze, Švec & Popolo, 2003), and intentional
versus unintentional is an explicit axis in the published taxonomy of rough effects. But **no study has
compared low-placed deliberate distortion with high-placed incidental distortion for injury risk.**

**On the live grit**, Beth Roars hears *"something called an arytenoid rattle… two little cartilages on
the back of your vocal cords… they can rattle around and bash off each other."* Three precisions. The
effect in the literature is **rattle**, arytenoid-on-arytenoid vibration; "arytenoid rattle" is a
plain-English gloss rather than the term of art. The arytenoids aren't what makes it unique, since
**growl also involves them**, against the epiglottis. And this is **Complete Vocal Technique vocabulary
described in the peer-reviewed literature** (Aaen, McGlashan & Sadolin, 2020) rather than neutral
cross-method consensus: all authors CVT-affiliated, 20 singers, no independent replication we could
find. The literature says nothing about Michael Jackson, so labeling his recorded sound "rattle" is
Beth Roars' ear, offered as such.

> [[COACH-VIDEO id=Jz9_nKD-hIs by="Chris Liepe" title="It's not like it sounds!! How to PROPERLY learn from Michael Jackson & Seth Riggs"]]

### The leaked coaching session, and why you shouldn't copy it

A recording of a session with **Seth Riggs** (his teacher, brought in by Quincy Jones, who wanted him
working with Jackson two hours a day, six days a week through the *Thriller* sessions) circulates as
"how Michael Jackson warmed up." Liepe argues that treating it that way is a mistake. What he hears is
encouraging, *"he's already in a mixed voice there… not causing tension,"* but the warning is blunt:
*"it's not called a warm-up, it's called a training session… It's how he **trains**, not necessarily
how he warms up."* His fix, if you use the material anyway: *"do not do it fast. Do it slow."* That's
the difference between [warming up](/learn/how-to-warm-up-your-voice) and
[practicing](/learn/how-to-practice-singing), and it's why the passaggio drill below sits at 84 bpm.
Riggs's own method, **Speech Level Singing**, keeps the larynx near its speaking level while blending
head and chest: one method among several (Estill, Complete Vocal Technique, classical pedagogy), whose
evidence base we haven't assessed in either direction.

### Two disagreements worth surfacing

**Head voice or falsetto up top?** Henley, on the warm-up: *"it's not falsetto, this is his head
voice."* Riggs, who taught him, told Red Bull Music Academy the opposite: he *"goes in the chest and
then flips into falsetto so he wouldn't hurt himself."* Much of the fight is **terminology**: Speech
Level Singing reserves "falsetto" for the disconnected, breathy upper register, many contemporary
coaches reserve "head voice" for a connected one, and Estill and CVT don't use that axis at all.
Underneath sits a real physiological question (laryngeal mechanism M1 versus M2), but the two overlap
across a wide frequency band, so a note name settles nothing, and telling them apart needs
electroglottography or endoscopy. Neither exists for him, and frequency alone cannot distinguish
mechanism, so Henley's "not falsetto" is expert *auditory* opinion rather than data.

**Should vibrato slow when the exercise does?** Riggs tells him not to let it. Liepe disagrees on
record, respectfully: *"let your [vibrato](/learn/vibrato-exercises) be musical for the situation."*
Two named teachers, one tape, no resolution.

> [[COACH-VIDEO id=CWP_mSlKK-c by="Wings of Pegasus" title="Detailed vocal analysis REVEALS Michael Jackson's LOW voice!"]]

### The runs, the vibrato, and the hour of warm-up

**The runs are narrow and quick.** Beth Roars transcribes them: *"It's just super, super fast."*
Stepwise and close together rather than acrobatic, ordinary [agility](/learn/vocal-agility-exercises)
at unusual precision. **The vibrato is fast and narrow**, and she notes he *"uses it to move into that
run,"* a transition device rather than decoration parked at the end of a note. Behind all of it, plain
work: his engineer **Bruce Swedien** says *"every day that we recorded vocals his vocal coach was
there, and he warmed up for an hour beforehand,"* and that he never saw him with a lyric sheet, since
he *"sang the songs from memory."* An internalized lyric leaves your attention free for phrasing and
timing.

## Practice it: how to sing like Michael Jackson, six drills

You can't practice "being Michael Jackson," but you can practice the coordinations underneath. These
are real Vocal Habit exercises with live pitch scoring: tap **+ Add to routine** on the ones that match
what your voice needs and skip the rest.

**1. Top-down mix: carry head resonance down without adding weight. Start around E3.**

> [[DRILL exerciseId=bub-mix-voice key="E3"]]
> A descending 8–5–3–1 on "bub," starting around **E3** for a male voice. You enter on the octave,
> already in head-mix, and walk it down: the opposite move from Tamplin's "pulling up a bunch of
> girth."

**2. Bright, connected head voice: landing from above so the larynx stays put. Start around A3.**

> [[DRILL exerciseId=head-voice-vwohm key="A3"]]
> Two descending slides (6→4, then 4→1) on "vwo–ohm," starting around **A3**. Every slide lands from
> above, so nothing gets reached for. It should get brighter as it climbs, not heavier.

**3. Cross the first bridge on a narrow "oo": the anti-pull-up drill. Start around F3.**

> [[DRILL exerciseId=passaggio-leap-and-back key="F3"]]
> An octave leap-and-return on "oo," starting around **F3** so the leap lands on F4, right in the male
> first bridge. Riggs's rule made physical: *"if you don't pull up chest voice, you will never lose
> your bottom."* It runs at 84 bpm on purpose.

**4. Consonants as drumbeats: clean glottal onsets, no squeeze. Start around A3.**

> [[DRILL exerciseId=staccato-onset key="A3"]]
> Short separated "gug" onsets on 1–3–1–5–1, starting around **A3**. The hard "g" sets clean fold
> closure at the start of each note, the mechanical basis of the drumbeat. Rushed attacks go
> [out of tune](/learn/how-to-sing-in-tune) first.

**5. The "hee": percussive isms on pitch, in time, across the octave. Start around G3.**

> [[DRILL exerciseId=staccato-arpeggio key="G3"]]
> Seven staccato "hee"s over a 1–3–5–8–5–3–1 arc at 140 bpm, starting around **G3**. **Baritones drop
> to E3 or F3**, since G3 is above this exercise's baritone tonic ceiling. The point is that it stays
> in tune, in the pocket, and survives the bridge at the top.

**6. Fast, small, even runs, and the legato half of the pair. Start around A3.**

> [[DRILL exerciseId=agility-run key="A3"]]
> A nine-note stepwise run up and back on "ah" at 144 bpm, starting around **A3**. Narrow and quick,
> the honest shape of his runs. Run it back-to-back with drill 5 for the legato/staccato contrast; the
> switch between them is the actual skill.

**What's deliberately missing: any grit, rasp or distortion drill.** Liepe's multitrack work shows the
rasp was at least three separate deliberate techniques, and none has a safe unsupervised form in an
app. False-fold and arytenoid work needs a teacher listening in real time. We made the same call on the
Freddie Mercury page.

## Go deeper

Each of these is a full guide with its own free, pitch-scored exercises:
[mix voice](/learn/mix-voice-exercises) (the connected middle, entered from above),
[head voice](/learn/head-voice-exercises), [chest voice](/learn/chest-voice-exercises) (build it, then
*don't* drag it upward), [resonance](/learn/vocal-resonance-exercises),
[agility](/learn/vocal-agility-exercises), [vibrato](/learn/vibrato-exercises),
[SOVT work](/learn/sovt-exercises), [breathing](/learn/breathing-exercises-for-singing),
[how to warm up](/learn/how-to-warm-up-your-voice) (ten minutes, not an hour),
[how to practice](/learn/how-to-practice-singing),
[how to increase your range](/learn/how-to-increase-vocal-range),
[how to sing in tune](/learn/how-to-sing-in-tune), and
[how to improve your singing voice](/learn/how-to-improve-singing-voice).

## Common mistakes, and singing it safely

- **Copying the leaked coaching tape as a warm-up.** It's how he *trains*, and at speed it's a fast route into strain. If you use it, slow it right down.
- **Doing the "hee-hee" as a party trick.** Detached from pitch and time it's an impression, not technique. Drill 5 puts it back on a note and in a tempo.
- **Chasing the rasp.** Squeezing for it, or shouting through high notes to get it, is the injury-risk version. Learn it in person if you want it.
- **Dragging chest voice up for "power."** Riggs's line is the memorable one: pull up chest voice and you lose your bottom.
- **Copying the percussion with volume.** The jaggedness is articulation and timing. Louder isn't crisper.
- **Ignoring the fitness side.** Breath control while dancing is a conditioning problem too. If you're winded, phrase around it.

> **A note on vocal health.** These drills should feel like effort, never pain. One useful self-check,
> described in the clinical literature as a **swelling check** (Bastian, Keidar & Verdolini-Marston,
> 1990): sing something high **and very quiet**. Quiet high onsets are the first thing to go when the
> folds are swollen, and loudness masks the deficit, which is why a full-voice belt tells you nothing.
> It flags general mucosal disturbance rather than anything specific to distortion, and it's a
> self-monitoring heuristic, not a diagnosis. Current guidance (AAO-HNS, 2018) is to get hoarseness
> lasting **four weeks or more** evaluated by a professional. This page is educational, not medical
> advice.

## FAQ

**What was Michael Jackson's vocal range?**
No peer-reviewed acoustic study of his voice exists as far as we can find, so there's no measurement to
quote. The repeated **E2–C6, nearly four octaves** is Singing Carrots' catalogue-wide estimate, which
the site itself flags as inferred from songs. Fil Henley's pitch-tracking pass over one circulated
warm-up reported roughly **three octaves**, around B2 to A♭5, as his software read of one tape.

**What voice type was Michael Jackson?**
Usually **light lyric tenor** or high tenor, but treat it loosely: the label is back-derived from
enthusiast range figures rather than from tessitura or passaggio analysis. Henley tracks his speaking
voice to around C3, ordinary adult-male territory, while his singing reads as high because it's light
and forward.

**Did he sing in head voice or falsetto up top?**
The two best-placed sources contradict each other. Henley says head voice and "not falsetto." Seth
Riggs, who taught him, says he "goes in the chest and then flips into falsetto." Much of the gap is
vocabulary, and the question underneath, mechanism M1 versus M2, can't be settled from a recording.

**How do you sing like Michael Jackson?**
Start with rhythm rather than range: consonants placed like drum hits, ad-libs colored to fit each
song, staccato and legato switched deliberately. Then a mix entered from above, light forward placement
with a still larynx, and real breath support if you're moving. Skip the grit until you have a teacher
in the room.

## Sources

- **Coaches (embedded, with thanks):** New York Vocal Coaching; Ken Tamplin Vocal Academy; Chris Liepe (Seth Riggs session; "Privacy" multitrack); Beth Roars ("Smooth Criminal"); Wings of Pegasus (Fil Henley). Also cited: [Beth Roars on "Billie Jean"](https://www.youtube.com/watch?v=1mKe07Po-2g); [Chris Liepe on "Beat It"](https://www.youtube.com/watch?v=jDanDRFLu-g).
- **Interviews:** [Seth Riggs, Red Bull Music Academy Daily (2017)](https://daily.redbullmusicacademy.com/2017/08/seth-riggs-interview/); [Bruce Swedien, *Sound on Sound*](https://www.soundonsound.com/people/bruce-swedien-recording-michael-jackson).
- **Voice science:** [Aaen, McGlashan & Sadolin (2020)](https://pubmed.ncbi.nlm.nih.gov/30448317/) on rough vocal effects (CVT-affiliated, n=20, no independent replication found); [Roubeau et al. (2009)](https://pubmed.ncbi.nlm.nih.gov/18538982/) on M1/M2 overlap; [Smith & Patterson (2005)](https://pubmed.ncbi.nlm.nih.gov/16334696/) on voice size and formants; [Titze, Švec & Popolo (2003)](https://pubmed.ncbi.nlm.nih.gov/12959470/) on vocal dose; [Holmberg et al. (1988)](https://pubmed.ncbi.nlm.nih.gov/3170944/) on adult speaking pitch; [Fuchs & Maxwell (2016)](https://www.isca-archive.org/speechprosody_2016/fuchs16b_speechprosody.html) on mp3 and the tails of the pitch distribution; [Herbst et al. (2017)](https://pubmed.ncbi.nlm.nih.gov/27079680/), the Mercury study.
- **Health:** [Bastian, Keidar & Verdolini-Marston (1990)](https://www.sciencedirect.com/science/article/abs/pii/S0892199705801444); [Laryngopedia, "Swelling Checks"](https://laryngopedia.com/swelling-checks/); [AAO-HNSF hoarseness guideline, 2018](https://aao-hnsfjournals.onlinelibrary.wiley.com/doi/10.1177/0194599817751030).
- **Lore and background, attributed as such:** [Singing Carrots](https://singingcarrots.com/artist-range?artist=Michael+Jackson), E2–C6 with its own disclaimer; [Seth Riggs](https://en.wikipedia.org/wiki/Seth_Riggs); [Vocal hiccup](https://en.wikipedia.org/wiki/Vocal_hiccup), citing Geoff Brown (Omnibus, 1996); [Michael Jackson](https://en.wikipedia.org/wiki/Michael_Jackson), verified to carry no voice-type or range claim.
- Full claim-by-claim verdicts: `seo/spotlight-michael-jackson-content-sources.md`.

*Vocal Habit is not affiliated with or endorsed by Michael Jackson's estate. This is an educational analysis of publicly observable vocal technique.*
