export function drawTelegraphs(ctx, enemies, time) {
  for (const enemy of enemies) {
    if (enemy.aiState !== "windup") {
      continue;
    }
    ctx.save();
    ctx.strokeStyle = enemy.isFinalBoss ? "rgba(218, 112, 255, 0.85)" : "rgba(235, 64, 52, 0.85)";
    ctx.lineWidth = enemy.isBoss ? 7 : 4;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -time * 90;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.telegraphX, enemy.telegraphY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = enemy.isFinalBoss ? "rgba(195, 92, 255, 0.28)" : "rgba(235, 64, 52, 0.25)";
    ctx.beginPath();
    ctx.arc(enemy.telegraphX, enemy.telegraphY, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawKnightArmorAndShield(ctx, blink, time) {
  ctx.fillStyle = blink ? "#ffffff" : "#a82020";
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-18 - Math.sin(time * 12) * 2.5, 13);
  ctx.lineTo(-3, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = blink ? "#ffffff" : "#8b98a8";
  ctx.strokeStyle = "#1c1f24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-10, -7, 19, 19, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = blink ? "#ffffff" : "#cfd8e3";
  ctx.beginPath();
  ctx.arc(0, -11, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#1c1f24";
  ctx.fillRect(1, -13, 8, 3);

  ctx.fillStyle = "#d9362b";
  ctx.beginPath();
  ctx.moveTo(-2, -20);
  ctx.quadraticCurveTo(8, -28, 12, -17);
  ctx.lineTo(2, -18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d9b052";
  ctx.strokeStyle = "#3c2a12";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(17, -1);
  ctx.lineTo(15, 10);
  ctx.lineTo(8, 13);
  ctx.lineTo(5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawKnight(ctx, player, time) {
  const bob = Math.sin(player.walkPhase) * 2.2;
  const blink = player.invulnTimer > 0 && Math.floor(time * 24) % 2 === 0;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const dashReady = player.dashCooldown <= 0;
  ctx.strokeStyle = dashReady ? "rgba(240, 201, 110, 0.72)" : "rgba(240, 201, 110, 0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const ratio = dashReady ? 1 : Math.max(0, 1 - player.dashCooldown / 2.05);
  ctx.arc(0, 4, 21, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * ratio);
  ctx.stroke();

  if (player.dashTimer > 0) {
    ctx.fillStyle = "rgba(255, 224, 130, 0.28)";
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.scale(player.facing, 1);
  ctx.translate(0, bob);
  drawKnightArmorAndShield(ctx, blink, time);
  ctx.restore();
}

function drawArchLich(ctx, enemy, time) {
  const floatY = Math.sin(time * 5) * 4;
  ctx.strokeStyle = "rgba(186, 104, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 4, enemy.radius + 8 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.translate(0, floatY);
  ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#3a145c";
  ctx.strokeStyle = "#d896ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(24, 24);
  ctx.lineTo(0, 17);
  ctx.lineTo(-24, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#efe6d8";
  ctx.beginPath();
  ctx.arc(0, -14, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d966ff";
  ctx.fillRect(-6, -16, 4, 4);
  ctx.fillRect(2, -16, 4, 4);

  ctx.fillStyle = "#f0c96e";
  ctx.beginPath();
  ctx.moveTo(-12, -23);
  ctx.lineTo(-7, -34);
  ctx.lineTo(0, -26);
  ctx.lineTo(7, -34);
  ctx.lineTo(12, -23);
  ctx.closePath();
  ctx.fill();
}

function drawHornedHelm(ctx, r) {
  ctx.fillStyle = "#f0c96e";
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.5);
  ctx.lineTo(-r * 1.15, -r * 1.2);
  ctx.lineTo(-r * 0.25, -r * 0.8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.5);
  ctx.lineTo(r * 1.15, -r * 1.2);
  ctx.lineTo(r * 0.25, -r * 0.8);
  ctx.fill();
  ctx.fillStyle = "#ff595e";
  ctx.fillRect(-6, -3, 12, 3);
}

function drawStandardEnemy(ctx, enemy, time) {
  const flash = enemy.flashTimer > 0;
  const r = enemy.radius;
  ctx.translate(0, Math.sin(time * 10 + enemy.id) * 1.8);

  ctx.fillStyle = flash ? "#ffffff" : enemy.color;
  ctx.strokeStyle = "#141010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (enemy.kind === "goblin") {
    ctx.fillStyle = flash ? "#ffffff" : "#62b55c";
    ctx.beginPath();
    ctx.moveTo(-r, -2);
    ctx.lineTo(-r - 7, -8);
    ctx.lineTo(-r + 3, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r, -2);
    ctx.lineTo(r + 7, -8);
    ctx.lineTo(r - 3, -8);
    ctx.fill();
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(-5, -4, 3, 3);
    ctx.fillRect(2, -4, 3, 3);
  } else if (enemy.kind === "skeleton") {
    ctx.fillStyle = "#1b1615";
    ctx.fillRect(-6, -5, 4, 4);
    ctx.fillRect(2, -5, 4, 4);
    ctx.fillRect(-4, 3, 8, 2);
  } else if (enemy.kind === "cultist") {
    ctx.fillStyle = "#2b1240";
    ctx.beginPath();
    ctx.moveTo(0, -r - 8);
    ctx.lineTo(r, 4);
    ctx.lineTo(-r, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e0aaff";
    ctx.fillRect(-4, -3, 3, 3);
    ctx.fillRect(2, -3, 3, 3);
  } else {
    drawHornedHelm(ctx, r);
  }
}

export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.82, enemy.radius * 0.9, enemy.radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  if (enemy.isFinalBoss) {
    drawArchLich(ctx, enemy, time);
  } else {
    ctx.scale(enemy.facing, 1);
    drawStandardEnemy(ctx, enemy, time);
  }
  ctx.restore();

  if ((enemy.isBoss || enemy.kind === "cursed_knight") && enemy.hp < enemy.maxHp) {
    const barW = enemy.isBoss ? 62 : 34;
    const bx = enemy.x - barW * 0.5;
    const by = enemy.y - enemy.radius - 14;
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(bx, by, barW, 5);
    ctx.fillStyle = enemy.isFinalBoss ? "#d06bff" : "#e04136";
    ctx.fillRect(bx, by, barW * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
}
