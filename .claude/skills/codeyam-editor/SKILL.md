---
name: codeyam-editor
autoApprove: true
description: CodeYam Editor Mode — scaffold a project and build code + data scenarios together
---

# CodeYam Editor Mode

You are in **Editor Mode**. The user sees a split-screen: this terminal on the left, live preview on the right.

## CRITICAL: How This Works

You MUST follow a step-by-step workflow driven by `codeyam editor` commands. Each command tells you exactly what to do next. **You do NOT have all the instructions upfront** — the commands provide them incrementally.

**Your first action:** Run `codeyam editor steps`.

**The rule:** After completing what a command tells you to do, run the NEXT command it specifies. The commands are your instructions — follow them one at a time.

## TASK Directive

Some `codeyam editor N` commands output a `━━━ TASK ━━━` section with an `EXACT_TASK_TITLE:` line. When you see one:

1. Delete ALL existing tasks: run TaskList, then run TaskUpdate with status "deleted" for every task returned
2. Run TaskCreate with the EXACT title from the `EXACT_TASK_TITLE:` line — copy it character-for-character, do NOT paraphrase

This ensures only one task is ever visible. Do NOT create tasks on your own. Only create them when a `━━━ TASK ━━━` directive tells you to.

## Migration Mode

When `codeyam editor steps` shows **"Project Migration"** instead of "Feature Cycle", the project is being migrated from an existing codebase. Follow the `codeyam editor migrate` commands instead of the normal 13-step cycle.

Migration uses a different command set:

```
codeyam editor migrate        → Survey the project (explore pages, confirm order)
codeyam editor migrate 1-8    → Run migration step N for the current page
codeyam editor migrate next   → Advance to the next page
codeyam editor migrate status → Show migration progress
```

**The same rule applies:** run the command shown in the output, follow its checklist, then run the next command it specifies. Migration steps are 1-8 per page: Capture → Preview → Discuss → Decompose → Extract → Recapture → Journal → Present. Steps 4-6 (Decompose/Extract/Recapture) are optional — the user decides at step 3 whether to decompose or skip to step 7. After all pages are migrated, the project transitions to the normal feature cycle.

**IMPORTANT:** When `codeyam editor steps` tells you to run a `codeyam editor migrate` command, run THAT command — do NOT run `codeyam editor 1` or any other normal step command.

### Migration Survey (codeyam editor migrate)

When you run `codeyam editor migrate` with no arguments and no existing migration state, follow this survey checklist:

1. Read `package.json` — understand the framework, dependencies, and scripts
2. Explore the project structure — find all page/route files
   - Next.js App Router: `app/**/page.tsx` | Pages Router: `pages/**/*.tsx`
   - Check for other patterns: `src/` directory, custom routing, etc.
3. Read each page/route to assess complexity and data flow
4. Identify how the dev server starts (check `scripts` in package.json)
5. Note any environment variables, databases, or external services needed
6. Present a numbered list of all pages with:
   - Page name and route
   - File path
   - Complexity assessment (simple / moderate / complex)
7. Suggest a migration order — **start with the most complex pages** (dashboards, analytics, etc.) as they best demonstrate CodeYam's value and have rich decomposition opportunities
8. Wait for user confirmation of the order

**After user confirms**, write `.codeyam/migration-state.json`:

```json
{
  "status": "surveyed",
  "startedAt": "<ISO>",
  "completedAt": null,
  "pages": [
    {
      "name": "Home",
      "route": "/",
      "filePath": "app/page.tsx",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "extractedComponents": [],
      "extractedFunctions": [],
      "scenarioCount": 0
    }
  ],
  "currentPageIndex": 0,
  "sharedComponents": []
}
```

Then run: `codeyam editor migrate 1`

## The Cycle

Every feature follows 13 gated steps:

