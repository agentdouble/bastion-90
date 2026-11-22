export function drawZones(ctx, zones, time) {
  for (const zone of zones) {
    const alpha = Math.min(1, zone.life / 0.6);
    const pulse = 0.94 + Math.sin(time * 12 + zone.id) * 0.06;
    const r = zone.radius * pulse;
    const grad = ctx.createRadialGradient(zone.x, zone.y, 8, zone.x, zone.y, r);
    if (zone.evolved) {
      grad.addColorStop(0, `rgba(255, 240, 140, ${0.46 * alpha})`);
      grad.addColorStop(0.55, `rgba(255, 110, 30, ${0.34 * alpha})`);
      grad.addColorStop(1, "rgba(180, 28, 12, 0)");
    } else {
      grad.addColorStop(0, `rgba(255, 190, 70, ${0.38 * alpha})`);
      grad.addColorStop(0.6, `rgba(225, 78, 26, ${0.26 * alpha})`);
      grad.addColorStop(1, "rgba(140, 20, 10, 0)");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 168, 56, ${0.48 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawPickups(ctx, pickups, time) {
  for (const item of pickups) {
    const bob = Math.sin(time * 6 + item.id) * 2.5;
    ctx.save();
    ctx.translate(item.x, item.y + bob);

    if (item.kind === "xp") {
      ctx.fillStyle = item.value >= 20 ? "#f0c96e" : "#4ecbff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (item.kind === "heart") {
      ctx.fillStyle = "#e63946";
      ctx.strokeStyle = "#ffd6da";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -2, 5, 0, Math.PI * 2);
      ctx.arc(4, -2, 5, 0, Math.PI * 2);
      ctx.moveTo(-9, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(9, 0);
      ctx.fill();
      ctx.stroke();
    } else if (item.kind === "chest") {
      ctx.fillStyle = "#7a441b";
      ctx.strokeStyle = "#ffe07d";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-11, -8, 22, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffe07d";
      ctx.fillRect(-11, -1, 22, 3);
      ctx.fillRect(-2, -3, 4, 6);
    }
    ctx.restore();
  }
}

export function drawOrbitals(ctx, player) {
  const level = player.weapons.morning_star || 0;
  if (level <= 0) {
    return;
  }
  const evolved = level >= 4;
  const orbCount = level >= 5 ? 6 : level >= 4 ? 5 : level >= 2 ? 3 : 2;
  const orbitRadius = evolved ? 98 : level >= 2 ? 84 : 72;
  const orbRadius = evolved ? 13 : 10;

  for (let i = 0; i < orbCount; i += 1) {
    const angle = player.orbitalAngle + (i / orbCount) * Math.PI * 2;
    const ox = player.x + Math.cos(angle) * orbitRadius;
    const oy = player.y + Math.sin(angle) * orbitRadius;

    ctx.strokeStyle = evolved ? "rgba(255, 198, 92, 0.55)" : "rgba(176, 186, 198, 0.42)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    ctx.fillStyle = evolved ? "#ffae42" : "#aeb9c7";
    ctx.strokeStyle = evolved ? "#fff3c4" : "#242930";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox, oy, orbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawProjectiles(ctx, projectiles, enemyProjectiles) {
  for (const p of projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (p.kind === "dawn_blade") {
      ctx.fillStyle = p.evolved ? "#ffe27a" : "#e6eef8";
      ctx.strokeStyle = p.evolved ? "#ff9500" : "#5e748d";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-9, -6);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-9, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === "berserker_axe") {
      const r = p.radius;
      ctx.fillStyle = p.evolved ? "#ffb84d" : "#c5cfd9";
      ctx.strokeStyle = "#2b1d14";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, -0.9, 0.9);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, Math.PI - 0.9, Math.PI + 0.9);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const ep of enemyProjectiles) {
    ctx.save();
    ctx.fillStyle = ep.color;
    ctx.shadowColor = ep.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, ep.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawLightningAndNovas(ctx, bolts, novas) {
  for (const bolt of bolts) {
    const alpha = Math.max(0, bolt.life / bolt.maxLife);
    ctx.save();
    ctx.strokeStyle = bolt.evolved ? `rgba(255, 232, 130, ${alpha})` : `rgba(128, 229, 255, ${alpha})`;
    ctx.lineWidth = bolt.evolved ? 4.5 : 3;
    ctx.beginPath();
    for (let i = 0; i < bolt.points.length; i += 1) {
      const pt = bolt.points[i];
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        const prev = bolt.points[i - 1];
        const midX = (prev.x + pt.x) * 0.5 + (Math.sin(i * 17) * 14);
        const midY = (prev.y + pt.y) * 0.5 + (Math.cos(i * 11) * 14);
        ctx.lineTo(midX, midY);
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  for (const nova of novas) {
    const alpha = Math.max(0, nova.life / nova.maxLife);
    ctx.save();
    ctx.strokeStyle = nova.evolved ? `rgba(255, 224, 120, ${alpha})` : `rgba(240, 201, 110, ${alpha * 0.9})`;
    ctx.lineWidth = nova.evolved ? 7 : 4.5;
    ctx.beginPath();
    ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawParticlesAndTexts(ctx, particles, floatingTexts) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of floatingTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${Math.round(14 * t.scale)}px Georgia, serif`;
    ctx.strokeStyle = "rgba(10, 7, 6, 0.92)";
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
