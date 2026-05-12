#!/usr/bin/env node
// Shared ripgrep wrapper with pure-Node fallback when rg is not installed.

import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param {string} pattern - Regex pattern to search for
 * @param {object} [opts]
 * @param {string[]} [opts.types] - File type filters, e.g. ['ts', 'js']
 * @param {string[]} [opts.globs] - Glob filters, e.g. ['!node_modules']
 * @param {number} [opts.context] - Lines of context around matches (-C)
 * @param {boolean} [opts.lineNumbers] - Include line numbers (-n)
 * @param {string} [opts.cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<string>} ripgrep-compatible output: "file:line:text\n" lines
 */
export async function ripgrepSearch(pattern, opts = {}) {
  const { types = [], globs = [], context, lineNumbers = true, cwd = process.cwd() } = opts;

  try {
    return await runRipgrep(pattern, { types, globs, context, lineNumbers, cwd });
  } catch (err) {
    if (err.code === 'ENOENT') {
      // rg not installed — use Node fallback
      return nodeFallback(pattern, { types, globs, context, lineNumbers, cwd });
    }
    throw err;
  }
}

function runRipgrep(pattern, { types, globs, context, lineNumbers, cwd }) {
  return new Promise((resolve, reject) => {
    const args = [];
    if (lineNumbers) args.push('-n');
    if (context != null) args.push('-C', String(context));
    for (const t of types) args.push('--type', t);
    for (const g of globs) args.push('--glob', g);
    args.push(pattern, '.'); // Explicit path prevents rg from reading stdin

    execFile('rg', args, { cwd, maxBuffer: 50 * 1024 * 1024 }, (err, stdout) => {
      if (err) {
        // Exit code 1 = no matches, 2 = error (e.g. no files searched)
        if (err.code === 1 || err.code === 2) return resolve('');
        // ENOENT = rg binary not found
        if (err.code === 'ENOENT') {
          const e = new Error('rg not found');
          e.code = 'ENOENT';
          return reject(e);
        }
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

const TYPE_EXTENSIONS = {
  ts: ['.ts', '.tsx', '.mts', '.cts'],
  js: ['.js', '.jsx', '.mjs', '.cjs'],
};

const DEFAULT_IGNORE = ['node_modules', 'dist', 'build', '.next', '.git'];

async function nodeFallback(pattern, { types = [], globs = [], context, lineNumbers = true, cwd = process.cwd() } = {}) {
  // Build file extension filter from types
  const extensions = new Set();
  for (const t of types) {
    const exts = TYPE_EXTENSIONS[t];
    if (exts) exts.forEach((e) => extensions.add(e));
  }

  // Parse globs for negative patterns (simple heuristic: "!dirname")
  const ignoreDirs = new Set(DEFAULT_IGNORE);
  for (const g of globs) {
    if (g.startsWith('!')) ignoreDirs.add(g.slice(1));
  }
  // Also handle glob patterns like "!*.d.ts" and "!*.map"
  const ignoreExtensions = new Set();
  for (const g of globs) {
    const m = g.match(/^!\*(\.\w+(?:\.\w+)*)$/);
    if (m) ignoreExtensions.add(m[1]);
  }

  const regex = new RegExp(pattern);
  const contextLines = context ?? 0;
  const results = [];

  let entries;
  try {
    entries = await readdir(cwd, { recursive: true });
  } catch {
    return '';
  }

  for (const relPath of entries) {
    // Skip ignored directories
    const parts = relPath.split('/');
    if (parts.some((p) => ignoreDirs.has(p))) continue;

    // Check extension filters
    if (extensions.size > 0) {
      const hasMatchingExt = [...extensions].some((ext) => relPath.endsWith(ext));
      if (!hasMatchingExt) continue;
    }

    // Check ignore extensions
    if ([...ignoreExtensions].some((ext) => relPath.endsWith(ext))) continue;

    const fullPath = join(cwd, relPath);
    let content;
    try {
      content = await readFile(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    const matchIndices = [];
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) matchIndices.push(i);
    }

    if (matchIndices.length === 0) continue;

    if (contextLines === 0) {
      for (const idx of matchIndices) {
        const lineNum = idx + 1;
        const prefix = lineNumbers ? `${relPath}:${lineNum}:` : `${relPath}:`;
        results.push(`${prefix}${lines[idx]}`);
      }
    } else {
      // With context: output blocks separated by "--"
      const emitted = new Set();
      for (const idx of matchIndices) {
        const start = Math.max(0, idx - contextLines);
        const end = Math.min(lines.length - 1, idx + contextLines);
        for (let i = start; i <= end; i++) {
          if (!emitted.has(i)) {
            emitted.add(i);
            const lineNum = i + 1;
            const sep = i === idx ? ':' : '-';
            const prefix = lineNumbers ? `${relPath}${sep}${lineNum}${sep}` : `${relPath}${sep}`;
            results.push(`${prefix}${lines[i]}`);
          }
        }
      }
    }
  }

  return results.join('\n') + (results.length > 0 ? '\n' : '');
}

// Exported for testing — not part of the public API.
export { nodeFallback as _nodeFallback };
