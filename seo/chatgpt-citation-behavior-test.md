# ChatGPT citation-behavior test: which "how to learn X" questions trigger search + citations?

**Purpose.** Trait A in `seo/niche-replication-profile-2026-08.md` (§7b) says a niche is winnable for the
free-tool + library playbook only when ChatGPT *searches and cites* rather than answering from memory. We
inferred that from Ahrefs citation counts on incumbents. This test measures it directly on the model, per
question, so the niche ranking rests on observed behavior instead of inference.

**Status:** protocol written 2026-08-27. Pilot: see §7 log at the bottom.

## 1. Hypotheses

- H1. For a fixed niche, the phrasing decides whether the model searches. "Free / best way / resources"
  phrasings trigger search; bare "how do I" phrasings often do not.
- H2. For a fixed phrasing, niches split cleanly: some are answered from memory (fitness, study skills,
  meditation), some always searched (singing, lettering, aim, swimming).
- H3. When the model searches, the cited set includes sub-DR-50 domains in trait-A niches and only DR-70+
  domains in authority-owned niches.
- H4. YouTube and Reddit take a large share of citations in video-native niches; the remaining text slots
  are few, which is why a new text site gets in.

## 2. Design

Two factors: **niche** (25) × **phrasing** (4) = 100 prompts. Each prompt runs in a fresh Temporary Chat
(no memory, no prior turns), one prompt per chat, no follow-ups. Default model, search left on "auto"
(never force the Search button; the point is whether the model chooses to search).

**Phrasing templates** (X = the skill, in the wording a beginner would use):
- P1 bare: "How do I learn to X?"
- P2 free: "What's the best free way to learn to X online?"
- P3 identity: "Can an adult beginner learn to X, and how would I start?"
- P4 problem: a niche-specific pain question (see bank) e.g. "Why does my voice crack when I sing?"

**Niches** (with controls marked):
| id | X | P4 problem question | Expected (from Ahrefs) |
|---|---|---|---|
| sing | sing | Why does my voice crack when I sing? | searched, cites small sites (control: positive) |
| speak | speak with more confidence / public speaking | How do I stop saying um when I talk? | searched |
| voice-deep | make my voice deeper | Why does my voice sound nasal and thin? | unknown |
| voice-act | become a voice actor | Do I have a good enough voice for voice acting? | searched |
| pronounce | improve my English pronunciation | Why can't people understand my accent? | searched, apps cited |
| whistle | whistle | Why can't I whistle no matter how hard I try? | unknown |
| rollr | roll my Rs | Why can't I roll my Rs? | unknown |
| aim | improve my aim in FPS games | Why is my aim so inconsistent? | searched, small sites |
| letter | do hand lettering / calligraphy | Why does my handwriting look so ugly? | searched, small sites |
| swim | swim as an adult | I'm scared of water, can I still learn to swim at 35? | searched |
| skate | skateboard as an adult | Am I too old to learn to skateboard at 30? | searched |
| lucid | lucid dream | Why can't I remember my dreams? | searched |
| pullup | do a pull-up | Why can't I do a single pull-up? | answered from memory (control: negative) |
| splits | do the splits / get flexible | Why am I so inflexible? | answered from memory |
| meditate | meditate | Why can't I stop thinking when I meditate? | answered from memory |
| study | study effectively | Why do I forget everything I study? | answered from memory |
| interview | do well in job interviews | Why do I freeze up in interviews? | answered from memory |
| social | make small talk / be better in conversation | Why am I so awkward in conversations? | searched, DR70+ only |
| draw | draw | Why do my drawings look flat? | searched, DR70+ only |
| piano | play piano by myself | Can I learn piano without a teacher? | searched, DR55+ |
| guitar | play guitar | Why do my fingers hurt playing guitar? | searched, justinguitar |
| type | type faster | Why is my typing so slow? | searched, tool sites |
| juggle | juggle | Why do I keep dropping the third ball? | unknown |
| japanese | learn Japanese | Should I learn kanji first or grammar first? | searched, DR70+ |
| transfer | transfer community college credits to a university (Gradical control) | Will my community college classes transfer? | unknown; expected parametric or .edu |

## 3. Harvest schema (one row per prompt)

```
prompt_id        sing-P2
niche            sing
phrasing         P2
prompt_text      "What's the best free way to learn to sing online?"
model            (as shown in the UI, e.g. "GPT-5")
searched         yes | no          (UI shows "Searching the web" / a Sources button)
n_citations      integer            (distinct URLs in the Sources panel)
cited_urls       list
cited_domains    list (deduped)
answer_shape     resources | steps | both
mentions_youtube yes | no
mentions_reddit  yes | no
named_products   list (apps/courses named in prose even without a link)
answer_text      full text (for later qualitative coding)
timestamp        ISO
```

Post-processing: `batch-analysis` on all cited domains → DR per domain → per niche compute search rate,
median citations, min DR cited, share of cited domains with DR < 50, YouTube/Reddit share.

## 4. Two execution paths

