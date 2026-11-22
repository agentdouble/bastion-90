---
name: arena
description: Parallel bakeoff skill (Exhaust the Design Space). Spawns 2-3 competing implementation candidates under isolated constraints, benchmarks them against verification gates, and synthesizes the winning architecture.
---

# Arena Skill (Exhaust the Design Space)

Use when facing a novel architectural tradeoff, a performance-critical core algorithm, or high design ambiguity.

## Protocol
1. **Freeze the Contract:** Define the exact interface, invariants, and benchmark/test suite before spawning candidates.
2. **Spawn 2–3 Competing Candidates** (isolated workspaces/branches) with distinct design hypotheses:
   - **Candidate A (Minimalist / Laziness Protocol):** Smallest possible code footprint.
   - **Candidate B (Domain-Driven / Explicit State Machine):** Maximum clarity and formal verifiability.
   - **Candidate C (Performance / Alternative Paradigm):** Optimized data structure or execution path.
3. **Evaluate Deterministically:** Every candidate must pass `npm run factory:verify` (zero slop violations, 100% tests green).
4. **Score & Synthesize:** Compare candidates on:
   - Simplicity / reader load (lines of code, cyclomatic depth)
   - Invariant strength & edge-case resilience
   - Benchmark / runtime telemetry
   Merge the strongest elements into one clean implementation and discard the rest.
