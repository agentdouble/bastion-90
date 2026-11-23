import { ARENA_HEIGHT, ARENA_MARGIN, ARENA_WIDTH } from "../domain/catalog.js";
import { angleBetween, clamp, circlesOverlap, dist, normalize } from "../domain/math.js";
import { addShake, emitEvent } from "../domain/state.js";
import { damagePlayer, spawnParticles, triggerGraze } from "./combat.js";
import { spawnEnemy } from "./spawner.js";

function spawnEnemyOrb(state, x, y, angle, speed, damage, radius = 7, color = "#c77dff") {
  state.enemyProjectiles.push({
    id: state.nextEntityId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    radius,
    color,
    life: 3.4
  });
}

function updateChargerAi(state, enemy, dt, speedMult) {
  const player = state.player;
  enemy.aiTimer -= dt;
  if (enemy.aiState === "chase") {
    const dir = normalize(player.x - enemy.x, player.y - enemy.y);
    enemy.vx = dir.x * enemy.speed * speedMult;
    enemy.vy = dir.y * enemy.speed * speedMult;
    if (enemy.aiTimer <= 0 && dist(enemy.x, enemy.y, player.x, player.y) < 330) {
      enemy.aiState = "windup";
      enemy.aiTimer = 0.52;
      enemy.telegraphX = player.x;
      enemy.telegraphY = player.y;
      enemy.vx = 0;
      enemy.vy = 0;
    }
  } else if (enemy.aiState === "windup") {
    enemy.vx = 0;
    enemy.vy = 0;
    if (enemy.aiTimer <= 0) {
      const dir = normalize(enemy.telegraphX - enemy.x, enemy.telegraphY - enemy.y);
      enemy.aiState = "rush";
      enemy.aiTimer = 0.44;
      enemy.vx = dir.x * 410;
      enemy.vy = dir.y * 410;
    }
  } else if (enemy.aiState === "rush" && enemy.aiTimer <= 0) {
    enemy.aiState = "chase";
    enemy.aiTimer = state.rng.range(2.2, 3.1);
  }
}

function updateCultistAi(state, enemy, dt, speedMult) {
  const player = state.player;
  const d = dist(enemy.x, enemy.y, player.x, player.y);
  const dir = normalize(player.x - enemy.x, player.y - enemy.y);
  if (d > 240) {
    enemy.vx = dir.x * enemy.speed * speedMult;
    enemy.vy = dir.y * enemy.speed * speedMult;
  } else if (d < 150) {
    enemy.vx = -dir.x * enemy.speed * 0.7;
    enemy.vy = -dir.y * enemy.speed * 0.7;
  } else {
    enemy.vx = -dir.y * enemy.speed * 0.5;
    enemy.vy = dir.x * enemy.speed * 0.5;
  }
  enemy.aiTimer -= dt;
  if (enemy.aiTimer <= 0) {
    enemy.aiTimer = state.rng.range(2.2, 3.0);
    const angle = angleBetween(enemy.x, enemy.y, player.x, player.y);
    spawnEnemyOrb(state, enemy.x, enemy.y, angle, 240, enemy.damage, 7, "#c77dff");
  }
}

function executeLichPattern(state, enemy, enraged) {
  const player = state.player;
  const pattern = enemy.patternIndex % 3;
  enemy.patternIndex += 1;

  if (pattern === 0) {
    const orbCount = enraged ? 14 : 10;
    const offset = angleBetween(enemy.x, enemy.y, player.x, player.y);
    for (let i = 0; i < orbCount; i += 1) {
      const ang = offset + (i / orbCount) * Math.PI * 2;
      spawnEnemyOrb(state, enemy.x, enemy.y, ang, enraged ? 255 : 215, 16, 8, "#d98cff");
    }
    spawnParticles(state, enemy.x, enemy.y, "#c77dff", 16, 60, 170, 4);
    emitEvent(state, "boss_cast");
    enemy.aiTimer = 2.0;
    return;
  }

  if (pattern === 1) {
    enemy.aiState = "windup";
    enemy.aiTimer = 0.65;
    enemy.telegraphX = player.x;
    enemy.telegraphY = player.y;
    return;
  }

  for (let i = 0; i < 3; i += 1) {
    const ang = (i / 3) * Math.PI * 2 + state.rng.range(0, 0.8);
    spawnEnemy(state, "skeleton", {
      x: enemy.x + Math.cos(ang) * 75,
      y: enemy.y + Math.sin(ang) * 75
    });
  }
  spawnParticles(state, enemy.x, enemy.y, "#9d4edd", 14, 50, 140, 4);
  enemy.aiTimer = 2.1;
}

