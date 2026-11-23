# ⚔️ BASTION 90

> **Survie médiévale en 10 minutes** — Jeu web arcade en HTML5 Canvas et Web Audio procédural, sans dépendances runtime.

Tiens la cour du château face à une horde croissante, forge ton arsenal médiéval à la volée, enchaîne les **Parades** en roulade et terrasse le **Seigneur Liche** avant l'aube.

## ✨ Points forts

- **Parties de 10 minutes en Siège classique et en Défi du jour.** L'Exécuteur d'Acier apparaît après `4:30` de jeu actif et le Seigneur Liche après `8:30`. Le compte à rebours se fige en pause et pendant les choix de la Forge. À `10:00`, la partie est perdue si le Seigneur Liche vit encore.
- **Arsenal Médiéval + Éveil (Forge)** : 6 armes auto-déclenchées (*Lame de l'Aube*, *Fléau Orbital*, *Hache du Berserker*, *Feu Grégeois*, *Foudre Runique*, *Onde du Bouclier*) + 6 reliques passives. Atteindre le **Niveau 4** éveille l'arme en version **FORGÉE ★**.
- **Gameplay nerveux & skill-based** : Roulade invulnérable avec mécanique de **Parade / Frôlement** (bonus de score, combo + recharge de roulade réduite).
- **Audio procédural 100% Web Audio API** : gamme dorienne ascendante à chaque gemme d'XP, effets d'acier/foudre/feu, cor de guerre pour les boss et tambour de siège dynamique.
- **Rejouabilité instantanée** : Restart en 1 touche (`R`), rangs de fin de partie (`C` à `S+`), **Défi du Jour** (graine déterministe quotidienne) et records sauvegardés localement.
- **Contrôles complets** : AZERTY (`ZQSD`), QWERTY (`WASD`), Flèches, et joystick tactile mobile automatique.

## 🚀 Lancer en local

Prérequis : Node.js 20+ (zéro `npm install` nécessaire).

```bash
npm run dev
```

Puis ouvre **http://127.0.0.1:4173** dans ton navigateur.

## 🎮 Contrôles

| Touche | Action |
|---|---|
| `ZQSD` / `WASD` / `↑↓←→` | Déplacement (ou joystick tactile sur mobile) |
| `Espace` / `Shift` / Clic droit | Roulade invulnérable & Parade |
| `1`, `2`, `3` | Choisir une amélioration au Level-Up |
| `P` / `Échap` | Pause |
| `R` | Recommencer instantanément |
| `M` | Couper / activer le son |

## 🧪 Tests & Vérification

```bash
npm test
npm run factory:check
npm run factory:verify
```

## 🧱 Architecture

- `src/domain/` — Catalogue d'armes/reliques/ennemis, maths, PRNG déterministe et état initial.
- `src/engine/` — Moteur de simulation pur (zéro DOM, 100% testable en Node.js).
- `src/framework/` — Audio procédural Web Audio, gestionnaire clavier/tactile, stockage local et boucle fixe 60 Hz.
- `src/render/` — Rendu médiéval Canvas 2D (cour pavée mise en cache, braseros animés, sprites & VFX).
- `src/app/` — Interface HUD, écran titre, cartes de forge et contrôleur principal.
