export const PERSONAL_BEST = Object.freeze({
  version: 1,
  compareOrder: Object.freeze(['wave', 'elapsedMs', 'score'])
});

function normalizeRecord(record = {}) {
  return Object.freeze({
    wave: Math.max(0, Math.floor(Number(record.wave) || 0)),
    elapsedMs: Math.max(0, Number(record.elapsedMs) || 0),
    score: Math.max(0, Math.floor(Number(record.score) || 0))
  });
}

export function comparePersonalBest(candidate, previous) {
  const next = normalizeRecord(candidate);
  const current = previous ? normalizeRecord(previous) : null;

  if (!current) {
    return Object.freeze({
      isPersonalBest: true,
      reason: 'first-record',
      candidate: next,
      previous: null
    });
  }

  if (next.wave !== current.wave) {
    return Object.freeze({
      isPersonalBest: next.wave > current.wave,
      reason: 'wave',
      candidate: next,
      previous: current
    });
  }

  if (next.elapsedMs !== current.elapsedMs) {
    return Object.freeze({
      isPersonalBest: next.elapsedMs > current.elapsedMs,
      reason: 'survival',
      candidate: next,
      previous: current
    });
  }

  return Object.freeze({
    isPersonalBest: next.score > current.score,
    reason: next.score === current.score ? 'tie' : 'score',
    candidate: next,
    previous: current
  });
}

export function getPersonalBestFixtures() {
  const first = comparePersonalBest({ wave: 3, elapsedMs: 50000, score: 4000 }, null);
  const higherWave = comparePersonalBest(
    { wave: 4, elapsedMs: 30000, score: 3500 },
    { wave: 3, elapsedMs: 60000, score: 4500 }
  );
  const longerSameWave = comparePersonalBest(
    { wave: 4, elapsedMs: 70000, score: 4300 },
    { wave: 4, elapsedMs: 60000, score: 5000 }
  );
  const higherScoreSameWaveTime = comparePersonalBest(
    { wave: 4, elapsedMs: 70000, score: 5100 },
    { wave: 4, elapsedMs: 70000, score: 5000 }
  );
  const worse = comparePersonalBest(
    { wave: 3, elapsedMs: 99999, score: 9999 },
    { wave: 4, elapsedMs: 10000, score: 1000 }
  );

  return Object.freeze({
    firstRecord: first.isPersonalBest,
    higherWave: higherWave.isPersonalBest,
    longerSameWave: longerSameWave.isPersonalBest,
    higherScoreSameWaveTime: higherScoreSameWaveTime.isPersonalBest,
    worseRejected: worse.isPersonalBest === false
  });
}
