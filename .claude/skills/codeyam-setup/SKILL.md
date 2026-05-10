---
name: codeyam-setup
autoApprove: true
description: |
  Use this skill when the user asks to "setup CodeYam" or needs to configure CodeYam for their project.
  This skill guides you through:
  - Configuring the dev server start command
  - Creating a sandbox to iterate on startup fixes directly
  - Writing universal mocks for dependencies that prevent startup
  - Identifying and mocking authentication logic that could block simulations
  - Verifying with test-startup at the end
  Use when: User runs `codeyam init` and wants to complete the setup process
---

# CodeYam Setup Assistant

## Quick Reference: Mock Path Decision Tree

```
Where is the error coming from?
│
├── node_modules package (e.g., @prisma/client, @supabase/supabase-js)
│   └── Mock path: .codeyam/universal-mocks/node_modules/{package}.ts
│       Example: .codeyam/universal-mocks/node_modules/@prisma/client.ts
│
└── Project file (e.g., lib/db.ts, packages/prisma/index.ts)
    └── Mock path: .codeyam/universal-mocks/{same-path-as-original}
        Example: .codeyam/universal-mocks/lib/db.ts
        Example: .codeyam/universal-mocks/packages/prisma/index.ts
```

## Quick Reference: Mock Writing Rules

**BEFORE writing any mock:**

1. Read the original file first
2. Note all its export names exactly

**WHEN writing the mock:**

1. Export names MUST match exactly (case-sensitive)
2. ALL code MUST be inside exports (no helper variables outside)
3. Keep it minimal - empty methods are fine

**AFTER writing the mock:**

```bash
codeyam validate-mock .codeyam/universal-mocks/{path-to-your-mock}
```

---

## Setup Workflow

### Step 0: Ensure Simulation Infrastructure

Before configuring the dev server or mocks, ensure the simulation infrastructure is installed.

```bash
codeyam setup-simulations
```

This is **idempotent** — if already set up, each step is detected and skipped. On first run it installs analyzer dependencies, Playwright chromium, and creates baseline entities (several minutes). Subsequent runs complete in seconds.

If it fails with "No web applications found", the project doesn't support simulations — inform the user and stop.

### Step 1: Configure Webapp Start Command

**ACTION 1:** Read configuration files:

- `.codeyam/config.json` - get webapps array
- Root `package.json` - find start scripts
- Each webapp's `package.json` - find direct scripts

**ACTION 2:** Identify start commands for each webapp:

Look for scripts that start the dev server. Priority order:

1. Root convenience scripts: `"dev": "cd apps/web && pnpm dev"`
2. Webapp's own scripts: `"dev": "next dev"` or `"dev": "remix dev"`

**ACTION 3:** Ask user which webapp(s) to configure:

Use `AskUserQuestion` with `multiSelect: true` to let the user choose which webapp(s) to set up:

```
I found [N] webapp(s) in your project. Which would you like to configure for CodeYam?

Options (select one or more):
□ [Framework] at [path] - Start: `[command]`
□ [Framework] at [path] - Start: `[command]`
□ All webapps
```

**Note:** For projects with a single webapp, you may skip this and proceed directly. For multi-webapp projects, always ask.

**ACTION 4:** Determine the correct start command with port

The startCommand must include a `$PORT` placeholder that CodeYam will substitute at runtime.

**IMPORTANT:** Commands always run from the **project root**, not the webapp directory. For webapps in subdirectories, you must ensure the command can run from root.

**Option A: Root has a convenience script (recommended)**

If the root `package.json` has a script that chains to the webapp:

```json
// Root package.json
"scripts": {
  "dev": "cd dashboard && pnpm dev"
}
```

Then test from root:

```bash
# From project root - this should work
pnpm dev --port 9999
```

**Option B: No root script - use shell command**

If there's no root convenience script, use `sh -c` to change directory:

```bash
# Test this from project root
sh -c "cd dashboard && pnpm dev --port 9999"
```

Config for this approach:

```json
"startCommand": {
  "command": "sh",
  "args": ["-c", "cd dashboard && pnpm dev --port $PORT"]
}
```

**Option C: Using PORT env var**

Some frameworks read from PORT environment variable:

```bash
PORT=9999 pnpm dev
```

**AVOID the `--` separator** - it often breaks with nested/chained commands like `cd dashboard && pnpm dev -- --port 9999`.

**ACTION 5:** Update `.codeyam/config.json` with the working startCommand including `$PORT`:

