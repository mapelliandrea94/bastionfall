import { calculateRunScore } from './runScore.js';

export const RUN_END_REASONS = Object.freeze({
  BASTION_DESTROYED: 'bastion-destroyed',
  PLAYER_EXIT: 'player-exit'
});

export function createRunEndSnapshot(run = {}, reason = RUN_END_REASONS.BASTION_DESTROYED) {
  const score = calculateRunScore(run);

  return Object.freeze({
    mode: run.mode ?? null,
    seed: run.seed ?? null,
    reason,
    wave: Math.max(0, Math.floor(Number(run.wave) || 0)),
    elapsedMs: Math.max(0, Number(run.elapsedMs) || 0),
    score: score.totalScore,
    gold: Math.max(0, Math.floor(Number(run.gold) || 0)),
    coreHp: Math.max(0, Number(run.coreHp) || 0),
    coreMaxHp: Math.max(1, Number(run.coreMaxHp) || 1),
    kills: Math.max(0, Math.floor(Number(run.kills) || 0)),
    deathRecap: Object.freeze({
      nexusDamage: Math.max(0, Math.floor(Number(run.deathRecap?.nexusDamage) || 0)),
      escapedEnemies: Math.max(0, Math.floor(Number(run.deathRecap?.escapedEnemies) || 0)),
      byUnitType: Object.freeze({ ...(run.deathRecap?.byUnitType ?? {}) }),
      byFaction: Object.freeze({ ...(run.deathRecap?.byFaction ?? {}) }),
      lastThreat: run.deathRecap?.lastThreat ?? null
    }),
    towerMilestones: Object.freeze({
      seven: Math.max(0, Math.floor(Number(run.towerMilestones?.seven) || 0)),
      fourteen: Math.max(0, Math.floor(Number(run.towerMilestones?.fourteen) || 0))
    }),
    startedAtMs: Number(run.startedAtMs ?? 0),
    endedAtMs: Number(run.endedAtMs ?? 0)
  });
}

export function getRunEndFixtures() {
  const snapshot = createRunEndSnapshot({
    mode: 'single-gate',
    seed: 'fixture',
    wave: 4,
    elapsedMs: 90000,
    gold: 77,
    coreHp: 0,
    coreMaxHp: 20,
    kills: 12,
    startedAtMs: 1000,
    endedAtMs: 91000
  });

  return Object.freeze({
    reasonExpected: RUN_END_REASONS.BASTION_DESTROYED,
    reasonActual: snapshot.reason,
    modeExpected: 'single-gate',
    modeActual: snapshot.mode,
    waveExpected: 4,
    waveActual: snapshot.wave,
    elapsedExpected: 90000,
    elapsedActual: snapshot.elapsedMs,
    scorePositive: snapshot.score > 0,
    frozen: Object.isFrozen(snapshot)
  });
}
