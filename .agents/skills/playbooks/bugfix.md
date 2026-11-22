# Playbook: Bugfix (Root Cause Only)

1. **Reproduce First (Prove It Fails):** Write a failing test or deterministic repro command capturing the exact bug before touching implementation code.
2. **State the Premise Explicitly:** Write one sentence describing the suspected root cause.
3. **Fix the Root Cause:** Never patch symptoms or wrap failures in defensive swallowing (`catch {}`, fallback hacks).
4. **Verify (`verify`):** Run `npm run factory:verify` and confirm the new regression test passes.
5. **Attack the Premise Circuit Breaker:** If 2 consecutive fixes under the same premise fail verification, STOP. Write down the assumption, test it directly with instrumentation, and replace the premise before editing again.
6. **Encode Lesson in Structure (`encode-rule`):** If the bug class is statically detectable, encode a permanent rule in `rules/constraints.json`.
