import { ARENA_HEIGHT, ARENA_MARGIN, ARENA_WIDTH, RUN_DURATION } from "../domain/catalog.js";
import { clamp, normalize } from "../domain/math.js";
import { computePlayerStats, createInitialState, emitEvent, showBanner } from "../domain/state.js";
import { applyUpgradeChoice, spawnParticles, updatePickups } from "./combat.js";
import { updateEnemies, updateEnemyProjectiles } from "./enemies.js";
import { spawnInitialSkirmish, updateSpawner } from "./spawner.js";
import { updatePlayerProjectiles, updateWeapons, updateZonesAndEffects } from "./weapons.js";

export { applyUpgradeChoice };

export function startNewRun(options = {}) {
  const state = createInitialState(options);
  spawnInitialSkirmish(state);
  showBanner(state, "⚔ TIENS LE BASTION — 90 SECONDES ! ⚔", 2.2);
  emitEvent(state, "run_start");
  return state;
}

function updatePlayer(state, input, dt) {
  const player = state.player;
  const stats = computePlayerStats(player);
  player.maxHp = stats.maxHp;
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);

  const move = normalize(input.moveX || 0, input.moveY || 0);
  if (move.len > 0) {
    player.facing = move.x < -0.05 ? -1 : move.x > 0.05 ? 1 : player.facing;
  }

  if (input.dash && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    player.dashTimer = 0.19;
    player.dashCooldown = stats.dashCooldown;
    player.dashGrazeReady = true;
    player.invulnTimer = Math.max(player.invulnTimer, 0.25);
    player.dashDirX = move.len > 0 ? move.x : player.facing;
    player.dashDirY = move.len > 0 ? move.y : 0;
    spawnParticles(state, player.x, player.y, "#f0c96e", 10, 40, 140, 3.5);
    emitEvent(state, "dash");
  }

  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.vx = player.dashDirX * 620;
    player.vy = player.dashDirY * 620;
    if (state.rng.next() < 0.7) {
      spawnParticles(state, player.x, player.y, "#f5c469", 1, 10, 45, 3);
    }
  } else {
    player.vx = move.x * stats.moveSpeed;
    player.vy = move.y * stats.moveSpeed;
  }

  player.x = clamp(player.x + player.vx * dt, ARENA_MARGIN + player.radius, ARENA_WIDTH - ARENA_MARGIN - player.radius);
  player.y = clamp(player.y + player.vy * dt, ARENA_MARGIN + player.radius, ARENA_HEIGHT - ARENA_MARGIN - player.radius);
  if (Math.hypot(player.vx, player.vy) > 12) {
    player.walkPhase += dt * 11;
  }
}

function updateParticlesAndTexts(state, dt) {
  const keptParticles = [];
  for (const p of state.particles) {
    p.life -= dt;
    if (p.life <= 0) {
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.08, dt);
    p.vy *= Math.pow(0.08, dt);
    keptParticles.push(p);
  }
  state.particles = keptParticles;

  const keptTexts = [];
  for (const t of state.floatingTexts) {
    t.life -= dt;
    if (t.life <= 0) {
      continue;
    }
    t.y += t.vy * dt;
    t.vy *= Math.pow(0.25, dt);
    keptTexts.push(t);
  }
  state.floatingTexts = keptTexts;
}

export function stepSimulation(state, input, rawDt) {
  const dt = clamp(rawDt, 0, 0.05);
  state.events = [];

  if (state.bannerTimer > 0) {
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
  }
  if (state.shakeTime > 0) {
    state.shakeTime = Math.max(0, state.shakeTime - dt);
    if (state.shakeTime <= 0) {
      state.shakeMagnitude = 0;
    }
  }

  if (state.status !== "playing") {
    return state;
  }

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    updateParticlesAndTexts(state, dt * 0.5);
    return state;
  }

  state.elapsed += dt;
  state.remaining = Math.max(0, RUN_DURATION - state.elapsed);
  if (state.remaining <= 0 && !state.overtime && !state.bossDefeated) {
    state.overtime = true;
    showBanner(state, "☀ AUBE SANGLANTE — ACHÈVE LE LICHE ! ☀", 3.5);
    emitEvent(state, "overtime");
  }

  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - dt);
  } else if (state.combo > 1) {
    state.combo = Math.max(1, state.combo - dt * 1.4);
  }

  updatePlayer(state, input, dt);
  updateSpawner(state, dt);
  updateWeapons(state, dt);
  updatePlayerProjectiles(state, dt);
  updateZonesAndEffects(state, dt);
  updateEnemies(state, dt);
  updateEnemyProjectiles(state, dt);
  updatePickups(state, dt);
  updateParticlesAndTexts(state, dt);

  return state;
}
