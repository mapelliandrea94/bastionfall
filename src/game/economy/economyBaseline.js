export const ECONOMY_BASELINE = Object.freeze({
  version: 2,
  startingGold: 300,
  waveClearBaseGold: 26,
  waveClearBandSize: 5,
  waveClearBandBonus: 5,
  waveClearMaxGold: 70,
  enemyKillRewardMultiplier: 2
});

export function getWaveClearReward(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const band = Math.floor((wave - 1) / ECONOMY_BASELINE.waveClearBandSize);
  return Math.min(
    ECONOMY_BASELINE.waveClearMaxGold,
    ECONOMY_BASELINE.waveClearBaseGold + band * ECONOMY_BASELINE.waveClearBandBonus
  );
}

export function getEnemyKillReward(enemy) {
  const baseReward = Math.max(0, Math.floor(Number(enemy?.goldReward ?? 0)));
  return baseReward * ECONOMY_BASELINE.enemyKillRewardMultiplier;
}

export function getOpeningAffordability(defenses) {
  const entries = Object.values(defenses)
    .filter((defense) => Number(defense?.cost) > 0)
    .map((defense) => Object.freeze({
      id: defense.id,
      cost: Number(defense.cost),
      maxCopies: Math.floor(ECONOMY_BASELINE.startingGold / Number(defense.cost)),
      remainingAfterOne: ECONOMY_BASELINE.startingGold - Number(defense.cost)
    }));

  return Object.freeze(entries);
}

export function getEconomyBaselineFixtures(defenses) {
  const affordability = getOpeningAffordability(defenses);
  const byId = Object.fromEntries(affordability.map((entry) => [entry.id, entry]));

  return Object.freeze({
    startingGoldExpected: 300,
    startingGoldActual: ECONOMY_BASELINE.startingGold,
    archerCopiesExpected: 4,
    archerCopiesActual: byId.archer?.maxCopies ?? null,
    cannonCopiesExpected: 2,
    cannonCopiesActual: byId.cannon?.maxCopies ?? null,
    wave1RewardExpected: 26,
    wave1RewardActual: getWaveClearReward(1),
    wave6RewardExpected: 31,
    wave6RewardActual: getWaveClearReward(6)
  });
}
