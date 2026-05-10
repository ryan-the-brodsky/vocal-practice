---
name: codeyam-verify
autoApprove: true
description: |
  Use this skill after making code changes that impact application functionality.
  Automatically run simulations to verify your changes and present results to the user.
  Use when: You've completed making changes to visual components or library functions and are ready to present your work.

  NOTE: A Stop hook is installed that will remind you to use this skill if you made changes to .ts/.tsx/.jsx/.vue files during the session.
---

# CodeYam Verify Assistant

Use this skill to automatically verify code changes by running simulations and presenting results to the user.

## When to Use This Skill

**IMPORTANT: Use this skill automatically after making code changes that affect:**

- Visual components (React components, Vue components, UI elements)
- Library functions (exported functions, utility methods, business logic)
- Any other code that impacts application functionality

**You should invoke this skill:**

- After completing a set of code changes
- Before presenting your work to the user
- When you want to demonstrate the impact of your changes

**DO NOT use this skill for:**

- Documentation-only changes
- Type definition changes that don't affect runtime behavior
- Configuration file updates (unless they affect component behavior)

## Important: Permissions Already Configured

The `codeyam init` command has already auto-approved:

- ✅ All CodeYam CLI commands (including `codeyam verify`)
- ✅ All CodeYam skills
- ✅ All file operations in the `.codeyam/` directory

You can freely use the verify command without asking for permission.

## Workflow: Verifying Your Changes

When you're ready to present your changes to the user, follow this workflow:

### Step 1: Run the Verify Command

Execute the verify command to detect changed entities and launch the dashboard:

```bash
codeyam verify
```

**Optional: Provide Business Logic Context**

If you made business logic changes that require specific data to demonstrate, use the `--context` and `--scenario-count` flags:

```bash
codeyam verify \
  --context "Added warning icon that displays when status is 'deleted'. Create scenarios with status='deleted' to show the warning icon prominently" \
  --scenario-count 3
```

**When to provide context:**

- ✅ New feature that depends on specific data values (e.g., "show badge when count > 0")
- ✅ Conditional rendering added based on data (e.g., "warning icon when status is 'deleted'")
- ✅ Business logic changed in a way that specific data reveals the change (e.g., "empty state when array is empty")
- ❌ Pure refactoring (extracting components, renaming, reorganizing) - no context needed
- ❌ Style-only changes (colors, fonts, spacing) - no context needed
- ❌ Type safety improvements - no context needed

**Context format:**

1. Describe what changed (the new behavior)
2. Describe what data needs to be present/missing/specific to demonstrate it
3. Be specific about data values that trigger the behavior

**What this does:**

1. Scans your git working directory for changed files
2. Detects which entities (functions, components) were modified or added
3. Filters to only visual and library entities
4. Starts the CodeYam dashboard server (if not already running)
5. Opens your browser to the Git verification page
6. **If context provided**: Passes it to the analyzer to generate scenarios demonstrating the changes

### Step 2: Interpret the Results

The verify command will either:

**If NO visual or library entities changed:**

- The command exits with a message
- No further action needed
- Present your changes to the user normally

**If entities WERE changed:**

- The command lists all changed entities
- Opens the browser to http://localhost:3111/git
- The dashboard shows your changes with options to analyze them

### Step 3: Present Results to the User

After running `codeyam verify`, tell the user:

**Example message:**

```
I've completed the changes and kicked off simulations for the modified components.

Changed entities:
  • Button (visual) - components/Button.tsx
  • formatDate (library) - utils/formatters.ts

You can view the results and run simulations at: http://localhost:3111/git

On the Git page, you can:
  • View all changed entities
  • Click "Analyze All" to run simulations for all entities
  • Click "Analyze" on individual entities to run specific simulations
  • View real-time progress as analyses complete
```

## Complete Example

**User asks:** "Can you update the Button component to support a loading state?"

**Your workflow:**

1. Make the code changes to the Button component
2. BEFORE presenting to the user, invoke this skill
3. Run `codeyam verify` with context to demonstrate the new loading state
4. Present the changes to the user with the verification link

**Your response:**

```
I've updated the Button component to support a loading state. The changes include:
- Added a `loading` prop to the Button interface
- Display a spinner when loading is true
- Disable the button during loading

I've kicked off simulations to verify these changes with scenarios that show the loading state:

codeyam verify \
  --context "Added loading state to Button. Create scenarios with loading=true to show the spinner and disabled state" \
  --scenario-count 2

You can view the results at: http://localhost:3111/git

The simulations will show:
- Normal button state
- Loading button state with spinner
```

## Important Notes

- **Always run verify AFTER making changes** - not before, not during
- **The verify command only detects uncommitted changes** - changes that aren't yet committed to git
- **If no relevant entities changed** - the command will exit quickly and you can present your work normally
- **Simulations run in the background** - they may take 1-5 minutes to complete
- **Multiple entities can be analyzed at once** - use the "Analyze All" button on the Git page

## Integration with Your Workflow

Make this automatic part of your workflow:

1. User asks for code changes
2. You make the changes
3. **[NEW STEP]** You run `codeyam verify` to verify the changes
4. You present the changes to the user with the verification link

This ensures the user can always see simulation results for your changes, building trust and providing visual confirmation that the changes work as expected.