**Path 1: programmatic (recommended first).** OpenAI Responses API with the `web_search` tool, `tool_choice:
"auto"`, temperature default, one call per prompt. Record whether a `web_search_call` item appears in the
output and harvest `url_citation` annotations. Fully reproducible, ~100 calls, cost in cents, no clicking.
Caveat: API search behavior is a proxy for the consumer app; validate with Path 2 on ~15 prompts.

**Path 2: consumer app (ground truth).** chatgpt.com in Chrome via claude-in-chrome, or the desktop app via a
computer-use agent (Codex). Temporary Chat per prompt, wait for completion, open Sources, copy the list.
Manual-speed: ~1 min per prompt. Use it to validate Path 1 and for the top 15 niche×phrasing cells.
Rate limits and UI changes make this the fragile path; don't run all 100 here first.

## 5. Practical filter: can the niche have a free automated tool, or does it need AI coaching?

Marginal cost per user session decides whether "free" is sustainable:

| Feedback type | Marginal cost | Examples | Freemium shape |
|---|---|---|---|
| Deterministic, in-browser | ~zero | pitch detection, RMS, pace/WPM, reaction/flick timing, tap-rhythm, stroke smoothness on a canvas, timers, spaced repetition | Free forever; monetize with optional depth (history, plans) |
| Browser-side ASR | ~zero | Web Speech API for filler-word counts and pace | Free, with accuracy caveats |
| Cloud ASR / phoneme scoring | cents per minute | pronunciation scoring, transcript-quality speech analysis | Free daily quota, paid unlimited |
| LLM feedback on a transcript or artifact | cents per call, falling | "coach my 60-second speech", critique a lettering photo, review a dream journal | Free N per day, paid beyond; cache prompts |
| Vision model on camera/upload | cents per image | handwriting/lettering critique, form check | Same as above |

Per candidate:
- **Speaking voice**: deterministic core (pitch, variance, RMS, pace, pauses) + browser ASR for fillers = free.
  LLM coaching on the transcript is the paid layer. Best cost profile of the set.
- **Aim / mouse skill**: fully deterministic. Free forever.
- **Lettering / handwriting**: stylus canvas metrics (stroke consistency, spacing) are deterministic but thin;
  the real value is a vision critique = paid layer. Weakest free tool, strongest content.
- **Pronunciation**: minimal-pair listening drills are free; real scoring needs cloud phoneme ASR = paid.
- **Swimming / skateboarding**: no sensor; content + checklists, monetize via nothing or affiliate.
- **Lucid dreaming**: journal + reminders deterministic; LLM dream-journal reflection is the paid layer.

## 6. Does DR come from traffic, or does it require backlinks?

DR is Ahrefs' backlink-only metric: a log-scale function of the number and strength of *followed* linking
domains. Traffic does not move it, content volume does not move it, and time does not move it. Our 435
referring domains are launch-week spam and contribute nothing; Bing Webmaster Tools already flags "not enough
inbound links from high-quality domains".

What that means for us:
- **DR is not required for the LLM channel.** The whole point of the sweep is that ChatGPT cites at DR 0.
- **DR is required for Google organic**, and Google is where the 5,300/mo "vocal warm ups" head terms live.
- Traffic raises DR only indirectly: users and writers who find the tool sometimes link to it. That loop is
  slow and needs linkable assets (the range test, the data-backed articles, an artist-spotlight series).
- Cheap legitimate links in this category: music-education resource pages (.edu music departments keep
  "free tools" lists), tool directories (Product Hunt, AlternativeTo), teacher blogs, Wikipedia external links
  (nofollow, but read by LLMs), podcasts and newsletters covering singing, and answering journalist queries.
  Reddit and YouTube descriptions are nofollow yet matter for the LLM channel as brand mentions.
- Target: DR 20-30 within a year is realistic for a category whose leader is DR 36; that needs roughly
  50-150 real followed domains, not thousands.

## 7. Pilot log

**Pilot run 2026-08-27, 21 prompts, consumer app in Chrome via claude-in-chrome.** Model shown as "Instant"
(GPT-5 Instant), Temporary Chat, search on auto, account location Colorado. One prompt per chat, no follow-ups.
Raw rows: `seo/data/chatgpt-citation-pilot-2026-08-27.jsonl`. n = 1 per cell; treat every cell as a single draw.

