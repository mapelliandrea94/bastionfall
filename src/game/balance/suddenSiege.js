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
  void wave;
  return SUDDEN_SIEGE.baseWaveClearGold;
}

export function getSuddenSiegeEconomyParity(waveNumber, tftConfig) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const suddenBase = getSuddenSiegeWaveReward(wave);
  const tftBase = Math.max(0, Number(tftConfig?.waveClearGold ?? 0));
  return Object.freeze({
    wave,
    suddenBase,
    tftBase,
    delta: suddenBase - tftBase,
    exactParity: suddenBase === tftBase
  });
}

export function getSuddenSiegeTelemetry(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const scaling = getSuddenSiegeWaveScaling(wave);
  const stage = wave <= 5 ? 'OPENING' : wave <= 12 ? 'ESCALATION' : wave <= 20 ? 'ONSLAUGHT' : 'ENDLESS';
  return Object.freeze({
    wave,
    stage,
    threatMultiplier: scaling.suddenThreatMultiplier ?? 1,
    hpMultiplier: scaling.enemyHpMultiplier ?? 1,
    spawnIntervalMs: scaling.spawnIntervalMs,
    bastionDamage: scaling.bastionDamage,
    waveReward: getSuddenSiegeWaveReward(wave),
    preparationSeconds: SUDDEN_SIEGE.preparationSeconds
  });
}

export function getSuddenSiegeBattlefieldVisual(waveNumber) {
  const telemetry = getSuddenSiegeTelemetry(waveNumber);
  const byStage = Object.freeze({
    OPENING: Object.freeze({ intensity: 0.16, pulseMs: 2400, label: 'THREAT RISING' }),
    ESCALATION: Object.freeze({ intensity: 0.28, pulseMs: 1900, label: 'ESCALATION' }),
    ONSLAUGHT: Object.freeze({ intensity: 0.42, pulseMs: 1400, label: 'ONSLAUGHT' }),
    ENDLESS: Object.freeze({ intensity: 0.58, pulseMs: 1000, label: 'ENDLESS PRESSURE' })
  });
  const visual = byStage[telemetry.stage] ?? byStage.OPENING;
  return Object.freeze({
    ...visual,
    stage: telemetry.stage,
    className: telemetry.stage.toLowerCase()
  });
}

export function getSuddenSiegeStageTransition(previousStage, nextStage) {
  const stages = Object.freeze(['OPENING', 'ESCALATION', 'ONSLAUGHT', 'ENDLESS']);
  const previousIndex = stages.indexOf(previousStage);
  const nextIndex = stages.indexOf(nextStage);
  if (previousIndex < 0 || nextIndex < 0 || nextIndex <= previousIndex) return null;

  const copy = Object.freeze({
    ESCALATION: Object.freeze({
      title: 'SIEGE ESCALATES',
      subtitle: 'Enemy pressure and health have increased.'
    }),
    ONSLAUGHT: Object.freeze({
      title: 'ONSLAUGHT',
      subtitle: 'The siege has entered its lethal phase.'
    }),
    ENDLESS: Object.freeze({
      title: 'ENDLESS PRESSURE',
      subtitle: 'No ceiling remains. Survive as long as you can.'
    })
  });

  const message = copy[nextStage];
  if (!message) return null;
  return Object.freeze({
    from: previousStage,
    to: nextStage,
    ...message
  });
}

export function getSuddenSiegeFixtures() {
  const early = getSuddenSiegeWaveScaling(3);
  const mid = getSuddenSiegeWaveScaling(10);
  const late = getSuddenSiegeWaveScaling(18);
  const endless = getSuddenSiegeWaveScaling(25);
  const telemetry10 = getSuddenSiegeTelemetry(10);
  const telemetry25 = getSuddenSiegeTelemetry(25);
  const visual3 = getSuddenSiegeBattlefieldVisual(3);
  const visual18 = getSuddenSiegeBattlefieldVisual(18);
  const visual25 = getSuddenSiegeBattlefieldVisual(25);
  const escalationTransition = getSuddenSiegeStageTransition('OPENING', 'ESCALATION');
  const invalidTransition = getSuddenSiegeStageTransition('ONSLAUGHT', 'ESCALATION');
  return Object.freeze({
    gradualThreat: early.suddenThreatMultiplier < mid.suddenThreatMultiplier && mid.suddenThreatMultiplier < late.suddenThreatMultiplier && late.suddenThreatMultiplier < endless.suddenThreatMultiplier,
    gradualHp: early.enemyHpMultiplier < mid.enemyHpMultiplier && mid.enemyHpMultiplier < late.enemyHpMultiplier && late.enemyHpMultiplier < endless.enemyHpMultiplier,
    fasterSpawnsLate: late.spawnIntervalMs < early.spawnIntervalMs,
    rewardWave1: getSuddenSiegeWaveReward(1),
    rewardWave8: getSuddenSiegeWaveReward(8),
    rewardWave15: getSuddenSiegeWaveReward(15),
    rewardCurveFlat: getSuddenSiegeWaveReward(1) === getSuddenSiegeWaveReward(8) && getSuddenSiegeWaveReward(8) === getSuddenSiegeWaveReward(25),
    telemetryStage10: telemetry10.stage === 'ESCALATION',
    telemetryStage25: telemetry25.stage === 'ENDLESS',
    telemetryUsesWaveReward: telemetry10.waveReward === getSuddenSiegeWaveReward(10),
    battlefieldVisualEscalates: visual3.intensity < visual18.intensity && visual18.intensity < visual25.intensity,
    battlefieldPulseAccelerates: visual3.pulseMs > visual18.pulseMs && visual18.pulseMs > visual25.pulseMs,
    escalationTransitionAnnounces: escalationTransition?.to === 'ESCALATION',
    reverseTransitionIgnored: invalidTransition === null
  });
}
