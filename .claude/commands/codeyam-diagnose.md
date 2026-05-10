# Debug Scenario or Analysis

When a user asks to debug a scenario or analysis (e.g., `/codeyam-diagnose [ID]`), use this systematic process.

## Goal & Rules

**Goal:** Capture quality screenshots by fixing all errors, then document what was wrong.

**Definition of Done** — debugging is NOT complete until one of:

| Outcome                | What's Required                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **SUCCESS (DB Fix)**   | Issue fixed via database/config changes, screenshots recaptured, all files verified on disk AND visually inspected                            |
| **SUCCESS (File Fix)** | Issue fixed via tmp folder edits, screenshots recaptured with `--capture-only`, all files verified AND visually inspected, changes documented |
| **UNFIXABLE**          | Issue cannot be fixed locally (rare), documented in final report with full details                                                            |

### KEY RULE 1: Never stop before capturing screenshots

Category 4 ("engine bug") is a **diagnosis category, not a blocker**. You have full access to edit any file in `/tmp/codeyam/local-dev/{slug}/project/` — the "engine" just wrote those files as plain TypeScript/JavaScript. Every issue can be fixed locally.

If you find yourself thinking "this requires an engine-level fix" or "this is blocked by a code generation bug" — **STOP**.

- Fix the files in the tmp folder, then capture screenshots, THEN document the bug
- Try at least 3 different approaches before asking the user whether to continue
- Only stop when the user agrees or you've captured quality screenshots

### KEY RULE 2: Original Repo vs Tmp Folder

| Location                                                  | What's There                                                        | Use For                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| **Original Repo** (your working directory)                | Database (`.codeyam/db.sqlite3`), config, universal mocks, captures | **Run all `codeyam` commands here**                   |
| **Tmp Folder** (`/tmp/codeyam/local-dev/{slug}/project/`) | Copy of project with mock injections, generated scenario files      | **Only edit files here — never run codeyam commands** |

Running `codeyam recapture` from the tmp folder fails with "Not in a CodeYam project" because the database isn't there.

### KEY RULE 3: Never modify client code

Fix the **mock data or mock code** — never the client's components or application code. The client's code is sacred. Our job is to make the simulation environment correct. You CAN modify:

- Database data (`.codeyam/db.sqlite3`) — in Original Repo
- Universal mocks (`.codeyam/universal-mocks`) — in Original Repo
- Generated files in tmp folder (`__codeyamMocks__/`, layouts, routes)

### KEY RULE 4: `--capture-only` preserves tmp folder edits

- `codeyam recapture ID` — regenerates files from database, then captures (overwrites tmp edits)
- `codeyam recapture ID --capture-only` — captures without regenerating (preserves your edits)
- `codeyam debug ID` — regenerates files only (also overwrites tmp edits)

If you edited files in the tmp folder, you **MUST** use `--capture-only` when recapturing.

---

## Setup

### Note Key Locations

**Database:** The codeyam database relevant for this command should always be found in the repo where this command is called in the `.codeyam/db.sqlite3` file.

**Logs:** Before debugging copy the original logs to a temorary location as the debugging will overwrite these logs and they are valuable for debugging issues.

Original Logs Locaion: `/tmp/codeyam/local-dev/{slug}/codeyam/logs.txt`
Temporary location: `/tmp/codeyam/local-dev/{slug}/debug/original-logs.txt`

**Notice:** Both paths lead to "Recapture" and "Verify screenshots". There is no path that ends after just identifying a bug category. You must always capture quality screenshots before completing.

---

## MANDATORY: Session Context (Do This First!)

Long debugging sessions cause context loss. To prevent forgetting critical information:

### Step 1: Create Session Context File

At the **very start** of debugging, create `.codeyam/debug-session.md` in the **original project directory**:

```markdown
# Debug Session Context

## Key Locations

- **Original Repo**: [FULL PATH]
- **Tmp Folder**: /tmp/codeyam/local-dev/[PROJECT SLUG]/project
- **Database**: [Original Repo]/.codeyam/db.sqlite3
- **Logs**: /tmp/codeyam/local-dev/[PROJECT SLUG]/codeyam/log.txt

## IDs

- **Analysis ID**: [ID]
- **Scenario ID**: [ID]
- **Entity**: [NAME] at [FILE PATH]

## URLs (fill in after codeyam debug)

- **Scenario URL**: http://localhost:[PORT]/static/codeyam-sample
```

Re-read this file before running any `codeyam` command to avoid running commands from the wrong directory.

### Copy Original Logs

Copy logs before debugging overwrites them:

