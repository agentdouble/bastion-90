---
name: interrogate
description: Adversarial code & design review skill. Attacks a diff from security, concurrency, invariant, and anti-slop angles, filtering noise into concrete root-cause fixes.
---

# Interrogate Skill (Adversarial Review)

Run after `Implement` and before `Verify` (or before opening a PR to the `AutoMergeGate`).

## Adversarial Checklist
1. **Slop & Escape Hatch Audit:**
   - Are there comments rationalizing a hack?
   - Are there compatibility shims, dead flags, or defensive dead branches?
   - Can any abstraction be deleted without losing correctness?
2. **Premise & Edge-Case Attack:**
   - What happens on empty input, malformed input, duplicate execution (idempotency), partial failure, or concurrent writes?
   - Which invariant in `feature-map.json` could this diff subtly break?
3. **Boundary & Type Audit:**
   - Did hazardous primitives leak out of `src/framework/`?
   - Are failure states explicit rather than swallowed?
4. **Signal Filtering:**
   - Do **not** blindly accept every nitpick. Classify findings into:
     - **Blocker (Must Fix + Encode Rule/Test)**
     - **Simplification (Delete/Collapse)**
     - **Noise (Reject with 1-line rationale)**
