#!/usr/bin/env node
// Preprocesses Claude Code session logs for the codeyam-memory skill.
// Replaces preprocess.sh — no jq or platform-specific stat required.
//
// - Finds JSONL session files (>=10KB, last 30 days)
// - Excludes the current active session
// - Runs JS filter for 5-50x compression
// - Caches results in /tmp/cc-session-analysis/
// - Prints filtered file paths to stdout (one per line)

import { readdir, stat, mkdir, readFile, rm } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { filterSessionLine } from './filter-session.mjs';

const OUTPUT_DIR = '/tmp/cc-session-analysis';
const MIN_SIZE = 10240; // 10KB
const MAX_AGE_DAYS = 30;
const MAX_SESSIONS = 30;
const FILTER_TIMEOUT = 30_000; // 30s per file

// Compute Claude project directory (mirrors Claude Code's path hashing)
const projectDir = process.cwd();
const projectHash = projectDir.replace(/[/.]/g, '-');
const sessionDir = join(homedir(), '.claude', 'projects', projectHash);

// Check session directory exists
try {
  await stat(sessionDir);
} catch {
  process.stderr.write(`No Claude session directory found at ${sessionDir}\n`);
  process.stderr.write('This project may not have any Claude Code session history.\n');
  process.exit(0);
}

// Find eligible session files
await mkdir(OUTPUT_DIR, { recursive: true });

const entries = await readdir(sessionDir);
const now = Date.now();
const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const sessionFiles = [];
for (const name of entries) {
  if (!name.endsWith('.jsonl')) continue;
  const fullPath = join(sessionDir, name);
  try {
    const st = await stat(fullPath);
    if (!st.isFile()) continue;
    if (st.size < MIN_SIZE) continue;
    if (now - st.mtimeMs > maxAgeMs) continue;
    sessionFiles.push({ path: fullPath, mtimeMs: st.mtimeMs });
  } catch {
    continue;
  }
}

if (sessionFiles.length === 0) process.exit(0);

// Sort newest first, cap to MAX_SESSIONS
sessionFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
if (sessionFiles.length > MAX_SESSIONS) {
  process.stderr.write(`Note: ${sessionFiles.length} sessions found, capping to ${MAX_SESSIONS} most recent\n`);
}
const sessions = sessionFiles.slice(0, MAX_SESSIONS);

// Determine active session to exclude
let activeSession = '';
const claudeSessionId = process.env.CLAUDE_SESSION_ID;
if (claudeSessionId) {
  const match = sessions.find((s) => basename(s.path, '.jsonl') === claudeSessionId);
  if (match) activeSession = match.path;
}
if (!activeSession && sessions.length > 0) {
  activeSession = sessions[0].path; // newest = likely active
}

// Process each session
for (const session of sessions) {
  if (session.path === activeSession) continue;

  const uuid = basename(session.path, '.jsonl');
  const filtered = join(OUTPUT_DIR, `${uuid}.filtered.jsonl`);

  // Check cache: skip if filtered file has a valid sentinel
  try {
    const firstLine = (await readFile(filtered, 'utf-8')).split('\n')[0];
    const sentinel = JSON.parse(firstLine);
    if (sentinel.processed_at) {
      console.log(filtered);
      continue;
    }
  } catch {
    // No cache or invalid — reprocess
  }

  // Filter with timeout
  try {
    await filterFile(session.path, filtered);
    console.log(filtered);
  } catch (err) {
    if (err.name === 'AbortError') {
      process.stderr.write(`Warning: filter timed out after ${FILTER_TIMEOUT / 1000}s on ${basename(session.path)} — skipping\n`);
      await rm(filtered, { force: true });
    } else {
      process.stderr.write(`Warning: error processing ${basename(session.path)}: ${err.message}\n`);
      await rm(filtered, { force: true });
    }
  }
}

async function filterFile(inputPath, outputPath) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FILTER_TIMEOUT);

  try {
    const st = await stat(inputPath);
    const sentinel = JSON.stringify({
      processed_at: new Date().toISOString(),
      source_size: st.size,
    });

    const output = createWriteStream(outputPath);
    output.write(sentinel + '\n');

    const rl = createInterface({
      input: createReadStream(inputPath),
      signal: ac.signal,
    });

    let lineCount = 0;
    for await (const line of rl) {
      try {
        const obj = JSON.parse(line);
        const result = filterSessionLine(obj);
        if (result) {
          output.write(JSON.stringify(result) + '\n');
          lineCount++;
        }
      } catch {
        // Skip malformed lines
      }
    }

    output.end();
    await new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });

    // Remove files with no content beyond the sentinel
    if (lineCount === 0) {
      await rm(outputPath, { force: true });
    }
  } finally {
    clearTimeout(timer);
  }
}