- **From:** `/tmp/codeyam/local-dev/{slug}/codeyam/logs.txt`
- **To:** `/tmp/codeyam/local-dev/{slug}/debug/original-logs.txt`

---

## Step 1: Check Database (MANDATORY FIRST STEP)

**DO NOT run `codeyam debug` yet!** First check if other scenarios in the same analysis are also failing.

```bash
# Get analysis ID (if you have a scenario ID)
sqlite3 .codeyam/db.sqlite3 "SELECT analysis_id FROM scenarios WHERE id = 'SCENARIO_ID'"

# Check ALL scenarios for that analysis
sqlite3 .codeyam/db.sqlite3 "
SELECT s.id, s.name, json_extract(s.metadata, '$.screenshotPaths') as screenshots
FROM scenarios s WHERE s.analysis_id = 'ANALYSIS_ID'"

# Check for errors in scenario status
sqlite3 .codeyam/db.sqlite3 "
SELECT json_extract(status, '$.scenarios') FROM analyses WHERE id = 'ANALYSIS_ID'"
```

**If multiple scenarios failing, ASK THE USER** whether to fix just the requested one or all.

### Check Existing Screenshots for Client-Side Errors

Even if screenshots exist, view them with the Read tool and check for:

- Red error boundaries or React error overlays
- "Something went wrong" or similar error text
- Blank/white screens that should have content

If the screenshot shows errors, proceed to Step 2.

---

## Step 2: Run Debug Command

```bash
codeyam debug ANALYSIS_ID
```

Output includes: **project path**, **start command**, **URL**, **log path**. Update your session context file with these.

---

## Step 3: Identify Error Type

Read the log file or error output to categorize:

| Error Type                         | Symptoms                            | Likely Category   |
| ---------------------------------- | ----------------------------------- | ----------------- |
| **Syntax error in generated file** | `Unexpected token`, `Parse error`   | Category 4        |
| **Runtime error**                  | `TypeError`, `ReferenceError`       | Category 1-3 or 4 |
| **Missing mock**                   | `Cannot read property of undefined` | Category 1-2      |
| **Wrong mock type**                | `X is not a function`               | Category 3-4      |

---

## Step 4: Diagnose Root Cause Category

Determine WHERE in the pipeline the bug originated.

### The 4 Error Categories

| Category | What's Wrong                                     | Where to Check       | Fix                 |
| -------- | ------------------------------------------------ | -------------------- | ------------------- |
| **1**    | Missing attribute in `isolatedDataStructure`     | `entities.metadata`  | Re-analyze          |
| **2**    | Attribute not merged into `mergedDataStructure`  | `analyses.metadata`  | Re-analyze          |
| **3**    | Data structure complete, but scenario data wrong | `scenarios.metadata` | Edit mockData in DB |
| **4**    | Data complete, but generated code wrong          | Files in `/tmp`      | Edit files directly |

### Diagnostic Queries

```bash
# Category 1: Check isolatedDataStructure
sqlite3 .codeyam/db.sqlite3 \
  "SELECT json_extract(metadata, '$.isolatedDataStructure') FROM entities WHERE sha = 'ENTITY_SHA'" \
  | python3 -m json.tool

# Category 2: Check mergedDataStructure
sqlite3 .codeyam/db.sqlite3 \
  "SELECT json_extract(metadata, '$.mergedDataStructure') FROM analyses WHERE id = 'ANALYSIS_ID'" \
  | python3 -m json.tool

# Category 2 (also): scenariosDataStructure
sqlite3 .codeyam/db.sqlite3 \
  "SELECT json_extract(metadata, '$.scenariosDataStructure') FROM analyses WHERE id = 'ANALYSIS_ID'" \
  | python3 -m json.tool

# Category 3: Check scenario mockData
sqlite3 .codeyam/db.sqlite3 \
  "SELECT json_extract(metadata, '$.data.mockData') FROM scenarios WHERE id = 'SCENARIO_ID'" \
  | python3 -m json.tool
```

### Diagnosis Flow

Work through these checks in order — stop at the first failure:

| Step | Check                                                                           | If wrong → |
| ---- | ------------------------------------------------------------------------------- | ---------- |
| 1    | **Start with the error** — what attribute/value is missing or wrong at runtime? | —          |
| 2    | Is the attribute in `isolatedDataStructure`?                                    | Category 1 |
| 3    | Is the attribute in `mergedDataStructure`?                                      | Category 2 |
| 4    | Is `scenariosDataStructure` correct?                                            | Category 2 |
| 5    | Does scenario `mockData` have correct values?                                   | Category 3 |
| 6    | Is the generated mock code syntactically/semantically correct?                  | Category 4 |
| 7    | Are imports correct? Environment variable entities mocked out?                  | Category 4 |

