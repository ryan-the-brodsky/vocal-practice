# Session Log Analysis Prompt

You are analyzing a filtered Claude Code session transcript to find instances where Claude got confused about **this specific codebase**. The transcript has been preprocessed — each line is a JSON object with `type` ("user" or "assistant"), `ts` (timestamp), and `content`.

## Your Task

Read the session file provided and identify moments where Claude demonstrated confusion that a `.claude/rules/` rule could have prevented.

## Signal Types to Detect

1. **USER_CORRECTION** — The user corrects Claude's approach, code, or assumption. Look for: "no, that's not how...", "actually...", "you need to use X not Y", "that's wrong", explicit disagreement.

2. **RE_EDIT** — Claude edits the same file multiple times in quick succession, indicating the first attempt was wrong. Look for: multiple Edit/Write tool calls targeting the same file path with different content.

3. **FAILED_PIVOT** — A tool call fails (test failure, bash error, type error) and Claude switches to a different approach. Look for: error in tool result followed by a new strategy in the next assistant message.

4. **WRONG_ASSUMPTION** — Claude's thinking or text reveals an incorrect assumption about the codebase. Look for: statements that contradict later evidence, "I assumed...", reasoning that turns out wrong.

5. **TRIBAL_KNOWLEDGE** — The user provides context Claude didn't have but needed. Look for: the user explaining how something works, why something is the way it is, historical context, non-obvious conventions.

6. **APPROACH_PIVOT** — Claude abandons a call chain mid-stream and tries something completely different (without an explicit error triggering it). Look for: sudden topic/strategy shifts in assistant messages.

## Rules for Reporting

- **Only report codebase-specific confusion.** Generic programming mistakes (typos, syntax errors, forgetting imports for standard libraries) are NOT worth reporting.
- **Only report findings where a `.claude/rules/` rule would prevent the confusion.** If the confusion is situational or one-off, skip it.
- **Maximum 5 findings per session.** Prioritize the strongest, most rule-worthy signals.
- **Be precise about file paths.** If the confusion relates to specific files, include them.

## Output Format

Return a JSON array (no markdown fences, no explanation outside the array). Each element:

```json
{
  "signal": "USER_CORRECTION | RE_EDIT | FAILED_PIVOT | WRONG_ASSUMPTION | TRIBAL_KNOWLEDGE | APPROACH_PIVOT",
  "summary": "One sentence describing what went wrong",
  "evidence": "Brief quote or paraphrase from the session proving this happened",
  "file_path": "path/to/relevant/file.ts or null if not file-specific",
  "topic": "kebab-case-topic-label",
  "rule_worthy": true,
  "rule_worthy_reason": "Why a rule would prevent this from recurring"
}
```

If the session contains no codebase-specific confusion worth documenting, return an empty array: `[]`
