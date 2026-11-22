---
name: encode-rule
description: Mistake-to-Constraint encoder (Encode Lessons in Structure). Converts any agent mistake or review finding into a permanent deterministic rule in rules/constraints.json so it can never recur.
---

# Encode-Rule Skill (Encode Lessons in Structure)

> **Golden Rule:** Never fix an agent mistake by adding another paragraph to `AGENTS.md`. Turn it into a deterministic check.

## When to Trigger
- An agent introduced a subtle anti-pattern caught in review or production.
- A post-merge revert occurred and root-cause analysis identified a preventable code pattern.
- A hazardous API needs to be confined to `src/framework/`.

## Protocol
1. **Isolate the Structural Pattern:** Identify the minimal regex, AST shape, type constraint, or invariant test that deterministically catches the error class.
2. **Encode into `rules/constraints.json`:**
   ```bash
   node bin/factory.mjs encode-rule \
     --id "no-unbounded-retry" \
     --pattern "while\\s*\\(true\\)" \
     --message "Unbounded while(true) loops are banned. Use bounded retry helpers from src/framework." \
     --rationale "Prevent infinite agent retry loops in production workers."
   ```
3. **Prove the Rule Works:** Add a negative + positive test case in `test/factory.test.mjs` and run `npm run factory:verify`.
4. **Keep `AGENTS.md` Thin:** Do not duplicate the rule in prose unless human judgment is genuinely required.
