# Courses: aggregator submission notes (Class Central, AlternativeTo)

**Why:** `analytics/findings-log.md` shows Bing grounding queries for the site are led by "learn to sing online free", "best free online singing course", and "free singing lessons for beginners". `seo/citation-brokers-and-vosci.md` shows Class Central (DR 78, ~3.6k ChatGPT citations) and AlternativeTo (DR 88, ~6k) are the pages ChatGPT quotes for those prompts. They pass no backlinks; treat them as AI-visibility + referral levers.

**Gate before submitting anything (CLAUDE.md rule: committed != deployed):**

```
curl -s https://vocalhabit.com/courses/foundations-of-singing/ | grep -o "<h1[^>]*>[^<]*"
curl -s https://vocalhabit.com/courses/foundations-of-singing/ | grep -o '"@type":"Course"'
curl -s https://vocalhabit.com/courses/foundations-of-singing/05-singing-in-tune | grep -o "<h1[^>]*>[^<]*"
```

All three must return real content, not the app shell. Then run Google's Rich Results test on the syllabus URL and "Request Indexing" for `/courses/` and the syllabus in Bing Webmaster Tools (IndexNow discovery is not a crawl).

## Class Central

No self-serve form for independent providers. Email `contact@classcentral.com` asking to be listed as an independent provider. Fields they will want:

| Field | Value |
|---|---|
| Course title | Foundations of Singing |
| Provider | Vocal Habit (independent) |
| URL | https://vocalhabit.com/courses/foundations-of-singing/ |
| Price | Free (no paid tier, no signup) |
| Level | Beginner |
| Subject | Music / Singing |
| Format | Self-paced, online, in-browser (microphone-scored exercises) |
| Duration | 9 lessons, about 2 hours of guided work, paced over ~3 weeks |
| Language | English |
| Certificate | None |
| Syllabus | The nine lesson titles on the page (also in the `syllabusSections` JSON-LD) |

Their rankings are Bayesian averages of learner reviews, and the ranking article is what ChatGPT reads, so once listed: ask finishing users (lesson 9) to leave a review. Optional second path: publish the syllabus as a YouTube playlist, which qualifies through their YouTube-provider route.

## AlternativeTo

Self-serve: "Suggest new application" on alternativeto.net, approved in 1–2 days. List Vocal Habit as a free web app; name Singing Carrots, Yousician, Vocal Pitch Monitor, and VoSci as alternatives so the listing lands on their pages.

## Other

- coursesity.com / openculture.com: email-only, low odds; try after Class Central responds.
- mooc-list.com: skip.
