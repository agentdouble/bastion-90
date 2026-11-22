# Playbook: Feature Implementation

1. **Ground in `feature-map.json`:** Identify the affected feature or register a new feature entry with explicit `files`, `invariants`, and `verificationProbe`.
2. **Architect (`architect`):** Sketch domain types, boundaries, and state transitions. Use `arena` if 2+ competing architectures are plausible.
3. **Sequence into Verifiable Units:** Break work into small, independently mergeable PRs (prefer < 250 changed lines per unit).
4. **Implement:** Follow *Laziness Protocol* and *Subtract Before You Add*. Zero unapproved comments.
5. **Adversarial Review (`interrogate`):** Attack edge cases, idempotency, and anti-slop discipline.
6. **Verify (`verify`):** Run `npm run factory:verify`, confirm Proof Artifact Bundle is green.
7. **Auto-Merge Gate (`ship-automerge.md`):** Run `node bin/factory.mjs gate --fresh --record`.
