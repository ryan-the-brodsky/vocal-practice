# Why singing worked for ChatGPT citations, and how to find the next niche

**Date:** 2026-08-27. **Data:** Ahrefs API v3 (`site-explorer-ai-responses-count`, `batch-analysis`,
`keywords-explorer-overview`, US), Bing Webmaster Tools AI Performance (from `analytics/findings-log.md`),
Ahrefs Web Analytics projects 10013070 (vocalhabit) and 10246330 (gradical).

## 1. The anomaly, in numbers

ChatGPT citations do not track Domain Rating or organic traffic. They track whether a site is a
plausible member of the short list ChatGPT builds when someone asks "how do I learn X (for free / by myself)".

| Site | Niche | DR | Organic visits/mo | ChatGPT cites / pages | All-platform cites |
|---|---|---|---|---|---|
| **vocalhabit.com** | singing, free tool + library | **0** | 0 | **33 / 4** | 38 |
| singingcarrots.com | singing, free tool + library | 36 | 36k | 96 / 88 | 1,344 |
| 30daysinger.com | singing, paid course | 46 | 38k | 32 / 53 | 1,582 |
| ramseyvoice.com | singing, content only | 46 | 9.6k | 17 / 8 | 776 |
| singwise.com | singing, content only | 37 | 2.4k | 17 / 8 | 302 |
| tonegym.co | ear training tool | 47 | 74k | 15 / 9 | 1,350 |
| tonedear.com | ear training tool, no text | 50 | 16k | 1 / 1 | 108 |
| musictheory.net | theory tool | 76 | 604k | 22 / 27 | 1,700 |
| teoria.com | theory tool + text | 67 | 28k | 21 / 16 | 1,070 |
| musicca.com | theory tool + text | 64 | 1.9M | 494 / 402 | 23,206 |
| keybr.com | typing tool | 71 | 467k | 36 / 1 | 252 |
| monkeytype.com | typing tool | 75 | 3.5M | 48 / 23 | 520 |
| humanbenchmark.com | reaction/memory tests, no text | 67 | 572k | 6 / 13 | 727 |
| drawabox.com | drawing, free course | 58 | 23k | 24 / 54 | 482 |
| justinguitar.com | guitar, free course | 70 | 355k | 115 / 123 | 7,499 |
| hoffmanacademy.com | piano, free-tier course | 58 | 233k | 105 / 55 | 13,938 |
| pianote.com | piano, paid | 54 | 92k | 305 / 168 | 5,214 |
| drumeo.com | drums, paid | 62 | 53k | 169 / 165 | 4,255 |
| languagetransfer.org | language, free audio course | 55 | 4.6k | 33 / 15 | 94 |
| elsaspeak.com | pronunciation app | 72 | 1.3M | 1,485 / 1,320 | 33,949 |
| boldvoice.com | accent app | 53 | 22k | 64 / 58 | 1,121 |
| youglish.com | pronunciation tool | 72 | 245k | 19 / 11 | 28,810 |
| orai.com | public speaking app | 47 | 33k | 38 / 34 | 523 |
| yoodli.ai | public speaking AI | 67 | 20k | 9 / 25 | 348 |
| virtualspeech.com | public speaking courses | 72 | 40k | 17 / 9 | 2,684 |
| artofmemory.com | memory training | 61 | 30k | 52 / 43 | 1,326 |
| spreeder.com | speed reading tool | 57 | 11k | 5 / 16 | 152 |
| sightreadingfactory.com | sight reading tool | 59 | 12k | 6 / 14 | 61 |
| jperm.net | cubing, free tutorials | 40 | 11k | 28 / 13 | 375 |
| steezy.co | dance, paid | 60 | 41k | 32 / 38 | 2,091 |
| exercism.org | coding, free | 76 | 16k | 28 / 18 | 829 |
| lichess.org | chess, free | 84 | 2.3M | 199 / 238 | 4,383 |
| **gradical.app** | college credit planning | **0** | 0 | **0** | 0 |
| assist.org | CA articulation (official) | 61 | 35k | **0** | 55 |
| transferology.com | credit transfer tool | 61 | 11k | **0** | 54 |
| modernstates.org | free CLEP prep | 60 | 8.6k | 5 / 5 | 411 |
| lcwo.net | morse code tool | 59 | 0.2k | 2 / 2 | 23 |
| humanbeatbox.com | beatbox community | 35 | 0 | 0 | 5 |

