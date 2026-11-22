import { ARENA_HEIGHT, ARENA_MARGIN, ARENA_WIDTH } from "../domain/catalog.js";
import { clamp, circlesOverlap, dist, normalize } from "../domain/math.js";
import { addShake, computePlayerStats, emitEvent, showBanner } from "../domain/state.js";
import { applyUpgradeChoice as applyChoiceCore, grantXp } from "./upgrades.js";

export function spawnParticles(state, x, y, color, count, speedMin = 40, speedMax = 170, size = 3.5) {
  const maxParticles = 240;
  for (let i = 0; i < count; i += 1) {
    if (state.particles.length >= maxParticles) {
      state.particles.shift();
    }
    const angle = state.rng.range(0, Math.PI * 2);
    const speed = state.rng.range(speedMin, speedMax);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: state.rng.range(0.22, 0.55),
      maxLife: 0.55,
      size: state.rng.range(size * 0.6, size * 1.35),
      color
    });
  }
}

export function spawnFloatingText(state, x, y, text, color, scale = 1) {
  if (state.floatingTexts.length > 48) {
    state.floatingTexts.shift();
  }
  state.floatingTexts.push({
    x: x + state.rng.range(-8, 8),
    y: y - 10,
    vy: -48,
    text,
    color,
    scale,
    life: 0.68,
    maxLife: 0.68
  });
}

export function spawnPickup(state, x, y, kind, value) {
  state.pickups.push({
    id: state.nextEntityId++,
    x: clamp(x, ARENA_MARGIN + 10, ARENA_WIDTH - ARENA_MARGIN - 10),
    y: clamp(y, ARENA_MARGIN + 10, ARENA_HEIGHT - ARENA_MARGIN - 10),
    kind,
    value,
    radius: kind === "chest" ? 13 : kind === "heart" ? 10 : 7,
    magnetized: false,
    age: 0
  });
}

export function healPlayer(state, amount) {
  const stats = computePlayerStats(state.player);
  state.player.maxHp = stats.maxHp;
  const before = state.player.hp;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
  const gained = Math.round(state.player.hp - before);
  if (gained > 0) {
    spawnFloatingText(state, state.player.x, state.player.y - 16, `+${gained} PV`, "#6ce88a", 1.05);
    spawnParticles(state, state.player.x, state.player.y, "#6ce88a", 8, 30, 95, 3);
  }
}

export function applyUpgradeChoice(state, index) {
  return applyChoiceCore(
    state,
    index,
    healPlayer,
    (st, x, y) => spawnParticles(st, x, y, "#f0c96e", 18, 60, 180, 4)
  );
}

export function registerComboKill(state, baseScore) {
  state.kills += 1;
  state.comboTimer = 3.2;
  state.combo = Math.min(12, state.combo + 0.35);
  const wholeCombo = Math.floor(state.combo);
  if (wholeCombo > state.maxCombo) {
    state.maxCombo = wholeCombo;
  }
  state.score += Math.round(baseScore * wholeCombo);

  const stats = computePlayerStats(state.player);
  if (stats.bloodHeal > 0) {
    state.player.killsForBlood += 1;
    if (state.player.killsForBlood >= 12) {
      state.player.killsForBlood = 0;
      healPlayer(state, stats.bloodHeal);
    }
  }
}

function handleEnemyDeath(state, enemy) {
  registerComboKill(state, enemy.score);
  const burst = enemy.isBoss ? 34 : 11;
  spawnParticles(state, enemy.x, enemy.y, enemy.color, burst, 55, enemy.isBoss ? 280 : 165, enemy.isBoss ? 5.5 : 3.6);
  spawnPickup(state, enemy.x, enemy.y, "xp", enemy.xp);

  if (enemy.kind === "cursed_knight" || enemy.kind === "executioner") {
    spawnPickup(state, enemy.x + 14, enemy.y, "chest", 42);
    addShake(state, enemy.isBoss ? 11 : 5, 0.22);
    state.hitstopTimer = Math.max(state.hitstopTimer, enemy.isBoss ? 0.05 : 0.025);
  } else if (state.rng.next() < 0.045) {
    spawnPickup(state, enemy.x - 10, enemy.y, "heart", 18);
  }

  emitEvent(state, enemy.isBoss ? "boss_kill" : "enemy_kill", { kind: enemy.kind });

  if (enemy.isFinalBoss) {
    state.bossDefeated = true;
    const speedBonus = Math.round(Math.max(0, state.remaining) * 95);
    state.score += 1800 + speedBonus;
    addShake(state, 15, 0.45);
    state.hitstopTimer = 0.06;
    state.status = "victory";
    showBanner(state, "SEIGNEUR LICHE TERRASSÉ — VICTOIRE !", 4);
    emitEvent(state, "victory", { score: state.score });
  }
}

