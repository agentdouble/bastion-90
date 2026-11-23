import {
  ARENA_HEIGHT,
  ARENA_MARGIN,
  ARENA_WIDTH,
  BOSS_TIME,
  ENEMY_CATALOG,
  MINIBOSS_TIME,
  RUN_DURATION,
  SURGE_TIME
} from "../domain/catalog.js";
import { clamp, dist } from "../domain/math.js";
import { addShake, emitEvent, showBanner } from "../domain/state.js";

function pickSpawnEdgePoint(state) {
  const player = state.player;
  const pad = ARENA_MARGIN + 18;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const edge = state.rng.int(0, 3);
    let x = pad;
    let y = pad;
    if (edge === 0) {
      x = state.rng.range(pad, ARENA_WIDTH - pad);
      y = pad;
    } else if (edge === 1) {
      x = state.rng.range(pad, ARENA_WIDTH - pad);
      y = ARENA_HEIGHT - pad;
    } else if (edge === 2) {
      x = pad;
      y = state.rng.range(pad, ARENA_HEIGHT - pad);
    } else {
      x = ARENA_WIDTH - pad;
      y = state.rng.range(pad, ARENA_HEIGHT - pad);
    }
    if (dist(x, y, player.x, player.y) >= 240) {
      return { x, y };
    }
  }
  const fallbackX = player.x < ARENA_WIDTH * 0.5 ? ARENA_WIDTH - pad : pad;
  const fallbackY = player.y < ARENA_HEIGHT * 0.5 ? ARENA_HEIGHT - pad : pad;
  return { x: fallbackX, y: fallbackY };
}

export function spawnEnemy(state, kind, customPos = null) {
  const def = ENEMY_CATALOG[kind];
  const pos = customPos || pickSpawnEdgePoint(state);
  const scale = 1 + (state.elapsed / RUN_DURATION) * 0.42;
  const hp = Math.round(def.hp * (def.isBoss ? 1 : scale));

  const enemy = {
    id: state.nextEntityId++,
    kind,
    name: def.name,
    x: clamp(pos.x, ARENA_MARGIN + def.radius, ARENA_WIDTH - ARENA_MARGIN - def.radius),
    y: clamp(pos.y, ARENA_MARGIN + def.radius, ARENA_HEIGHT - ARENA_MARGIN - def.radius),
    vx: 0,
    vy: 0,
    kbX: 0,
    kbY: 0,
    hp,
    maxHp: hp,
    speed: def.speed,
    damage: def.damage,
    radius: def.radius,
    xp: def.xp,
    score: def.score,
    color: def.color,
    isBoss: Boolean(def.isBoss),
    isFinalBoss: Boolean(def.isFinalBoss),
    facing: 1,
    flashTimer: 0,
    stunTimer: 0,
    aiTimer: state.rng.range(1.1, 2.2),
    aiState: "chase",
    telegraphX: 0,
    telegraphY: 0,
    patternIndex: 0,
    orbitHitTimers: {}
  };

  state.enemies.push(enemy);
  return enemy;
}

export function spawnInitialSkirmish(state) {
  const player = state.player;
  const count = 5;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + state.rng.range(-0.25, 0.25);
    const radius = state.rng.range(240, 320);
    spawnEnemy(state, "goblin", {
      x: player.x + Math.cos(angle) * radius,
      y: player.y + Math.sin(angle) * radius
    });
  }
}

function chooseWaveKind(state) {
  const t = state.elapsed;
  const r = state.rng.next();
  if (t < SURGE_TIME) {
    return r < 0.72 ? "goblin" : "skeleton";
  }
  if (t < MINIBOSS_TIME) {
    if (r < 0.36) return "goblin";
    if (r < 0.72) return "skeleton";
    if (r < 0.88) return "charger";
    return "cultist";
  }
  if (t < BOSS_TIME) {
    if (r < 0.25) return "goblin";
    if (r < 0.5) return "skeleton";
    if (r < 0.7) return "charger";
    if (r < 0.87) return "cultist";
    return "cursed_knight";
  }
  if (r < 0.22) return "skeleton";
  if (r < 0.45) return "goblin";
  if (r < 0.67) return "charger";
  if (r < 0.85) return "cultist";
  return "cursed_knight";
}

function getSpawnRate(state) {
  return state.bossSpawned ? 0.75 : 0.62 + 0.98 * (state.elapsed / BOSS_TIME);
}

export function updateSpawner(state, dt) {
  if (!state.minibossSpawned && state.elapsed >= MINIBOSS_TIME) {
    state.minibossSpawned = true;
    spawnEnemy(state, "executioner");
    showBanner(state, "⚔ L'EXÉCUTEUR D'ACIER ENTRE EN LICE ! ⚔", 2.8);
    addShake(state, 9, 0.3);
    emitEvent(state, "boss_horn");
  }

  if (!state.bossSpawned && state.elapsed >= BOSS_TIME) {
    state.bossSpawned = true;
    spawnEnemy(state, "arch_lich");
    showBanner(state, "☠ LE SEIGNEUR LICHE S'ÉVEILLE ! ☠", 3.4);
    addShake(state, 12, 0.4);
    emitEvent(state, "boss_horn");
  }

  const maxEnemies = state.bossSpawned ? 42 : 56;
  if (state.enemies.length >= maxEnemies) {
    return;
  }

  state.spawnAccumulator += dt * getSpawnRate(state);
  while (state.spawnAccumulator >= 1 && state.enemies.length < maxEnemies) {
    state.spawnAccumulator -= 1;
    const kind = chooseWaveKind(state);
    const packSize = kind === "goblin" ? Math.min(2, maxEnemies - state.enemies.length) : 1;
    for (let i = 0; i < packSize; i += 1) {
      spawnEnemy(state, kind);
    }
  }
}
