import { composeWaveByThreatBudget, getWaveThreatBudget } from './waveThreat.js';
import { getBandWaveScaling } from './difficultyBands.js';
import { getEliteChanceForWave, ELITE_MODIFIER_SYSTEM } from '../elites/eliteModifiers.js';
import { getActiveWorldModifiers, getWorldModifierEffects, WORLD_MODIFIER_SYSTEM } from '../world/worldModifiers.js';

const SOAK_WAVES = Object.freeze([21, 30, 50, 75, 100, 150, 250]);

function archetypeSet(waveNumber) {
  return new Set(composeWaveByThreatBudget(waveNumber).composition.map((enemy) => enemy.archetype));
}

export function getLateGameSoakQa() {
  const budgets = SOAK_WAVES.map((wave) => getWaveThreatBudget(wave));
  const scalings = SOAK_WAVES.map((wave) => getBandWaveScaling(wave));
  const diversity = SOAK_WAVES.map((wave) => archetypeSet(wave).size);
  const highWaveWorldEffects = getWorldModifierEffects(
    getActiveWorldModifiers('late-game-soak', 21)
  );

  return Object.freeze({
    waves: SOAK_WAVES,
    budgetsStrictlyIncrease: budgets.every((value, index) => index === 0 || value > budgets[index - 1]),
    travelDurationNeverBelowFloor: scalings.every((entry) => entry.travelDurationMs >= 2800),
    spawnIntervalNeverBelowFloor: scalings.every((entry) => entry.spawnIntervalMs >= 320),
    bastionDamageNonDecreasing: scalings.every((entry, index) => index === 0 || entry.bastionDamage >= scalings[index - 1].bastionDamage),
    lateWavesStayMixed: diversity.slice(1).every((count) => count >= 4),
    wave100HasBroadThreatMix: archetypeSet(100).size >= 5,
    wave250HasBroadThreatMix: archetypeSet(250).size >= 5,
    eliteChanceCapped: getEliteChanceForWave(9999) === ELITE_MODIFIER_SYSTEM.maxEliteChance,
    eliteChanceMeaningfullyRises: getEliteChanceForWave(100) > getEliteChanceForWave(15),
    worldModifierCountBounded: getActiveWorldModifiers('late-game-soak', 21).length <= WORLD_MODIFIER_SYSTEM.maxActiveModifiers,
    worldEffectsFinite: Object.values(highWaveWorldEffects).every((value) => Number.isFinite(value) && value > 0)
  });
}

export function getLateGameSoakPass() {
  const qa = getLateGameSoakQa();
  return Object.entries(qa)
    .filter(([key]) => key !== 'waves')
    .every(([, value]) => value === true);
}
