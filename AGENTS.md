# AGENTS.md — Thin Top-Layer Contract

> This file is intentionally minimal. Per the **Inverse Pyramid of Trust**, do **not** bloat this file with behavioral reminders. Encode repeatable mistakes deterministically via `node bin/factory.mjs encode-rule` into `rules/constraints.json`.

## Operating Protocol
1. **Invoke the router:** Follow `.agents/skills/factory-mode/SKILL.md` for every non-trivial task.
2. **Respect the Feature Map & Boundaries:** Read `feature-map.json` and respect layer boundaries in `factory.config.json` before editing code.
3. **Never self-approve:** Every PR requires an independent reviewer receipt (`reviews.json`) bound to the exact SHA-256 `diffHash` (`reviewerAgentId !== authorAgentId`, distinct model). Critical paths require quorum 2.
4. **Never ship unverified code:** Every change must pass `npm run factory:verify` and `factory gate` before merge.
5. **Attack the Premise:** If two consecutive attempts sharing the same assumption fail verification, stop patching. Test the premise directly before retrying.
6. **Encode Lessons in Structure:** Every defect or post-merge revert must yield a new rule in `rules/constraints.json` or a permanent test.

## Hard Invariants (Enforced by `slop-guard` + `boundary-guard`)
- No comments in `src/` or `bin/` except `@invariant`, `@safety`, or `@spec`.
- No lint/type suppressions, no `any`, no empty `catch {}`, no `TODO/FIXME/HACK`.
- No `useEffect` outside `src/framework/`.
- Max 350 lines per file, max 60 lines per function, acyclic layer imports only.
