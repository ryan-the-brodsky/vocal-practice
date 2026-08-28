# Citation brokers (aggregators) and a profile of VoSci

**Date:** 2026-08-27. Sources: Ahrefs API v3 (ai-responses-count, referring-domains, top-pages, batch-analysis),
voicescience.org pages, classcentral.com help center and course pages inspected in Chrome, web search.
Follows `seo/chatgpt-citation-behavior-test.md` §7, where ChatGPT cited Class Central 4 times and VoSci once
for "best free online singing course".

## Part 1. VoSci (voicescience.org)

**Who.** Josh Manuel, founder and sole named pedagogue. MM Vocal Pedagogy, Westminster Choir College (with
Distinction); BM classical voice performance; teaching since 2013; founded Manuel Creative Arts Academy
(~1,500 students/week at peak, in-school programs). Stated mission: most voice information "either ignored the
science or presented it in a way that had no practical application." **Correction (LinkedIn, read by Ryan 2026-08-27): not solo.** His own description: responsible for brand positioning, curriculum design and cross-channel content strategy "while managing a small, agile team across education, media, and infrastructure," and directing "go-to-market execution across paid media, podcast, and web." So the tools were most likely built by a hired developer (the "infrastructure" seat), and he has been spending on paid media. Ahrefs shows **zero paid search traffic or cost, ever**, so the paid spend is Meta/YouTube/podcast ads, not Google Ads. His pre-VoSci career is in customer success in tech (per Ryan's read of the profile), the same operator-not-engineer background as Ryan's.

**What they publish (all free, no signup).**
- **168-lesson "Free Voice Training"** at `/free/` (planned as 365 daily lessons, stopped at 168). This is the
  page ChatGPT cited.
- **Lexicon, 200+ terms** (`/lexicon/<term>/`), each a ~200-word definition with `DefinedTerm` + `BreadcrumbList`
  JSON-LD, internal links, no external citations. These are their top organic pages (voice frequency range,
  voice crack, contralto, belting, mezzo-soprano).
- **27 articles** in "How to X: The Science-Based Guide" form (practice, sing in tune, vocal range, belting, breath,
  higher notes, mix voice, passaggio, head voice, singing straws, "Are Online Singing Lessons Good?",
  "How ChatGPT Thinks You Teach Singing"). These DO carry reference sections citing Journal of Voice papers,
  e.g. Johnson & Kempster 2011 (J. Voice 25:5), Lamarche, Ternström & Pabon 2010 (J. Voice 24:4), Rast et al.
  2023 (J. Voice 37:6). No author bylines, dates 2022 to 2026.
