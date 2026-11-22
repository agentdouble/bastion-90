# Playbook: Refactor & Migration

1. **Outcome-Oriented Execution:** Converge directly on the target architecture. Do **not** leave throwaway compatibility shims behind.
2. **Migrate Callers, Then Delete Legacy APIs:** Update all callers atomically (or in a tightly sequenced stack) and delete the obsolete API in the final step.
3. **Subtract Before You Add:** Delete dead branches, unused exports, and stale adapters before introducing new structures.
4. **Verify Behavior Preservation (`verify`):** Behavior-level tests and property invariants must remain 100% green without rewriting assertions to mask regressions.
5. **Update `feature-map.json`:** Reflect deleted/moved files immediately so `feature-map` gate stays green.
