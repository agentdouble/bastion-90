#!/usr/bin/env node
import fs from 'node:fs';

function readStdinJson() {
  const raw = fs.readFileSync(0, 'utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function main() {
  const req = readStdinJson();
  const hasDiff = Boolean(req.diffText && req.diffText.trim().length > 0);
  const response = {
    reviewerAgentId: process.env.FACTORY_REVIEWER_ID || 'external-interrogator',
    reviewerModel: process.env.FACTORY_REVIEWER_MODEL || 'external-reviewer-model',
    isHuman: false,
    verdict: hasDiff ? 'APPROVED' : 'CHANGES_REQUESTED',
    blockers: hasDiff ? [] : ['Empty diff submitted for independent review.'],
    simplifications: [],
    noise: [],
    summary: 'Template external reviewer adapter. Wire this script to a distinct LLM model for adversarial multi-model interrogation.'
  };
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

main();