If all database data looks correct but the generated code has syntax errors, wrong structure, or doesn't match the data → **Category 4**.

---

## Step 5: Fix the Issue

Jump to the subsection matching your category:

- **Categories 1-2** → Re-analyze
- **Category 3** → Edit mockData in database
- **Category 4** → Edit generated files in tmp folder

### Categories 1-2 (Data Structure Issues)

Re-run analysis:

```bash
codeyam analyze --entity EntityName path/to/file.tsx
```

### Category 3 (Scenario Data Issues)

Fix mockData directly in the database:

```bash
# Export metadata
sqlite3 .codeyam/db.sqlite3 "SELECT metadata FROM scenarios WHERE id = 'SCENARIO_ID'" > /tmp/metadata.json

# Edit with Python
python3 << 'EOF'
import json
with open('/tmp/metadata.json') as f:
    data = json.loads(f.read())

# Fix the mockData
data['data']['mockData']['keyName'] = {"fixed": "value"}

with open('/tmp/metadata_fixed.json', 'w') as f:
    f.write(json.dumps(data))
EOF

# Update database
python3 << 'EOF'
import sqlite3, json
with open('/tmp/metadata_fixed.json') as f:
    metadata = f.read()
conn = sqlite3.connect('.codeyam/db.sqlite3')
conn.execute("UPDATE scenarios SET metadata = ? WHERE id = 'SCENARIO_ID'", (metadata,))
conn.commit()
conn.close()
EOF
```

### Category 4 (Code Generation Issues) — Edit Files Directly

Fix generated files in `/tmp/codeyam/local-dev/{slug}/project/`. Common locations:

- **Generated mocks**: `__codeyamMocks__/MockData_*.tsx` or `__codeyamMocks__/MockCode_*.tsx`
- **Scenario layouts**: `app/static/{projectSlug}/{analysisId}/{entitySlug}/{scenarioSlug}/`
- **Route files**: `app/routes/` or `pages/` depending on framework

Common fixes:

- Syntax errors (missing brackets, commas, quotes)
- Wrong import paths
- Missing named or default exports
- TypeScript type issues
- Wrong mock data shape

**Only fix GENERATED files** (mocks, layouts, routes) — never the client's application code. If a client component crashes, the fix is in the mock data or mock code.

### Universal Mocks (for infrastructure dependencies)

Use universal mocks to mock functions not in the dependency tree (middleware, startup functions needing env vars).

**Mock path decision tree:**

```
Error source?
├── node_modules package → .codeyam/universal-mocks/node_modules/{package}.ts
│   Example: .codeyam/universal-mocks/node_modules/@prisma/client.ts
└── Project file → .codeyam/universal-mocks/{same-path-as-original}
    Example: .codeyam/universal-mocks/lib/db.ts
```

**Mock writing rules:**

1. Read the original file first, note all export names exactly
2. Export names MUST match exactly (case-sensitive)
3. ALL code MUST be inside exports (no helper variables outside)
4. Keep it minimal — empty methods are fine
5. Validate: `codeyam validate-mock .codeyam/universal-mocks/{path}`

### Track All Changes (MANDATORY)

For every change, record for the final report:

**Database changes:**

| Table       | Record ID | Field Path                   | Before    | After       |
| ----------- | --------- | ---------------------------- | --------- | ----------- |
| `scenarios` | `abc123`  | `metadata.data.mockData.key` | `"wrong"` | `"correct"` |

**File changes:**

| File Path                                            | Change Description  |
| ---------------------------------------------------- | ------------------- |
| `/tmp/.../project/__codeyamMocks__/MockData_xyz.tsx` | Fixed missing comma |

Include actual diffs for file changes.

---

## Step 6: Verify Fix

### After Database Changes (Categories 1-3)

1. Re-run `codeyam debug ANALYSIS_ID` to regenerate files with updated data
2. Curl the URL to check for errors:
   ```bash
   curl -s http://localhost:PORT/static/codeyam-sample | head -50
   ```
3. Check for 200 response (no `statusCode:500`)

If verification fails after database fixes, proceed to fix files directly (Category 4 approach).

### After File Changes (Category 4)

**Do NOT run `codeyam debug` again** — it overwrites your changes.

1. Start the dev server manually from the tmp folder
2. Curl the URL to check for errors
3. For visual/rendering issues, ask the user to verify: _"Can you visit http://localhost:PORT/static/codeyam-sample and confirm the component renders correctly?"_

---

## Step 7: Recapture & Verify Screenshots

