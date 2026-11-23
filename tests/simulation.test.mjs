import assert from "node:assert/strict";
import test from "node:test";
import { ARENA_MARGIN, ARENA_WIDTH, computeRank, getPhaseLabel } from "../src/domain/catalog.js";
import { createRng, getDailyDateKey } from "../src/domain/rng.js";
import { damageEnemy, damagePlayer } from "../src/engine/combat.js";
import { spawnEnemy } from "../src/engine/spawner.js";
import { applyUpgradeChoice, startNewRun, stepSimulation } from "../src/engine/simulation.js";
import { grantXp } from "../src/engine/upgrades.js";

test("PRNG and daily run seeding are strictly deterministic", () => {
  const rngA = createRng("bastion90-2026-11-23");
  const rngB = createRng("bastion90-2026-11-23");
  const seqA = Array.from({ length: 12 }, () => rngA.next());
  const seqB = Array.from({ length: 12 }, () => rngB.next());
  assert.deepEqual(seqA, seqB);
  assert.match(getDailyDateKey(new Date("2026-11-23T00:00:00Z")), /^2026-11-23$/);

  const runA = startNewRun({ mode: "daily", dateKey: "2026-11-23" });
  const runB = startNewRun({ mode: "daily", dateKey: "2026-11-23" });
  for (let i = 0; i < 180; i += 1) {
    stepSimulation(runA, { moveX: 1, moveY: 0, dash: i === 20 }, 1 / 60);
    stepSimulation(runB, { moveX: 1, moveY: 0, dash: i === 20 }, 1 / 60);
  }
  assert.equal(runA.player.x, runB.player.x);
  assert.equal(runA.score, runB.score);
  assert.equal(runA.enemies.length, runB.enemies.length);
});

test("Player movement clamps within arena battlements and dash triggers graze parade", () => {
  const state = startNewRun({ seed: 42 });
  for (let i = 0; i < 400; i += 1) {
    stepSimulation(state, { moveX: -1, moveY: -1, dash: false }, 1 / 60);
  }
  assert.ok(state.player.x >= ARENA_MARGIN + state.player.radius);
  assert.ok(state.player.y >= ARENA_MARGIN + state.player.radius);

  const grazeRun = startNewRun({ seed: 77 });
  grazeRun.enemies = [];
  spawnEnemy(grazeRun, "goblin", { x: grazeRun.player.x + 34, y: grazeRun.player.y });
  stepSimulation(grazeRun, { moveX: 1, moveY: 0, dash: true }, 1 / 60);
  stepSimulation(grazeRun, { moveX: 1, moveY: 0, dash: false }, 1 / 60);
  assert.equal(grazeRun.grazeCount, 1);
  assert.equal(grazeRun.player.hp, grazeRun.player.maxHp);
});

test("Level-up choice upgrades weapons and triggers Forged Awakening at level 4", () => {
  const state = startNewRun({ seed: 101 });
  state.player.weapons.dawn_blade = 3;
  state.status = "levelup";
  state.pendingChoices = [
    {
      kind: "weapon",
      id: "dawn_blade",
      name: "Excalibur Solaire",
      nextLevel: 4,
      isEvolve: true
    }
  ];
  const applied = applyUpgradeChoice(state, 0);
  assert.equal(applied, true);
  assert.equal(state.status, "playing");
  assert.equal(state.player.weapons.dawn_blade, 4);
  assert.match(state.bannerText, /EXCALIBUR SOLAIRE/);
});

function advanceFrames(state, count, dt = 1 / 60) {
  for (let i = 0; i < count; i += 1) {
    stepSimulation(state, {}, dt);
  }
}

function queueLethalBolt(state, target) {
  state.projectiles.push({
    kind: "dawn_blade",
    x: target.x,
    y: target.y,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    life: 1,
    radius: 9,
    damage: 9999,
    pierce: 3,
    hitIds: new Set()
  });
}

function assertFrozen(state) {
  const snapshot = (run) => JSON.stringify({ ...run, events: [] });
  const before = snapshot(state);
  stepSimulation(state, { moveX: 1, dash: true }, 0.05);
  assert.equal(snapshot(state), before);
  assert.deepEqual(state.events, []);
}

for (const mode of ["classic", "daily"]) {
  test(`${mode}: the two boss milestones and the hard deadline use active time`, () => {
    const state = startNewRun({ mode, seed: 9090 });
    state.player.invulnTimer = 1000;
    state.player.weapons = {};
    assert.equal(state.mode, mode);
    assert.equal(state.remaining, 600);
    assert.equal(getPhaseLabel(state.elapsed), "L'AVANT-GARDE");
    const enemiesOfKind = (kind) => state.enemies.filter((enemy) => enemy.kind === kind);

    advanceFrames(state, 270 * 60 - 1);
    assert.ok(state.elapsed < 270);
    assert.equal(enemiesOfKind("executioner").length, 0);
    assert.equal(getPhaseLabel(state.elapsed), "LA MARÉE SOMBRE");
    advanceFrames(state, 1);
    assert.equal(state.elapsed, 270);
    assert.equal(enemiesOfKind("executioner").length, 1);
    assert.equal(getPhaseLabel(state.elapsed), "L'ASSAUT INFERNAL");
    assert.equal(state.events.filter(({ type }) => type === "boss_horn").length, 1);
    enemiesOfKind("executioner")[0].hp = 0;

    advanceFrames(state, 240 * 60 - 1);
    assert.ok(state.elapsed < 510);
    assert.equal(enemiesOfKind("executioner").length, 0);
    assert.equal(enemiesOfKind("arch_lich").length, 0);
    advanceFrames(state, 1);
    assert.equal(state.elapsed, 510);
    assert.equal(enemiesOfKind("arch_lich").length, 1);
    const [lich] = enemiesOfKind("arch_lich");
    assert.equal(getPhaseLabel(state.elapsed), "BOSS FINAL — SEIGNEUR LICHE");
    assert.equal(state.events.filter(({ type }) => type === "boss_horn").length, 1);

    advanceFrames(state, 90 * 60 - 1);
    assert.ok(state.remaining > 0);
    assert.equal(state.status, "playing");
    assert.deepEqual(enemiesOfKind("arch_lich").map(({ id }) => id), [lich.id]);
    queueLethalBolt(state, lich);
    advanceFrames(state, 1);
    assert.equal(state.elapsed, 600);
    assert.equal(state.remaining, 0);
    assert.equal(state.status, "defeat");
    assert.equal(state.defeatReason, "timeout");
    assert.ok(lich.hp > 0 && state.player.hp > 0);
    assert.equal(state.projectiles[0].life, 1);
    assert.deepEqual(state.events.map(({ type }) => type), ["defeat"]);
    assertFrozen(state);
  });
}

