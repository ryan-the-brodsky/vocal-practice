#!/usr/bin/env node
// Gathers deprecation signals from package.json, source markers, and git history.
// Outputs structured JSON to /tmp/codeyam-memory/deprecated-scan.json

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ripgrepSearch } from '../lib/ripgrep-fallback.mjs';

const OUTPUT_DIR = '/tmp/codeyam-memory';
const OUTPUT_FILE = join(OUTPUT_DIR, 'deprecated-scan.json');
await mkdir(OUTPUT_DIR, { recursive: true });

// --- Dependency scan ---
// Collect all dependency names from package.json files
const allDeps = new Set();
const packageFiles = await findFiles('.', 'package.json', ['node_modules', 'dist', '.next']);

for (const pkgPath of packageFiles) {
  try {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
    for (const key of ['dependencies', 'devDependencies']) {
      if (pkg[key] && typeof pkg[key] === 'object') {
        for (const dep of Object.keys(pkg[key])) allDeps.add(dep);
      }
    }
  } catch {
    // Skip unparseable package.json
  }
}

const dependencies = [...allDeps].sort();

// --- Explicit marker scan ---
let explicitMarkers = [];

const markerOutput = await ripgrepSearch(
  '@deprecated|// legacy|// deprecated|// old approach|TODO.*deprecat|FIXME.*deprecat',
  {
    types: ['ts', 'js'],
    globs: ['!node_modules', '!dist', '!build', '!.next'],
    context: 2,
    lineNumbers: true,
  },
);

if (markerOutput.trim()) {
  // Parse ripgrep output into structured entries
  for (const line of markerOutput.split('\n')) {
    // Match "file:line:text" (colons in file path unlikely for these repos)
    const match = line.match(/^([^:]+):(\d+):(.*)$/);
    if (match) {
      explicitMarkers.push({
        file: match[1],
        line: parseInt(match[2], 10),
        text: match[3].trim(),
      });
    }
  }
}

// --- Git recency comparison ---
const gitRecency = {};

if (dependencies.length > 0) {
  const recentImports = gitImports('3 months ago', undefined);
  const oldImports = gitImports('12 months ago', '3 months ago');

  for (const dep of dependencies) {
    if (dep.length < 3) continue; // Skip short names that match too broadly

    const pattern = `from ['"]${dep}`;
    const recent = countMatches(recentImports, pattern);
    const old = countMatches(oldImports, pattern);

    if (recent > 0 || old > 0) {
      gitRecency[dep] = { recent_imports: recent, old_imports: old };
    }
  }
}

// --- Assemble final output ---
const output = {
  dependencies,
  explicit_markers: explicitMarkers,
  git_recency: gitRecency,
};

await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`Deprecated pattern scan complete: ${OUTPUT_FILE}`);
console.log(`  Dependencies found: ${dependencies.length}`);
console.log(`  Explicit markers found: ${explicitMarkers.length}`);
console.log(`  Deps with git activity: ${Object.keys(gitRecency).length}`);

// --- Helpers ---

async function findFiles(dir, filename, ignoreDirs) {
  const results = [];
  const ignoreSet = new Set(ignoreDirs);

  let entries;
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== filename) continue;
    const parentPath = entry.parentPath ?? entry.path; // parentPath in Node 22+
    const parts = parentPath.split('/');
    if (parts.some((p) => ignoreSet.has(p))) continue;
    results.push(join(parentPath, entry.name));
  }
  return results;
}

function gitImports(since, until) {
  const args = ['log', `--since=${since}`, '-p', '--', '*.ts', '*.tsx', '*.js', '*.jsx'];
  if (until) args.splice(2, 0, `--until=${until}`);

  try {
    const output = execFileSync('git', args, {
      maxBuffer: 100 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output;
  } catch {
    return '';
  }
}

function countMatches(text, pattern) {
  const regex = new RegExp(pattern, 'g');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}
