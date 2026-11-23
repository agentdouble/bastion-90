import {
  FINAL_COUNTDOWN,
  PASSIVE_CATALOG,
  WEAPON_CATALOG,
  computeRank,
  getPhaseLabel
} from "../domain/catalog.js";

function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatRunTime(seconds) {
  const tenths = Math.round(seconds * 10);
  const clock = formatClock(Math.floor(tenths / 10));
  return tenths % 10 === 0 ? clock : `${clock},${tenths % 10}`;
}

function queryNodes() {
  const el = (id) => document.getElementById(id);
  return {
    hud: el("hud"),
    hpText: el("hud-hp-text"),
    hpFill: el("hud-hp-fill"),
    lvlText: el("hud-lvl-text"),
    dashText: el("hud-dash-text"),
    xpFill: el("hud-xp-fill"),
    loadout: el("hud-loadout"),
    phase: el("hud-phase"),
    timer: el("hud-timer"),
    bossWrap: el("hud-boss-wrap"),
    bossName: el("hud-boss-name"),
    bossFill: el("hud-boss-fill"),
    score: el("hud-score"),
    combo: el("hud-combo"),
    kills: el("hud-kills"),
    btnMute: el("btn-mute"),
    btnPause: el("btn-pause"),
    banner: el("banner-toast"),
    titleOverlay: el("title-overlay"),
    levelupOverlay: el("levelup-overlay"),
    levelupTitle: el("levelup-title"),
    upgradeCards: el("upgrade-cards"),
    pauseOverlay: el("pause-overlay"),
    gameoverOverlay: el("gameover-overlay"),
    modeClassic: el("mode-classic"),
    modeDaily: el("mode-daily"),
    dailyDateLabel: el("daily-date-label"),
    recordsRow: el("records-row"),
    btnPlay: el("btn-play"),
    btnResume: el("btn-resume"),
    btnPauseRestart: el("btn-pause-restart"),
    btnPauseMenu: el("btn-pause-menu"),
    btnRetry: el("btn-retry"),
    btnMenu: el("btn-menu"),
    endBadge: el("end-badge"),
    endTitle: el("end-title"),
    endSubtitle: el("end-subtitle"),
    endRank: el("end-rank"),
    endStats: el("end-stats"),
    endBuild: el("end-build")
  };
}

function renderLoadoutStrip(nodes, uiState, player) {
  const chips = [];
  const parts = [];
  for (const [id, lvl] of Object.entries(player.weapons)) {
    const def = WEAPON_CATALOG[id];
    const forged = lvl >= def.evolveLevel;
    parts.push(`w:${id}:${lvl}`);
    chips.push(`<span class="loadout-chip${forged ? " forged" : ""}">${def.icon} N${lvl}${forged ? "★" : ""}</span>`);
  }
  for (const [id, lvl] of Object.entries(player.passives)) {
    const def = PASSIVE_CATALOG[id];
    parts.push(`p:${id}:${lvl}`);
    chips.push(`<span class="loadout-chip">${def.icon} ${lvl}</span>`);
  }
  const sig = parts.join("|");
  if (sig !== uiState.lastLoadoutSig) {
    uiState.lastLoadoutSig = sig;
    nodes.loadout.innerHTML = chips.join("");
  }
}

function renderHudView(nodes, uiState, state) {
  const p = state.player;
  nodes.hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  nodes.hpFill.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  nodes.lvlText.textContent = `NIV. ${p.level}`;
  nodes.dashText.textContent = p.dashCooldown <= 0 ? "ROULADE PRÊTE" : `ROULADE ${p.dashCooldown.toFixed(1)}s`;
  nodes.xpFill.style.width = `${Math.min(100, (p.xp / p.xpToNext) * 100)}%`;
  renderLoadoutStrip(nodes, uiState, p);

  nodes.phase.textContent = getPhaseLabel(state.elapsed);
  nodes.timer.textContent = formatClock(state.remaining);
  nodes.timer.classList.toggle("urgent", state.remaining <= FINAL_COUNTDOWN);

  const boss = state.enemies.find((enemy) => enemy.isFinalBoss && enemy.hp > 0)
    || state.enemies.find((enemy) => enemy.isBoss && enemy.hp > 0);
  if (boss) {
    nodes.bossWrap.classList.remove("hidden");
    nodes.bossName.textContent = boss.name.toUpperCase();
    nodes.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
  } else {
    nodes.bossWrap.classList.add("hidden");
  }

  nodes.score.textContent = state.score.toLocaleString("fr-FR");
  const comboWhole = Math.floor(state.combo);
  nodes.combo.textContent = `×${comboWhole}`;
  nodes.combo.classList.toggle("hot", comboWhole >= 4);
  nodes.kills.textContent = `${state.kills} ⚔`;

  if (state.bannerTimer > 0 && state.bannerText) {
    nodes.banner.textContent = state.bannerText;
    nodes.banner.classList.remove("hidden");
  } else {
    nodes.banner.classList.add("hidden");
  }
}

function renderUpgradeCardsView(nodes, state, onPickChoice) {
  nodes.levelupTitle.textContent = `NIVEAU ${state.player.level} — CHOISIS TON POUVOIR`;
  nodes.upgradeCards.innerHTML = "";
  state.pendingChoices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `upgrade-card${choice.isEvolve ? " evolve" : ""}`;
    btn.innerHTML = [
      `<div class="card-top"><span class="card-icon">${choice.icon}</span><span class="card-tag${choice.isEvolve ? " evolve" : ""}">${choice.tag}</span></div>`,
      `<div class="card-name">${choice.name}</div>`,
      `<div class="card-desc">${choice.description}</div>`,
      `<div class="card-key"><span>Sélectionner</span><kbd>${idx + 1}</kbd></div>`
    ].join("");
    btn.addEventListener("click", () => onPickChoice(idx));
    nodes.upgradeCards.appendChild(btn);
  });
}

