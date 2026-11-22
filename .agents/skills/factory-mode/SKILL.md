---
name: factory-mode
description: Central router skill (inspired by Lauren Tan's /poteto-mode). Classifies any engineering task, selects the matching playbook, enforces the 24 principles, and gates completion on deterministic verification artifacts.
---

# Factory Mode (Router Skill)

> **"If you want to go fast, go deep first."**

## Step 1 — Classify & Route
Read `feature-map.json` to anchor vocabulary and ownership, then select the exact playbook:
- **New capability / API / UI:** `.agents/skills/playbooks/feature.md`
- **Defect / regression / incident:** `.agents/skills/playbooks/bugfix.md`
- **Structural cleanup / migration:** `.agents/skills/playbooks/refactor.md`
- **Ready to merge / release:** `.agents/skills/playbooks/ship-automerge.md`

## Step 2 — Enforce the Lifecycle State Machine
Every work unit strictly follows `formal/FactoryLifecycle.tla`:
1. **Plan:** State the explicit **premise**, target files from `feature-map.json`, and concrete verification probe. Invoke `architect` if crossing module boundaries.
2. **Implement:** Apply the *Laziness Protocol* and *Subtract Before You Add*. Zero unapproved comments, zero lint suppressions, zero compatibility cruft.
3. **Review:** Run `interrogate` to attack edge cases, failure modes, and slop before verification.
4. **Verify:** Run `verify` (`npm run factory:verify`). Never claim success from a build alone — produce a Proof Artifact Bundle.
5. **Loopback / Attack the Premise:**
   - Failure #1 on the current premise -> loop back to `Implement`.
   - Failure #2 on the **same premise** -> **STOP PATCHING**. Enter `AttackPremise`, write down the hidden assumption, test it directly, and formulate a new premise.
6. **Encode Lessons in Structure:** Whenever a bug or review defect is found, run `encode-rule` (`node bin/factory.mjs encode-rule`) or add a property test so the mistake becomes structurally impossible.

## Non-Negotiable Principles
Always apply `docs/04-principles-24.md`, especially:
- `Laziness Protocol` — minimum viable change; bias toward deletion.
- `Prove It Works` — verify the exact runtime behavior with artifacts.
- `Encode Lessons in Structure` — rules over prose; never bloat `AGENTS.md`.
- `Never Block on the Human` — prepare verifiable artifacts and safe defaults so review is asynchronous.
