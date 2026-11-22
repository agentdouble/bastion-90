import { PASSIVE_CATALOG, PASSIVE_IDS, WEAPON_CATALOG, WEAPON_IDS } from "../domain/catalog.js";
import { addShake, computePlayerStats, emitEvent, showBanner, xpForLevel } from "../domain/state.js";

function collectWeaponChoices(player) {
  const choices = [];
  const ownedCount = Object.keys(player.weapons).length;
  for (const id of WEAPON_IDS) {
    const def = WEAPON_CATALOG[id];
    const current = player.weapons[id] || 0;
    if (current > 0 && current < def.maxLevel) {
      const nextLvl = current + 1;
      const isEvolve = nextLvl === def.evolveLevel;
      choices.push({
        kind: "weapon",
        id,
        name: nextLvl >= def.evolveLevel ? def.evolvedName : def.name,
        icon: def.icon,
        nextLevel: nextLvl,
        isEvolve,
        tag: isEvolve ? "ÉVEIL ★" : `NIV. ${nextLvl}`,
        description: def.descriptions[nextLvl - 1],
        weight: isEvolve ? 3 : 2
      });
    } else if (current === 0 && ownedCount < 4) {
      choices.push({
        kind: "weapon",
        id,
        name: def.name,
        icon: def.icon,
        nextLevel: 1,
        isEvolve: false,
        tag: "NOUVELLE ARME",
        description: def.descriptions[0],
        weight: 2
      });
    }
  }
  return choices;
}

function collectPassiveChoices(player) {
  const choices = [];
  for (const id of PASSIVE_IDS) {
    const def = PASSIVE_CATALOG[id];
    const current = player.passives[id] || 0;
    if (current < def.maxLevel) {
      choices.push({
        kind: "passive",
        id,
        name: def.name,
        icon: def.icon,
        nextLevel: current + 1,
        isEvolve: false,
        tag: `RELIQUE ${current + 1}/${def.maxLevel}`,
        description: def.description,
        weight: 1
      });
    }
  }
  return choices;
}

export function generateUpgradeChoices(state) {
  const pool = [
    ...collectWeaponChoices(state.player),
    ...collectPassiveChoices(state.player)
  ];
  if (pool.length === 0) {
    return [
      {
        kind: "bonus",
        id: "royal_banquet",
        name: "Banquet Royal",
        icon: "🍷",
        nextLevel: 1,
        isEvolve: false,
        tag: "BÉNÉDICTION",
        description: "Restaure 45 PV et accorde +350 points de gloire."
      }
    ];
  }
  const shuffled = state.rng.shuffle(pool);
  shuffled.sort((a, b) => (b.weight - a.weight) * (state.rng.next() > 0.35 ? 1 : -1));
  return shuffled.slice(0, 3);
}

export function checkPendingLevelUp(state) {
  const player = state.player;
  if (player.xp >= player.xpToNext && state.status === "playing") {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext = xpForLevel(player.level);
    state.pendingChoices = generateUpgradeChoices(state);
    state.status = "levelup";
    emitEvent(state, "levelup", { level: player.level });
    return true;
  }
  return false;
}

export function grantXp(state, rawAmount) {
  const stats = computePlayerStats(state.player);
  state.player.xp += rawAmount * stats.xpMult;
  checkPendingLevelUp(state);
}

export function applyUpgradeChoice(state, index, onHeal, onSpark) {
  if (state.status !== "levelup") {
    return false;
  }
  const choice = state.pendingChoices[index];
  if (!choice) {
    return false;
  }
  const player = state.player;

  if (choice.kind === "weapon") {
    player.weapons[choice.id] = choice.nextLevel;
    if (player.weaponTimers[choice.id] === undefined) {
      player.weaponTimers[choice.id] = 0.05;
    }
    if (choice.isEvolve) {
      showBanner(state, `★ ${choice.name.toUpperCase()} FORGÉE ! ★`, 2.4);
      addShake(state, 7, 0.2);
    }
  } else if (choice.kind === "passive") {
    player.passives[choice.id] = choice.nextLevel;
    player.maxHp = computePlayerStats(player).maxHp;
    if (choice.id === "plate_armor") {
      onHeal(state, 30);
    }
  } else {
    onHeal(state, 45);
    state.score += 350;
  }

  state.pendingChoices = [];
  state.status = "playing";
  onSpark(state, player.x, player.y);
  emitEvent(state, choice.isEvolve ? "evolve" : "upgrade_pick", { id: choice.id });
  checkPendingLevelUp(state);
  return true;
}
