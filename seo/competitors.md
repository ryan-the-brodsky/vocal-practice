# Vocal Habit competitors (baseline for a competitive analysis we never did up front)

**Date:** 2026-08-27. Metrics from Ahrefs API v3 (`batch-analysis`, `site-explorer-ai-responses-count`), US.
"ChatGPT cites" = citation links in ChatGPT answers per Ahrefs' sample; "pages" = distinct cited URLs.

Origin note (Ryan): Singing Carrots was the product that motivated Vocal Habit. It was bloated and expensive;
Vocal Habit is the trimmed, free counterpart. Two months after launch Vocal Habit sits at DR 0 with ~34% of
Singing Carrots' ChatGPT citations and parity with 30 Day Singer (DR 46).

## Direct: browser singing tools with pitch detection

| Domain | What it is | DR | Ref. domains | Organic visits/mo | ChatGPT cites / pages | All-platform AI cites |
|---|---|---|---|---|---|---|
| vocalhabit.com | free warm-ups + pitch scoring + Learn library | 0 | 435 (spam) | 0 | 33 / 4 | 38 |
| singingcarrots.com | freemium pitch tool + range test + exercises + articles | 36 | 2,470 | 36k | 96 / 88 | 1,344 |
| tonegym.co | ear-training gym, paid, has vocal range test page (~20k visits/mo on that page alone) | 47 | 3,104 | 74k | 15 / 9 | 1,350 |
| singsharp.com | pitch-detection singing app (mobile) | 26 | 553 | 0.1k | 5 / 4 | 15 |
| vocalpitchmonitor.com | pitch monitor app landing | 4 | 460 | 0 | not measured | |
| yousician.com | multi-instrument app incl. singing; big brand | 71 | 5,156 | 86k | 337 / 230 | 7,269 |

## Free-library competitors surfaced by the ChatGPT pilot (2026-08-27)

These came out of asking ChatGPT "best free online singing course" / "free singing lessons for beginners"
directly (see `seo/chatgpt-citation-behavior-test.md` §7). They are the resource-list slot we compete for.

| Domain | What it is | DR | Organic visits/mo | ChatGPT cites / pages | Note |
|---|---|---|---|---|---|
| voicescience.org (VoSci) | 168 free lessons + 200-term lexicon + 27 sourced articles + podcast + **7 free mic tools** (VRP phonetogram, pitch matching, spectrogram, intervals, sight-reading, VFE); paid adaptive Practice Paths | **15** | 665 | **276 / 63** | The strongest proof of the thesis in the whole dataset: DR 15, ~no Google traffic, 8x our ChatGPT citations. Our profile writ large, run by one pedagogue (Josh Manuel, Westminster Choir College). Full profile: `seo/citation-brokers-and-vosci.md`. |
| academyofvoice.com | free through "Level 2", interactive lessons | **0.6** | 1 | 8 / 1 | A DR-0 site cited for being free + interactive. |
| classcentral.com | course aggregator; ranks "best free singing courses" | 78 | 193k | (aggregator) | Cited 4 times across two prompts. Getting Vocal Habit listed on Class Central is a concrete, cheap citation lever. |
| Ken Tamplin Vocal Academy, Vocal Nebula, Sing Like A Pro | YouTube curricula | n/a | n/a | via Class Central / YouTube | Named as the "course" picks. |

## Courses and content sites (no tool)

| Domain | What it is | DR | Organic visits/mo | ChatGPT cites / pages | All-platform |
|---|---|---|---|---|---|
| 30daysinger.com | paid video course, strong blog | 46 | 38k | 32 / 53 | 1,582 |
| ramseyvoice.com | Ramsey Voice Studio blog + lessons | 46 | 9.6k | 17 / 8 | 776 |
| singwise.com | long-form voice pedagogy articles | 37 | 2.4k | 17 / 8 | 302 |
| singingsuccess.com | Brett Manning paid course | 44 | 14k | 7 / 6 | 715 |
| superiorsingingmethod.com | paid course (declining) | 8 | 0 | 0 | 0 |
| vocalizeu.com | vocal training app | 29 | 0 | 0 | 0 |

## Adjacent (ear training / theory) for calibration

| Domain | DR | Organic visits/mo | ChatGPT cites / pages |
|---|---|---|---|
| tonedear.com (tool only, no text) | 50 | 16k | 1 / 1 |
| teoria.com | 67 | 28k | 21 / 16 |
| musictheory.net | 76 | 604k | 22 / 27 |
| musicca.com | 64 | 1.9M | 494 / 402 |

## Read-outs to carry into the real analysis

- Category leader is DR 36 (Singing Carrots). Everything below DR 50 except Yousician. This is a small-site category.
- Tool-only sites are not cited (tonedear 1, singsharp 5). Citations go to the sites that pair a tool with text.
- Singing Carrots is cited across 88 pages vs our 4. Their breadth of pages, not their authority, is the gap.
- Bing AI Performance says our citations come from "learn to sing online free / best free online singing course /
  free singing lessons for beginners"; the `/learn/` hub is the cited page. Our citation is a resource-list slot,
  theirs are mostly method/article slots. Both are open.

## To do when the analysis is done properly

1. Feature matrix (tool, range test, exercises count, coaching, progress, price, signup wall) for the direct set.
2. Content inventory per competitor: article count, question-titled share, whether prose is sourced.
3. Which of their pages get cited (Ahrefs `site-explorer-top-pages` + Brand Radar if ever added).
4. Their backlink sources (`site-explorer-referring-domains`), to find the legitimate links available in this category.
5. Pricing and the exact "bloat" Singing Carrots carries, written down as positioning for the landing page.
