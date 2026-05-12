#!/usr/bin/env node
// Session log filter — replaces filter.jq.
// Strips progress/system/queue records, compresses tool inputs to 300 chars,
// tool results to 500 chars, thinking to 1000 chars. Output is compact JSONL.

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/**
 * Filter a single parsed session log object.
 * Returns the filtered object, or null if it should be skipped.
 */
export function filterSessionLine(obj) {
  if (obj.type === 'assistant') {
    const contentItems = obj.message?.content;
    if (!Array.isArray(contentItems)) return null;

    const filtered = [];
    for (const item of contentItems) {
      if (item.type === 'text') {
        filtered.push({ t: 'text', text: item.text });
      } else if (item.type === 'thinking') {
        const thinking = item.thinking ?? '';
        filtered.push({
          t: 'think',
          thinking: thinking.length > 1000 ? thinking.slice(0, 1000) + '...[truncated]' : thinking,
        });
      } else if (item.type === 'tool_use') {
        const inputStr = typeof item.input === 'string' ? item.input : JSON.stringify(item.input);
        filtered.push({
          t: 'tool',
          name: item.name,
          input: inputStr.length > 300 ? inputStr.slice(0, 300) + '...' : inputStr,
        });
      }
    }

    return { type: 'assistant', ts: obj.timestamp, content: filtered };
  }

  if (obj.type === 'user') {
    const msgContent = obj.message?.content;

    if (typeof msgContent === 'string') {
      return { type: 'user', ts: obj.timestamp, content: msgContent };
    }

    if (Array.isArray(msgContent)) {
      const items = [];
      for (const item of msgContent) {
        if (item.type === 'tool_result') {
          const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
          items.push({
            t: 'result',
            id: item.tool_use_id,
            err: item.is_error ?? false,
            content: contentStr.length > 500 ? contentStr.slice(0, 500) + '...[truncated]' : contentStr,
          });
        } else {
          const text = typeof item === 'string' ? item : JSON.stringify(item);
          items.push({
            t: 'msg',
            text: text.length > 500 ? text.slice(0, 500) + '...[truncated]' : text,
          });
        }
      }
      return { type: 'user', ts: obj.timestamp, content: items };
    }

    // Fallback: stringify whatever content is
    const fallback = typeof msgContent === 'string' ? msgContent : JSON.stringify(msgContent);
    return {
      type: 'user',
      ts: obj.timestamp,
      content: fallback.length > 500 ? fallback.slice(0, 500) + '...[truncated]' : fallback,
    };
  }

  return null;
}

// Standalone mode: node filter-session.mjs input.jsonl → filtered JSONL to stdout
const inputFile = process.argv[2];
if (inputFile) {
  const rl = createInterface({ input: createReadStream(inputFile) });
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      const result = filterSessionLine(obj);
      if (result) console.log(JSON.stringify(result));
    } catch {
      // Skip malformed lines (matching jq's silent-skip behavior)
    }
  }
}
