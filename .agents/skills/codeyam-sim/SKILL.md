---
name: codeyam-sim
autoApprove: true
description: |
  Use this skill to create interactive simulations of components and functions using CodeYam's analysis.
  Use when: User asks to simulate/analyze a component, generate scenarios, see visual output with screenshots,
  or demonstrate code behavior. This skill runs full CodeYam analysis with scenario capture and visual results.
---

# CodeYam Simulation Assistant

Use this skill to help users create interactive simulations of their code using CodeYam's full analysis pipeline, including scenario generation, data capture, and screenshot visualization.

## When to Use This Skill

- User asks to "simulate" or "analyze" a component/function
- User wants to see visual output with screenshots
- User requests scenario generation
- User wants to demonstrate code behavior interactively
- User mentions viewing results in a browser
- You want to show how code behaves with different data states

## Important: Permissions Already Configured

The `codeyam init` command has already auto-approved:

- ✅ All CodeYam CLI commands (including `codeyam analyze`, `codeyam entities`, etc.)
- ✅ All CodeYam skills
- ✅ Read/Write operations for `.codeyam/ai-requests/` and `.codeyam/ai-responses/` directories
- ✅ All file operations in the `.codeyam/` directory

You can freely use Read, Write, and Bash tools for CodeYam operations without asking for permission.

## AI Mode: Automatic Detection

CodeYam automatically detects the best AI mode based on your configuration:

### Mode Detection (Automatic)

CodeYam checks in this priority order:

1. **Direct API Mode**: If an API key is found → uses Anthropic API directly
   - Project: `.codeyam/secrets.json` (highest priority)
   - Home: `~/.codeyam/secrets.json` (shared across projects)
   - Environment variables
2. **Codex CLI Mode**: If no API key AND `.Codex` folder exists → uses Codex CLI
3. **Error**: If neither is found → provides helpful error message

### Codex CLI Mode (Default for Codex Users)

- **What it is**: CodeYam calls `Codex -p` (headless Codex) for all AI requests
- **Authentication**: Uses your existing Codex authentication automatically
- **When used**: Automatically when using CodeYam from Codex (`.Codex` folder detected)
- **How it works**:
  1. Run `codeyam analyze --entity ComponentName 'path/to/file.tsx'`
  2. When analyzer needs AI (key attributes, scenarios, data), it executes: `Codex -p "prompt" --output-format json`
  3. Codex CLI returns response
  4. Analyzer continues automatically until complete
- **User experience**: Fast, fully autonomous, zero setup, zero API keys

### Direct API Mode

- **What it is**: CodeYam calls Anthropic API directly for AI requests
- **When used**: Automatically when an API key is found in:
  - `~/.codeyam/secrets.json` (recommended - shared across projects)
  - `.codeyam/secrets.json` (project-specific override)
  - Environment variables
- **Setup**: Add your API key to `~/.codeyam/secrets.json`:
  ```json
  {
    "ANTHROPIC_API_KEY": "sk-ant-..."
  }
  ```
- **Benefits**: Faster, can run in background without Codex

### No Manual Mode Selection Required!

**Mode is detected automatically** - you never need to specify which mode to use:

- ✅ No `--Codex-cli` flag needed
- ✅ Works seamlessly in Codex (`.Codex` folder detected)
- ✅ API keys take precedence if configured
- ✅ Clear error if neither mode is available

## ⚠️ CRITICAL: User Interruption Protocol

**If the user interrupts with "[Request interrupted by user]":**

- ❌ **STOP ALL PROCESSING IMMEDIATELY** - Do not continue processing AI requests
- ❌ Do not read any more AI request files
- ❌ Do not write any more AI response files
- ❌ Do not poll BashOutput anymore
- ✅ Wait for user instructions
- ✅ **ONLY resume processing if the user explicitly asks you to continue**
- ✅ If resuming, check for any unprocessed requests and continue from where you stopped