| prompt | phrasing | searched | cited domains (DR) |
|---|---|---|---|
| How do I learn to sing? | P1 | **no** | |
| Can an adult beginner learn to sing, and how would I start? | P3 | **no** | |
| Why does my voice crack when I sing? | P4 | **no** | |
| What's the best free way to learn to sing online? | P2 | yes | classcentral (78), 30daysinger (46), youtube |
| free singing lessons for beginners | Q (Bing grounding query) | yes | 30daysinger, classcentral x2 |
| best free online singing course | Q (Bing grounding query) | yes | classcentral x2, **voicescience.org (15)**, **academyofvoice.com (0.6)** |
| How do I learn to do a pull-up? | P1 | **no** | |
| What's the best free way to learn to do a pull-up online? | P2 | yes | **hybridcalisthenics (39)**, nerdfitness (74) |
| How do I get better at public speaking? | P1 | **no** | |
| What's the best free way to get better at public speaking online? | P2 | yes | toastmasters x2, yoodli x2 (notes Yoodli's free tier cap) |
| How do I make my voice deeper? | P1 | **no** | |
| How do I learn to whistle? | P1 | **no** | |
| What's the best free way to learn hand lettering online? | P2 | yes | youtube, tombowusa x3, **thehappyevercrafter (40)** |
| What's the best free way to improve my aim in FPS games? | P2 | weak (1 link) | aimlabs |
| What's the best free way to learn to study effectively online? | P2 | yes | coursera, learningscientists (71) x4 |
| What's the best free way to learn to meditate online? | P2 | yes | uclahealth x2, palousemindfulness (70), insighttimer x2 |
| What's the best free way to learn to lucid dream? | P2 | **no** ("no app or course needed") | |
| What's the best free way to improve my English pronunciation online? | P2 | **no** (offers itself: "practice directly with me for free") | |
| Can an adult beginner learn to swim, and how would I start? | P3 | **no** | |
| What's the best free way to learn to swim as an adult? | P2 | yes | redcross x2 + a map of local pools |
| How do I transfer my community college credits to a university? | P1 (Gradical control) | yes | highered.colorado.gov x3 (location-aware) |

### Findings

1. **Phrasing is the switch, not the niche.** All six "How do I…" prompts, both "Can an adult…" prompts, and the
   "Why does my…" prompt were answered from memory with zero citations, singing included. "Best free way to
   learn X online" searched in 7 of 9 niches; the two search-style queries searched 2 of 2. H1 confirmed
   strongly; H2 (niche decides) is wrong as stated.
2. **Niche decides *whom* it cites once it searches.** Small sites made the list in singing (DR 15 and DR 0.6),
   pull-ups (DR 39), lettering (DR 40). Only authority sites made it in study skills (DR 71), meditation (UCLA,
   DR 70), swimming (Red Cross), college transfer (state government). H3 holds as a niche property.
3. **The Ahrefs trait-A inference was half right.** Fitness incumbents' low citation counts reflect that most
   fitness questions are phrased "how do I", which never searches; when a user says "free... online" the model
   does search and does cite a DR-39 site. So the real filter is: what share of a niche's questions are
   *resource-seeking* ("free", "course", "lessons", "best way", "online") rather than *method-seeking*. Singing's
   share is high because the default answer to "how do I sing" in the culture is "get lessons" (i.e. a resource).
4. **The model refuses to search where it believes no resource is needed** (lucid dreaming: "you don't need an
   app, supplement, mask, or paid course") **or where it can be the tool itself** (pronunciation: "practice
   directly with me for free"). Any niche whose feedback loop is text-only is exposed to the second one; a
   sensor-based tool (mic pitch, mouse timing) is what the model cannot substitute. This is a stronger version
   of the "browser sensor" trait than the earlier ranking gave it.
5. **Class Central is a citation broker.** It was cited 4 times across two singing prompts as the ranker of
   "best free singing course", and it lists YouTube curricula. Getting Vocal Habit onto Class Central (and
   similar course aggregators) is the cheapest concrete citation lever found today.
6. **Vocal Habit was not in the list in any of the three singing resource prompts** (n = 3). Bing's 277 citations
   mean we are in the rotation, not the default. The default set today: Class Central's ranking, 30 Day Singer's
   free lessons page, VoSci, Academy of Voice, Vocal Nebula/Ken Tamplin on YouTube.
7. **Two prompts were location-aware** (Colorado pools, Colorado transfer rules). Runs need a fixed location,
   and other users' lists will differ.
8. **The "why does my voice crack" article class earns nothing on this path.** Those citations (Bing AI
   Performance shows `sovt-exercises` at 40) come via Copilot/Bing or from users who toggle Search on. For the
   title/framing audit: pain-point titles serve Google and Copilot; the ChatGPT-native page is a "free
   singing lessons / free course" resource page that says free, beginner, and online in the title.

### Harness notes (for the full 100-prompt run, Codex or Claude)

Working recipe per prompt (~35 s): `navigate chatgpt.com/?temporary-chat=true` → wait 5 s → JS
`#prompt-textarea`.focus() + `document.execCommand('insertText', false, prompt)` → wait 1 s → JS click
`button[data-testid="send-button"]` → wait 20 s → **take a screenshot** (the DOM text stays empty until a repaint
when the window is unfocused) → `get_page_text` + JS collect `main a[href]` hostnames with query strings stripped
(the extension blocks returns containing query strings). Keystroke typing is unreliable once Chrome loses OS
focus; a second tab cannot be typed into in parallel; batches over ~60 s time out. First load shows a Temporary
Chat modal (click Continue once). Afterwards, `batch-analysis` on the cited domains for DR.
Path 1 (Responses API + web_search) is still the right way to get n = 3 per cell cheaply; use this recipe to
validate it on ~15 cells.