### Choose Recapture Mode

**Database-only changes:**

```bash
codeyam recapture SCENARIO_ID
```

**File changes (or mixed):**

```bash
codeyam recapture SCENARIO_ID --capture-only
```

### Verify Files Exist

```bash
sqlite3 .codeyam/db.sqlite3 "SELECT name, json_extract(metadata, '$.screenshotPaths') FROM scenarios WHERE analysis_id = 'ANALYSIS_ID'"
find .codeyam/captures -name "*.png" -path "*ANALYSIS_ID*" -mmin -5
```

### Visually Inspect Screenshots

Use the Read tool to view each screenshot. Check for:

- Red error boundaries or React error overlays
- "Something went wrong" or similar error text
- Blank/white screens that should have content
- Missing components or broken layouts

If the screenshot shows a dedicated 500 page with no clear error, consider commenting out error boundary logic to expose the real error.

**If screenshots show errors:** Go back to Step 5, check the log file (`tail -100 /tmp/codeyam/local-dev/{slug}/codeyam/log.txt`), fix remaining issues, and recapture again.

---

## Reference

### Debug Report Template

**Always produce this report** after debugging. Save to `.codeyam/debug-report.md`.

```markdown
## Debug Session Report

### Issue Summary

**Error:** `[Exact error message]`
**Entity:** `[Entity name]` in `[file/path.tsx]`
**Root Cause Category:** [1, 2, 3, or 4]
**Outcome:** [Fixed via database changes / Fixed via file edits (engine bug) / Unfixable]

### Affected Scenarios

| Scenario ID | Name     | Analysis ID     | Status               |
| ----------- | -------- | --------------- | -------------------- |
| `[id]`      | `[name]` | `[analysis-id]` | [Fixed / Engine bug] |

### Root Cause Category Determination

**Category identified:** [1 / 2 / 3 / 4]
**Evidence:**

- [ ] **Category 1** (isolatedDataStructure): [What was missing/wrong?]
- [ ] **Category 2** (mergedDataStructure): [What was missing/wrong?]
- [ ] **Category 3** (scenario mockData): [What was wrong in LLM-generated data?]
- [ ] **Category 4** (mock code writing): [What was wrong in generated code?]

**How determined:** [Explain what you checked. Include relevant JSON snippets.]

### Database Changes Made (if any)

| Table     | Record ID | Field Path | Before  | After   |
| --------- | --------- | ---------- | ------- | ------- |
| `[table]` | `[id]`    | `[path]`   | `[old]` | `[new]` |

**SQL/Python commands used:**
[Include exact commands]

### File Changes Made (if any)

| File Path                                                | Change Description  |
| -------------------------------------------------------- | ------------------- |
| `/tmp/codeyam/local-dev/{slug}/project/path/to/file.tsx` | [Brief description] |

**Diffs:**
[Include actual diffs]

**Recapture command used:**
`codeyam recapture SCENARIO_ID [--capture-only]`

### For Category 4 — Required Details

**What the data looks like (correct):** [database data structure]
**What the generated code looks like (wrong):** [problematic code]
**What the generated code should look like:** [correct code]
**Pattern/Edge case:** [Describe the pattern that causes this bug]

### Verification

- [ ] Scenario loads without errors (curl returns 200)
- [ ] Screenshots recaptured successfully
- [ ] Used `--capture-only` flag (if file changes were made)
- [ ] Screenshot files verified to exist on disk
- [ ] Screenshots visually inspected — no client-side errors visible
- [ ] All changes documented for CodeYam team
```

### Saving & Uploading Report

1. Save report to `.codeyam/debug-report.md`
2. Ask user: "Would you like me to upload this debug report to CodeYam for the team to review?"
3. If yes: `codeyam report --upload`

### Helper Queries

```bash
# Get scenario details
sqlite3 .codeyam/db.sqlite3 "SELECT id, analysis_id, name FROM scenarios WHERE id = 'ID'"

# Get entity for analysis
sqlite3 .codeyam/db.sqlite3 "SELECT e.name, e.file_path FROM entities e JOIN analyses a ON e.sha = a.entity_sha WHERE a.id = 'ANALYSIS_ID'"

# List all scenarios for an analysis
sqlite3 .codeyam/db.sqlite3 "SELECT id, name FROM scenarios WHERE analysis_id = 'ANALYSIS_ID'"

# Check for dependent analyses
sqlite3 .codeyam/db.sqlite3 "SELECT json_extract(metadata, '$.dependentAnalyses') FROM analyses WHERE id = 'ANALYSIS_ID'" | python3 -m json.tool
```
