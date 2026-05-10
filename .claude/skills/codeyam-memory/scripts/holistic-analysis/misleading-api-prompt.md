# Misleading API Analysis

You are analyzing a codebase for **misleading APIs** — exported functions whose names promise one thing but whose implementations do another. These are dangerous because a coding agent reading the function signature will make incorrect assumptions about behavior.

## Input

Read the export index from `/tmp/codeyam-memory/exports-scan.json`. It contains:

- `files`: Object keyed by file path, each containing an array of `{line, text}` export declarations
- `stats`: `total_files` and `total_exports` counts

## Analysis Steps

### 1. Triage by Name Pattern

Scan all export names and prioritize **pure-sounding** functions — names that imply no side effects or predictable behavior:

**Highest priority** (names suggesting pure computation):

- `get*`, `compute*`, `calculate*`, `derive*`, `extract*`
- `is*`, `has*`, `check*`, `can*`
- `parse*`, `format*`, `transform*`, `convert*`
- `to*`, `from*`, `create*` (when suggesting a factory)
- `validate*`, `verify*`

**Medium priority** (names suggesting single responsibility):

- `save*`, `update*`, `delete*`, `remove*` — check for hidden secondary effects
- `send*`, `notify*`, `emit*` — check for unexpected mutations
- `init*`, `setup*`, `configure*` — check for non-obvious global state changes

### 2. Deep Read Suspicious Exports

For each pure-sounding or single-responsibility export, use the Read tool to read the **full function implementation** (not just 30 lines — read until the function ends). Look for these red flags:

**Side effects in "pure" functions:**

- Writes to external state (database, cache, filesystem, global variables)
- Network calls (fetch, HTTP requests, WebSocket messages)
- Logging that includes sensitive data or business logic decisions
- Event emission or pub/sub publishing

**Input mutation:**

- Modifying objects/arrays passed as arguments (when the name doesn't suggest mutation)
- Reassigning properties on `this` in methods that sound like getters

**Silent error swallowing:**

- `catch` blocks that return default values instead of throwing or propagating
- `try/catch` around critical operations where the function signature suggests it will throw on failure
- Optional chaining (`?.`) chains that silently return `undefined` for important data

**Unexpected returns:**

- Function name suggests returning one type but actually returns something different
- `get*` functions that return `null` or `undefined` instead of throwing when the entity doesn't exist
- Boolean-named functions (`is*`, `has*`) that return non-boolean values

**Hidden coupling:**

- Functions that read from or write to module-level state
- Functions that depend on call order (must call A before B)
- Functions that modify shared caches or memoization stores

### 3. Scan Non-Pure Exports Too

Quickly scan action-oriented exports (`save*`, `update*`, etc.) at a glance for **hidden secondary effects**:

- `saveUser()` that also sends a welcome email
- `deleteProject()` that also archives data elsewhere
- `updateConfig()` that also restarts a service

### 4. Count Callsites

For each finding, use Grep to count how many files import or call the misleading function. More callsites = higher impact.

### 5. Assess Severity

- **high**: The mismatch could cause data corruption, silent failures, security issues, or affects >10 callsites
- **medium**: The mismatch leads to unexpected behavior that would cause bugs, or affects 3–10 callsites
- **low**: Minor naming inconsistency, affects few callsites, unlikely to cause bugs

## Output

Return your findings as a JSON code block in your response, using this format:

```json
{
  "findings": [
    {
      "type": "misleading-api",
      "function": "functionName",
      "file": "path/to/file.ts",
      "name_implies": "what the name suggests the function does",
      "actually_does": "what it actually does (with specific line numbers for the divergent behavior)",
      "severity": "high|medium|low",
      "callsite_count": 0
    }
  ],
  "stats": {
    "exports_scanned": 0,
    "deep_reads": 0,
    "findings_count": 0
  }
}
```

After the JSON block, return a **brief one-paragraph summary** of your findings. Include the number of findings and the most notable misleading API discovered.

## Important Notes

- **Read full implementations** — don't just look at the first few lines. Side effects often live at the end of functions or in helper calls.
- Be conservative with "low" severity findings — only flag things that would actually mislead a coding agent into writing incorrect code
- **Skip type exports** (type, interface, enum) — these can't have behavioral mismatches
- **Skip trivial getters** that just return a property — focus on functions with actual logic
- When a function delegates to a helper, read the helper too if the function name implies purity but the helper name suggests side effects
