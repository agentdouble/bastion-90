import { ARENA_HEIGHT, ARENA_WIDTH } from "../domain/catalog.js";
import { clamp } from "../domain/math.js";
import { createArenaRenderer } from "./arena.js";
import {
  drawLightningAndNovas,
  drawOrbitals,
  drawParticlesAndTexts,
  drawPickups,
  drawProjectiles,
  drawZones
} from "./effects.js";
import { drawEnemy, drawKnight, drawTelegraphs } from "./sprites.js";

function computeCamera(state, viewW, viewH) {
  const scale = Math.max(0.75, Math.min(1.18, Math.min(viewW / 980, viewH / 640)));
  const visibleW = viewW / scale;
  const visibleH = viewH / scale;

  let camX = state.player.x - visibleW * 0.5;
  let camY = state.player.y - visibleH * 0.5;

  if (visibleW >= ARENA_WIDTH) {
    camX = (ARENA_WIDTH - visibleW) * 0.5;
  } else {
    camX = clamp(camX, 0, ARENA_WIDTH - visibleW);
  }

  if (visibleH >= ARENA_HEIGHT) {
    camY = (ARENA_HEIGHT - visibleH) * 0.5;
  } else {
    camY = clamp(camY, 0, ARENA_HEIGHT - visibleH);
  }

  let shakeX = 0;
  let shakeY = 0;
  if (state.shakeTime > 0 && state.shakeMagnitude > 0) {
    shakeX = (Math.random() * 2 - 1) * state.shakeMagnitude;
    shakeY = (Math.random() * 2 - 1) * state.shakeMagnitude;
  }

  return { scale, camX: camX - shakeX, camY: camY - shakeY };
}

function drawVignette(ctx, viewW, viewH, state) {
  const grad = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.5,
    Math.min(viewW, viewH) * 0.36,
    viewW * 0.5,
    viewH * 0.5,
    Math.max(viewW, viewH) * 0.76
  );
  const lowHp = state.player.hp / state.player.maxHp < 0.3;
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, lowHp ? "rgba(140, 14, 14, 0.58)" : "rgba(8, 5, 5, 0.54)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawTouchStick(ctx, stick) {
  if (!stick || !stick.active) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "rgba(240, 201, 110, 0.45)";
  ctx.fillStyle = "rgba(24, 18, 16, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(stick.originX, stick.originY, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(240, 201, 110, 0.78)";
  ctx.beginPath();
  ctx.arc(stick.x, stick.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createGameRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const arenaRenderer = createArenaRenderer();

  function render(state, viewW, viewH, time, touchStick = null) {
    ctx.fillStyle = "#0d0a09";
    ctx.fillRect(0, 0, viewW, viewH);

    const cam = computeCamera(state, viewW, viewH);

    ctx.save();
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.camX, -cam.camY);

    arenaRenderer.render(ctx, state, time);
    drawZones(ctx, state.zones, time);
    drawPickups(ctx, state.pickups, time);
    drawTelegraphs(ctx, state.enemies, time);

    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy, time);
    }

    drawOrbitals(ctx, state.player);
    drawKnight(ctx, state.player, time);
    drawProjectiles(ctx, state.projectiles, state.enemyProjectiles);
    drawLightningAndNovas(ctx, state.lightningBolts, state.novas);
    drawParticlesAndTexts(ctx, state.particles, state.floatingTexts);
    ctx.restore();

    drawVignette(ctx, viewW, viewH, state);
    drawTouchStick(ctx, touchStick);
  }

  return { render };
}
