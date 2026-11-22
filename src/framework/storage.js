const STORAGE_KEY = "bastion90_records_v1";

function defaultRecords() {
  return {
    bestScore: 0,
    bestVictoryTime: null,
    victories: 0,
    runs: 0,
    winStreak: 0,
    dailyBest: {},
    muted: false
  };
}

export function loadRecords() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultRecords();
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultRecords(),
      ...parsed,
      dailyBest: parsed && typeof parsed.dailyBest === "object" && parsed.dailyBest ? parsed.dailyBest : {}
    };
  } catch (error) {
    void error;
    return defaultRecords();
  }
}

export function saveRecords(records) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

export function recordRunResult(records, state) {
  const victory = state.status === "victory";
  const next = {
    ...records,
    runs: records.runs + 1,
    bestScore: Math.max(records.bestScore, state.score),
    victories: records.victories + (victory ? 1 : 0),
    winStreak: victory ? records.winStreak + 1 : 0,
    dailyBest: { ...records.dailyBest }
  };

  if (victory) {
    const clearTime = Number(state.elapsed.toFixed(1));
    if (next.bestVictoryTime === null || clearTime < next.bestVictoryTime) {
      next.bestVictoryTime = clearTime;
    }
  }

  if (state.mode === "daily") {
    const prevDaily = next.dailyBest[state.dateKey] || 0;
    next.dailyBest[state.dateKey] = Math.max(prevDaily, state.score);
  }

  saveRecords(next);
  return next;
}