**IMPORTANT: Valid framework values are:** `Remix`, `Next`, `NextPages`, `CRA`, `Unknown`

React Router 7 apps should use `"framework": "Remix"` (React Router 7 is the successor to Remix and uses the same
architecture).

**For webapps at root OR with root convenience script:**

```json
"startCommand": {
  "command": "pnpm",
  "args": ["dev", "--port", "$PORT"]
}
```

**For webapps in subdirectory without root script:**

```json
"startCommand": {
  "command": "sh",
  "args": ["-c", "cd <webapp-path> && pnpm dev --port $PORT"]
}
```

**For env var approach:**

```json
"startCommand": {
  "command": "pnpm",
  "args": ["dev"],
  "env": { "PORT": "$PORT" }
}
```

**ACTION 6:** Sync to database:

```bash
codeyam update-config
```

### Step 2: Setup Sandbox and Fix Startup Errors

After configuring startCommands, create a sandbox to iterate on fixes directly.

**2A. Tell the user what's happening**

Before running `setup-sandbox`, inform the user:

```
Now I need to test that your app can start without real environment variables and
no access to external services such as the database.

I'll clone your project to a temporary directory and try running the dev server.
Any code that fails due to missing env vars or external dependencies will need
to be mocked. This may take a few iterations.
```

**2B. Create the sandbox**

```bash
codeyam setup-sandbox
```

This:

- Copies the project to `/tmp/codeyam/local-dev/{slug}/project`
- Sanitizes env files (replaces real values with dummies)
- Applies any existing universal mocks
- Shows start commands for each webapp

**2C. Start a server in the sandbox**

Use one of the start commands shown by setup-sandbox. Run in background:

```bash
cd /tmp/codeyam/local-dev/{slug}/project && pnpm dev --port 9999 &
```

**2D. Test the page**

```bash
curl http://localhost:9999
```

Or use WebFetch to see the response and any errors.

**2E. Fix ALL errors in the sandbox first**

**IMPORTANT:** Fix all errors directly in the sandbox before writing anything to `.codeyam/universal-mocks/`. This is more efficient than re-running `setup-sandbox` after each fix.

**Iteration loop (stay in sandbox):**

1. **Read the error** to identify the failing file (look for file paths in stack traces)
2. **Read the file** in the sandbox: `/tmp/codeyam/local-dev/{slug}/project/{path}`
3. **Edit the file** in the sandbox to fix the error with minimal mock code
4. **Restart the server**: `pkill -f "next dev\|remix dev\|vite" ; cd /tmp/codeyam/local-dev/{slug}/project && <start-command> &`
5. **Test again** with curl/fetch
6. **Repeat steps 1-5** for each new error until the page loads successfully

**Once the page loads successfully in the sandbox:**

7. **Write ALL fixes** to `.codeyam/universal-mocks/{path}` in the original project
8. **Validate each mock**: `codeyam validate-mock .codeyam/universal-mocks/{path}`
9. **Re-run setup-sandbox** to verify mocks apply correctly: `codeyam setup-sandbox`
10. **Start server and test** one more time to confirm

**Key principles for fixes:**

- Only modify CODE files (.ts, .tsx, .js, .jsx), never config files
- Mock at the source (the function that fails, not its callers)
- Keep fixes minimal - replace functions/methods with simple return values
- Match the expected return type (null, [], {}, etc.)
- Track which files you modified in the sandbox so you can write them all to universal-mocks at the end

**2F. Environment Variables (if needed)**

For errors about missing env vars (e.g., `NEXT_PUBLIC_API_URL is undefined`), add them to `.codeyam/config.json`:

```json
"environmentVariables": [
  {
    "key": "NEXT_PUBLIC_API_URL",
    "value": "http://localhost:3000"
  }
]
```

Then run `codeyam update-config` to sync. These are safe dummy values.

### Step 3: Final Verification

Once all webapps work in the sandbox AND fixes have been written to `.codeyam/universal-mocks/`:

**Test each webapp with test-startup:**

```bash
codeyam test-startup --webappPath <path> --debug
```

This verifies the mocks work correctly in the standard CodeYam flow.

**ALL webapps must pass test-startup before proceeding to Step 4.**

### Step 4: Identify and Mock Authentication Logic

Even with a successful `test-startup`, authentication logic can block individual component simulations. Proactively search for and mock auth patterns.

**4A. Search for common auth patterns**