- **The Voice Science Podcast**, 63 episodes since ~2025, plus a weekly newsletter ("The Voice Science Brief").
- **A `/compare/singing-carrots/` page** (their #2 organic page): "Singing Carrots gives you well-designed tools
  to practice with. VoSci builds your practice from your voice." Feature table: automatic session programming
  vs manual; both have real-time pitch feedback; SC has gamification, a 75,000-song database and video courses;
  VoSci has voice-calibrated sessions. SC priced at ~$9.99/mo.

**Do they have a tool? Yes, seven, free, at `app.voicescience.org`:** Voice Range Profile (browser mic, real-time
pitch, "siren mode" for quick range, full protocol produces a phonetogram of pitch × loudness plus spectral
clarity / harmonic richness / stability metrics; optional free account for history), Pitch Matching,
Spectrogram, Intervals, Sight-reading, VFE (vocal function exercises), Foundational. **Paid layer:** "Practice
Paths" (adaptive session generator built from your VRP data) and Academy courses/membership. A recent site
notice says they are changing direction but the lexicon, podcast and tools stay free and Academy subscriptions
are unaffected.

**Numbers.** DR 15, 489 referring domains, ~665 organic visits/mo, 357 keywords. **ChatGPT 276 citations across
63 pages**, Perplexity 35, AI Overviews 4. Their followed links come overwhelmingly from **podcast directories**
(Buzzsprout DR 91, Poddtoppen 78, Podcast Republic 69, Podscan 63, Podstatus) plus Grokipedia (7 dofollow):
the podcast is their link engine, not the articles.

**Verdict: they are our profile writ large, and slightly ahead on the library.** Free sourced library + free mic
tools + paid adaptive layer, no signup. What we have that they don't: scored warm-up routines with streaks,
song import, artist spotlights, a fully free guided experience (their guided paths are paid). What they have
that we don't: 168 + 200 + 27 = ~400 indexable pages (our cited-page gap in one number), a podcast, a lexicon,
compare pages, and a newsletter.

**Use them as a source-mining seed, not a source.** The 27 articles' reference lists are pre-filtered primary
literature on exactly our topics; pull the papers, run them through `content-fact-check`, and cite the paper.
Lexicon entries have no citations and should not be cited. Never cite VoSci as an authority; it is a DR-15
competitor, and our style guide requires primary sources.

**Cheap things to copy.** (1) A lexicon of 100-200 `DefinedTerm` pages: breadth is what ChatGPT's method slot
rewards, and definitions are fast to write and easy to fact-check. (2) `/compare/singing-carrots`,
`/compare/vosci`, `/compare/yousician` pages for "X alternative" intent. (3) "The Science-Based Guide" title
pattern. (4) A podcast, if only as a link engine: every directory listing is a DR 60-90 followed link.


### 1b. How and when VoSci was built (added 2026-08-27, same day)

**Timeline** (Wayback CDX, podcast RSS, Ahrefs refdomains history, their own copy):
- The domain voicescience.org had unrelated prior owners (snapshots 2002-2016). Josh's site is separate.
- **2023**: "I started VoSci in 2023." First modern snapshot 2023-06-04; `/articles` by 2023-06-29; `/lexicon`
  by 2023-12-04. Referring domains: 1 in June 2023, 3 by year end. A content site, no product.
- **2024**: articles + lexicon grow; 3 → 11 referring domains. No tools, no podcast, still no traction.
- **Feb 18 2025**: The Voice Science Podcast launches (biweekly, ~16 min, 64 episodes to date; on "summer
  break" since 2026-07-21). Referring domains 15 → 63 over 2025, nearly all podcast directories.
- **Apr 2025**: `/academy/` appears (paid membership: Practice Paths, courses).
- **Feb 26 2026**: Terms v4.0 (free accounts by default, seven tools, paid monthly/annual for Practice Paths,
  courses, "advanced reporting, and Studio features", i.e. a teacher/studio tier). Terms re-updated 2026-08-24.
- **Apr 2026**: first Wayback capture of `/tools/*`; the tool app (`app.voicescience.org`, a React/Vite bundle
  behind Cloudflare; the marketing site is static HTML on Cloudflare) is a 2025-2026 build.
- **May-Aug 2026**: referring domains jump 61 → 192 → 277 → 415 → 469. Same shape and timing as our own
  launch-week spam wave (435); treat it as noise, not authority.
- **Google traffic curve** (Ahrefs monthly): literally 0 for the first two years (Jul 2023 to Apr 2024), single
  digits through mid-2025, 31 in Sep 2025, 71 in Jan 2026, then **405 in Apr 2026 when the tools shipped**,
  peak 1,024 in Jun 2026, 647 in Aug 2026. Three years of sourced writing earned nothing from Google; the
  tools did in two months what the library never did, and the library is what ChatGPT cites.
- **Location**: VoSci, Louisville, Colorado 80027. Local to us.

So the sequence was: two years of articles + lexicon with almost no traffic → podcast (links) → paid academy →
free tools → and now a pivot. The 276 ChatGPT citations sit on top of a site Google mostly ignores, which is
the same shape as ours.

**The pivot ("The Next Chapter", on `/academy/`, Aug 2026).** In his words the pattern he saw: "the people
getting the most from this work are dedicated singers who want to truly understand their craft, and the
teachers guiding them. So that's where we're going next." The next product is **The Voice Science Brief**, a
weekly newsletter pitched at teachers ("Pedagogy Demystified... actionable studio teaching methods... designed
to fit perfectly between lessons"). Practice Paths is "currently unavailable while we adjust the singer
experience"; the podcast is paused; lexicon, podcast archive and the seven tools "stay free and open to
everyone"; existing Academy members are told nothing changes yet. Read plainly: **he is moving up-market to
teachers and pedagogy students and stepping back from the consumer beginner product.** That is the exact
segment Vocal Habit serves.

**Ryan's hands-on UX notes (2026-08-27).** Six top-level menus. Tools → Foundational Exercises opens a
Settings modal as the first thing a cold user sees: mode tabs **Audiate / Sing / Test** ("Listen and imagine
the pattern silently"), Exercise Category (Scales / Triad Arpeggios / 7th Arpeggios), Scale Type (3-, 5-, 8-,
9-tone), Mode (Ionian, Aeolian, "More Modes"), Pattern (ascending/descending/up-then-down/down-then-up), a
note-highlighting checkbox, root-note picker by octave and pitch class, then "Start Training". Running the
exercise: a constant drone/hum underneath, and **no feedback on how you did** when it ends. Verdict: an
academic's tool for people who already know what "audiate" means; his academy/teacher users get through it
because they are his students. Our "step right up and sing" flow with immediate scored feedback and a
routine is the better beginner experience today, and his pivot confirms he knows who his users really are.


**Tool-app fingerprint (bundle inspected 2026-08-27).** One 2.9 MB unsplit Vite/React bundle at
`app.voicescience.org`, with d3 (the phonetogram), Stripe, PostHog, Sentry, Cloudflare Workers references,
`getUserMedia` + `AudioWorklet` for capture, and a pitch detector built on **MPM (McLeod, NSDF buffer) with YIN
references**: the same algorithm family as our pitchy-based detector. Vite default hashing and a single giant
bundle are consistent with a solo, AI-assisted 2025-26 build (Ryan's read: the tools arrived with the
vibe-coding era; the articles predate it). Unverified beyond the bundle. Note the correction: his degree is from
Westminster Choir College in **Princeton, New Jersey**; the Colorado connection is his business address
(Louisville, CO), not the school.

**Monetization read (Ryan, 2026-08-27).** Practice Paths (paid, for free singers) is offline and the new product
is a teacher newsletter plus "Studio features" in the Terms. That is a founder who paid a team and paid for media to convert casual singers to a
subscription, didn't get enough of them to cover the burn, and is pivoting to the people who already pay for
pedagogy: teachers and serious students. Our version of the same bet runs at near-zero cost (one operator
plus AI coding, zero ad spend, a free LLM-citation channel), so the consumer lane he is leaving is still
viable for us at our cost structure even though it wasn't at his. It is the strongest external evidence we have that **consumer
singers are hard to convert**, which matches our own data (almost nobody edits their routine; completion is
curiosity-driven). Implications: keep the consumer product free and un-gated as the citation engine; if we
ever monetize, the validated wedge is the teacher/studio side (assign routines, see student scores), not a
paywall on practice.


**Links and contact routes (verified 2026-08-27).**
- The pivot announcement ("The Next Chapter of VoSci"): https://www.voicescience.org/academy/
- The Voice Science Brief (waitlist page, "Coming Soon", weekly, teacher-facing): https://www.voicescience.org/brief/
- About: https://www.voicescience.org/about/josh-manuel/ ; contact form: https://www.voicescience.org/contact/
- LinkedIn: https://www.linkedin.com/in/joshua-scott-manuel/ ("Founder & CEO @ VoSci")
- Instagram: https://www.instagram.com/voicescience.org ; YouTube: https://www.youtube.com/@voicescience
- Podcast: https://www.voicescience.org/vosci-podcast/ (Apple id1795320877; Buzzsprout feed 2447385)
- Business address (Terms): VoSci, 566 S. McCaslin Blvd #270559, Louisville, CO 80027

**Queued: deep study of the seven tools** (Ryan, 2026-08-27). Priority is the Voice Range Profile's loudness
axis. We already capture `rmsDb` on every `PitchSample` (it feeds `MicLevelMeter`), so a pitch × loudness
profile is mostly a UI + protocol problem, not an engine one. Caveat to design around: browser mic gain is
uncalibrated, so absolute dB is meaningless; what is usable is *relative* dynamics within one session at a
fixed mic distance (soft vs loud at each pitch, dynamic range per register, where loudness collapses near the
passaggio). That is enough to give projection and register-resonance advice without claiming to measure
timbre, which pitch + RMS cannot. Secondary: interval trainer and pitch matching as ear-training adjacencies;
sight reading is his serious-student territory, not our warm-up/exercise lane.

**What to take from him for the roadmap** (feature development seeds, ranked):
1. **Voice Range Profile with dynamics.** His phonetogram (pitch × loudness, soft vs loud per note) is a
   clinical-grade idea nobody else in the consumer space ships. Our range test measures range only; adding an
   RMS axis is a small engine change and a big differentiator.
2. **Adaptive routine sequencing.** Practice Paths (warm-up → skill → cooldown, weak areas get more reps,
   six unlock tiers) is his paid product and it is currently offline. Our routine + per-exercise scores
   already hold the data to do this for free.
3. **Lexicon.** 200 `DefinedTerm` pages is the cheapest breadth we can add and the thing he ranks for.
4. **Interval / pitch-matching / sight-reading trainers** as adjacency tools (ear-training slot where tonedear
   gets 1 citation because it has no text).
5. **Teacher/studio tier** as a validated monetization direction (his Terms already define "Studio features"
   and "advanced reporting"): a teacher assigns routines and sees student scores.
6. **Podcast** purely as a link engine if we ever want DR from directories.
7. **Anti-patterns to keep avoiding:** settings-first modals, jargon tabs, exercises that end without a score,
   a drone under the melody.

## Part 2. Aggregators as citation brokers

ChatGPT citations per aggregator (Ahrefs, all pages):

| Aggregator | DR | ChatGPT cites / pages | Perplexity | Lists what | How to get in |
|---|---|---|---|---|---|
| **alternativeto.net** | 88 | **5,977 / 6,011** | 2,211 | software and web apps, "X alternative" pages | Self-serve: sign up, "Suggest new application", approved in 1-2 days. List Vocal Habit as a web app; it then appears as an alternative to Singing Carrots, Yousician, Vocal Pitch Monitor, Sing Sharp. |
| **classcentral.com** | 78 | **3,584 / 2,253** | 1,426 | courses (auto-ingests Coursera/edX/etc.; also YouTube playlists and independent providers) | No form. Help center: "If you believe your courses should be in Class Central's catalog, please contact us" (classcentral.com/contact, contact@classcentral.com). Rankings are Bayesian averages of learner reviews; their "Best free singing course" article is what ChatGPT quotes. |
| **producthunt.com** | 91 | 2,348 / 2,053 | 2,257 | product launches | Launch. Links are nofollow (Ahrefs: 3 links to Singing Carrots, 0 dofollow). |
| openculture.com | 78 | 410 / 245 | 584 | free university courses, editorial | Email mail@openculture.com / contact page; they say they review suggestions. University-heavy, low odds. |
| alison.com | | 201 | 665 | its own courses | Not an aggregator; skip. |
| coursesity.com | | 13 | 302 | course search engine | Perplexity cites it, ChatGPT barely. Low priority. |
| mooc-list.com | | 5 | 6 | MOOCs | Skip. |

**They do not build DR.** Class Central course pages contain **no external link to the provider** (the
"Go to class" button routes through classcentral.com), so a listing is not a backlink. Ahrefs shows **zero**
referring links from Class Central, AlternativeTo, Product Hunt or Open Culture to Hoffman Academy, Justin
Guitar or Monkeytype, and Product Hunt's links to Singing Carrots are nofollow. Treat aggregators as
AI-visibility and referral plays only.

**Where DR actually comes from in this category** (Singing Carrots' followed links, DR ≥ 40): rutgers.edu (4),
backstage.com (2), sweetwater.com (2), makeuseof.com (2), indiehackers.com (10), starterstory.com (74),
f6s.com (3), lalal.ai (2), carrd.co, framer.app, github.io (14), and **grokipedia.com (744 dofollow)**. So:
one .edu music-department resource page, one music-retailer blog, one performing-arts trade site, one
tech-listicle, founder-story sites, and being cited as a source by an AI encyclopedia. VoSci's DR came from
podcast directories. Neither came from course aggregators.

## Part 3. What to do, in order

1. **AlternativeTo** (30 min, self-serve): create the listing today. Highest-cited broker, zero gatekeeping.
2. **Class Central** (half a day): package the Learn library + default routine as a named free course with a
   syllabus page ("Learn to Sing: a free 4-week beginner course"), then email contact@classcentral.com asking
   to be listed as an independent provider. Optionally publish the same syllabus as a YouTube playlist so it
   also qualifies through their YouTube-provider path. Ask finishing users for a Class Central review (their
   rankings are review-driven and the ranking article is what ChatGPT reads).
3. **Product Hunt** launch when the range test + routine are demo-ready (nofollow, but 2,348 ChatGPT cites).
4. **Open Culture** email (10 min, low odds).
5. **For DR, separately:** .edu resource pages, Sweetwater/Backstage-style editorial, founder-story sites
   (Starter Story, Indie Hackers), and a podcast if we ever want the directory links.
