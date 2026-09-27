import { NORMAL_ENEMY } from '../enemies/normal.js';
import { RUNNER_ENEMY } from '../enemies/runner.js';
import { TANK_ENEMY } from '../enemies/tank.js';
import { ARMORED_ENEMY } from '../enemies/armored.js';
import { SHIELDED_ENEMY } from '../enemies/shielded.js';
import { FLYING_ENEMY } from '../enemies/flying.js';

export const WAVE_THREAT_MODEL = Object.freeze({
  version: 1,
  baseThreat: 3,
  threatPerWave: 0.95,
  bandSize: 5,
  bandBonusThreat: 0.6,
  archetypes: Object.freeze([
    Object.freeze({ definition: NORMAL_ENEMY, unlockWave: 1, targetShare: 1 }),
    Object.freeze({ definition: RUNNER_ENEMY, unlockWave: 3, targetShare: 0.18 }),
    Object.freeze({ definition: TANK_ENEMY, unlockWave: 5, targetShare: 0.16 }),
    Object.freeze({ definition: ARMORED_ENEMY, unlockWave: 7, targetShare: 0.14 }),
    Object.freeze({ definition: SHIELDED_ENEMY, unlockWave: 9, targetShare: 0.14 }),
    Object.freeze({ definition: FLYING_ENEMY, unlockWave: 11, targetShare: 0.12 })
  ])
});

export function getWaveThreatBudget(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const band = Math.floor((wave - 1) / WAVE_THREAT_MODEL.bandSize);
  return Number((
    WAVE_THREAT_MODEL.baseThreat +
    (wave - 1) * WAVE_THREAT_MODEL.threatPerWave +
    band * WAVE_THREAT_MODEL.bandBonusThreat
  ).toFixed(2));
}

function addEnemy(composition, definition) {
  composition.push(Object.freeze({
    archetype: definition.archetype,
    threatValue: definition.threatValue
  }));
}

export function composeWaveByThreatBudget(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const budget = getWaveThreatBudget(wave);
  const composition = [];
  let spentThreat = 0;

  const unlockedSpecials = WAVE_THREAT_MODEL.archetypes
    .filter((profile) => profile.definition.archetype !== NORMAL_ENEMY.archetype && wave >= profile.unlockWave);

  for (const profile of unlockedSpecials) {
    const allocation = budget * profile.targetShare;
    let count = Math.floor(allocation / profile.definition.threatValue);

    if (
      count === 0 &&
      wave === profile.unlockWave &&
      budget - spentThreat >= profile.definition.threatValue
    ) {
      count = 1;
    }

    for (let index = 0; index < count; index += 1) {
      if (spentThreat + profile.definition.threatValue > budget) break;
      addEnemy(composition, profile.definition);
      spentThreat += profile.definition.threatValue;
    }
  }

  while (spentThreat + NORMAL_ENEMY.threatValue <= budget) {
    addEnemy(composition, NORMAL_ENEMY);
    spentThreat += NORMAL_ENEMY.threatValue;
  }

  const cheapestUnlocked = unlockedSpecials
    .map((profile) => profile.definition)
    .sort((a, b) => a.threatValue - b.threatValue)[0];

  if (
    cheapestUnlocked &&
    spentThreat < budget &&
    spentThreat + cheapestUnlocked.threatValue <= budget
  ) {
    addEnemy(composition, cheapestUnlocked);
    spentThreat += cheapestUnlocked.threatValue;
  }

  return Object.freeze({
    waveNumber: wave,
    budget,
    spentThreat: Number(spentThreat.toFixed(2)),
    unusedThreat: Number((budget - spentThreat).toFixed(2)),
    enemyCount: composition.length,
    composition: Object.freeze(composition)
  });
}

export function getThreatModelFixtures() {
  const wave1 = composeWaveByThreatBudget(1);
  const wave5 = composeWaveByThreatBudget(5);
  const wave11 = composeWaveByThreatBudget(11);

  return Object.freeze({
    wave1BudgetExpected: 3,
    wave1BudgetActual: wave1.budget,
    wave1OnlyNormal: wave1.composition.every((enemy) => enemy.archetype === NORMAL_ENEMY.archetype),
    wave5HasTank: wave5.composition.some((enemy) => enemy.archetype === TANK_ENEMY.archetype),
    wave11HasFlying: wave11.composition.some((enemy) => enemy.archetype === FLYING_ENEMY.archetype),
    wave11WithinBudget: wave11.spentThreat <= wave11.budget
  });
}
