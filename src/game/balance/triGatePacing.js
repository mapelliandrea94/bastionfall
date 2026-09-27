import { ECONOMY_BASELINE, getWaveClearReward } from '../economy/economyBaseline.js';
import { getBandWaveScaling } from './difficultyBands.js';

export const TRI_GATE_PACING = Object.freeze({
  version: 1,
  startingGold: 320,
  preparationSeconds: 18,
  waveClearRewardMultiplier: 1.25,
  threatMultiplier: 1.15,
  spawnIntervalMultiplier: 1.08,
  travelDurationMultiplier: 1.05,
  bastionDamageMultiplier: 1
});

export function getTriGateWaveClearReward(waveNumber) {
  return Math.round(getWaveClearReward(waveNumber) * TRI_GATE_PACING.waveClearRewardMultiplier);
}

export function getTriGateWaveScaling(waveNumber) {
  const base = getBandWaveScaling(waveNumber);

  return Object.freeze({
    ...base,
    threatMultiplier: Number((base.threatMultiplier * TRI_GATE_PACING.threatMultiplier).toFixed(3)),
    travelDurationMs: Math.round(base.travelDurationMs * TRI_GATE_PACING.travelDurationMultiplier),
    spawnIntervalMs: Math.round(base.spawnIntervalMs * TRI_GATE_PACING.spawnIntervalMultiplier),
    bastionDamage: Math.max(1, Math.round(base.bastionDamage * TRI_GATE_PACING.bastionDamageMultiplier))
  });
}

export function getTriGateEconomyFixtures() {
  const wave1 = getTriGateWaveScaling(1);
  const wave6 = getTriGateWaveScaling(6);

  return Object.freeze({
    startingGoldExpected: 320,
    startingGoldActual: TRI_GATE_PACING.startingGold,
    startingGoldAboveSingleGate: TRI_GATE_PACING.startingGold > ECONOMY_BASELINE.startingGold,
    preparationExpected: 18,
    preparationActual: TRI_GATE_PACING.preparationSeconds,
    wave1RewardExpected: 23,
    wave1RewardActual: getTriGateWaveClearReward(1),
    wave6RewardExpected: 28,
    wave6RewardActual: getTriGateWaveClearReward(6),
    wave1ThreatMultiplierExpected: 1.15,
    wave1ThreatMultiplierActual: wave1.threatMultiplier,
    wave1SpawnSlowerThanSingle: wave1.spawnIntervalMs > getBandWaveScaling(1).spawnIntervalMs,
    wave6TravelSlowerThanSingle: wave6.travelDurationMs > getBandWaveScaling(6).travelDurationMs,
    bastionDamageUnchanged: wave1.bastionDamage === getBandWaveScaling(1).bastionDamage
  });
}
