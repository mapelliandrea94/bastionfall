import { getBandWaveScaling } from './difficultyBands.js';

const SUDDEN_BANDS = Object.freeze([
  Object.freeze({ maxWave: 5, threat: 1.10, hp: 1.08, bastionDamage: 1.00, spawn: 0.92 }),
  Object.freeze({ maxWave: 12, threat: 1.20, hp: 1.14, bastionDamage: 1.05, spawn: 0.88 }),
  Object.freeze({ maxWave: 20, threat: 1.32, hp: 1.22, bastionDamage: 1.12, spawn: 0.82 }),
  Object.freeze({ maxWave: Infinity, threat: 1.45, hp: 1.32, bastionDamage: 1.20, spawn: 0.76 })
]);

export const SUDDEN_SIEGE = Object.freeze({
  version: 2,
  preparationSeconds: 9,
  baseWaveClearGold: 5,
  perfectWaveBonus: 1,
  bossWaveBonus: 3,
  milestoneWaveBonus: 2,
  milestoneInterval: 5
});

function getSuddenBand(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  return SUDDEN_BANDS.find((band) => wave <= band.maxWave) ?? SUDDEN_BANDS.at(-1);
}

export function getSuddenSiegeWaveScaling(waveNumber) {
  const base = getBandWaveScaling(waveNumber);
  const sudden = getSuddenBand(waveNumber);
  return Object.freeze({
    ...base,
    suddenThreatMultiplier: sudden.threat,
    enemyHpMultiplier: sudden.hp,
    bastionDamage: Math.max(1, Math.round(base.bastionDamage * sudden.bastionDamage)),
    spawnIntervalMs: Math.max(220, Math.round(base.spawnIntervalMs * sudden.spawn))
  });
}

export function applySuddenSiegeEnemyScaling(enemy, waveNumber) {
  if (!enemy) return enemy;
  const scaling = getSuddenSiegeWaveScaling(waveNumber);
  const hpMultiplier = scaling.enemyHpMultiplier ?? 1;
  const maxHp = Math.max(1, Math.round(Number(enemy.maxHp ?? enemy.hp ?? 1) * hpMultiplier));
  const hp = Math.max(1, Math.round(Number(enemy.hp ?? enemy.maxHp ?? 1) * hpMultiplier));
  const shield = enemy.shield != null ? Math.max(0, Math.round(Number(enemy.shield) * hpMultiplier)) : enemy.shield;
  const maxShield = enemy.maxShield != null ? Math.max(0, Math.round(Number(enemy.maxShield) * hpMultiplier)) : enemy.maxShield;
  return Object.freeze({ ...enemy, hp, maxHp, shield, maxShield });
}

export function getSuddenSiegeWaveReward(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  return SUDDEN_SIEGE.baseWaveClearGold + (wave >= 8 ? 1 : 0) + (wave >= 15 ? 1 : 0);
}

export function getSuddenSiegeFixtures() {
  const early = getSuddenSiegeWaveScaling(3);
  const mid = getSuddenSiegeWaveScaling(10);
  const late = getSuddenSiegeWaveScaling(18);
  const endless = getSuddenSiegeWaveScaling(25);
  return Object.freeze({
    gradualThreat: early.suddenThreatMultiplier < mid.suddenThreatMultiplier && mid.suddenThreatMultiplier < late.suddenThreatMultiplier && late.suddenThreatMultiplier < endless.suddenThreatMultiplier,
    gradualHp: early.enemyHpMultiplier < mid.enemyHpMultiplier && mid.enemyHpMultiplier < late.enemyHpMultiplier && late.enemyHpMultiplier < endless.enemyHpMultiplier,
    fasterSpawnsLate: late.spawnIntervalMs < early.spawnIntervalMs,
    rewardWave1: getSuddenSiegeWaveReward(1),
    rewardWave8: getSuddenSiegeWaveReward(8),
    rewardWave15: getSuddenSiegeWaveReward(15)
  });
}
