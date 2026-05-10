# Deprecated Pattern Analysis

You are analyzing a codebase for **deprecated patterns** — situations where two approaches to the same problem coexist, with one fading in favor of another. These create confusion because a coding agent reading locally may follow the old pattern.

## Input

Read the scan data from `/tmp/codeyam-memory/deprecated-scan.json`. It contains:

- `dependencies`: All npm dependency names from the project
- `explicit_markers`: Lines containing `@deprecated`, `// legacy`, etc., with file, line number, and text
- `git_recency`: Per-dependency counts of `recent_imports` (last 3 months) vs `old_imports` (3–12 months ago)

## Analysis Steps

### 1. Dependency Overlap Analysis

Review the full dependency list and identify pairs or groups that serve **overlapping purposes**. Use your domain knowledge of the npm ecosystem — don't rely on name similarity alone.

Common overlap categories:

- **ORMs / query builders**: knex, kysely, prisma, drizzle, typeorm, sequelize, supabase-js (when used for queries)
- **Date libraries**: moment, dayjs, date-fns, luxon
- **HTTP clients**: axios, got, node-fetch, ky, superagent, undici
- **State management**: redux, zustand, jotai, recoil, mobx, valtio
- **Schema validation**: zod, yup, joi, ajv, io-ts, superstruct, valibot
- **CSS-in-JS / styling**: styled-components, emotion, tailwind, vanilla-extract, stitches
- **Testing**: jest, vitest, mocha, ava
- **Bundlers**: webpack, vite, esbuild, rollup, parcel, turbopack
- **Logging**: winston, pino, bunyan, log4js

Also look for:

- Internal packages that wrap the same underlying library differently
- Old utility files alongside newer replacements

### 2. Cross-Reference with Git Recency

For each overlapping pair you identified, check the `git_recency` data:

- Is one dependency's import count **growing** (more recent than old) while the other is **fading** (fewer recent than old)?
- A clear growth-vs-fade pattern confirms a migration in progress.
- If both are stable or both are growing, it may be intentional coexistence rather than a migration.

### 3. Cross-Reference with Explicit Markers

Check if any `@deprecated` or `// legacy` markers corroborate your dependency findings:

- A marker on code that imports the fading dependency strengthens the signal
- A marker on a wrapper/utility that abstracts one of the approaches is strong evidence

### 4. Find Remaining Callsites

For each confirmed deprecated pattern, use Grep to find all files still importing or using the old dependency/pattern. Count the callsites to assess migration completeness.

Search patterns:

```
from ['"]<old-dep>
require(['"]<old-dep>
import <old-dep>
```

### 5. Assess Severity

- **high**: Active migration with significant remaining old callsites (>10 files), or explicit deprecation markers present
- **medium**: Clear trend in git recency but no explicit markers and fewer remaining callsites
- **low**: Slight trend, possibly intentional coexistence

## Output

Return your findings as a JSON code block in your response, using this format:

```json
{
  "findings": [
    {
      "type": "deprecated-pattern",
      "old_pattern": "descriptive name of the old approach",
      "new_pattern": "descriptive name of the new approach",
      "evidence": "concise summary of the evidence (git recency numbers, markers found)",
      "files_still_using_old": ["path/to/file1.ts", "path/to/file2.ts"],
      "severity": "high|medium|low",
      "suggested_rule_paths": ["src/relevant/**/*.ts"]
    }
  ],
  "stats": {
    "deps_analyzed": 0,
    "overlapping_pairs_found": 0,
    "confirmed_deprecated": 0
  }
}
```

After the JSON block, return a **brief one-paragraph summary** of your findings. Include the number of confirmed deprecated patterns and the highest-severity finding.

## Important Notes

- Be conservative: only flag patterns where there is clear evidence of transition, not just the presence of two similar libraries
- Some projects intentionally use multiple tools in the same category (e.g., jest for unit tests and playwright for e2e) — that's not deprecation
- Focus on patterns that would **mislead a coding agent** — if both approaches are valid and documented, it may not need a rule
