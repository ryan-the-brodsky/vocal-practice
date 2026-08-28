# Plain-language editorial pass: brief for per-article editors

**Why (2026-08-27).** Our Learn articles were born from academic research and read that way: average 20 words
per sentence and ~25 voice-science terms per 1,000 words, versus 15 and ~17 on the competitor guides that
ChatGPT cites most (see `seo/vosci-content-audit.md`). The sourcing is our strength and must not be touched.
The prose is the problem. Audience: a beginner or casual singer who has never had a lesson and asked a
chatbot "how do I learn to sing for free." Voice: `seo/content-style-guide.md` ("Jeff Nippard for singing":
well-informed, calm, plain, non-dogmatic).

## Targets (per article, measured by `scripts` below)
- Average sentence length **17 words or fewer** (was ~20). Split long sentences; one idea per sentence.
- Jargon density **down by at least 30%** from the baseline in `seo/data/plain-language-baseline-2026-08-27.json`.
  Do this by (a) defining each technical term in plain words the first time it appears and then using the
  plain phrase afterwards, (b) deleting terms that add no information, (c) never deleting a term that a
  cited claim depends on.
- Length within **±15%** of the current word count. This is an edit, not a rewrite or a cut.
- **Zero em dashes** and no AI-isms: run `python3 ~/.claude/skills/anti-slop/scan.py <file>` and fix every
  HARD violation; use judgment on the candidates.

## Hard preservation rules (verify with `git diff` before you finish)
1. **Frontmatter is untouched** (title, seoTitle, slug, category, tags, embeddedExerciseId, targetKeyword,
   volume, kd, intent, metaDescription, references). The only permitted change is `updated:` → today's date
   (2026-08-27), if the field exists.
2. **`## Sources` section is byte-identical** to the original. Do not reorder, reformat, or trim it.
3. **Every factual claim, number, and study reference survives.** Inline attributions (Author, Year) stay,
   though the sentence around them may be rephrased. No new claims, no new sources, no removed caveats.
   If a sentence is too technical to simplify without changing its meaning, leave it and move on.
4. **Headings keep their meaning** (they carry the SEO intent); you may shorten a heading but not change
   what it promises. **FAQ question headings (`### ...?`) are verbatim**: they feed FAQPage JSON-LD and the
   grounding queries we are cited for.
5. **HTML comments and exercise markers are byte-identical**, e.g. `<!-- EMBEDDED EXERCISE: ... -->`,
   `<!-- ExerciseWidget: ... -->`, `<!-- EmbeddedExercise exerciseId="..." -->`. Do not move them.
6. Markdown links, image references, and internal `/learn/...` links stay as they are.
7. Keep the "surfaces genuine disagreement" passages; plain language, same disagreement.

## Style moves that work here
- Lead with what the reader feels or hears ("your voice flips"), then the mechanism, then the fix.
- Replace "phonation" with "making sound", "adduction" with "the folds coming together", "subglottal
  pressure" with "air pressure under the folds", "vocal tract" with "throat and mouth", "register" with the
  named voice (chest, head) where that is what is meant. Keep the technical word in parentheses on first use
  when a cited study uses it.
- Cut hedges that do not change meaning; keep hedges that do (evidence strength matters).
- Prefer "you" and short imperative sentences in the exercise steps.

## Deliverable
Edit the file in place. Then return a short report: baseline vs after (words, avg sentence length, jargon/1k),
anti-slop HARD violations remaining (must be 0), confirmation that frontmatter, Sources, FAQ headings and
markers are unchanged (state how you checked), and the three biggest changes you made in one line each.

## Measuring
```
python3 - <<'PY'
import re,sys,statistics
f=sys.argv[1] if len(sys.argv)>1 else 'FILE'
JARGON=['formant','adduct','abduct','thyroarytenoid','cricothyroid','subglott','glottal','larynx','laryngeal','vocal fold','vocal tract','resonan','harmonic','spectr','aerodynamic','phonat','passaggio','register','closed quotient','open quotient','SOVT','semi-occluded','twang','epilar','aryepiglott','vocology','pedagog','audiat','solfege','solfège']
s=open(f).read(); body=s.split('---',2)[-1].split('## Sources')[0]
text=re.sub(r'<!--.*?-->','',body,flags=re.S); text=re.sub(r'[#*_>\[\]()`]','',text); text=re.sub(r'\s+',' ',text)
w=len(text.split()); sents=[x for x in re.split(r'(?<=[.!?])\s+',text) if len(x.split())>3]
print('words',w,'avg_sentence',round(statistics.mean(len(x.split()) for x in sents),1),'jargon_per_1k',round(1000*sum(len(re.findall(re.escape(k),text,re.I)) for k in JARGON)/w,1),'em_dashes',s.count('—'))
PY
```
(Run as `python3 - content/learn/<slug>.md <<'PY' ... ` or save to a temp file; pass the path as argv[1].)
