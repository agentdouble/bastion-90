import assert from "node:assert/strict";
import test from "node:test";
import { ARENA_HEIGHT, ARENA_MARGIN, ARENA_WIDTH, BOSS_TIME, MINIBOSS_TIME, computeRank } from "../src/domain/catalog.js";
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

test("Full 70-second headless soak spawns Executioner and Arch-Lich with valid finite state", () => {
  const state = startNewRun({ seed: 9090 });
  state.player.hp = 9999;
  state.player.maxHp = 9999;
  state.player.passives.plate_armor = 3;
  state.player.weapons.morning_star = 3;
  state.player.weapons.runic_lightning = 2;

  const totalSteps = Math.ceil((BOSS_TIME + 5) * 60);
  for (let i = 0; i < totalSteps; i += 1) {
    if (state.status === "levelup") {
      applyUpgradeChoice(state, 0);
    }
    const angle = i * 0.03;
    stepSimulation(state, { moveX: Math.cos(angle), moveY: Math.sin(angle), dash: i % 150 === 0 }, 1 / 60);
  }

  assert.equal(state.minibossSpawned, true);
  assert.equal(state.bossSpawned, true);
  assert.ok(state.elapsed >= MINIBOSS_TIME);
  assert.ok(Number.isFinite(state.player.x) && Number.isFinite(state.player.y));
  assert.ok(state.player.x <= ARENA_WIDTH - ARENA_MARGIN);
  assert.ok(state.player.y <= ARENA_HEIGHT - ARENA_MARGIN);
  assert.ok(state.kills > 10);
});

test("Defeating Arch-Lich awards victory and rank calculation scales properly", () => {
  const state = startNewRun({ seed: 314 });
  state.elapsed = 72;
  state.remaining = 18;
  const boss = spawnEnemy(state, "arch_lich");
  damageEnemy(state, boss, 99999);
  assert.equal(state.bossDefeated, true);
  assert.equal(state.status, "victory");
  assert.equal(computeRank(10000, true, 78), "S+");
  assert.equal(computeRank(7000, true, 88), "S");
  assert.equal(computeRank(1200, false, 30), "C");
});

test("Player defeat, Blood Dawn overtime, and overflow XP multi-levelup behave cleanly", () => {
  const defeatRun = startNewRun({ seed: 55 });
  damagePlayer(defeatRun, 999, 0, 0);
  assert.equal(defeatRun.status, "defeat");
  assert.equal(defeatRun.player.hp, 0);

  const overtimeRun = startNewRun({ seed: 88 });
  overtimeRun.elapsed = 89.99;
  stepSimulation(overtimeRun, { moveX: 0, moveY: 0, dash: false }, 0.05);
  assert.equal(overtimeRun.overtime, true);

  const xpRun = startNewRun({ seed: 99 });
  grantXp(xpRun, 140);
  assert.equal(xpRun.status, "levelup");
  assert.equal(xpRun.player.level, 2);
  applyUpgradeChoice(xpRun, 0);
  assert.equal(xpRun.status, "levelup");
  assert.equal(xpRun.player.level, 3);
});