```
codeyam editor steps → Setup (if new) or cycle overview
codeyam editor 1    → Plan the feature (confirm with user)
codeyam editor 2    → Build a working prototype fast
codeyam editor 3    → Confirm prototype with user
codeyam editor 4    → Plan extraction (read code, list everything to extract)
codeyam editor 5    → Execute extraction (TDD for functions, extract components)
codeyam editor 6    → Record functions in glossary
codeyam editor 7    → Analyze and verify components
codeyam editor 8    → Create app-level scenarios
codeyam editor 9    → Create user-persona scenarios
codeyam editor 10   → Verify screenshots and check for errors
codeyam editor 11   → Create/update journal entry
codeyam editor 12   → Verify screenshots and audit
codeyam editor 13   → Present summary, get final approval
```

**You MUST run each command and follow its checklist before moving to the next.** Steps 1, 3, and 13 require user confirmation. After step 13, loop back to step 1.

## Handling User Feedback / Changes

When the user asks for changes — whether through the menu, a direct request, or even a question that implies a change (e.g., "Can the cards have images?") — you MUST run `codeyam editor change` **before** making any modifications. This includes:

- Code changes (components, routes, lib functions, styles)
- Scenario data updates (seed data, localStorage data, mock data)
- Style adjustments (CSS, Tailwind classes, layout tweaks)
- Even small fixes (typos, color tweaks, spacing)

This command gives you the post-change checklist (re-register scenarios, re-run tests, update journal, etc.). Never make changes without running the change workflow first.

**CRITICAL:** The change workflow MUST end with `codeyam editor 13`, which shows Working Session Results to the user. Skipping this step is a broken experience — the user will not see what changed and cannot approve or request further changes. Every change, no matter how small, must conclude with results being shown.

## Key Rules

- **Run the commands** — they ARE your instructions, not suggestions
- **One step at a time** — run each `codeyam editor N` command, read its FULL output, complete every checklist item, then advance. The CLI enforces a minimum time per step.
- **NEVER batch-run steps** — `for step in 5 6 7 8; do codeyam editor $step; done` or piping to `head` defeats the entire workflow. Each step has unique instructions you must read and follow.
- **NEVER delegate multiple steps to a subagent** — each step must be run, read, and completed in the main conversation. You MAY use subagents for parallelizable work _within_ a single step (e.g. extracting components + writing tests in step 5).
- **Every feature gets scenarios** — this is the core value of CodeYam
- **Always scaffold with a database** (Prisma + SQLite)
- **Build real API routes** — the proxy handles scenario data transparently
- **Start the dev server via the CodeYam API** — it handles proxy setup automatically
- **Keep the preview moving** — the user watches the preview panel as you work. Refresh it frequently so they see progress, not a static screen. See below.

## Keep the Preview Moving

The user is watching the live preview panel while you work. A static preview makes it feel like nothing is happening. **Refresh the preview after every meaningful change** — not just at the end of a step.

**During prototyping (step 2):**

- Refresh after creating the first visible page, even if it's bare
- Refresh after adding each major UI section (header, list, form, etc.)
- Refresh after seeding data so the user sees real content appear
- Refresh after styling changes so the user sees the visual progress

**During extraction (step 5):**

- Refresh after extracting each batch of components to confirm nothing broke

**During changes:**

- Refresh after each individual change, not after all changes are done

**How to refresh:**

```
codeyam editor preview '{"dimension":"<name from screenSizes>"}'
```

Navigate to a specific path or switch scenario:

```
codeyam editor preview '{"path":"/drinks/1","dimension":"<name from screenSizes>"}'
codeyam editor preview '{"scenarioId":"abc-123"}'
```

The goal: the user should see the preview update 4-8+ times during a typical building session, not just once at the end.

## Collaboration

Isolation routes are committed to git (not gitignored). They are protected by a layout guard at `app/isolated-components/layout.tsx` that returns `notFound()` in production, so they are safe to commit. Scenarios, screenshots, journal entries, and the glossary are also committed. Only the local database and secrets are gitignored.

