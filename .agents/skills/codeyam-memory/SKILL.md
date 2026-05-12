---
name: codeyam-memory
autoApprove: true
description: |
  Generate and maintain Codex Rules for your codebase based on thorough analysis.
  Use when: User wants to set up memory, Codex rules, document confusing areas,
  or ensure Codex has proper context for working in the codebase.
---

# CodeYam Memory Assistant

This skill helps you generate and maintain Codex Rules (`.Codex/rules/`) that provide context-specific guidance. The goal is to **document genuinely confusing aspects** of the codebase—not things Codex can figure out by reading code.

## Core Principle: Document Confusion, Not Information

**Valuable rules** capture knowledge that reading the code alone wouldn't reveal:

- Historical context (why code evolved this way)
- Hidden relationships (files that must change together)
- Gotchas that caused bugs
- Non-obvious conventions

Skip documenting things Codex can determine by reading code: function signatures, type definitions, directory structure, and common patterns.

## When to Use This Skill

- Initial setup: User asks to "set up memory" or "generate Codex rules"
- Maintenance: After completing complex work where lessons should be preserved
- Review: Periodically to ensure rules are accurate and up-to-date

---

## Phase 1: Setup (First Run Only)

Check if this is the first time running memory.

### 1A. Add Documentation Section to AGENTS.md

If AGENTS.md already contains a "Documenting Confusion / Mistakes" section, skip this step entirely.

Otherwise, add **only** the section below — do not modify or add any other content to AGENTS.md. If AGENTS.md doesn't exist, create it with just a `# Project` heading followed by this section:

```markdown
## Continuous Documentation

As you work, think about any information that might be helpful to know in future work sessions without the user re-providing the information.

This might include

- High-level architecture for complex areas of the codebase (if not obvious)
- Specific commands that are recommended
- Debugging strategies for complex areas of the codebase (if not obvious)
- Anything confusing that is encountered in the work session

### Documenting Confusion / Mistakes

It is very important to document any tribal knowledge, complex architectural decisions, and any confusion or mistakes you encounter in Codex Rules (`.Codex/rules`).
Please see `.codeyam/rules/instructions.md` for guidance.
```

**Important:** Do not add project descriptions, architecture summaries, or any other content to AGENTS.md. Only add the exact section above.

### 1B. Verify Instructions File

Check that `.codeyam/rules/instructions.md` exists (it should be created during `codeyam init`). If missing, copy it from `codeyam-cli/templates/rules-instructions.md`.

### 1C. Install Pre-commit Hook

Check if the project uses Husky (`.husky/` directory exists).

**If using Husky**, append to `.husky/pre-commit`:

```bash
# CodeYam Memory Up-To-Date Check
if [ -f ".codeyam/bin/memory-hook.sh" ]; then
  .codeyam/bin/memory-hook.sh
fi
```

**If not using Husky**, create or append to `.git/hooks/pre-commit`.

Ensure `.codeyam/bin/memory-hook.sh` exists and is executable (`chmod +x`).

---

## Phase 2: Confusion Archaeology

The goal is to find areas where developers have **struggled**—not just areas that are complex. High churn alone doesn't mean confusion; we're looking for patterns that indicate something is genuinely non-obvious.

### 2A. Find Confusion Signals in Commit History

**Files with rapid successive changes** (same file, multiple commits in short windows = iteration/confusion):

```bash
# Files changed 3+ times in last month (rapid iteration signal)
git log --since="1 month ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | awk '$1 >= 3 {print}' | head -20
```

