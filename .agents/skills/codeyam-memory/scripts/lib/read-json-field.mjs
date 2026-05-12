#!/usr/bin/env node
// Lightweight jq replacement for simple field lookups.
// Usage: node read-json-field.mjs <file> '<expression>'
// Supports: .field.subfield, .field | length

import { readFile } from 'node:fs/promises';

const [, , filePath, expression] = process.argv;

if (!filePath || !expression) {
  console.error('Usage: node read-json-field.mjs <file> <expression>');
  process.exit(1);
}

try {
  const raw = await readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const result = evaluate(data, expression);
  console.log(typeof result === 'string' ? result : JSON.stringify(result));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

function evaluate(data, expr) {
  const trimmed = expr.trim();

  // Handle pipe: ".field | length"
  const pipeIdx = trimmed.indexOf('|');
  if (pipeIdx !== -1) {
    const left = trimmed.slice(0, pipeIdx).trim();
    const right = trimmed.slice(pipeIdx + 1).trim();
    const intermediate = resolvePath(data, left);

    if (right === 'length') {
      if (Array.isArray(intermediate)) return intermediate.length;
      if (typeof intermediate === 'object' && intermediate !== null) return Object.keys(intermediate).length;
      if (typeof intermediate === 'string') return intermediate.length;
      throw new Error(`Cannot get length of ${typeof intermediate}`);
    }
    throw new Error(`Unsupported pipe function: ${right}`);
  }

  return resolvePath(data, trimmed);
}

function resolvePath(data, pathExpr) {
  // Strip leading dot: ".foo.bar" -> "foo.bar"
  const cleaned = pathExpr.startsWith('.') ? pathExpr.slice(1) : pathExpr;
  if (cleaned === '') return data;

  const keys = cleaned.split('.');
  let current = data;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      throw new Error(`Cannot access '${key}' on ${JSON.stringify(current)}`);
    }
    current = current[key];
  }
  return current;
}
