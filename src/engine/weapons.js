import { ARENA_HEIGHT, ARENA_WIDTH, WEAPON_CATALOG } from "../domain/catalog.js";
import { angleBetween, circlesOverlap, distSq } from "../domain/math.js";
import { addShake, computePlayerStats, emitEvent } from "../domain/state.js";
import { damageEnemy, healPlayer, spawnParticles } from "./combat.js";

function findNearestEnemy(state, maxRange = 9999) {
  const player = state.player;
  let best = null;
  let bestSq = maxRange * maxRange;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      continue;
    }
    const dSq = distSq(player.x, player.y, enemy.x, enemy.y);
    if (dSq < bestSq) {
      bestSq = dSq;
      best = enemy;
    }
  }
  return best;
}

function fireDawnBlade(state, level) {
  const player = state.player;
  const target = findNearestEnemy(state);
  const baseAngle = target
    ? angleBetween(player.x, player.y, target.x, target.y)
    : player.facing >= 0
      ? 0
      : Math.PI;

  const count = level >= 5 ? 5 : level >= 4 ? 4 : level >= 2 ? 2 : 1;
  const spread = count === 1 ? 0 : 0.16;
  const evolved = level >= 4;
  const speed = level >= 3 ? 660 : 560;
  const pierce = level >= 4 ? 3 : level >= 3 ? 2 : 1;
  const damage = WEAPON_CATALOG.dawn_blade.baseDamage * (1 + (level - 1) * 0.24) * (evolved ? 1.2 : 1);

  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) * 0.5) * spread;
    const angle = baseAngle + offset;
    state.projectiles.push({
      id: state.nextEntityId++,
      kind: "dawn_blade",
      evolved,
      x: player.x + Math.cos(angle) * 16,
      y: player.y + Math.sin(angle) * 16,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      spin: 0,
      radius: evolved ? 12 : 9,
      damage,
      pierce,
      hitIds: new Set(),
      life: 1.25
    });
  }
  emitEvent(state, "weapon_blade");
}

function fireBerserkerAxe(state, level) {
  const player = state.player;
  const evolved = level >= 4;
  const count = level >= 5 ? 4 : level >= 4 ? 3 : level >= 2 ? 2 : 1;
  const damage = WEAPON_CATALOG.berserker_axe.baseDamage * (1 + (level - 1) * 0.26);
  const target = findNearestEnemy(state);
  const aimAngle = target ? angleBetween(player.x, player.y, target.x, target.y) : -Math.PI * 0.5;

  for (let i = 0; i < count; i += 1) {
    const angle = aimAngle + (i - (count - 1) * 0.5) * 0.42;
    const speed = evolved ? 430 : 370;
    state.projectiles.push({
      id: state.nextEntityId++,
      kind: "berserker_axe",
      evolved,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      spin: 13,
      radius: evolved ? 22 : level >= 3 ? 18 : 15,
      damage,
      pierce: evolved ? 9 : 4,
      hitIds: new Set(),
      life: 1.45
    });
  }
  emitEvent(state, "weapon_axe");
}

function fireGreekFire(state, level) {
  const evolved = level >= 4;
  const count = level >= 4 ? 3 : level >= 3 ? 2 : 1;
  const radius = (evolved ? 86 : level >= 2 ? 72 : 56) + (level >= 5 ? 16 : 0);
  const damage = WEAPON_CATALOG.greek_fire.baseDamage * (1 + (level - 1) * 0.3);

  for (let i = 0; i < count; i += 1) {
    const target = state.enemies.length > 0 ? state.rng.pick(state.enemies) : null;
    const tx = target ? target.x : state.player.x + state.rng.range(-150, 150);
    const ty = target ? target.y : state.player.y + state.rng.range(-120, 120);
    state.zones.push({
      id: state.nextEntityId++,
      x: tx,
      y: ty,
      radius,
      damage,
      evolved,
      slowFactor: evolved ? 0.62 : 0.88,
      tickTimer: 0.05,
      life: evolved ? 4.2 : 3.2,
      maxLife: evolved ? 4.2 : 3.2
    });
    spawnParticles(state, tx, ty, "#ff8b3d", 10, 40, 120, 4);
  }
  emitEvent(state, "weapon_fire");
}