**Why this matters**: The user may be debugging, updating code, or needs to stop the process. Continuing to process requests after interruption can cause confusion and wastes tokens.

## Workflow: Simulating a Component

When a user asks to simulate a component (e.g., "simulate BranchIndicator"), **ALWAYS follow this complete workflow**:

### Step 1: Search for the Entity

**IMPORTANT**: Never skip this step! Even if you think you know where the entity is, always search first to get the exact entity name and file path.

Use the `codeyam entities` command to find matching entities:

```bash
codeyam entities ComponentName
```

This will return all entities matching that name with their file paths.

### Step 2: Handle Results

**If SINGLE match found:**

- Automatically proceed to Step 3 with that entity
- No need to ask the user which one

**If MULTIPLE matches found:**

- Present the list to the user
- Ask which file path they want to simulate
- Example: "I found 3 entities named 'Button'. Which one would you like to simulate?"
  - Button in components/ui/Button.tsx
  - Button in legacy/Button.tsx
  - Button in admin/Button.tsx

**If NO matches found:**

- Inform the user the entity wasn't found
- Suggest they check the entity name or file path

### Step 3: Run Analysis

Once you have the specific entity and file path, run the analysis. CodeYam automatically detects whether to use Codex CLI or direct API mode:

**ACTION 1:** Ensure the CodeYam server is running:

```bash
codeyam start
```

This will start the server if it's not already running. If it's already running, it will just confirm that.

**ACTION 2:** Run the analysis in the background:

```bash
codeyam analyze --entity ComponentName 'path/to/file.tsx'
```

**Optional: Provide Business Logic Context**

If you just made changes to business logic that require specific data to demonstrate, use the `--context` and `--scenario-count` flags:

```bash
codeyam analyze --entity ComponentName 'path/to/file.tsx' \
  --context "Added warning icon that displays when status is 'deleted'. Create a scenario with status='deleted' to show the warning icon prominently" \
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

**Good examples:**

- "Added notification badge that appears when unreadCount > 0. Create a scenario with unreadCount=5 to show the badge"
- "Updated empty state to show when items array is empty. Create a scenario with an empty array to demonstrate the empty state"
- "Added warning icon for deleted files. Create a scenario with status='deleted' to show the warning icon"

**Bad examples:**

- ❌ "New filtering feature: when 'showErrors' prop is true, only display files with errors" (describes the logic, not what data to provide)
- ❌ "Refactored to use union types" (no business logic change)
- ❌ "Updated colors to match design system" (style-only)

**Instructions:**

1. Run the command with `run_in_background: true` and `timeout: 600000` (10 minutes)
2. Extract the entity SHA from the `codeyam entities` output (Step 1) - it's the first column in the results
3. Tell user: "I've started the CodeYam analysis. Depending on the complexity of the analysis it might take between 1 and 5 minutes. Then your browser will open automatically with the results."
4. Provide the progress link: "You can watch the real-time analysis progress at: http://localhost:3111/entity/{entitySha}"
5. **That's it! Do nothing else.** Don't poll output, don't monitor progress, don't check status.

The analysis runs autonomously using `Codex -p` (headless Codex) and opens the browser when complete.

**What happens**:

1. Background process analyzes the entity and generates data scenarios
2. Background process launches the project server and captures the results
3. Browser automatically opens with results

The browser will show:

- All generated scenarios
- Screenshots for each scenario (for visual components)
- Data structures and mock data
- Any errors encountered

## When NOT to Use This Skill

- User wants to write unit/integration tests → Use **CodeYam Testing** skill instead
- User asks for Jest mocks or test templates → Use **CodeYam Testing** skill instead
- User wants to run `codeyam generate-data-structure` → Use **CodeYam Testing** skill instead

---

**Remember**: CodeYam analyzes your code to discover real data scenarios and usage patterns. The analysis runs autonomously and provides comprehensive visual documentation of component behavior.
