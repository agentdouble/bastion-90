import { getDailyDateKey } from "../domain/rng.js";
import { createInitialState } from "../domain/state.js";
import { applyUpgradeChoice, startNewRun, stepSimulation } from "../engine/simulation.js";
import { createAudioEngine } from "../framework/audio.js";
import { createInputController } from "../framework/input.js";
import { createGameLoop } from "../framework/loop.js";
import { loadRecords, recordRunResult, saveRecords } from "../framework/storage.js";
import { createGameRenderer } from "../render/renderer.js";
import { createUiController } from "./ui.js";

function createSessionActions(app) {
  function launchRun() {
    app.audio.unlock();
    app.state = startNewRun({ mode: app.mode, dateKey: app.dateKey });
    app.endRecorded = false;
    app.screen = "playing";
    app.ui.syncScreen(app.screen);
    app.ui.updateHud(app.state);
    app.audio.processEvents(app.state.events);
  }

  function togglePause() {
    if (app.screen === "playing") {
      app.screen = "paused";
      app.ui.syncScreen(app.screen);
    } else if (app.screen === "paused") {
      app.screen = "playing";
      app.ui.syncScreen(app.screen);
    }
  }

  function pickUpgrade(index) {
    if (app.screen !== "levelup") return;
    app.audio.unlock();
    if (applyUpgradeChoice(app.state, index)) {
      app.screen = app.state.status === "levelup" ? "levelup" : "playing";
      if (app.screen === "levelup") {
        app.ui.renderUpgradeChoices(app.state);
      }
      app.ui.syncScreen(app.screen);
      app.audio.processEvents(app.state.events);
    }
  }

  function toggleMute() {
    const muted = app.audio.setMuted(!app.audio.isMuted());
    app.records = { ...app.records, muted };
    saveRecords(app.records);
    app.ui.setMuted(muted);
  }

  function backToMenu() {
    app.screen = "title";
    app.ui.renderRecords(app.records, app.dateKey);
    app.ui.syncScreen(app.screen);
  }

  return { launchRun, togglePause, pickUpgrade, toggleMute, backToMenu };
}

function tickApp(app, input, dt) {
  if (app.screen !== "playing") {
    return;
  }
  stepSimulation(app.state, input.sample(), dt);
  app.audio.processEvents(app.state.events);
  app.audio.tickDrum(app.state, dt);

  if (app.state.status === "levelup") {
    app.screen = "levelup";
    app.ui.renderUpgradeChoices(app.state);
    app.ui.syncScreen(app.screen);
  } else if ((app.state.status === "victory" || app.state.status === "defeat") && !app.endRecorded) {
    app.endRecorded = true;
    app.records = recordRunResult(app.records, app.state);
    app.screen = app.state.status;
    app.ui.renderEndSummary(app.state, app.records);
    app.ui.syncScreen(app.screen);
  }
  app.ui.updateHud(app.state);
}

function bootstrap() {
  const canvas = document.getElementById("arena-canvas");
  const touchDashBtn = document.getElementById("touch-dash-btn");
  const dateKey = getDailyDateKey();
  const records = loadRecords();

  const app = {
    dateKey,
    records,
    mode: "classic",
    screen: "title",
    state: createInitialState({ mode: "classic", dateKey }),
    endRecorded: false,
    audio: createAudioEngine(records.muted),
    ui: null
  };

  const actions = createSessionActions(app);
  app.ui = createUiController({
    onModeChange(mode) {
      app.mode = mode;
      app.ui.setMode(mode, dateKey);
    },
    onStartRun: actions.launchRun,
    onRestart: actions.launchRun,
    onPauseToggle: actions.togglePause,
    onMuteToggle: actions.toggleMute,
    onPickChoice: actions.pickUpgrade,
    onBackToMenu: actions.backToMenu
  });

  const input = createInputController(canvas, touchDashBtn, {
    onCardPick: actions.pickUpgrade,
    onPauseToggle: actions.togglePause,
    onQuickRestart: () => {
      if (app.screen !== "title") actions.launchRun();
    },
    onMuteToggle: actions.toggleMute,
    onConfirm: () => {
      if (app.screen === "title" || app.screen === "victory" || app.screen === "defeat") {
        actions.launchRun();
      }
    }
  });

  const renderer = createGameRenderer(canvas);
  app.ui.setMode(app.mode, dateKey);
  app.ui.setMuted(records.muted);
  app.ui.renderRecords(records, dateKey);
  app.ui.syncScreen(app.screen);

  const loop = createGameLoop(
    canvas,
    (dt) => tickApp(app, input, dt),
    (viewW, viewH, nowSec) => renderer.render(app.state, viewW, viewH, nowSec, input.getTouchStick())
  );
  loop.start();
}

bootstrap();
