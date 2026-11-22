const DORIAN_HZ = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];

function ensureAudioContext(bus) {
  if (bus.muted || bus.unavailable) {
    return null;
  }
  if (!bus.ctx) {
    const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtor) {
      bus.unavailable = true;
      return null;
    }
    bus.ctx = new AudioCtor();
  }
  if (bus.ctx.state === "suspended") {
    bus.ctx.resume().catch(() => {
      bus.unavailable = false;
    });
  }
  return bus.ctx;
}

function playTone(bus, freq, duration, type, volume, slideTo = null, delay = 0) {
  const audio = ensureAudioContext(bus);
  if (!audio) {
    return;
  }
  const now = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playNoise(bus, duration, volume, filterFreq = 900) {
  const audio = ensureAudioContext(bus);
  if (!audio) {
    return;
  }
  const frames = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  const gain = audio.createGain();
  const now = audio.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start(now);
}

function playChord(bus, notes, duration, type, volume, spacing = 0.06) {
  for (let i = 0; i < notes.length; i += 1) {
    playTone(bus, notes[i], duration, type, volume, null, i * spacing);
  }
}

function playWeaponSfx(bus, type) {
  if (type === "weapon_blade") {
    playTone(bus, 540, 0.07, "sawtooth", 0.035, 220);
    return true;
  }
  if (type === "weapon_axe") {
    playTone(bus, 210, 0.14, "sawtooth", 0.055, 95);
    return true;
  }
  if (type === "weapon_fire") {
    playNoise(bus, 0.2, 0.06, 650);
    return true;
  }
  if (type === "weapon_lightning") {
    playTone(bus, 880, 0.12, "square", 0.055, 190);
    playNoise(bus, 0.08, 0.05, 2400);
    return true;
  }
  if (type === "weapon_shield") {
    playTone(bus, 293.66, 0.25, "triangle", 0.09, 440);
    return true;
  }
  return false;
}

function playCombatSfx(bus, type) {
  if (type === "xp_pickup") {
    const now = performance.now();
    bus.xpStep = now - bus.lastXpAt < 900 ? Math.min(DORIAN_HZ.length - 1, bus.xpStep + 1) : 0;
    bus.lastXpAt = now;
    playTone(bus, DORIAN_HZ[bus.xpStep], 0.11, "triangle", 0.09, DORIAN_HZ[bus.xpStep] * 1.12);
    return true;
  }
  if (type === "dash") {
    playNoise(bus, 0.11, 0.055, 1400);
    playTone(bus, 280, 0.1, "triangle", 0.05, 420);
    return true;
  }
  if (type === "graze") {
    playChord(bus, [587.33, 880], 0.16, "triangle", 0.09, 0.03);
    return true;
  }
  if (type === "crit_hit") {
    playTone(bus, 660, 0.06, "square", 0.04, 880);
    return true;
  }
  if (type === "enemy_kill") {
    playTone(bus, 170, 0.07, "triangle", 0.045, 95);
    return true;
  }
  if (type === "player_hit") {
    playTone(bus, 125, 0.18, "sawtooth", 0.12, 55);
    playNoise(bus, 0.12, 0.08, 420);
    return true;
  }
  return false;
}

function playFanfareSfx(bus, type) {
  if (type === "levelup") {
    playChord(bus, [293.66, 392.0, 440.0, 587.33], 0.24, "triangle", 0.1, 0.055);
  } else if (type === "evolve") {
    playChord(bus, [293.66, 440.0, 587.33, 739.99, 880.0], 0.34, "sawtooth", 0.08, 0.055);
  } else if (type === "boss_horn") {
    playTone(bus, 110, 0.72, "sawtooth", 0.11, 98);
    playTone(bus, 164.81, 0.72, "sawtooth", 0.08, 146.83, 0.05);
  } else if (type === "chest") {
    playChord(bus, [440, 554.37, 659.25, 880], 0.22, "triangle", 0.09, 0.045);
  } else if (type === "victory") {
    playChord(bus, [293.66, 369.99, 440, 587.33, 739.99], 0.45, "triangle", 0.11, 0.08);
  } else if (type === "defeat") {
    playChord(bus, [293.66, 261.63, 220, 146.83], 0.38, "sawtooth", 0.08, 0.11);
  }
}

export function createAudioEngine(initialMuted = false) {
  const bus = {
    ctx: null,
    muted: Boolean(initialMuted),
    unavailable: false,
    xpStep: 0,
    lastXpAt: 0,
    drumTimer: 0,
    drumBeat: 0
  };

  return {
    unlock() {
      ensureAudioContext(bus);
    },
    setMuted(nextMuted) {
      bus.muted = Boolean(nextMuted);
      return bus.muted;
    },
    isMuted() {
      return bus.muted;
    },
    processEvents(events) {
      for (const evt of events) {
        if (!playWeaponSfx(bus, evt.type) && !playCombatSfx(bus, evt.type)) {
          playFanfareSfx(bus, evt.type);
        }
      }
    },
    tickDrum(state, dt) {
      if (state.status !== "playing" || bus.muted) {
        return;
      }
      const interval = state.overtime ? 0.28 : state.bossSpawned ? 0.34 : state.elapsed > 35 ? 0.42 : 0.52;
      bus.drumTimer -= dt;
      if (bus.drumTimer <= 0) {
        bus.drumTimer = interval;
        const accent = bus.drumBeat % 4 === 0;
        bus.drumBeat += 1;
        playTone(bus, accent ? 86 : 68, 0.09, "sine", accent ? 0.055 : 0.032, 38);
      }
    }
  };
}