function updateArchLichAi(state, enemy, dt, speedMult) {
  const player = state.player;
  const enraged = enemy.hp < enemy.maxHp * 0.45;
  enemy.aiTimer -= dt * (enraged ? 1.32 : 1);

  if (enemy.aiState === "windup") {
    enemy.vx = 0;
    enemy.vy = 0;
    if (enemy.aiTimer <= 0) {
      const dir = normalize(enemy.telegraphX - enemy.x, enemy.telegraphY - enemy.y);
      enemy.aiState = "rush";
      enemy.aiTimer = 0.55;
      enemy.vx = dir.x * (enraged ? 450 : 380);
      enemy.vy = dir.y * (enraged ? 450 : 380);
      addShake(state, 5, 0.14);
    }
    return;
  }

  if (enemy.aiState === "rush") {
    if (enemy.aiTimer <= 0) {
      enemy.aiState = "chase";
      enemy.aiTimer = 1.6;
    }
    return;
  }

  const dir = normalize(player.x - enemy.x, player.y - enemy.y);
  enemy.vx = dir.x * enemy.speed * speedMult * (enraged ? 1.18 : 1);
  enemy.vy = dir.y * enemy.speed * speedMult * (enraged ? 1.18 : 1);

  if (enemy.aiTimer <= 0) {
    executeLichPattern(state, enemy, enraged);
  }
}

function getFireSlowFactor(state, enemy) {
  let factor = 1;
  for (const zone of state.zones) {
    if (circlesOverlap(zone.x, zone.y, zone.radius, enemy.x, enemy.y, enemy.radius)) {
      factor = Math.min(factor, zone.slowFactor);
    }
  }
  return factor;
}

function applySoftSeparation(enemies) {
  for (let i = 0; i < enemies.length; i += 1) {
    const a = enemies[i];
    for (let j = i + 1; j < enemies.length; j += 1) {
      const b = enemies[j];
      const minDist = (a.radius + b.radius) * 0.82;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dSq = dx * dx + dy * dy;
      if (dSq > 0.001 && dSq < minDist * minDist) {
        const d = Math.sqrt(dSq);
        const push = (minDist - d) * 0.32;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

export function updateEnemies(state, dt) {
  const player = state.player;
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

  for (const enemy of state.enemies) {
    enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
    for (const orbKey of Object.keys(enemy.orbitHitTimers)) {
      enemy.orbitHitTimers[orbKey] = Math.max(0, enemy.orbitHitTimers[orbKey] - dt);
    }

    const slow = getFireSlowFactor(state, enemy);
    if (enemy.stunTimer > 0) {
      enemy.vx *= 0.7;
      enemy.vy *= 0.7;
    } else if (enemy.kind === "charger" || enemy.kind === "executioner") {
      updateChargerAi(state, enemy, dt, slow);
    } else if (enemy.kind === "cultist") {
      updateCultistAi(state, enemy, dt, slow);
    } else if (enemy.kind === "arch_lich") {
      updateArchLichAi(state, enemy, dt, slow);
    } else {
      const dir = normalize(player.x - enemy.x, player.y - enemy.y);
      enemy.vx = dir.x * enemy.speed * slow;
      enemy.vy = dir.y * enemy.speed * slow;
    }

    enemy.x += (enemy.vx + enemy.kbX) * dt;
    enemy.y += (enemy.vy + enemy.kbY) * dt;
    enemy.kbX *= Math.pow(0.015, dt);
    enemy.kbY *= Math.pow(0.015, dt);
    enemy.x = clamp(enemy.x, ARENA_MARGIN + enemy.radius, ARENA_WIDTH - ARENA_MARGIN - enemy.radius);
    enemy.y = clamp(enemy.y, ARENA_MARGIN + enemy.radius, ARENA_HEIGHT - ARENA_MARGIN - enemy.radius);
    if (Math.abs(enemy.vx) > 5) {
      enemy.facing = enemy.vx >= 0 ? 1 : -1;
    }

    if (player.dashTimer > 0 && circlesOverlap(player.x, player.y, player.radius + 30, enemy.x, enemy.y, enemy.radius)) {
      triggerGraze(state, (player.x + enemy.x) * 0.5, (player.y + enemy.y) * 0.5);
    } else if (circlesOverlap(player.x, player.y, player.radius - 2, enemy.x, enemy.y, enemy.radius - 2)) {
      damagePlayer(state, enemy.damage, enemy.x, enemy.y);
      if (state.status === "defeat") {
        return;
      }
    }
  }

  applySoftSeparation(state.enemies);
}

export function updateEnemyProjectiles(state, dt) {
  const player = state.player;
  const kept = [];

  for (const proj of state.enemyProjectiles) {
    proj.life -= dt;
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    if (
      proj.life <= 0 ||
      proj.x < ARENA_MARGIN ||
      proj.x > ARENA_WIDTH - ARENA_MARGIN ||
      proj.y < ARENA_MARGIN ||
      proj.y > ARENA_HEIGHT - ARENA_MARGIN
    ) {
      continue;
    }

    if (player.dashTimer > 0 && circlesOverlap(player.x, player.y, player.radius + 26, proj.x, proj.y, proj.radius)) {
      triggerGraze(state, proj.x, proj.y);
      kept.push(proj);
      continue;
    }

    if (circlesOverlap(player.x, player.y, player.radius - 2, proj.x, proj.y, proj.radius)) {
      damagePlayer(state, proj.damage, proj.x, proj.y);
      if (state.status === "defeat") {
        return;
      }
      continue;
    }
    kept.push(proj);
  }
  state.enemyProjectiles = kept;
}
