# Playbook: Ship & Auto-Merge Gate

1. **Fresh Verification Run (Couches 1 & 2):**
   ```bash
   npm run factory:verify
   ```
2. **Independent Adversarial Review (Contexte frais, Reviewer ≠ Author):**
   ```bash
   node bin/factory.mjs review --base main --author worker-alpha
   ```
   Génère `reviews.json` lié cryptographiquement au `diffHash` SHA-256 du diff courant (quorum 1 pour `standard`, quorum 2 pour `critical`).
3. **Evaluate Deterministic Gate & Circuit Breaker:**
   ```bash
   node bin/factory.mjs gate --base main --record
   ```
4. **Interpret Decision:**
   - `APPROVED`: Autorisé pour le merge automatique (`git merge --no-ff` via `factory run-next` ou GitHub Merge Queue). Joindre `artifacts/verifications/<runId>/report.md` à la PR.
   - `REJECTED`: Retour automatique en `Implement` avec les raisons structurées. Au bout de 2 échecs sur la même prémisse -> `AttackPremise` (`attack-premise.md`).
   - `HALTED_CIRCUIT_BREAKER`: Taux de revert glissant > **0,5 %**. Tous les merges autonomes sont suspendus jusqu'à diagnostic et encodage de nouvelles contraintes via `encode-rule`.
5. **Post-Merge Smoke & Auto-Revert:**
   Si la vérification post-merge sur `main` échoue, `factory-engine.mjs` exécute automatiquement `git revert -m 1`, journalise le `revert` dans `.factory/metrics.jsonl` et déclenche `encode-rule`.