function fireRunicLightning(state, level) {
  if (state.enemies.length === 0) {
    return;
  }
  const evolved = level >= 4;
  const strikes = level >= 5 ? 3 : evolved ? 2 : 1;
  const chains = evolved ? 5 : level >= 2 ? 4 : 2;
  const damage = WEAPON_CATALOG.runic_lightning.baseDamage * (1 + (level - 1) * 0.25);

  for (let s = 0; s < strikes; s += 1) {
    const candidates = state.enemies.filter((enemy) => enemy.hp > 0);
    if (candidates.length === 0) {
      break;
    }
    let current = state.rng.pick(candidates);
    const visited = new Set([current.id]);
    const points = [{ x: current.x, y: current.y - 160 }, { x: current.x, y: current.y }];
    damageEnemy(state, current, damage, 0, 0, level >= 3 ? 0.35 : 0.15);
    spawnParticles(state, current.x, current.y, "#8be9ff", 8, 50, 150, 3);

    for (let c = 0; c < chains; c += 1) {
      let nextTarget = null;
      let bestSq = 210 * 210;
      for (const candidate of state.enemies) {
        if (candidate.hp <= 0 || visited.has(candidate.id)) {
          continue;
        }
        const dSq = distSq(current.x, current.y, candidate.x, candidate.y);
        if (dSq < bestSq) {
          bestSq = dSq;
          nextTarget = candidate;
        }
      }
      if (!nextTarget) {
        break;
      }
      visited.add(nextTarget.id);
      points.push({ x: nextTarget.x, y: nextTarget.y });
      damageEnemy(state, nextTarget, damage * 0.8, 0, 0, 0.2);
      current = nextTarget;
    }
    state.lightningBolts.push({ points, evolved, life: 0.24, maxLife: 0.24 });
  }
  emitEvent(state, "weapon_lightning");
}

function fireHolyShield(state, level) {
  const player = state.player;
  const evolved = level >= 4;
  const radius = (evolved ? 175 : level >= 2 ? 142 : 112) + (level >= 5 ? 25 : 0);
  const damage = WEAPON_CATALOG.holy_shield.baseDamage * (1 + (level - 1) * 0.3);

  state.novas.push({
    x: player.x,
    y: player.y,
    radius: 16,
    maxRadius: radius,
    evolved,
    life: 0.32,
    maxLife: 0.32
  });

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      continue;
    }
    if (circlesOverlap(player.x, player.y, radius, enemy.x, enemy.y, enemy.radius)) {
      const ang = angleBetween(player.x, player.y, enemy.x, enemy.y);
      const push = evolved ? 320 : 210;
      damageEnemy(state, enemy, damage, Math.cos(ang) * push, Math.sin(ang) * push, 0.2);
    }
  }

  state.enemyProjectiles = state.enemyProjectiles.filter(
    (proj) => !circlesOverlap(player.x, player.y, radius, proj.x, proj.y, proj.radius)
  );

  if (level >= 5) {
    healPlayer(state, 3);
  }
  addShake(state, evolved ? 5 : 3, 0.12);
  emitEvent(state, "weapon_shield");
}

