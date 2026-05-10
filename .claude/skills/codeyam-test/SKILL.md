---
name: codeyam-test
autoApprove: true
description: |
  Use this skill to write comprehensive unit and integration tests using CodeYam's mock generation.
  Use when: User asks to write tests, generate mocks, understand function dependencies, or improve test coverage.
  This skill uses the `codeyam generate-data-structure` command to create realistic test mocks based on actual code analysis.
---

# CodeYam Testing Assistant

Use this skill to help users write comprehensive unit and integration tests for their code using CodeYam's dependency analysis and mock generation.

## When to Use This Skill

- User asks to write unit or integration tests
- User wants to generate Jest mocks for a function
- User needs help understanding function dependencies for testing
- User requests mock data for testing
- You see an opportunity to improve test coverage
- Testing complex functions with many dependencies

## Important: Permissions Already Configured

The `codeyam init` command has already auto-approved:

- ✅ All CodeYam CLI commands (including `codeyam generate-data-structure`)
- ✅ All CodeYam skills
- ✅ All file operations in the `.codeyam/` directory

You can freely use Read, Write, and Bash tools for CodeYam operations without asking for permission.

## Workflow: Writing Tests with CodeYam

### Step 1: Generate Mock Template

Use `codeyam generate-data-structure` to analyze the function and generate a mock template:

```bash
codeyam generate-data-structure --entity FunctionName path/to/file.ts
```

**What this does:**

1. Runs partial analysis (data structure only, no scenarios)
2. Discovers all function dependencies
3. Generates Jest mock template with proper types
4. Caches results for instant subsequent runs

**Optional flags:**

- `--json` - Output raw data structure for advanced use cases
- `--output path/to/output.ts` - Write to file instead of stdout

**Example:**

```bash
codeyam generate-data-structure --entity computeBranchEntityDiff codeyam-cli/src/webserver/app/lib/branchEntityComparison.ts
```

### Step 2: Understand the Analysis Output

The mock template shows:

- **Dependencies by module** - All external functions/imports
- **Mock declarations** - `jest.mock()` calls for each module
- **Return value templates** - Sample data for `mockReturnValue()`

**With `--json` flag, you get:**

```json
{
  "dataForMocks": {
    "getProjectRoot()": "/project/root",
    "getBranchDiffForProject(baseBranch, compareBranch)": [...]
  },
  "dependencySchemas": {
    "module/path": {
      "functionName": { "type": "object", "properties": {...} }
    }
  }
}
```

### Step 3: Write the Test

Use the generated template as a starting point:

**Key principles learned from experience:**

1. **Mock external dependencies only** - Let internal functions run
2. **Use realistic mock data** - Based on CodeYam's analysis
3. **Test behavior, not implementation** - Focus on what the function does
4. **Consider edge cases** - Added files, deleted files, empty results, etc.

**Example pattern:**

```typescript
// Mock external dependencies
jest.mock('path/to/module', () => ({
  externalFunction: jest.fn(),
}));

describe('FunctionName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
  });

  it('should handle normal case', () => {
    // Arrange: Setup mocks
    // Act: Call function
    // Assert: Verify behavior
  });

  it('should handle edge case', () => {
    // Test edge cases
  });
});
```

### Step 4: Run the Test

```bash
npx jest path/to/test.test.ts --verbose
```

### Step 5: Iterate

If tests fail:

1. Check mock data matches actual usage
2. Verify mock call counts (added files call extract once, modified call twice)
3. Ensure edge cases are handled
4. Use `jest.clearAllMocks()` between tests for isolation

## Common Testing Patterns

### Integration Tests

- Mock external dependencies (fs, child_process, imports)
- Let internal logic run naturally
- Test complete workflows

### Unit Tests

- Mock all dependencies
- Test single function in isolation
- Focus on edge cases and error handling

### Cache Testing

- Test both cache hit and miss scenarios
- Verify cache writes happen correctly
- Ensure cache reads prevent unnecessary work

## Tips from Experience

1. **Call counts matter** - Different file statuses call dependencies differently:
   - Modified files: extract entities from old AND new content (2 calls)
   - Added files: extract only from new content (1 call)
   - Deleted files: extract only from old content (1 call)

2. **Mock isolation** - Use `jest.clearAllMocks()` between tests to prevent interference

3. **Realistic data** - Use CodeYam's analysis to ensure mock data matches real usage patterns

4. **Test structure** - Organize by scenarios (cache hit, cache miss, edge cases)

## When NOT to Use This Skill

- User wants to simulate a component in the browser → Use **CodeYam Simulation** skill instead
- User wants to see visual screenshots of scenarios → Use **CodeYam Simulation** skill instead
- User asks to "analyze" or "simulate" an entity → Use **CodeYam Simulation** skill instead

---

**Remember**: This skill is for writing traditional unit/integration tests with Jest. For running CodeYam simulations with screenshots and scenarios, use the CodeYam Simulation skill.