Read-outs:

- **Vocal Habit at DR 0 is cited by ChatGPT as often as DR 45-70 sites** (30 Day Singer 32, keybr 36,
  Orai 38, languagetransfer 33, exercism 28, drawabox 24). Within its own niche it out-cites the two
  content-only singing sites (17 each) and sits at a third of the category leader.
- **Tool-only sites barely get cited by ChatGPT no matter how big they are.** Tonedear (DR 50) 1,
  humanbenchmark (DR 67, 572k visits) 6, sightreadingfactory 6, spreeder 5, keybr 36 but all on one page.
  ChatGPT cites *text that answers a learner's question*; the tool makes the site worth listing, the
  library is what gets quoted.
- **Tool + library is the cited shape in every niche:** Singing Carrots 96, Hoffman 105, Justin Guitar
  115, musicca 494, Elsa 1,485. Ryan's playbook (free tool + fact-checked library) is exactly this shape.
- **The college-transfer niche has almost no ChatGPT citation surface at any authority level.** assist.org
  (the official CA source, DR 61) gets 0. transferology 0. Modern States 5. Gradical's zero after 13 days
  is expected (Bing has indexed 0 pages yet), but even a mature Gradical is fishing in a pond where the
  official sources catch nothing. That is a niche-structure problem, not an execution problem.

## 2. What the grounding queries say

Bing Webmaster Tools AI Performance for vocalhabit.com (3 months, 277 citations): the top grounding
queries are **"learn to sing online free" (44, 23.7%)**, "best free online singing course" (20), "free
singing lessons for beginners" (19), "learn to sing" (8). Top cited page is the `/learn/` hub (124), then
`/learn/sovt-exercises` (40), `/` (21), two artist spotlights.

Now the Google volume for those same phrases (US): "learn to sing online free" **30/mo**, "free singing
lessons" 350, "how to learn to sing by yourself" 30. The phrasing that earns the citations is nearly
invisible in keyword tools. People type "vocal warm ups" into Google (5,300/mo) and ask ChatGPT "how can I
learn to sing for free by myself". **The demand the playbook captured is chat-native and does not show up
in Ahrefs volume.** Keyword research would have told us not to bother, and it would have been wrong.

## 3. The profile of a niche that behaves like singing

Eight traits. Singing scores on all eight; Gradical on two.

| # | Trait | Singing | Gradical |
|---|---|---|---|
| 1 | **Question class is "recommend me a way to learn X"**, not "look up a fact". Answer = a short list of resources; a legitimate free entrant makes the list without being the authority. | yes | no: "does this course transfer", "fastest path to a degree" are facts owned by institutions |
| 2 | **Default alternative is paid** (lessons $50-100/hr, subscription apps), so "free" / "by myself" is baked into the question and the pool of good-and-free is thin. | yes | weak: counselors are free, the info is public |
| 3 | **Open text web is thin**; instruction lives on YouTube and in apps. Category leader is DR 36-47. | yes | no: .edu, assist.org, College Board, Reddit |
| 4 | **Private / identity questions** ("can adults learn", "am I tone deaf", "why does my voice crack") that people ask a chatbot rather than a forum. | yes | no: bureaucratic, not shameful |
| 5 | **A browser sensor makes a free tool a credible substitute for the paid thing** (mic + pitch = the feedback a teacher sells). | yes | partial: a planner is a calculator, not a mirror |
| 6 | **Not YMYL, not jurisdictional, universal, evergreen.** No official body owns the answer, so the model has no reason to prefer an institution. | yes | no: money, state-specific, institutional |
| 7 | **Real science exists but is unpopularized** (voice science, J. Voice), so a sourced article beats the bro-science web for "why" questions. `sovt-exercises` = 40 cites. | yes | partial: policy is documented, not science |
| 8 | **Daily-practice habit** gives the tool a reason to be returned to. | yes | no: a plan is made once |