function updateOrbitals(state, dt) {
  const level = state.player.weapons.morning_star || 0;
  if (level <= 0) {
    return;
  }
  const player = state.player;
  const evolved = level >= 4;
  const orbCount = level >= 5 ? 6 : level >= 4 ? 5 : level >= 2 ? 3 : 2;
  const orbitRadius = evolved ? 98 : level >= 2 ? 84 : 72;
  const rotSpeed = level >= 3 ? 4.4 : 3.2;
  const orbRadius = evolved ? 15 : 12;
  const damage = WEAPON_CATALOG.morning_star.baseDamage * (1 + (level - 1) * 0.26);

  player.orbitalAngle = (player.orbitalAngle + rotSpeed * dt) % (Math.PI * 2);

  for (let i = 0; i < orbCount; i += 1) {
    const angle = player.orbitalAngle + (i / orbCount) * Math.PI * 2;
    const ox = player.x + Math.cos(angle) * orbitRadius;
    const oy = player.y + Math.sin(angle) * orbitRadius;

    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }
      const cooldown = enemy.orbitHitTimers[i] || 0;
      if (cooldown > 0) {
        continue;
      }
      if (circlesOverlap(ox, oy, orbRadius, enemy.x, enemy.y, enemy.radius)) {
        enemy.orbitHitTimers[i] = 0.26;
        const push = evolved ? 190 : 120;
        damageEnemy(state, enemy, damage, Math.cos(angle) * push, Math.sin(angle) * push);
        spawnParticles(state, ox, oy, evolved ? "#ffae42" : "#d8dee9", 4, 40, 120, 2.8);
      }
    }
  }
}

export function updateWeapons(state, dt) {
  const player = state.player;
  const stats = computePlayerStats(player);

  updateOrbitals(state, dt);

  for (const [id, level] of Object.entries(player.weapons)) {
    if (id === "morning_star" || level <= 0) {
      continue;
    }
    const def = WEAPON_CATALOG[id];
    const evolvedBonus = level >= def.evolveLevel ? 0.82 : 1;
    const cd = def.baseCooldown * stats.cooldownMult * evolvedBonus;
    player.weaponTimers[id] = (player.weaponTimers[id] ?? 0.1) - dt;
    if (player.weaponTimers[id] <= 0) {
      player.weaponTimers[id] = cd;
      if (id === "dawn_blade") fireDawnBlade(state, level);
      if (id === "berserker_axe") fireBerserkerAxe(state, level);
      if (id === "greek_fire") fireGreekFire(state, level);
      if (id === "runic_lightning") fireRunicLightning(state, level);
      if (id === "holy_shield") fireHolyShield(state, level);
    }
  }
}

export function updatePlayerProjectiles(state, dt) {
  const kept = [];
  for (const proj of state.projectiles) {
    proj.life -= dt;
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.angle += proj.spin * dt;
    if (proj.life <= 0 || proj.x < -40 || proj.x > ARENA_WIDTH + 40 || proj.y < -40 || proj.y > ARENA_HEIGHT + 40) {
      continue;
    }

    let alive = true;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || proj.hitIds.has(enemy.id)) {
        continue;
      }
      if (circlesOverlap(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
        proj.hitIds.add(enemy.id);
        const knock = proj.kind === "berserker_axe" ? 140 : 85;
        const speedLen = Math.hypot(proj.vx, proj.vy) || 1;
        damageEnemy(state, enemy, proj.damage, (proj.vx / speedLen) * knock, (proj.vy / speedLen) * knock);
        spawnParticles(state, proj.x, proj.y, proj.evolved ? "#ffe07d" : "#e8eef5", 4, 40, 120, 2.5);
        proj.pierce -= 1;
        if (proj.pierce <= 0) {
          alive = false;
          break;
        }
      }
    }
    if (alive) {
      kept.push(proj);
    }
  }
  state.projectiles = kept;
}

export function updateZonesAndEffects(state, dt) {
  const keptZones = [];
  for (const zone of state.zones) {
    zone.life -= dt;
    zone.tickTimer -= dt;
    if (zone.tickTimer <= 0) {
      zone.tickTimer = 0.28;
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0) {
          continue;
        }
        if (circlesOverlap(zone.x, zone.y, zone.radius, enemy.x, enemy.y, enemy.radius)) {
          damageEnemy(state, enemy, zone.damage, 0, 0);
        }
      }
    }
    if (zone.life > 0) {
      keptZones.push(zone);
    }
  }
  state.zones = keptZones;

  state.lightningBolts = state.lightningBolts.filter((bolt) => {
    bolt.life -= dt;
    return bolt.life > 0;
  });

  state.novas = state.novas.filter((nova) => {
    nova.life -= dt;
    const progress = 1 - Math.max(0, nova.life / nova.maxLife);
    nova.radius = nova.maxRadius * progress;
    return nova.life > 0;
  });
}
