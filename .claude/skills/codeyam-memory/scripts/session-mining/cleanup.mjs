#!/usr/bin/env node
// Removes cached preprocessed session files.

import { rm } from 'node:fs/promises';

const OUTPUT_DIR = '/tmp/cc-session-analysis';

try {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  console.log(`Cleaned up ${OUTPUT_DIR}`);
} catch {
  console.log(`Nothing to clean up (${OUTPUT_DIR} does not exist)`);
}
