function resizeCanvas(canvas, dims) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  dims.width = window.innerWidth;
  dims.height = window.innerHeight;
  canvas.width = Math.max(1, Math.floor(dims.width * dpr));
  canvas.height = Math.max(1, Math.floor(dims.height * dpr));
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function createGameLoop(canvas, onFixedStep, onRender) {
  const FIXED_DT = 1 / 60;
  const dims = { width: window.innerWidth, height: window.innerHeight };
  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;
  let running = false;

  const onResize = () => resizeCanvas(canvas, dims);

  const frame = (now) => {
    if (!running) {
      return;
    }
    const elapsed = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    accumulator += elapsed;

    let steps = 0;
    while (accumulator >= FIXED_DT && steps < 4) {
      onFixedStep(FIXED_DT);
      accumulator -= FIXED_DT;
      steps += 1;
    }
    if (steps >= 4) {
      accumulator = 0;
    }
    onRender(dims.width, dims.height, now / 1000);
    rafId = window.requestAnimationFrame(frame);
  };

  return {
    start() {
      if (running) return;
      running = true;
      onResize();
      window.addEventListener("resize", onResize);
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      window.removeEventListener("resize", onResize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    resize: onResize
  };
}