When a collaborator clones the repo and runs `codeyam editor`, scenarios are auto-imported from `scenarios-manifest.json`. Run `codeyam editor sync` to manually re-sync after pulling new changes.

## Expo / React Native Projects

When working with an Expo project (tech stack `expo-react-native`):

- Use `<View>`, `<Text>`, `<ScrollView>`, `<Pressable>` from `react-native` — **never use HTML elements** (`<div>`, `<span>`, `<h1>`, etc.)
- Do NOT use `'use client'` — this is a Next.js directive that has no meaning in Expo
- Do NOT import from `next/navigation`, `next/router`, or any `next/*` package
- Use `expo-router` for navigation: `useRouter()`, `useLocalSearchParams()`, `<Link>`
- Use `@/lib/theme` for all design tokens — not CSS custom properties (`var(--token)` does not work in React Native)
- AsyncStorage maps to localStorage on web — CodeYam's `localStorage` injection in scenarios works automatically
- Test with `npx jest`, not `npx vitest`
- Isolation routes use Expo Router: `app/isolated-components/ComponentName.tsx` (not a `/page.tsx` subdirectory)
- Capture wrappers use `nativeID="codeyam-capture"` (not `id="codeyam-capture"`) — `nativeID` maps to `id` on web
- The preview renders via react-native-web in a browser — some visual differences from native devices are expected (fonts, SafeAreaView, shadows). See `MOBILE_SETUP.md` for details.

## Quick Reference

```bash
# Register component scenario (auto-captures screenshot)
# ALWAYS include "dimensions" — use the project's default screen size name from setup
codeyam editor register '{"name":"DrinkCard - Default","componentName":"DrinkCard","componentPath":"app/components/DrinkCard.tsx","url":"/isolated-components/DrinkCard?s=Default","dimensions":["<name from screenSizes>"],"mockData":{"routes":{"/api/...":{"body":[...]}}}}'

# Register app scenario with seed data (ALWAYS include "url" and "dimensions")
codeyam editor register '{"name":"Full Catalog","type":"application","url":"/","dimensions":["<name from screenSizes>"],"seed":{"drinks":[...]}}'

# Register app scenario with localStorage (for apps using client-side storage instead of a database)
codeyam editor register '{"name":"Full Library","type":"application","url":"/","dimensions":["<name from screenSizes>"],"localStorage":{"articles":[...],"collections":[...]}}'

# BULK REGISTRATION (preferred — register all scenarios at once):
# Write an array of scenarios to a temp file, then register with @ prefix.
# This is faster and avoids repeated screenshot capture overhead.
# File format: [{"name":"...","type":"...","url":"...","seed":{...}}, ...]
codeyam editor register @.codeyam/tmp/scenarios.json

# Single scenario from file (for large seed/localStorage data):
codeyam editor register @/tmp/scenario-data.json

# Journal entry (one per feature, references scenario names)
codeyam editor journal '{"title":"...","type":"feature","description":"..."}'

# Update journal with commit info
codeyam editor journal-update '{"time":"...","commitSha":"...","commitMessage":"..."}'

# Refresh preview / navigate / switch scenario (ALWAYS include "dimension")
codeyam editor preview '{"dimension":"<name from screenSizes>"}'
codeyam editor preview '{"path":"/drinks/1","dimension":"<name from screenSizes>"}'
codeyam editor preview '{"scenarioId":"abc-123"}'

# Show/hide results panel
codeyam editor show-results
codeyam editor hide-results

# Commit feature
codeyam editor commit '{"message":"feat: Add drinks page"}'

# Restart dev server (only for config/dependency changes)
codeyam editor dev-server '{"action":"restart"}'

# Check for client-side errors
codeyam editor client-errors

# Verify all images load (extracts URLs from pages, HTTP-checks each one)
codeyam editor verify-images '{"paths":["/","/drinks/1"]}'

# Sync scenarios from manifest (after pulling collaborator changes)
codeyam editor sync
```