function renderEndSummaryView(nodes, state, records) {
  const victory = state.status === "victory";
  const timedOut = state.defeatReason === "timeout";
  const duration = formatRunTime(state.elapsed);
  const rank = computeRank(state.score, victory, state.elapsed);
  nodes.endBadge.textContent = victory ? "⚔ VICTOIRE ROYALE ⚔" : "☠ LE BASTION A CÉDÉ ☠";
  nodes.endTitle.textContent = victory ? "AUBE CONQUISE !" : timedOut ? "Temps écoulé" : "TOMBÉ AU COMBAT";
  nodes.endSubtitle.textContent = victory
    ? `Seigneur Liche terrassé en ${duration} • Série : ${records.winStreak}`
    : timedOut ? "Le Seigneur Liche est toujours en vie." : `Tu as tenu ${duration} face à la horde.`;
  nodes.endRank.textContent = rank;

  nodes.endStats.innerHTML = [
    `<div class="stat-tile"><span>SCORE</span><strong>${state.score.toLocaleString("fr-FR")}</strong></div>`,
    `<div class="stat-tile"><span>TEMPS</span><strong>${duration}</strong></div>`,
    `<div class="stat-tile"><span>ENNEMIS VAINCUS</span><strong>${state.kills}</strong></div>`,
    `<div class="stat-tile"><span>COMBO MAX</span><strong>×${state.maxCombo}</strong></div>`,
    `<div class="stat-tile"><span>PARADES</span><strong>${state.grazeCount}</strong></div>`,
    `<div class="stat-tile"><span>DÉGÂTS TOTAUX</span><strong>${state.totalDamage.toLocaleString("fr-FR")}</strong></div>`
  ].join("");

  const buildChips = [];
  for (const [id, lvl] of Object.entries(state.player.weapons)) {
    const def = WEAPON_CATALOG[id];
    const forged = lvl >= def.evolveLevel;
    const label = forged ? def.evolvedName : def.name;
    buildChips.push(`<span class="loadout-chip${forged ? " forged" : ""}">${def.icon} ${label} N${lvl}</span>`);
  }
  for (const [id, lvl] of Object.entries(state.player.passives)) {
    const def = PASSIVE_CATALOG[id];
    buildChips.push(`<span class="loadout-chip">${def.icon} ${def.name} ${lvl}</span>`);
  }
  nodes.endBuild.innerHTML = buildChips.join("");
}

function bindEvents(nodes, handlers) {
  nodes.modeClassic.addEventListener("click", () => handlers.onModeChange("classic"));
  nodes.modeDaily.addEventListener("click", () => handlers.onModeChange("daily"));
  nodes.btnPlay.addEventListener("click", () => handlers.onStartRun());
  nodes.btnMute.addEventListener("click", () => handlers.onMuteToggle());
  nodes.btnPause.addEventListener("click", () => handlers.onPauseToggle());
  nodes.btnResume.addEventListener("click", () => handlers.onPauseToggle());
  nodes.btnPauseRestart.addEventListener("click", () => handlers.onRestart());
  nodes.btnPauseMenu.addEventListener("click", () => handlers.onBackToMenu());
  nodes.btnRetry.addEventListener("click", () => handlers.onRestart());
  nodes.btnMenu.addEventListener("click", () => handlers.onBackToMenu());
}

export function createUiController(handlers) {
  const nodes = queryNodes();
  const uiState = { lastLoadoutSig: "" };
  bindEvents(nodes, handlers);

  return {
    setMode(mode, dateKey) {
      nodes.modeClassic.classList.toggle("active", mode === "classic");
      nodes.modeDaily.classList.toggle("active", mode === "daily");
      nodes.dailyDateLabel.textContent = `Graine du ${dateKey}`;
    },
    setMuted(muted) {
      nodes.btnMute.textContent = muted ? "🔇" : "🔊";
    },
    renderRecords(records, dateKey) {
      const dailyScore = records.dailyBest[dateKey] || 0;
      const bestTime = records.bestVictoryTime !== null ? formatRunTime(records.bestVictoryTime) : "—";
      nodes.recordsRow.innerHTML = [
        `<div class="record-card"><span>MEILLEUR SCORE</span><strong>${records.bestScore.toLocaleString("fr-FR")}</strong></div>`,
        `<div class="record-card"><span>RECORD VICTOIRE</span><strong>${bestTime}</strong></div>`,
        `<div class="record-card"><span>DÉFI DU JOUR</span><strong>${dailyScore.toLocaleString("fr-FR")}</strong></div>`
      ].join("");
    },
    updateHud: (state) => renderHudView(nodes, uiState, state),
    renderUpgradeChoices: (state) => renderUpgradeCardsView(nodes, state, handlers.onPickChoice),
    renderEndSummary: (state, records) => renderEndSummaryView(nodes, state, records),
    syncScreen(screen) {
      nodes.titleOverlay.classList.toggle("hidden", screen !== "title");
      nodes.hud.classList.toggle("hidden", screen === "title");
      nodes.levelupOverlay.classList.toggle("hidden", screen !== "levelup");
      nodes.pauseOverlay.classList.toggle("hidden", screen !== "paused");
      nodes.gameoverOverlay.classList.toggle("hidden", screen !== "victory" && screen !== "defeat");
    }
  };
}
