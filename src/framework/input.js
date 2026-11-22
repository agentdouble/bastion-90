function isAnyDown(state, codes, keys) {
  for (const c of codes) {
    if (state.pressedCodes.has(c)) return true;
  }
  for (const k of keys) {
    if (state.pressedKeys.has(k)) return true;
  }
  return false;
}

function handleKeyDown(state, callbacks, event) {
  const key = event.key.toLowerCase();
  state.pressedCodes.add(event.code);
  state.pressedKeys.add(key);

  if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
    event.preventDefault();
    state.dashQueued = true;
  }
  if (key === "1" || key === "2" || key === "3") {
    callbacks.onCardPick(Number(key) - 1);
  } else if (key === "p" || event.code === "Escape") {
    callbacks.onPauseToggle();
  } else if (key === "r") {
    callbacks.onQuickRestart();
  } else if (key === "m") {
    callbacks.onMuteToggle();
  } else if (event.code === "Enter") {
    callbacks.onConfirm();
  }
}

function handlePointerDown(state, touchDashBtn, event) {
  if (event.pointerType === "mouse" && event.button === 2) {
    state.dashQueued = true;
    return;
  }
  if (event.pointerType !== "touch") {
    return;
  }
  touchDashBtn.classList.remove("hidden");
  if (state.touchPointerId !== null) {
    return;
  }
  state.touchPointerId = event.pointerId;
  state.stick.active = true;
  state.stick.originX = event.clientX;
  state.stick.originY = event.clientY;
  state.stick.x = event.clientX;
  state.stick.y = event.clientY;
  state.stick.dx = 0;
  state.stick.dy = 0;
}

function handlePointerMove(state, event) {
  if (event.pointerId !== state.touchPointerId || !state.stick.active) {
    return;
  }
  const maxR = 54;
  const rawX = event.clientX - state.stick.originX;
  const rawY = event.clientY - state.stick.originY;
  const len = Math.hypot(rawX, rawY);
  const scale = len > maxR ? maxR / len : 1;
  state.stick.x = state.stick.originX + rawX * scale;
  state.stick.y = state.stick.originY + rawY * scale;
  state.stick.dx = len > 6 ? (rawX * scale) / maxR : 0;
  state.stick.dy = len > 6 ? (rawY * scale) / maxR : 0;
}

function sampleInputState(state) {
  let moveX = 0;
  let moveY = 0;
  if (isAnyDown(state, ["KeyA", "ArrowLeft"], ["q", "a"])) moveX -= 1;
  if (isAnyDown(state, ["KeyD", "ArrowRight"], ["d"])) moveX += 1;
  if (isAnyDown(state, ["KeyW", "ArrowUp"], ["z", "w"])) moveY -= 1;
  if (isAnyDown(state, ["KeyS", "ArrowDown"], ["s"])) moveY += 1;

  if (moveX === 0 && moveY === 0 && state.stick.active) {
    moveX = state.stick.dx;
    moveY = state.stick.dy;
  }
  const dash = state.dashQueued;
  state.dashQueued = false;
  return { moveX, moveY, dash };
}

function createListeners(state, canvas, touchDashBtn, callbacks) {
  const resetStick = () => {
    state.touchPointerId = null;
    state.stick.active = false;
    state.stick.dx = 0;
    state.stick.dy = 0;
  };
  return [
    [window, "keydown", (e) => handleKeyDown(state, callbacks, e)],
    [window, "keyup", (e) => {
      state.pressedCodes.delete(e.code);
      state.pressedKeys.delete(e.key.toLowerCase());
    }],
    [window, "blur", () => {
      state.pressedCodes.clear();
      state.pressedKeys.clear();
      resetStick();
    }],
    [canvas, "pointerdown", (e) => handlePointerDown(state, touchDashBtn, e)],
    [window, "pointermove", (e) => handlePointerMove(state, e)],
    [window, "pointerup", (e) => { if (e.pointerId === state.touchPointerId) resetStick(); }],
    [window, "pointercancel", (e) => { if (e.pointerId === state.touchPointerId) resetStick(); }],
    [canvas, "contextmenu", (e) => e.preventDefault()],
    [touchDashBtn, "pointerdown", (e) => {
      e.preventDefault();
      state.dashQueued = true;
    }]
  ];
}

export function createInputController(canvas, touchDashBtn, callbacks) {
  const state = {
    pressedCodes: new Set(),
    pressedKeys: new Set(),
    dashQueued: false,
    touchPointerId: null,
    stick: { active: false, originX: 0, originY: 0, x: 0, y: 0, dx: 0, dy: 0 }
  };
  const listeners = createListeners(state, canvas, touchDashBtn, callbacks);
  for (const [target, evt, fn] of listeners) {
    target.addEventListener(evt, fn);
  }

  return {
    sample: () => sampleInputState(state),
    getTouchStick: () => state.stick,
    destroy() {
      for (const [target, evt, fn] of listeners) {
        target.removeEventListener(evt, fn);
      }
    }
  };
}
