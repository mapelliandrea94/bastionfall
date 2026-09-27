export const ECONOMY_BASELINE = Object.freeze({
  version: 1,
  startingGold: 240,
  waveClearBaseGold: 18,
  waveClearBandSize: 5,
  waveClearBandBonus: 4,
  waveClearMaxGold: 50
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
  return Math.max(0, Math.floor(Number(enemy?.goldReward ?? 0)));
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
    startingGoldExpected: 240,
    startingGoldActual: ECONOMY_BASELINE.startingGold,
    archerCopiesExpected: 3,
    archerCopiesActual: byId.archer?.maxCopies ?? null,
    cannonCopiesExpected: 2,
    cannonCopiesActual: byId.cannon?.maxCopies ?? null,
    wave1RewardExpected: 18,
    wave1RewardActual: getWaveClearReward(1),
    wave6RewardExpected: 22,
    wave6RewardActual: getWaveClearReward(6)
  });
}