The mechanism in one line: **be the free, real-HTML, sourced answer in a niche where the question is a
recommendation request and the incumbents are videos and paywalls.**

Two infrastructure facts make the DR-0 part possible: ChatGPT and Copilot retrieve through Bing, which
weights authority far less than Google, and the site ships real static HTML with self-sourcing prose (see
the vocalhabit playbook memory). Neither is niche-specific; both are table stakes.

## 4. Scoring candidate niches

Score 0-2 per trait (max 16). Demand column = the best US Google phrase found; treat it as a floor, since
chat-native phrasing is undercounted (§2). ChatGPT-cite figures are the incumbents from §1.

| Niche | Tool (browser sensor) | Incumbents + ChatGPT cites | Demand signal | Score | Notes |
|---|---|---|---|---|---|
| **Speaking voice / public speaking** (filler words, pace, monotone, projection) | mic: WPM, pause length, pitch variance (reuse `lib/pitch`), Web Speech API for "um" count | Orai 38 (DR 47), Yoodli 9 (DR 67), VirtualSpeech 17, Toastmasters (in-person) | "how to improve public speaking" 2,400/mo **KD 2**, TP 202k; "how to stop saying um" 500 KD 0 | **15** | Closest replica. Paid default (coaches, Yoodli), shame-heavy, non-YMYL, speech science unpopularized, daily drills plausible. Tech is 70% Vocal Habit already. |
| **English pronunciation / accent** | mic: minimal-pair listening test (trivial), vowel formants, intonation contour, rhythm | Elsa 1,485, BoldVoice 64, YouGlish 19: dense, app-heavy | Google phrases near 0 ("free pronunciation practice" 0) yet Elsa has 34k AI cites: pure chat-native demand | **13** | Biggest chat market of the set, global audience. Harder scoring tech; incumbents already well-cited so slots are contested. Good second bet. |
| **Vocal Habit adjacencies** (tone-deaf test, whistle trainer, rhythm tap test, trans voice / pitch+resonance) | already built | tonedear 1 (tool-only), no text incumbents | "am i tone deaf test" 20, "learn to whistle" 100 KD 0 TP 4k, "voice feminization training" 100 KD 1 TP 1.7k, "how to improve rhythm" 50 KD 0 | **14** | Not new niches: new pages in the proven one. Cheapest citations available. Trans voice is high-fit technically and very chat-private; it is Ryan's call on brand scope. |
| **Reading speed** | timer test in-browser (trivial) | spreeder 5 (DR 57) | "reading speed test" 5,600 KD 33, "speed reading test" 1,900 KD 14 | **10** | Honest content says speed reading mostly fails (great "surfaces disagreement" material) but that undercuts the product. Better as reading-habit than speed. |
| **Piano self-teach** (melody note detection) | mic: monophonic note detection works today; no polyphony | Hoffman 105 (free tier), Pianote 305, musicca 494 | "how to learn piano by yourself" 700 **KD 1** | **10** | Dense citation niche but a strong *free* incumbent exists (Hoffman), which singing lacked. |
| **Handwriting** | camera/upload only | none strong | "how to improve handwriting" 3,000 KD 5 | **8** | No live sensor, no daily loop. Content-only play. |
| **Memory / mnemonics** | in-browser tests | artofmemory 52 (DR 61) | "memory training free" 20 | **8** | Incumbent already does tool + library well. |
| Typing, drawing, chess, guitar, coding | | keybr/monkeytype, drawabox, lichess, justinguitar, exercism | | 5-7 | Free incumbents already own the list. Do not enter. |
| Breathing, stuttering, voice disorders, anxiety | mic | | | skip | YMYL; the model prefers clinical sources. |

