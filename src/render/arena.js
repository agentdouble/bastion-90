import { ARENA_HEIGHT, ARENA_MARGIN, ARENA_WIDTH } from "../domain/catalog.js";

const BRAZIERS = [
  { x: 140, y: 92 },
  { x: ARENA_WIDTH * 0.5, y: 74 },
  { x: ARENA_WIDTH - 140, y: 92 },
  { x: ARENA_WIDTH - 92, y: ARENA_HEIGHT * 0.5 },
  { x: ARENA_WIDTH - 140, y: ARENA_HEIGHT - 92 },
  { x: ARENA_WIDTH * 0.5, y: ARENA_HEIGHT - 74 },
  { x: 140, y: ARENA_HEIGHT - 92 },
  { x: 92, y: ARENA_HEIGHT * 0.5 }
];

function drawBattlements(ctx) {
  const m = ARENA_MARGIN;
  ctx.fillStyle = "#1b1615";
  ctx.fillRect(0, 0, ARENA_WIDTH, m);
  ctx.fillRect(0, ARENA_HEIGHT - m, ARENA_WIDTH, m);
  ctx.fillRect(0, 0, m, ARENA_HEIGHT);
  ctx.fillRect(ARENA_WIDTH - m, 0, m, ARENA_HEIGHT);

  ctx.fillStyle = "#2d2523";
  for (let x = 16; x < ARENA_WIDTH - 24; x += 56) {
    ctx.fillRect(x, 8, 34, 24);
    ctx.fillRect(x, ARENA_HEIGHT - 32, 34, 24);
  }
  for (let y = 16; y < ARENA_HEIGHT - 24; y += 56) {
    ctx.fillRect(8, y, 24, 34);
    ctx.fillRect(ARENA_WIDTH - 32, y, 24, 34);
  }

  ctx.strokeStyle = "#8c6b36";
  ctx.lineWidth = 3;
  ctx.strokeRect(m, m, ARENA_WIDTH - m * 2, ARENA_HEIGHT - m * 2);
}

function createStaticCourtyard() {
  const off = document.createElement("canvas");
  off.width = ARENA_WIDTH;
  off.height = ARENA_HEIGHT;
  const ctx = off.getContext("2d");

  ctx.fillStyle = "#171312";
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  const tileW = 64;
  const tileH = 48;
  for (let row = 0; row < Math.ceil(ARENA_HEIGHT / tileH); row += 1) {
    const offsetX = row % 2 === 0 ? 0 : tileW * 0.5;
    for (let col = -1; col <= Math.ceil(ARENA_WIDTH / tileW); col += 1) {
      const x = col * tileW + offsetX;
      const y = row * tileH;
      const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
      const shade = Math.floor(33 + hash * 15);
      ctx.fillStyle = `rgb(${shade + 4}, ${shade}, ${shade - 2})`;
      ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);
      ctx.strokeStyle = "rgba(9, 7, 7, 0.72)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);
    }
  }

  const cx = ARENA_WIDTH * 0.5;
  const cy = ARENA_HEIGHT * 0.5;
  ctx.save();
  ctx.strokeStyle = "rgba(182, 146, 84, 0.28)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 145, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 112, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44);
    ctx.lineTo(cx + Math.cos(a) * 142, cy + Math.sin(a) * 142);
    ctx.stroke();
  }
  ctx.restore();

  drawBattlements(ctx);
  return off;
}

function drawBrazier(ctx, b, time, eerie) {
  const flicker = 0.88 + Math.sin(time * 13 + b.x) * 0.12;
  const glowR = 115 * flicker;
  const grad = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, glowR);
  if (eerie) {
    grad.addColorStop(0, "rgba(182, 92, 255, 0.36)");
    grad.addColorStop(0.5, "rgba(128, 36, 170, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  } else {
    grad.addColorStop(0, "rgba(255, 168, 56, 0.36)");
    grad.addColorStop(0.5, "rgba(218, 92, 24, 0.14)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b2422";
  ctx.strokeStyle = "#7a5e34";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = eerie ? "#d580ff" : "#ff9f2f";
  ctx.beginPath();
  ctx.arc(b.x, b.y - 2, 7 * flicker, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = eerie ? "#f7e1ff" : "#fff1b8";
  ctx.beginPath();
  ctx.arc(b.x, b.y - 4, 3.5 * flicker, 0, Math.PI * 2);
  ctx.fill();
}

export function createArenaRenderer() {
  let cachedCourtyard = null;

  return {
    render(ctx, state, time) {
      if (!cachedCourtyard) {
        cachedCourtyard = createStaticCourtyard();
      }
      ctx.drawImage(cachedCourtyard, 0, 0);

      const eerie = state.bossSpawned || state.overtime;
      for (const brazier of BRAZIERS) {
        drawBrazier(ctx, brazier, time, eerie);
      }

      if (state.overtime) {
        ctx.fillStyle = "rgba(155, 22, 28, 0.14)";
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      } else if (state.bossSpawned) {
        ctx.fillStyle = "rgba(68, 18, 96, 0.11)";
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      }
    }
  };
}
