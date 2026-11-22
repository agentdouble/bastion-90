---
name: verify
description: Evidence-based verification skill (Prove It Works). Runs deterministic constraints, feature-map integrity, tests, and emits a Proof Artifact Bundle for asynchronous human or automated merge review.
---

# Verify Skill (Prove It Works)

Never assume a change works because it compiles or looks plausible. Produce hard, reproducible proof artifacts.

## Protocol
1. **Run the Full Pipeline:**
   ```bash
   npm run factory:verify
   ```
2. **Inspect the Emitted Artifact Bundle:**
   Locate the newly created `artifacts/verifications/verify-<timestamp>/`:
   - `manifest.json` — machine-readable gate evidence
   - `report.md` — human-readable summary of constraints, feature map, tests, and formal specs
3. **Runtime & Domain Proof:**
   - For bug fixes: confirm the exact failing scenario now passes and is locked into a regression test.
   - For UI / CLI changes: attach execution trace, screenshot/video, or deterministic output snapshot into the artifact folder.
   - For critical state machines: verify alignment with `formal/*.tla` (or Lean spec).
4. **Handle Failures Strictly:**
   - Any non-zero exit code loops the unit back to `Implement`.
   - If the same premise fails twice, invoke **Attack the Premise** — do not patch blindly a third time.
