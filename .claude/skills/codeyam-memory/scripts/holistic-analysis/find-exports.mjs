#!/usr/bin/env node
// Indexes the project's public API surface by finding all exports.
// Outputs structured JSON to /tmp/codeyam-memory/exports-scan.json

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ripgrepSearch } from '../lib/ripgrep-fallback.mjs';

const OUTPUT_DIR = '/tmp/codeyam-memory';
const OUTPUT_FILE = join(OUTPUT_DIR, 'exports-scan.json');
await mkdir(OUTPUT_DIR, { recursive: true });

const exportOutput = await ripgrepSearch(
  '^export (function|const|class|default|async function|type|interface|enum)',
  {
    types: ['ts', 'js'],
    globs: ['!node_modules', '!dist', '!build', '!.next', '!*.d.ts', '!*.map'],
    lineNumbers: true,
  },
);

if (!exportOutput.trim()) {
  const empty = { files: {}, stats: { total_files: 0, total_exports: 0 } };
  await writeFile(OUTPUT_FILE, JSON.stringify(empty, null, 2));
  console.log(`Export scan complete: ${OUTPUT_FILE} (no exports found)`);
  process.exit(0);
}

// Parse ripgrep output and group by file
const files = {};
for (const line of exportOutput.split('\n')) {
  const match = line.match(/^([^:]+):(\d+):(.*)$/);
  if (!match) continue;

  const [, file, lineNum, text] = match;
  if (!files[file]) files[file] = [];
  files[file].push({ line: parseInt(lineNum, 10), text: text.trim() });
}

const totalFiles = Object.keys(files).length;
const totalExports = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);

const output = {
  files,
  stats: { total_files: totalFiles, total_exports: totalExports },
};

await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log(`Export scan complete: ${OUTPUT_FILE}`);
console.log(`  Files with exports: ${totalFiles}`);
console.log(`  Total exports: ${totalExports}`);
