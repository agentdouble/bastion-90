---
name: architect
description: Pre-implementation design skill. Maps callers, data shapes, boundaries, and invariants before writing code so agents never lock into sloppy abstractions.
---

# Architect Skill

Invoke **before** writing code whenever a change crosses module boundaries, modifies shared state, or introduces a new public API.

## Protocol
1. **Audit Callers & Ownership:** Read `feature-map.json` and inspect every caller of the affected modules.
2. **Model the Domain First:** Define exact data shapes, state transitions, and illegal states that must be unrepresentable by construction.
3. **Boundary Discipline:** Keep framework-level / hazardous primitives (e.g., `useEffect`, raw I/O, unsafe concurrency) isolated inside `src/framework/`. Product code consumes only safe, narrow APIs.
4. **Subtract Before You Add:** Identify dead code, obsolete adapters, or duplicated layers to delete *first*.
5. **Define Invariants & Probes:** List the exact invariants that `verify` will prove (unit tests, property-based tests, or TLA+/Lean specs) and update `feature-map.json`.
6. **Output:** A concise Architecture Note (max 30 lines) containing:
   - Explicit Premise
   - Data Shapes & State Transitions
   - Files to Delete / Modify / Create
   - Verification Probes