Recommendation: **speaking voice is the replication bet** (new brand or a Vocal Habit sibling; same
engine, same content pipeline, same static-export stack). **Pronunciation is the bigger, harder second.**
Before either, the adjacency pages are near-free citations inside the niche already proven.

## 5. What this means for Gradical

Gradical is 13 days old with 0 Bing-indexed pages, so its zero is not yet evidence of anything. But the
niche profile predicts a low ceiling for the *ChatGPT recommendation* mechanism specifically:

- The official sources get 0 ChatGPT citations. The model answers transfer questions from parametric
  knowledge or .edu pages; there is no "list of free resources" slot to occupy.
- Where the niche *does* behave like singing is CLEP: "can you test out of college classes", "easiest CLEP
  exams" are learning-journey questions with a paid default (tuition) and a free-resource slot (Modern
  States, 411 all-platform cites, though only 5 on ChatGPT; its citations come from Perplexity/AI Overviews).
  That suggests the LLM channel for Gradical may be Perplexity and Google AI Overviews rather than ChatGPT,
  which changes what to measure (Ahrefs `ai-responses-count` per platform, not Bing AI Performance).
- Concrete: keep hammering, but judge by the right dashboard, and lean the content toward questions that
  have a recommendation-shaped answer ("free tools to plan a transfer", "free CLEP study resources", "how
  to graduate faster: a checklist") rather than fact lookups the institutions own.

## 6. Repeatable profiling procedure (what was run here)

1. List 5-8 incumbents in the candidate niche (leader, paid app, content-only blog, tool-only site).
2. `batch-analysis` for DR + organic traffic; `site-explorer-ai-responses-count` per domain (~90 units each).
3. Look for: (a) leader DR under ~50, (b) a low-DR site with real ChatGPT citations, (c) tool-only sites
   with near-zero citations (means text is what wins, so the library play has room), (d) paid incumbents
   being cited (means the free slot is open).
4. `keywords-explorer-overview` on "learn X free / by yourself / am I" phrases: low Google volume with
   high incumbent citation counts = chat-native demand the SEO crowd has not built for.
5. Score against the eight traits in §3. Anything under 11 is a content play at best, not a product.
6. After launch, BWT AI Performance (ChatGPT/Copilot path) plus Ahrefs per-platform counts weekly.

Cost of this run: ~5,800 Ahrefs units of the 100k/mo Lite plan.

---

## 7. Broad sweep (2026-08-27, same day): 52 more domains across non-music "learn to X" niches

Ryan's correction: music was a coincidence of personal interest, not a property of the profile. This section
re-tests the profile against body skills, communication, gaming, cognition, crafts, scripts, perception, life
skills, and one control with no science (tarot).

### 7a. The data

Sorted by the thing we care about: ChatGPT citations at low DR.

| Niche | Domain | DR | Organic/mo | ChatGPT cites / pages | All-platform |
|---|---|---|---|---|---|
| **Hand lettering / calligraphy** | lettering-daily.com | **45** | 23k | **415 / 65** | 1,739 |
| Hand lettering / calligraphy | thepostmansknock.com | 58 | 28k | 90 / 66 | 2,511 |
| **Aim training (gaming)** | kovaaks.com | **30** | 32k | **48 / 27** | 175 |
| Aim training | 3daimtrainer.com | 43 | 248k | 40 / 25 | 887 |
| Aim training | aimlab.gg (app landing) | 54 | 0.9k | 11 / 3 | 39 |
| **Skateboarding** | brailleskateboarding.com | **39** | 3.3k | **44 / 26** | 297 |
| **Adult swimming** | myswimpro.com | 55 | 13k | 36 / 12 | 1,153 |
| Adult swimming | totalimmersion.net | 52 | 0.9k | 0 | 50 |
| **Lucid dreaming** | world-of-lucid-dreaming.com | 50 | 1.5k | 19 / 6 | 165 |
| Lucid dreaming | dreamviews.com (forum) | 52 | 0 | 0 | 1 |
| ASL | startasl.com | 57 | 29k | 37 / 33 | 1,041 |
| ASL | handspeak.com | 63 | 312k | 357 / 281 | 8,618 |
| ASL | lifeprint.com | 70 | 465k | 211 / 174 | 10,624 |
| Social skills | socialself.com | 55 | 112k | 217 / 136 | 7,994 |
| Social skills | scienceofpeople.com | 77 | 91k | 1,765 / 444 | 4,974 |
| Social skills | succeedsocially.com | 50 | 31k | 7 / 7 | 1,651 |
| Social skills | improveyoursocialskills.com | 54 | 0.7k | 0 | 33 |
| Voice acting | voices.com (marketplace) | 79 | 136k | 298 / 262 | 5,177 |
| Voice acting | gravyforthebrain.com | 65 | 1.2k | 8 / 8 | 220 |
| Negotiation | blackswanltd.com | 67 | 5.3k | 44 / 39 | 390 |
| Writing (tool + text) | hemingwayapp.com | 85 | 85k | 118 / 59 | 1,434 |
| Drawing | proko.com | 70 | 11k | 172 / 156 | 714 |
| Yoga | doyogawithme.com | 70 | 24k | 37 / 16 | 1,084 |
| Running | runnersconnect.net | 64 | 22k | 90 / 45 | 4,042 |
| Flexibility | pliability.com | 64 | 55k | 35 / 38 | 4,170 |
| Flexibility | stretchitapp.com | 35 | 1k | 8 / 11 | 86 |
| Calisthenics | gmb.io | 60 | 53k | 19 / 20 | 1,453 |
| Calisthenics | thenx.com | 43 | 10k | 14 / 25 | 120 |
| Calisthenics | hybridcalisthenics.com | 39 | 42k | 7 / 3 | 403 |
| Calisthenics | calimove.com | 37 | 4.6k | 3 / 3 | 187 |
| Meditation | insighttimer.com | 86 | 334k | 209 / 244 | 11,907 |
| Meditation | mindful.org | 84 | 430k | 135 / 99 | 4,547 |
| Study skills | learningscientists.org | 71 | 11k | 24 / 24 | 447 |
| Study skills | scotthyoung.com | 73 | 105k | 15 / 23 | 1,882 |
| Job interviews | biginterview.com | 70 | 44k | 12 / 20 | 1,074 |
| Mental math | zetamac.com (tool only) | 49 | 11k | 0 | 58 |
| Math | mathsisfun.com | 80 | 1.5M | 7,801 / 1,287 | 35,183 |
| Japanese | tofugu.com | 73 | 94k | 1,751 / 321 | 7,384 |
| Korean | howtostudykorean.com | 52 | 54k | 16 / 9 | 1,137 |
| Tarot (no-science control) | labyrinthos.co (free app + text) | 64 | 3.5M | 111 / 67 | 9,614 |
| Tarot | biddytarot.com | 71 | 742k | 161 / 88 | 2,875 |
| Wine | winefolly.com | 78 | 262k | 7,555 / 1,400 | 35,052 |
| Go | online-go.com | 69 | 55k | 19 / 27 | 316 |
| Magic | ellusionist.com | 62 | 4.6k | 7 / 11 | 105 |
| Lipreading | lipreading.org | 30 | 0.5k | 2 / 3 | 35 |
| Singing (added) | yousician.com | 71 | 86k | 337 / 230 | 7,269 |
| Singing (added) | singingsuccess.com | 44 | 14k | 7 / 6 | 715 |
| Singing (added) | singsharp.com | 26 | 0.1k | 5 / 4 | 15 |

Google floor for the chat-native phrasings (US volume / KD): how to sing 107k/16 · how to juggle 46k/3 ·
how to learn to draw 45k/3 · how to whistle **27k/0** · how to lucid dream 15k/40 · how to roll your rs
**10k/0** · how to learn calligraphy **9.1k/4** · how to improve reaction time 6.7k/0 · how to become a voice
actor **5.8k/0** · how to do the splits 5.1k/15 · how to do a handstand 4.3k/18 · how to make your voice
deeper **4.2k/1** · how to write better 3.5k/2 · how to learn asl 2.6k/68 · how to make small talk 2.3k/11 ·
how to become flexible 1.2k/0 · how to touch your toes 600/0 · how to be funnier 500/0 · how to improve social
skills 500/23 · how to speak clearly 250/1 · how to stop mumbling 250/0 · learn to swim as an adult 200/1 ·
how to learn to skateboard 200/1 · how to do mental math 150/1 · how to improve aim **70/0** (yet Kovaak's
gets 48 cites at DR 30).

### 7b. What the wide net changes about the profile

The eight traits survive, but the sweep shows which ones actually separate "cited at low DR" from "not cited
at any DR". Two are load-bearing; the rest are product traits, not citation traits.

**Load-bearing trait A: the model searches instead of answering.** For fitness (pull-ups, handstands,
flexibility), study skills, meditation, interviews, the model has textbook knowledge and answers from memory.
Incumbents at DR 60-73 get 3-24 ChatGPT citations. For singing, lettering, aim, skateboarding, swimming,
lucid dreaming, social skills, voice acting, the model goes to Bing and builds a list, and it cites small
sites doing it. The difference is not topic size. It is whether the honest answer is "here are resources
and a method I am not confident about" versus "here are the five steps everyone knows". Practical test:
low-DR incumbents with real ChatGPT citations exist in the niche (Kovaak's DR 30, Braille DR 39,
Lettering Daily DR 45, Vocal Habit DR 0). If every cited site in the niche is DR 70+, the model is treating
the niche as authority-owned.

**Load-bearing trait B: instruction is video-native, so the text web is thin.** Every low-DR winner is a
YouTube-taught skill: singing, lettering, skateboarding, swimming, aim, calligraphy. The text pages that
exist get in because there are so few of them. Counter-examples: social skills and study skills are
text-native (thousands of listicles), and citations there go to DR 70+ text incumbents only.

**Confirmed again: tool-only is never cited.** zetamac 0, aimlab landing 11, totalimmersion 0, tonedear 1,
dreamviews (forum) 0. The tool earns the resource-list slot only when a text library sits next to it.

**Confirmed again: Google volume is a bad proxy.** "how to improve aim" is 70 searches/mo on Google; two
aim-trainer sites at DR 30-43 collect 88 ChatGPT citations between them. Gamers ask the chatbot.

**Two distinct citation mechanisms, both open to a new site:**
1. *Resource-list slot*: "best free way to learn X" → the hub page is cited as a resource. This is where
   Vocal Habit's 33 come from (the `/learn/` hub, grounding query "learn to sing online free"). Needs: free,
   a real tool, real HTML, the words "free" and "beginner" on the page.
2. *Method slot*: "how do I do X" → a specific guide is cited. This is Lettering Daily's 415 (65 pages) and
   Singing Carrots' 96 (88 pages). Needs: many question-titled guides. Vocal Habit has 4 cited pages; the
   library breadth is the gap, which matches the title/framing audit already queued in `analytics/HANDOFF.md`.

Nice-to-have (product, retention, defensibility, not citations): browser sensor, daily habit, unpopularized
science. Tarot proves it: no science at all, and labyrinthos.co (free app + text) still gets 111 ChatGPT cites
and 3.5M organic visits. Science is what makes the *content* defensible and worth returning to; it is not
what gets the first citation.

### 7c. Re-ranked candidates (all niches, both sweeps)

Score is the 8 traits again (0-2 each), with A and B now required (a niche failing either is capped at 8).

| Rank | Niche | A: model searches? | B: video-native? | Sensor tool | Paid default | Best floor phrase | Score | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | **Speaking voice cluster**: public speaking, deeper voice, speak clearly / stop mumbling, filler words, voice acting | yes (Orai 38 @47, voices.com 298, gravyforthebrain only 8 @65) | yes | mic: pitch, variance, RMS, pace, pauses, Web Speech for "um" | coaches, demo reels, Yoodli | "how to become a voice actor" 5.8k KD 0; "how to make your voice deeper" 4.2k KD 1; "how to improve public speaking" 2.4k KD 2 | **16** | Build. Same engine, same pipeline, same stack. |
| 2 | **Aim / mouse skill (gaming)** | yes (Kovaak's 48 @DR 30) | yes | mouse: flick/track/reaction canvas, trivial | Kovaak's, coaching | "how to improve reaction time" 6.7k KD 0 | **14** | Structurally excellent; audience is young and not Ryan's. Decide on taste, not data. |
| 3 | **Hand lettering / calligraphy / handwriting** | yes (Lettering Daily 415 @DR 45, the biggest low-DR outlier found) | yes | stylus/touch canvas stroke drills, or camera upload; weaker than mic | Skillshare, kits, courses | "how to learn calligraphy" 9.1k KD 4; "how to improve handwriting" 3k KD 5 | **13** | Content is the strongest of any candidate; tool is the weakest. |
| 4 | **Vocal Habit adjacency pages** (whistle, roll your Rs, deeper voice, tone-deaf test, trans voice) | proven | yes | already built | | "how to whistle" **27k KD 0**; "how to roll your rs" **10k KD 0**; "voice feminization training" KD 1 | **14** | Cheapest citations available; ship before any new brand. "Deeper voice" is also the bridge to #1. |
| 5 | **Adult learning to swim** | yes (MySwimPro 36 @55) | yes | none (progression checklist, fear self-assessment) | lessons | "learn to swim as an adult" 200 KD 1, TP 2.2k | 11 | Content-first play; extreme shame makes it chat-private. |
| 6 | **Lucid dreaming** | yes (WoLD 19 @DR 50 on 1.5k visits) | partly | dream journal + reality-check scheduler (daily habit) | apps, courses | "how to lucid dream" 15k KD 40 | 11 | Real unpopularized science; sleep-adjacent, so keep it non-clinical. |
| 7 | **English pronunciation / accent** | yes (Elsa 1,485, BoldVoice 64 @53) | yes | mic: minimal pairs, intonation, rhythm | apps | chat-native; Google ~0 | 13 | Biggest market, hardest tech, contested slots. Second product after #1. |
| 8 | Skateboarding (adult beginners) | yes (Braille 44 @39) | yes | none | lessons | 200 KD 1 | 9 | Content only. |
| 9 | Social skills / conversation | yes but text-native (SoP 1,765 @77) | no | LLM roleplay (not free-static) | coaches | "how to be funnier" 500 KD 0 TP 3.7k | 8 | Fails B. |
| 10 | Writing / readability | text-native | no | readability analyzer | | "how to write better" 3.5k KD 2 | 8 | Fails B; Hemingway owns tool + text. |
| - | Fitness (pull-up, handstand, splits, flexibility), meditation, study skills, interviews | **no**: model answers from memory; incumbents at DR 60-73 get 3-24 cites | | | | big Google volume, misleading | capped 8 | Skip for this playbook regardless of demand. |
| - | ASL, drawing, Japanese, math, wine, tarot | searches, but DR 63-80 free incumbents own the list | | | | | skip | |
| - | Magic, Go, lipreading, morse, beatbox | dead on ChatGPT | | | | | skip | |

### 7d. The one-paragraph answer to "what did we chance upon"

Singing is a skill people are ashamed to be bad at, learn from videos, and would otherwise pay a teacher for.
When someone asks ChatGPT how to learn it for free, the model does not trust its own answer, so it searches
Bing for "free singing lessons for beginners" and assembles a short list from a thin text web whose leader
is DR 36. A free real tool with a real HTML library was a legitimate entry on that list on day one. Music
had nothing to do with it. Lettering, aim training, skateboarding, adult swimming, and the speaking voice
show the same signature, and fitness, study skills, and meditation, despite far larger demand, do not.

Cumulative Ahrefs spend for both sweeps: ~12,500 units of 100k.
