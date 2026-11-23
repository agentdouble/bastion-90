import { ARENA_HEIGHT, ARENA_WIDTH, RUN_DURATION } from "./catalog.js";
import { createRng, getDailyDateKey } from "./rng.js";

export function xpForLevel(level) {
  const previous = level - 1;
  return Math.round(64 + previous * 34 + previous ** 1.3 * 11);
}

export function computePlayerStats(player) {
  const p = player.passives;
  const speedLvl = p.quicksilver_boots || 0;
  const furyLvl = p.blacksmith_fury || 0;
  const hasteLvl = p.war_hourglass || 0;
  const magnetLvl = p.treasure_magnet || 0;
  const armorLvl = p.plate_armor || 0;
  const bloodLvl = p.blood_seal || 0;

  return {
    moveSpeed: 235 * (1 + speedLvl * 0.16),
    dashCooldown: Math.max(0.85, 2.05 * Math.pow(0.82, speedLvl)),
    damageMult: 1 + furyLvl * 0.22,
    critChance: 0.1 + furyLvl * 0.08,
    cooldownMult: Math.pow(0.85, hasteLvl),
    magnetRadius: 96 * (1 + magnetLvl * 0.55),
    xpMult: 1 + magnetLvl * 0.2,
    maxHp: 100 + armorLvl * 25,
    bloodHeal: bloodLvl > 0 ? 4 + bloodLvl * 2 : 0
  };
}

function createInitialPlayer() {
  return {
    x: ARENA_WIDTH * 0.5,
    y: ARENA_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    facing: 1,
    radius: 16,
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    xpToNext: xpForLevel(1),
    invulnTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 1,
    dashDirY: 0,
    dashGrazeReady: false,
    walkPhase: 0,
    weapons: { dawn_blade: 1 },
    weaponTimers: { dawn_blade: 0.15 },
    orbitalAngle: 0,
    passives: {},
    killsForBlood: 0
  };
}

export function createInitialState(options = {}) {
  const mode = options.mode === "daily" ? "daily" : "classic";
  const dateKey = options.dateKey || getDailyDateKey();
  const seed = options.seed !== undefined
    ? options.seed
    : mode === "daily"
      ? `bastion90-${dateKey}`
      : Date.now() ^ Math.floor(Math.random() * 0x7fffffff);

  return {
    status: "playing",
    mode,
    dateKey,
    seed,
    rng: createRng(seed),
    elapsed: 0,
    remaining: RUN_DURATION,
    defeatReason: null,
    nextEntityId: 1,
    player: createInitialPlayer(),
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    zones: [],
    lightningBolts: [],
    novas: [],
    pickups: [],
    particles: [],
    floatingTexts: [],
    pendingChoices: [],
    spawnAccumulator: 0,
    minibossSpawned: false,
    bossSpawned: false,
    bossDefeated: false,
    score: 0,
    kills: 0,
    totalDamage: 0,
    combo: 1,
    maxCombo: 1,
    comboTimer: 0,
    grazeCount: 0,
    shakeTime: 0,
    shakeMagnitude: 0,
    hitstopTimer: 0,
    bannerText: "",
    bannerTimer: 0,
    events: []
  };
}

export function isRunOver(state) {
  return state.status === "victory" || state.status === "defeat";
}

export function emitEvent(state, type, payload = null) {
  if (!isRunOver(state)) {
    state.events.push({ type, payload });
  }
}

export function addShake(state, magnitude, duration = 0.14) {
  if (!isRunOver(state) && (magnitude >= state.shakeMagnitude || state.shakeTime <= 0)) {
    state.shakeMagnitude = Math.max(state.shakeMagnitude, magnitude);
    state.shakeTime = Math.max(state.shakeTime, duration);
  }
}

export function showBanner(state, text, duration = 2.6) {
  state.bannerText = text;
  state.bannerTimer = duration;
}
