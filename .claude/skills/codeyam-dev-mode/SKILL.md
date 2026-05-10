---
name: codeyam-dev-mode
autoApprove: true
description: |
  Use this skill when working in CodeYam Dev Mode — an interactive environment for iterating on
  components and scenarios with a live preview panel alongside a Claude Code terminal.
  Use when: The embedded terminal in Dev Mode auto-invokes this skill to provide entity/scenario context.
---

# CodeYam Dev Mode

You are working inside CodeYam Dev Mode — a split-screen environment with this Claude Code terminal on the left and a live preview on the right.

## Step 1: Read Session Context

Read the dev mode context file to understand the current entity and scenario:

```
cat .codeyam/dev-mode-context.md
```

The context file contains all the specific paths you need — source file, mock data, dev server project, and **server log**. All paths are fully resolved; no placeholders to fill in.

## Step 2: Gather Context While Server Sets Up

The dev server needs time to set up the sandboxed project (copying files, installing deps, starting Vite). The mock data files in the tmp project **do not exist yet** when you first start. Use this time productively.

**Do these in parallel:**

1. **Read the source file** from the real repo (exists immediately).

2. **Query the database** for all scenarios belonging to this entity's analysis. Use the **Analysis ID** from the context file:

   ```
   sqlite3 .codeyam/db.sqlite3 "SELECT name, description FROM scenarios WHERE analysis_id = '<ANALYSIS_ID>'"
   ```

   Each scenario's `description` explains what data shape it tests — e.g. "empty list", "many items", "error state". This tells you what data attributes matter most for the component's visual states.

3. **Monitor the server log** listed in the context file under **Server log**:

   ```
   tail -f <server log path from context file>
   ```

   Wait until you see a local URL like `http://localhost:...` indicating the Vite server has started. Do NOT try to read mock data or other files from the tmp project until the logs confirm setup is complete.

## Step 3: Read Mock Data and Present Overview

Once the dev server is ready, read the **mock data file** from the tmp project path listed in the context file.

Then present a **concise** overview to the user:

1. **Component Summary** — 2-3 sentences on what the component does and the current scenario being previewed.

2. **Suggested Tests** — Compare the component's code paths (conditionals, edge cases, visual states) against the existing scenarios from the database. Recommend 2-4 specific ways to test the component that are **not yet covered** by saved scenarios. Focus on interesting visual states — e.g. "What does this look like with a very long title?", "What happens when the list is empty?", "How does the error state render?". Also suggest ways to enrich the _existing_ scenario's data to better exercise the component (more realistic content, populated optional fields, diverse values). Be specific to this component, not generic.

Keep it brief — no tables, no exhaustive attribute lists. The user can see the preview and wants actionable suggestions, not a data dump.

## How Dev Mode Works

**Layout:**

- **Left panel** — This Claude Code terminal (you)
- **Right panel** — Live preview iframe showing the rendered component/scenario

**Architecture:**

- The preview runs from a sandboxed project at the tmp path listed in the context file
- Source code edits in the real repo auto-sync to the preview via HMR (hot module replacement)
- Mock data files live in the tmp project under `__codeyamMocks__/`

**What you can edit:**