Look for these patterns in the codebase:

```bash
# Auth middleware
grep -r "middleware" --include="*.ts" --include="*.tsx" | grep -i "auth\|session\|token"

# Auth packages in use
grep -r "@clerk\|next-auth\|@auth0\|lucia\|passport" package.json

# Auth hooks and HOCs
grep -rn "useAuth\|useSession\|useUser\|withAuth\|requireAuth" --include="*.ts" --include="*.tsx"

# Route protection patterns
grep -rn "getServerSideProps.*session\|loader.*auth\|redirect.*login" --include="*.ts" --include="*.tsx"
```

**4B. Common auth packages that need mocks**

| Package               | Mock Location                         | Key Exports                                                  |
| --------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `@clerk/nextjs`       | `node_modules/@clerk/nextjs.ts`       | `auth`, `currentUser`, `ClerkProvider`, `useAuth`, `useUser` |
| `next-auth`           | `node_modules/next-auth.ts`           | `getServerSession`, `useSession`, `SessionProvider`          |
| `@auth0/nextjs-auth0` | `node_modules/@auth0/nextjs-auth0.ts` | `getSession`, `withPageAuthRequired`                         |
| `lucia`               | `node_modules/lucia.ts`               | `Lucia`, `validateRequest`                                   |

**4C. Create auth mocks even if startup succeeded**

For each auth package found, create a universal mock. Example for `@clerk/nextjs`:

```typescript
// .codeyam/universal-mocks/node_modules/@clerk/nextjs.ts
export const auth = () => ({
  userId: null,
  sessionId: null,
  getToken: async () => null,
});
export const currentUser = async () => null;
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
});
export const useUser = () => ({
  isLoaded: true,
  isSignedIn: false,
  user: null,
});
export const ClerkProvider = ({ children }: any) => children;
export const SignedIn = ({ children }: any) => null;
export const SignedOut = ({ children }: any) => children;
```

**4D. Check for project-specific auth wrappers**

Many projects wrap auth in local utilities. Search for:

```bash
grep -rn "export.*auth\|export.*session\|export.*getUser" lib/ utils/ src/lib/ src/utils/ --include="*.ts"
```

If found (e.g., `lib/auth.ts`), create a mock at `.codeyam/universal-mocks/lib/auth.ts` that returns null/unauthenticated state.

**4E. Validate all auth mocks**

```bash
codeyam validate-mock .codeyam/universal-mocks/node_modules/@clerk/nextjs.ts
codeyam validate-mock .codeyam/universal-mocks/lib/auth.ts
# etc.
```

**Note:** The goal is to ensure all auth checks return an "unauthenticated" state so components render their logged-out or loading states during simulation.

### Step 5: Success

Once `test-startup` passes for ALL webapps:

1. Run `codeyam suggest --limit 1 --verbose` (timeout: 5 minutes)
2. Tell user CodeYam is ready
3. Offer to simulate the suggested component

---

## Mock Examples

### Example: Prisma Client

Original at `packages/prisma/index.ts`:

```typescript
export const prisma = new PrismaClient();
export default prisma;
```

Mock at `.codeyam/universal-mocks/packages/prisma/index.ts`:

```typescript
export const prisma = {
  $connect: async () => {},
  $disconnect: async () => {},
  $transaction: async (fn: any) => (typeof fn === 'function' ? fn(prisma) : []),
  user: {
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => ({}),
  },
} as any;

export default prisma;
```

### Example: Supabase Client

Original at `lib/supabase.ts`:

```typescript
export const supabase = createClient(url, key);
```

Mock at `.codeyam/universal-mocks/lib/supabase.ts`:

```typescript
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
  }),
} as any;
```

### Example: Node Module Mock (@clerk/nextjs)

For `@clerk/nextjs`, create `.codeyam/universal-mocks/node_modules/@clerk/nextjs.ts`:

```typescript
export const auth = () => ({
  userId: null,
  sessionId: null,
  getToken: async () => null,
});
export const currentUser = async () => null;
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
});
export const useUser = () => ({
  isLoaded: true,
  isSignedIn: false,
  user: null,
});
export const ClerkProvider = ({ children }: any) => children;
export const SignedIn = ({ children }: any) => null;
export const SignedOut = ({ children }: any) => children;
```

### Example: Node Module Mock (next-auth)

For `next-auth`, create `.codeyam/universal-mocks/node_modules/next-auth.ts`:

```typescript
export const getServerSession = async () => null;
export const useSession = () => ({ data: null, status: 'unauthenticated' });
export const SessionProvider = ({ children }: any) => children;
export const signIn = async () => ({ ok: false, error: null });
export const signOut = async () => ({ url: '/' });
export default { getServerSession };
```

For `next-auth/react`, create `.codeyam/universal-mocks/node_modules/next-auth/react.ts`:

```typescript
export const useSession = () => ({ data: null, status: 'unauthenticated' });
export const SessionProvider = ({ children }: any) => children;
export const signIn = async () => ({ ok: false, error: null });
export const signOut = async () => ({ url: '/' });
export const getSession = async () => null;
```

### Example: Node Module Mock (lucia)

For `lucia`, create `.codeyam/universal-mocks/node_modules/lucia.ts`:

```typescript
export class Lucia {
  createSession = async () => ({ id: null });
  validateSession = async () => ({ user: null, session: null });
  invalidateSession = async () => {};
  createSessionCookie = () => ({ serialize: () => '' });
  createBlankSessionCookie = () => ({ serialize: () => '' });
}

export const validateRequest = async () => ({ user: null, session: null });
```

---

## Troubleshooting

### "Entity not found" / Duplicate exports

**Symptom:** Warning about entity not found, then duplicate export error

**Cause:** Mock export name doesn't match original file's export name

**Fix:**

1. Run `codeyam validate-mock .codeyam/universal-mocks/{path}`
2. Check the "originalExports" in the output
3. Rename your mock's export to match exactly

### "Module has no exports"

**Symptom:** Mock file appears empty or has no exports

**Cause:** Non-exported helper variables were used

**Fix:** Inline everything directly in exports:

```typescript
// ❌ BAD - helper gets dropped
const mockMethods = { findFirst: async () => null };
export const prisma = { user: mockMethods };

// ✅ GOOD - all inline
export const prisma = {
  user: { findFirst: async () => null },
} as any;
```

### "File not found" for mock

**Symptom:** Mock path doesn't match any original file

**Cause:** Wrong path in `.codeyam/universal-mocks/`

**Fix:** Mock path must mirror original exactly:

- Original: `packages/prisma/index.ts`
- Mock: `.codeyam/universal-mocks/packages/prisma/index.ts`

### Error persists after creating mock

**Cause:** Different error, or mock didn't apply correctly

**Fix:**

1. Check `/tmp/codeyam/local-dev/{slug}/project/{file}` to see if mock was applied
2. Run `codeyam validate-mock` to check for issues
3. The error message may be from a different file - trace carefully

---

## Key Principles

1. **Mock at the source** - If `getConfig()` fails because `findProjectRoot()` returns null, mock `findProjectRoot`, not every function that calls it.

2. **Read before write** - Always read the original file before creating a mock.

3. **Validate before retry** - Use `codeyam validate-mock` to catch issues before running test-startup again.

4. **Keep mocks minimal** - Empty methods and null returns are usually enough. The goal is to provide a simple mock with a structurally accurate return value. Do not import anything for mocks. Keep the mock simple.

5. **Match exports exactly** - Export names are case-sensitive and must match the original.

---

## Success Criteria

Setup is complete when:

- ✅ `webapps` configured in `.codeyam/config.json` with startCommand **including `$PORT` placeholder**
- ✅ Sandbox created and all webapps start successfully with fixes applied
- ✅ All fixes written to `.codeyam/universal-mocks/`
- ✅ `codeyam test-startup --webappPath <path> --debug` passes for ALL webapps
- ✅ Authentication logic identified and mocked (even if startup succeeded)
- ✅ User knows how to use CodeYam (analyze, test)

**CRITICAL:** The startCommand must include `$PORT` in the args (e.g., `["dev", "--port", "$PORT"]`) or env (e.g., `{"PORT": "$PORT"}`). Without this, CodeYam cannot start the server on the required port for capture.

## Wrap It Up

- Always end by presenting the user with a basic overview of CodeYam

```
CodeYam is set up!

You can now:

- Open the CodeYam dashboard: run `codeyam` or ask me to open it for you
- Simulate any function or method in your project. Just ask me to `simulate [NAME OF FUNCTION OR METHOD]`
- Ask me to test any function or method and I will be able to write tests more easily using the generated data structure CodeYam provides.

To start how about simulating [FILE PATH AND ENTITY NAME OF SUGGESTED COMPONENT]?

Do you want me to simulate that now?
```
