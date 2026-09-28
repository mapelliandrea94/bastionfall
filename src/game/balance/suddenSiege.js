import { getBandWaveScaling } from './difficultyBands.js';

export const SUDDEN_SIEGE = Object.freeze({
  version: 1,
  threatMultiplier: 1.35,
  hpMultiplier: 1.22,
  damageMultiplier: 1.16,
  spawnIntervalMultiplier: 0.82,
  preparationSeconds: 9
});

export function getSuddenSiegeWaveScaling(waveNumber) {
  const base = getBandWaveScaling(waveNumber);
  return Object.freeze({
    ...base,
    enemyHpMultiplier: Number(((base.enemyHpMultiplier ?? 1) * SUDDEN_SIEGE.hpMultiplier).toFixed(3)),
    enemyDamageMultiplier: Number(((base.enemyDamageMultiplier ?? 1) * SUDDEN_SIEGE.damageMultiplier).toFixed(3)),
    spawnIntervalMs: Math.max(220, Math.round(base.spawnIntervalMs * SUDDEN_SIEGE.spawnIntervalMultiplier))
  });
}

export function getSuddenSiegeFixtures() {
  const base = getBandWaveScaling(10);
  const sudden = getSuddenSiegeWaveScaling(10);
  return Object.freeze({
    hpHigher: sudden.enemyHpMultiplier > (base.enemyHpMultiplier ?? 1),
    damageHigher: sudden.enemyDamageMultiplier > (base.enemyDamageMultiplier ?? 1),
    spawnsFaster: sudden.spawnIntervalMs < base.spawnIntervalMs
  });
}
