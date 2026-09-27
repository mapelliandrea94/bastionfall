import { ECONOMY_BASELINE, getWaveClearReward } from '../economy/economyBaseline.js';
import { GOLD_MINE, getGoldMineBreakEvenWave } from '../structures/goldMine.js';
import { WAR_FORGE } from '../structures/warForge.js';
import { GUARDIAN_SHRINE } from '../structures/guardianShrine.js';

export const ECONOMY_SPEND_CURVE = Object.freeze({
  version: 1,
  reserveFloorEarly: 60,
  reserveFloorMid: 90,
  reserveFloorLate: 120,
  earlyWaveMax: 5,
  midWaveMax: 12,
  economyInvestmentShareSoftCap: 0.45,
  strategicStructureShareSoftCap: 0.55
});

export function getRecommendedReserve(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  if (wave <= ECONOMY_SPEND_CURVE.earlyWaveMax) return ECONOMY_SPEND_CURVE.reserveFloorEarly;
  if (wave <= ECONOMY_SPEND_CURVE.midWaveMax) return ECONOMY_SPEND_CURVE.reserveFloorMid;
  return ECONOMY_SPEND_CURVE.reserveFloorLate;
}

export function getEconomyRiskProfile({ waveNumber = 1, currentGold = ECONOMY_BASELINE.startingGold, mineCount = 0 } = {}) {
  const reserve = getRecommendedReserve(waveNumber);
  const totalMineCost = Math.max(0, Number(mineCount) || 0) * GOLD_MINE.cost;
  const postMineGold = Math.max(0, Number(currentGold) - totalMineCost);
  const mineShare = Number(currentGold) > 0 ? totalMineCost / Number(currentGold) : 0;

  return Object.freeze({
    waveNumber: Math.max(1, Math.floor(Number(waveNumber) || 1)),
    currentGold: Math.max(0, Number(currentGold) || 0),
    mineCount: Math.max(0, Number(mineCount) || 0),
    reserve,
    postMineGold,
    mineShare: Number(mineShare.toFixed(3)),
    overEconomySoftCap: mineShare > ECONOMY_SPEND_CURVE.economyInvestmentShareSoftCap,
    belowReserveAfterMine: postMineGold < reserve,
    mineBreakEvenWave: getGoldMineBreakEvenWave(),
    nextWaveClearGold: getWaveClearReward(waveNumber)
  });
}

export function getStrategicSpendProfile(currentGold = ECONOMY_BASELINE.startingGold) {
  const gold = Math.max(0, Number(currentGold) || 0);
  const forgeShare = gold > 0 ? WAR_FORGE.cost / gold : 1;
  const shrineShare = gold > 0 ? GUARDIAN_SHRINE.cost / gold : 1;

  return Object.freeze({
    currentGold: gold,
    forgeShare: Number(forgeShare.toFixed(3)),
    shrineShare: Number(shrineShare.toFixed(3)),
    forgeOverSoftCap: forgeShare > ECONOMY_SPEND_CURVE.strategicStructureShareSoftCap,
    shrineOverSoftCap: shrineShare > ECONOMY_SPEND_CURVE.strategicStructureShareSoftCap
  });
}

export function getSpendCurveFixtures() {
  const openingMine = getEconomyRiskProfile({ waveNumber: 1, currentGold: 240, mineCount: 1 });
  const doubleMine = getEconomyRiskProfile({ waveNumber: 1, currentGold: 240, mineCount: 2 });
  const strategic = getStrategicSpendProfile(240);

  return Object.freeze({
    openingMineLeavesReserve: openingMine.belowReserveAfterMine === false,
    openingMineUnderSoftCap: openingMine.overEconomySoftCap === false,
    doubleMineBelowReserve: doubleMine.belowReserveAfterMine === true,
    doubleMineOverSoftCap: doubleMine.overEconomySoftCap === true,
    forgeOpeningShareExpected: 0.625,
    forgeOpeningShareActual: strategic.forgeShare,
    shrineOpeningShareExpected: 0.604,
    shrineOpeningShareActual: strategic.shrineShare
  });
}