- **Source code** (the entity's file in the real repo) — edits sync automatically to the preview
- **Mock data** (the `MockData_*.tsx` file in the tmp project) — edits also sync via HMR
- Both types of edits show up in the preview almost instantly

**CRITICAL — What you must NEVER edit for functional changes:**

- **Shimmed component files** (`*_Scenario.tsx` in the tmp project) — these are auto-generated files that wire up the component with mocked dependencies. **NEVER modify these to change what renders.** Any functional changes you make here:
  - Will be lost when the scenario is recaptured or regenerated
  - Cannot be saved as a scenario (only mock data is persisted to the database)
  - Break the ability to reproduce the scenario in the future
- To change what the component displays, **always edit the `MockData_*.tsx` file**. The shimmed component reads mock data via `scenarios().data()` — that's the mechanism for controlling component behavior and visual state.
- The ONLY acceptable edit to a shimmed component file is adding temporary `console.log` statements for debugging (see Client-Side Logging below). Never change imports, state initialization, hooks, memos, or rendering logic.

## Workflow

1. Read the context file (`.codeyam/dev-mode-context.md`)
2. While dev server sets up, do in parallel:
   - Read the source file (from real repo — available immediately)
   - Query database for scenario names/descriptions (available immediately)
   - Monitor server log until dev server is ready
3. Read the mock data file (from tmp project — only after setup completes)
4. Present concise overview: component summary + suggested untested scenarios
5. Ask the user what they want to change
6. Make incremental edits to **source code or mock data only** — the preview updates live
7. After making changes, refresh the preview (curl command from context file)
8. Iterate based on user feedback

## Client-Side Logging (Required)

**Always add `console.log` statements to trace the execution flow when making changes.** This is critical — you cannot see the preview, so logging is your only way to verify the component renders as expected.

Client-side `console.log` and `console.error` calls are automatically captured by the `/api/client-log` endpoint and written to the server log file. This means you can add logging in component code and read it from the server log.

**When to add logging:**

- Before and after every change you make to the shimmed component or mock data
- At key data flow checkpoints: after state initialization, after useMemo computations, before the render return
- In useEffect callbacks to confirm they fire
- Around conditional branches you're targeting (e.g. "this condition should now be true")

**How to log:**

Add `console.log` with a `[CY-DEBUG]` prefix in the shimmed component file (the `*_Default_Scenario.tsx` file in the tmp project). **This is the ONLY acceptable edit to shimmed component files — temporary debug logging. Never change the component's logic, imports, state, or rendering in these files.**

```typescript
// After state declarations:
console.log(
  '[CY-DEBUG] render: myState:',
  myState?.length,
  'otherData:',
  otherData,
);

// Inside useEffect:
useEffect(() => {
  console.log('[CY-DEBUG] useEffect fired, setting data');
  // ...
}, []);

// Before return:
console.log(
  '[CY-DEBUG] PRE-RENDER: showThumbnails:',
  items?.length > 0,
  'showLoader:',
  !items,
);
```

**After refreshing, always check the log** for your `[CY-DEBUG]` lines:

```
tail -30 <server log path from context file>
```

If you don't see your debug logs but see `[CLIENT CONSOLE.ERROR]` or `Application Error`, the component is crashing before your code runs. Read the error stack trace to find the failing component.

**Keep logging in place** as you iterate — it costs nothing and saves significant debugging time.

## Refreshing the Preview

After making changes, refresh the live preview so it picks up your edits. The exact curl command is in the context file under **Server > Refresh preview** — copy and run it:

```
curl -s -X POST http://localhost:<port>/api/dev-mode-preview
```

**Always refresh after making changes.** This triggers the preview iframe to reload, **clears the server log file**, waits for the page to re-render, and then fetches the preview URL to check for SSR errors.

**The response includes preview health info.** Check the `preview` field in the JSON response:

```json
{
  "success": true,
  "sessionsNotified": 1,
  "logCleared": true,
  "preview": {
    "status": 200,
    "healthy": true
  }
}
```

If the preview is unhealthy (e.g., SSR error caught by an error boundary), the response will include the error:

```json
{
  "preview": {
    "status": 500,
    "healthy": false,
    "error": "ReferenceError: myVariable is not defined\n    at Component (/path/to/file.tsx:42:5)"
  }
}
```

**After every refresh:**

1. **Check `preview.healthy`** in the JSON response. If `false`, the `error` field contains the SSR error — fix it before proceeding.
2. **Check the log** for your `[CY-DEBUG]` lines to confirm the execution path:

```
tail -30 <server log path from context file>
```

If the preview was unhealthy, the log will also contain `[DEV-MODE-CHECK]` lines with the error details.

Look for your `[CY-DEBUG]` lines to confirm the execution path. If you see errors instead, the component is crashing. If you see nothing, the page may still be loading — wait a moment and check again.

## Debugging with Server Logs

The **Server log** path in the context file captures all output from the dev server process — Vite compilation errors, SSR errors, HMR updates, and runtime warnings. **Client-side errors** (React rendering errors, unhandled exceptions, console.error calls) are also automatically reported to this log via the `/api/client-log` endpoint. This means both server and client errors appear in the same log file.

Since the log is **cleared on every refresh**, you always see fresh output. No need to scroll past old errors.

**When to check the server log:**

- **After every refresh** — always verify your debug logs appear and no errors are present
- The preview shows a blank page, error boundary, or 500 error
- HMR updates aren't taking effect after edits
- The preview is stuck loading or shows unexpected content

**How to check:**

```
tail -50 <server log path from context file>
```

**What to look for:**

- `[CY-DEBUG]` — your trace logs confirming the execution path and data values
- `[CLIENT CONSOLE.ERROR]` — client-side React errors or unhandled exceptions
- `[vite]` error messages — TypeScript compilation failures
- `Application Error` — React error boundary activated (component crashed during render)
- No output at all — the page hasn't loaded yet, or the component never rendered

## Tips

- **NEVER modify shimmed component files** (`*_Scenario.tsx`) to change rendering behavior — only edit `MockData_*.tsx` files to change what the component displays. Shimmed components are auto-generated; functional changes to them won't persist and can't be saved as scenarios.
- **Refresh the preview frequently** — the user is watching the preview panel as you work. Make small changes, then refresh so they see visual progress. Don't batch multiple edits into one big refresh at the end. Aim for a refresh after every meaningful edit (new data values, layout changes, style tweaks).
- **Always add `[CY-DEBUG]` logging before refreshing** — never refresh without a way to verify the result
- Mock data files are TypeScript (`.tsx`) — they export scenario-specific props/data
- The database at `.codeyam/db.sqlite3` has entity and scenario metadata if you need deeper investigation
- If the preview breaks, check the server log (path in context file) for compilation or runtime errors
- You can also modify other files in the repo that the entity imports — those changes sync too