test("Killing the Lich early awards the remaining-time bonus and ends the frame", () => {
  const state = startNewRun({ seed: 314 });
  state.elapsed = 539.95;
  state.minibossSpawned = true;
  state.bossSpawned = true;
  state.enemies = [];
  const lich = spawnEnemy(state, "arch_lich");
  const bystander = spawnEnemy(state, "goblin", lich);
  queueLethalBolt(state, lich);
  state.pickups.push({ x: state.player.x, y: state.player.y, radius: 7, kind: "xp", value: 100 });

  advanceFrames(state, 1, 0.05);
  assert.equal(state.elapsed, 540);
  assert.equal(state.remaining, 60);
  assert.equal(state.status, "victory");
  assert.equal(state.bossDefeated, true);
  assert.equal(state.score, 5800);
  assert.equal(state.kills, 1);
  assert.equal(bystander.hp, bystander.maxHp);
  assert.equal(state.player.xp, 0);
  assert.equal(state.shakeTime, 0);
  assert.deepEqual(state.events.map(({ type }) => type), ["boss_kill", "victory"]);
  assertFrozen(state);
});

test("A fatal collision ends the run before projectiles and pickups advance", () => {
  const state = startNewRun({ seed: 55 });
  state.enemies = [];
  state.player.hp = 1;
  const enemy = spawnEnemy(state, "goblin", state.player);
  state.enemyProjectiles.push({ life: 1 });
  state.pickups.push({ x: state.player.x, y: state.player.y, radius: 10, kind: "heart", value: 18 });
  advanceFrames(state, 1);
  assert.equal(state.status, "defeat");
  assert.equal(state.defeatReason, "fallen");
  assert.equal(state.player.hp, 0);
  assert.equal(state.shakeTime, 0);
  assert.equal(state.enemyProjectiles[0].life, 1);
  assert.equal(state.pickups.length, 1);
  assert.equal(damageEnemy(state, enemy, 999), false);
  assert.equal(damagePlayer(state, 999, 0, 0), false);
  assert.equal(applyUpgradeChoice(state, 0), false);
  assertFrozen(state);
});

test("Rank rewards a fast clear and distinguishes ten-minute score tiers", () => {
  assert.equal(computeRank(5800, true, 575), "S+");
  assert.equal(computeRank(200000, true, 590), "S+");
  assert.equal(computeRank(100000, true, 590), "S");
  assert.equal(computeRank(99999, true, 590), "A");
  assert.equal(computeRank(45000, false, 600), "A");
  assert.equal(computeRank(15000, false, 600), "B");
  assert.equal(computeRank(14999, false, 600), "C");
});

test("Pause and consecutive Forge choices freeze the clock and preserve surplus XP", () => {
  const state = startNewRun({ seed: 99 });
  advanceFrames(state, 60);
  state.status = "paused";
  assertFrozen(state);
  state.status = "playing";

  grantXp(state, 349);
  assert.equal(state.status, "levelup");
  assert.equal(state.player.level, 2);
  assert.equal(state.player.xp, 285);
  assertFrozen(state);
  assert.equal(applyUpgradeChoice(state, 0), true);
  assert.equal(state.status, "levelup");
  assert.equal(state.player.level, 3);
  assert.equal(state.player.xp, 176);
  assertFrozen(state);
  assert.equal(applyUpgradeChoice(state, 0), true);
  assert.equal(state.status, "levelup");
  assert.equal(state.player.level, 4);
  assert.equal(state.player.xp, 17);
  assert.equal(applyUpgradeChoice(state, 0), true);
  assert.equal(state.status, "playing");
  assert.equal(state.elapsed, 1);
  assert.equal(state.remaining, 599);
  advanceFrames(state, 1);
  assert.ok(state.elapsed > 1);
});

test("Four XP per active second reaches the expected Forge and boss levels", () => {
  const state = startNewRun({ seed: 123 });
  let firstChoiceAt = null;
  for (let second = 1; second <= 510; second += 1) {
    grantXp(state, 4);
    if (state.status === "levelup") {
      firstChoiceAt ??= second;
      const index = state.pendingChoices.findIndex(({ id }) => id !== "treasure_magnet");
      assert.equal(applyUpgradeChoice(state, index), true);
    }
    if (second === 270) {
      assert.ok(state.player.level >= 5 && state.player.level <= 7);
    }
  }
  assert.ok(firstChoiceAt !== null && firstChoiceAt <= 30);
  assert.ok(state.player.level >= 8 && state.player.level <= 10);
});