export function damageEnemy(state, enemy, rawDamage, knockX = 0, knockY = 0, stun = 0) {
  if (enemy.hp <= 0) {
    return false;
  }
  const stats = computePlayerStats(state.player);
  const isCrit = state.rng.next() < stats.critChance;
  const amount = Math.max(1, Math.round(rawDamage * stats.damageMult * (isCrit ? 1.75 : 1)));
  enemy.hp -= amount;
  enemy.flashTimer = 0.11;
  state.totalDamage += amount;

  const knockResist = enemy.isBoss ? 0.14 : enemy.kind === "cursed_knight" ? 0.4 : 1;
  enemy.kbX += knockX * knockResist;
  enemy.kbY += knockY * knockResist;
  if (stun > 0 && !enemy.isBoss) {
    enemy.stunTimer = Math.max(enemy.stunTimer, stun);
  }

  spawnFloatingText(
    state,
    enemy.x,
    enemy.y - enemy.radius * 0.6,
    isCrit ? `${amount}!` : `${amount}`,
    isCrit ? "#ffe169" : "#f7efe0",
    isCrit ? 1.24 : 0.96
  );

  if (enemy.hp <= 0) {
    handleEnemyDeath(state, enemy);
    return true;
  }
  emitEvent(state, isCrit ? "crit_hit" : "hit", { amount });
  return false;
}

export function damagePlayer(state, amount, sourceX, sourceY) {
  const player = state.player;
  if (player.invulnTimer > 0 || player.dashTimer > 0 || state.status !== "playing") {
    return false;
  }
  player.hp = Math.max(0, player.hp - amount);
  player.invulnTimer = 0.58;
  state.combo = Math.max(1, state.combo * 0.55);
  addShake(state, 9, 0.24);
  spawnParticles(state, player.x, player.y, "#e04136", 14, 65, 190, 4);
  spawnFloatingText(state, player.x, player.y - 20, `-${amount}`, "#ff5e57", 1.2);

  const push = normalize(player.x - sourceX, player.y - sourceY);
  player.x = clamp(player.x + push.x * 16, ARENA_MARGIN + player.radius, ARENA_WIDTH - ARENA_MARGIN - player.radius);
  player.y = clamp(player.y + push.y * 16, ARENA_MARGIN + player.radius, ARENA_HEIGHT - ARENA_MARGIN - player.radius);
  emitEvent(state, "player_hit", { amount });

  if (player.hp <= 0) {
    state.status = "defeat";
    showBanner(state, "LE BASTION EST TOMBÉ", 4);
    emitEvent(state, "defeat", { score: state.score });
  }
  return true;
}

export function triggerGraze(state, x, y) {
  const player = state.player;
  if (!player.dashGrazeReady) {
    return;
  }
  player.dashGrazeReady = false;
  player.dashCooldown = Math.max(0, player.dashCooldown - 0.65);
  state.grazeCount += 1;
  state.combo = Math.min(12, state.combo + 0.8);
  state.comboTimer = 3.4;
  state.score += 75 * Math.floor(state.combo);
  spawnParticles(state, x, y, "#ffe6a1", 12, 60, 170, 3.5);
  spawnFloatingText(state, player.x, player.y - 24, "PARADE !", "#ffe6a1", 1.25);
  emitEvent(state, "graze");
}

export function updatePickups(state, dt) {
  const player = state.player;
  const stats = computePlayerStats(player);
  const kept = [];

  for (const item of state.pickups) {
    item.age += dt;
    const d = dist(item.x, item.y, player.x, player.y);
    if (d <= stats.magnetRadius || (item.kind === "chest" && d <= stats.magnetRadius * 1.35)) {
      item.magnetized = true;
    }
    if (item.magnetized) {
      const dir = normalize(player.x - item.x, player.y - item.y);
      const pullSpeed = 480 + item.age * 90;
      item.x += dir.x * pullSpeed * dt;
      item.y += dir.y * pullSpeed * dt;
    }

    if (circlesOverlap(item.x, item.y, item.radius + 4, player.x, player.y, player.radius)) {
      if (item.kind === "xp") {
        emitEvent(state, "xp_pickup");
        grantXp(state, item.value);
      } else if (item.kind === "heart") {
        healPlayer(state, item.value);
        emitEvent(state, "heal");
      } else if (item.kind === "chest") {
        healPlayer(state, 24);
        state.score += 300;
        spawnFloatingText(state, player.x, player.y - 26, "COFFRE ROYAL !", "#ffe6a1", 1.25);
        emitEvent(state, "chest");
        grantXp(state, item.value);
      }
      continue;
    }
    kept.push(item);
  }
  state.pickups = kept;
}
