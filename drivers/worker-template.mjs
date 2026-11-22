#!/usr/bin/env node
import fs from 'node:fs';

function readStdinJson() {
  const raw = fs.readFileSync(0, 'utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function main() {
  const payload = readStdinJson();
  const response = {
    agentId: process.env.FACTORY_WORKER_ID || 'external-worker',
    model: process.env.FACTORY_WORKER_MODEL || 'external-llm',
    taskId: payload.task?.id || null,
    attempt: payload.attempt || 1,
    status: 'READY_FOR_REVIEW',
    summary: 'Replace this template body with your CLI/API coding agent invocation (e.g., Claude Code, Codex, Antigravity, Cursor).'
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

main();