**Reverts** (definite confusion signals—someone made a change that didn't work):

```bash
git log --since="6 months ago" --oneline --grep="[Rr]evert" | head -10
```

**Correction language** (commits that fix misunderstandings):

```bash
git log --since="6 months ago" --oneline | grep -iE "(oops|forgot|actually|wrong|typo|missing|should have|meant to)" | head -15
```

**Files with multiple fix commits** (confusion hotspots):

```bash
git log --since="3 months ago" --oneline --grep="fix" -i --name-only --pretty=format: | sort | uniq -c | sort -rn | awk '$1 >= 2 {print}' | head -15
```

**Long commit messages** (someone felt the need to explain—complexity that needs documentation):

```bash
git log --since="6 months ago" --format="%h %s" | awk 'length($0) > 100' | head -15
```

### 2B. Dig Into High-Confusion Files

For each file that shows confusion signals, examine its evolution:

```bash
# View the story of changes to understand what kept going wrong
git log --since="6 months ago" --oneline -- path/to/confusing-file.ts

# Read the full commit messages for context
git log --since="6 months ago" --format="%h %s%n%b" -- path/to/confusing-file.ts | head -100
```

**As you analyze, ask:**

- What was the initial implementation?
- What kept breaking or needed fixing?
- What was non-obvious about the fix?
- What knowledge would have prevented the issue?

### 2C. Find Hidden Dependencies

**Files that always change together** (may have non-obvious relationships):

```bash
# Look for file pairs that frequently appear in the same commits
git log --since="3 months ago" --name-only --pretty=format: | awk 'NF' | sort | uniq -c | sort -rn | head -30
```

When you see the same files appearing together repeatedly, investigate why they're coupled.

### 2D. Scan for Developer Notes

**TODO/FIXME/HACK comments** often mark confusion points:

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . 2>/dev/null | head -30
```

Focus on comments that explain **why** something is the way it is, not just **what** needs to be done.

### 2E. Review Existing Documentation

Read these files if they exist to understand what's already documented:

- `README.md`
- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/` directory

Note gaps between what's documented and the confusion signals you found.

---

## Phase 3: Distinguish Important from Confusing

Not all high-churn areas need documentation. Filter your findings:

### Skip These (High Churn but NOT Confusing)

- Lock files (`pnpm-lock.yaml`, `package-lock.json`)
- Build outputs (`dist/`, `build/`)
- Generated files (`.build-info.json`, etc.)
- Files with mechanical changes (version bumps, auto-formatting)

### Document These (High Churn AND Confusing)

- Files with multiple fix commits in short windows
- Files with reverts (someone's approach didn't work)
- Files where commit messages explain complex reasoning
- Files where the same area keeps breaking
- Files that must change together but aren't obviously related

### Confusion Scoring

Prioritize areas with stronger confusion signals:

| Signal                    | Weight | Example                           |
| ------------------------- | ------ | --------------------------------- |
| Reverts                   | 5      | "Revert 'Track useState sources'" |
| Correction language       | 5      | "Oops, forgot to import..."       |
| Follow-up fix within days | 5      | Fix commit 2 days after change    |
| "Workaround" or "hack"    | 3      | "Workaround for webpack issue"    |
| Long commit message       | 3      | >100 chars explaining complexity  |
| Multiple fix commits      | 2      | 3+ fixes to same file             |
| Numbered fix series       | 1      | "Analysis Fixes 4", "Fixes 5"     |

Focus your documentation efforts on areas with the highest confusion scores.

Holistic source analysis signals (from the Holistic Source Analysis phase below) also feed into this scoring. Session mining signals (from the Session Log Mining phase below) feed into this same table.

---

## Phase 3B: Analysis Sizing & Menu

Before running the expensive LLM-powered analysis phases, run the fast extraction scripts to gather sizing metrics and let the user choose which phases to run.

### Step 1: Run fast extraction scripts (concurrent)

Clear stale data from any previous run, then run all three scripts in parallel:

```bash
rm -rf /tmp/codeyam-memory/ /tmp/cc-session-analysis/
```

```bash
node .Codex/skills/codeyam-memory/scripts/holistic-analysis/detect-deprecated-patterns.mjs
```

```bash
node .Codex/skills/codeyam-memory/scripts/holistic-analysis/find-exports.mjs
```

```bash
node .Codex/skills/codeyam-memory/scripts/session-mining/preprocess.mjs 2>/dev/null
```

Capture the stdout of `preprocess.mjs` — each line is a path to a filtered session file.

### Step 2: Extract sizing metrics

Use quick one-liners to extract counts — do NOT read the full JSON files into the main context:

```bash
node .Codex/skills/codeyam-memory/scripts/lib/read-json-field.mjs /tmp/codeyam-memory/deprecated-scan.json '.dependencies | length'
node .Codex/skills/codeyam-memory/scripts/lib/read-json-field.mjs /tmp/codeyam-memory/deprecated-scan.json '.explicit_markers | length'
node .Codex/skills/codeyam-memory/scripts/lib/read-json-field.mjs /tmp/codeyam-memory/exports-scan.json '.stats.total_exports'
node .Codex/skills/codeyam-memory/scripts/lib/read-json-field.mjs /tmp/codeyam-memory/exports-scan.json '.stats.total_files'
```

The session count is the number of lines from `preprocess.mjs` stdout.

**Time estimate formulas:**

| Phase                    | Formula                                 | Example                 |
| ------------------------ | --------------------------------------- | ----------------------- |
| Holistic source analysis | `3 + (total_exports / 500)` min, cap 12 | 3,470 exports → ~10 min |
| Session log mining       | `1 + (sessions × 0.25)` min, cap 12     | 25 sessions → ~7 min    |

### Step 3: Present the menu

Use `AskUserQuestion` with `multiSelect: true`. Include actual numbers from Step 2:

> **Which additional analysis phases would you like to run?**
>
> 📦 **Holistic Source Analysis** — {exports} exports across {files} files, {deps} dependencies, {markers} deprecation markers. Estimated: ~{N} min
>
> 💬 **Session Log Mining** — {sessions} qualifying sessions found. Estimated: ~{N} min

Options (as `multiSelect: true`):

- **Holistic Source Analysis (~N min)** — "Deep-read exports to find misleading APIs and deprecated patterns"
- **Session Log Mining (~N min)** — "Mine Codex session history for confusion signals"
- **Skip both** — "Proceed with git archaeology results only"

Omit any option where the data count is zero (e.g., if no sessions qualify, don't show the session mining option). If both counts are zero, skip the menu entirely and proceed to Phase 4.

### Step 4: Execute selected phases

Based on the user's selection:

- **Holistic Source Analysis selected:** Jump to the "Holistic Source Analysis" section below, starting at **Step 2** (scripts already ran in Step 1 above).
- **Session Log Mining selected:** Jump to the "Session Log Mining" section below, starting at **Step 2** (preprocessing already ran in Step 1 above). Use the session file paths captured in Step 1.
- **Both selected:** Run both, starting each at Step 2.
- **Skip both:** Proceed directly to Phase 4.

### Step 5: Cleanup

Regardless of what the user selected, clean up temporary files before proceeding to Phase 4:

```bash
rm -rf /tmp/codeyam-memory/ /tmp/cc-session-analysis/
```

---

## Additional Analysis Phase: Holistic Source Analysis

Holistic analysis reads the codebase cross-cuttingly to find **latent confusion** — problems
that haven't caused bugs yet but will mislead a future agent reading code locally.

### Prerequisites

- Project must contain `.ts`, `.tsx`, `.js`, or `.jsx` source files
- If no source files are found, skip this phase entirely

### Step 1: Run extraction scripts

Handled by Phase 3B. Proceed to Step 2.

### Step 2: Launch analysis subagents (concurrent)

Read the prompt templates and launch both as Task agents concurrently. **Do NOT read the
scan data into the main context** — it can be hundreds of KB. Each subagent reads its own
data file via the Read tool.

1. **Deprecated Pattern agent** — Read `.Codex/skills/codeyam-memory/scripts/holistic-analysis/deprecated-prompt.md` for the
   prompt template. Launch as a foreground Task agent (model: sonnet) with the prompt template
   content. The agent reads `/tmp/codeyam-memory/deprecated-scan.json` itself, uses Grep to
   find remaining callsites, and returns its findings JSON in the response.

2. **Misleading API agent** — Read `.Codex/skills/codeyam-memory/scripts/holistic-analysis/misleading-api-prompt.md` for the
   prompt template. Launch as a foreground Task agent (model: sonnet) with the prompt template
   content. The agent reads `/tmp/codeyam-memory/exports-scan.json` itself, uses Read to
   inspect suspicious functions, and returns its findings JSON in the response.

Both agents return their findings JSON and a brief summary directly in their response.

**Context budget note:** The exports index alone can be 400KB+. Never read it into the main
context. Subagents run as foreground Task agents and have full filesystem access including
`/tmp/`.

### Step 3: Integrate findings

Parse the findings JSON from each subagent's response. For each finding:

- **Deprecated patterns** get confusion score **4** (comparable to "workaround/hack" signal).
  If an explicit `@deprecated` marker exists, bump to **5**.
- **Misleading APIs** get confusion score **4** for medium severity, **6** for high severity
  (where "high" means the mismatch could cause data corruption or silent failures).

Add findings to the evidence pool alongside git archaeology results. They flow into
Phase 4 (evidence-based user questions) and Phase 5 (rule generation) normally.

### Step 4: Cleanup

Handled by Phase 3B Step 5.

---

## Additional Analysis Phase: Session Log Mining

This phase mines Codex session transcripts for empirical confusion: user corrections, wrong assumptions, re-edits, tribal knowledge gaps. It complements the git archaeology in Phase 2 with direct evidence from actual Codex sessions.

### Step 1: Preprocess Sessions

Handled by Phase 3B. Use the session file paths captured there.

### Step 2: Launch Haiku Subagents

Read the prompt template from `.Codex/skills/codeyam-memory/scripts/session-mining/analyze-prompt.md`.

For each filtered session file from Step 1:

- If the file is **<200KB**: launch one Haiku Task agent
- If the file is **>200KB**: chunk into ~200KB segments, launch one agent per chunk

**Do NOT read session files into the main context** — they can be 20-40KB each and will
exhaust the context window. Each subagent reads its own file via the Read tool. Each agent
receives:

1. The prompt template content
2. The `/tmp/` file path to read (the agent reads it itself)
3. Instruction to return a JSON array

Launch agents in batches of **10** using the Task tool with `model: "haiku"`. **Use unique descriptions** for each agent (e.g., "Session mining batch 1 - session 1", "Session mining batch 1 - session 2", etc.; increment the batch number for each batch of 10). Wait for each batch to complete before launching the next. This keeps machine load manageable — a poweruser may have 30+ sessions qualifying.

### Step 3: Collect and Validate Findings

Parse each agent's response as JSON. Validate:

- Must be an array
- Each element must have `signal` and `summary` fields
- `signal` must be one of: `USER_CORRECTION`, `RE_EDIT`, `FAILED_PIVOT`, `WRONG_ASSUMPTION`, `TRIBAL_KNOWLEDGE`, `APPROACH_PIVOT`

If >50% of agents return invalid output, warn the user before continuing. Otherwise, silently skip invalid results.

**Filter out environment-specific findings.** Discard any finding that relates to the developer's local machine setup rather than the project's codebase — e.g., bare repo checkout layouts, local tool versions, IDE configuration, shell aliases, filesystem paths, or permission issues. The rules we generate must be useful to _any_ developer cloning the repo, not just the one whose sessions we mined.

### Step 4: Deduplicate Across Sessions

Three-pass merge:

1. **Cluster by `topic`** — group all findings with the same topic label
2. **Rank within each cluster** — priority order: `USER_CORRECTION` > `TRIBAL_KNOWLEDGE` > `WRONG_ASSUMPTION` > `FAILED_PIVOT` > `RE_EDIT` > `APPROACH_PIVOT`
3. **Count session occurrences** — add `session_count` to each merged finding

Output: one merged finding per topic, with `session_count`, strongest signal type, and collected file paths.

### Step 5: Feed into Phase 3 Scoring

Additional scoring weights for session-mining signals:

| Signal                              | Weight   |
| ----------------------------------- | -------- |
| User correction (session)           | 7        |
| Tribal knowledge provided (session) | 6        |
| Wrong assumption caught (session)   | 5        |
| Re-edit of same file (session)      | 4        |
| Failed-then-pivoted (session)       | 3        |
| Appearing in 3+ sessions            | +3 bonus |

These merge into the Phase 3 scoring table above. Session-mined findings then flow into Phase 4 (evidence-based questions) and Phase 5 (rule generation) alongside git archaeology findings.

### Step 6: Cleanup

Handled by Phase 3B Step 5.

---

## Phase 4: Ask Evidence-Based Questions

Questions must reference **specific confusion evidence** you found. Don't ask generic questions about files; ask about the specific commits, patterns, or problems you discovered.

Always include "I'm not sure - please investigate" as an option so users can delegate investigation to you.

### Question Examples

**For rapid successive changes:**

> "I found 5 commits to `ScopeDataStructure.ts` in 3 weeks, including 'Fix exponential blowup' and 'scope data structure optimization'. What kept causing issues here? What would someone need to know to avoid similar problems?"
>
> Options: [Explain the pattern] [I'm not sure - please investigate]

**For reverts:**

> "Commit `a9fbd6385` reverted 'Track useState initialization sources'. Why didn't that approach work? What should be done instead?"
>
> Options: [Explain what went wrong] [I'm not sure - please investigate]

**For correction commits:**

> "Commit `31e4a3842` says 'Oops, lost an import'. What import was lost and why is it easy to miss?"
>
> Options: [Explain the gotcha] [I'm not sure - please investigate]

**For files that change together:**

> "I noticed `auth.ts` and `session.ts` are modified together in 8 commits. Is there an invariant that must be maintained between them? What would break if someone changed one without the other?"
>
> Options: [Explain the relationship] [I'm not sure - please investigate]

**For long explanatory commits:**

> "Commit `abc123` has a detailed message about 'why we need to track execution flows separately'. What's the key insight here that should be documented?"
>
> Options: [Summarize the insight] [I'm not sure - please investigate]

### Process

1. Group related questions by area/module
2. Ask 2-3 questions at a time, wait for answers
3. If user says "I'm not sure - please investigate":
   - Read the relevant code, commits, and context yourself
   - Analyze the patterns and behavior
   - Document your findings based on what you discover
4. Move to next area after capturing answers

---

## Phase 5: Generate and Validate Rules

For each area where you have enough information, create a rule file—but **validate it first**.

### 5A. Rule Validation (Before Writing)

Before generating each rule, verify it passes these tests:

**1. Evidence check**: Does the rule reference actual confusion evidence from commit history?

- If no evidence of confusion, reconsider whether the rule is needed

**2. Code-derivable check**: Read the files the rule will cover. Could the rule's content be determined by reading those files alone?

- If YES → the code is its own documentation — prefer keeping rules for non-derivable insights
- If NO (historical context, edge cases, non-obvious behavior) → rule is valuable

**3. Prevention check**: Would this rule have prevented one of the confusion commits you found?

- If YES → definitely document it
- If NO → reconsider its value

**For holistic analysis findings**, the validation checks apply with these adjustments:

- **Evidence check:** Satisfied by structural evidence from source analysis (e.g., "name implies pure computation but implementation writes to cache on line 47") rather than git commit history.
- **Code-derivable check:** These findings ARE derived from code — but from a cross-cutting read that a local reader wouldn't perform. The rule is valuable if it captures insight that requires reading multiple files or tracing non-obvious call chains.
- **Prevention check:** "Would this rule prevent a future agent from being misled?" rather than "would it have prevented a past commit?"

### Rule Quality Examples

**✅ Good rule** (passes all tests):

```markdown
## Path Prefix Matching Must Check Boundaries

When checking if one schema path is a prefix of another using `startsWith()`,
you must verify the match is at a path boundary. Otherwise sibling properties
with similar names incorrectly match.

This caused a bug where `entity` matched `entityCode` (siblings, not parent-child).
```

- Evidence: Learned from actual bug (commit history evidence)
- Not code-derivable: Code doesn't explain why boundary checking matters
- Prevention: Would prevent future prefix-matching bugs

**Compare with a weaker alternative** (fails the checks):

```markdown
## Running Tests

Use `pnpm jest` to run tests. Configuration is in `jest.config.ts`.
```

- No confusion evidence, code-derivable, and wouldn't prevent future mistakes

### 5B. Rule File Guidelines

1. **Location mirrors code structure**
   - Rule for `src/api/` → `.Codex/rules/src/api/architecture.md`
   - Rule for testing patterns → `.Codex/rules/testing-patterns.md`

2. **Paths must be specific** — use `paths: ['src/api/**/*.ts']` rather than `'**/*.ts'` (too broad wastes context)

3. **Content should explain "why" not just "what"**
   - Focus on the reasoning, history, or gotcha
   - Be concise - every word costs context

4. **Audit dates live in `.Codex/codeyam-rule-state.json`** (managed by `codeyam memory touch`). Keep rule frontmatter limited to `paths`.

### Rule Template

```markdown
---
paths:
  - 'specific/path/**/*.ts'
---

## [Clear, Descriptive Title]

[What's the gotcha/insight/non-obvious thing?]

### Why This Matters

[What would go wrong if someone didn't know this?]

### The Solution/Pattern

[What should someone do differently?]
```

---

## Phase 6: Final Review

After generating rules based on your analysis and user answers:

1. **Present a summary** of all rules created

2. **Ask the user:**

   > "I've created rules covering [list areas]. Are there any other areas of the codebase that you know are confusing or have tribal knowledge that I might have missed?"

3. **Generate any additional rules** based on their response

4. **Suggest viewing rules in the dashboard:**

   > "Run `codeyam` to open the dashboard and view all rules in the Rules tab."

5. **Remind the user** to commit the new rules:
   ```
   git add .Codex/rules/ .codeyam/rules/
   git commit -m "Add rules for Codex (generated via /codeyam-memory)"
   ```

---

## Ongoing Maintenance

### When Codex Should Update Rules

- After fixing a bug that revealed a gotcha
- After making an architectural decision
- When code patterns change
- When asking "why does this work this way?" and learning the answer
- When receiving clarification from the user about any confusion

### Pre-commit Hook Behavior

The pre-commit hook **blocks commits** when:

- Code files matching a rule's `paths` are modified
- The rule's `lastAuditedAt` in `.Codex/codeyam-rule-state.json` is older than the code changes

To proceed:

1. Review the flagged rule(s)
2. Update content if needed
3. Run `codeyam memory touch` to mark rules as audited in `.Codex/codeyam-rule-state.json`
4. Stage and commit
