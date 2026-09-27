export const GOLD_MINE = Object.freeze({
  id: 'gold-mine',
  name: 'Gold Mine',
  role: 'economy',
  cost: 100,
  incomePerWave: 22,
  firstPayoutDelayWaves: 1,
  maxConcurrent: 3,
  description: 'Sacrifices immediate combat power for recurring gold after each cleared wave.'
});

export function getGoldMinePayback(wavesOwned = 0) {
  const ownedWaves = Math.max(0, Math.floor(Number(wavesOwned) || 0));
  const productiveWaves = Math.max(0, ownedWaves - GOLD_MINE.firstPayoutDelayWaves + 1);
  const earnedGold = productiveWaves * GOLD_MINE.incomePerWave;
  const netGold = earnedGold - GOLD_MINE.cost;

  return Object.freeze({
    wavesOwned: ownedWaves,
    productiveWaves,
    earnedGold,
    netGold,
    breakEvenReached: netGold >= 0
  });
}

export function getGoldMineBreakEvenWave() {
  return GOLD_MINE.firstPayoutDelayWaves - 1 +
    Math.ceil(GOLD_MINE.cost / GOLD_MINE.incomePerWave);
}

export function getGoldMineOpportunityCost(referenceDefenses = []) {
  const affordableAlternatives = referenceDefenses
    .filter((defense) => Number(defense?.cost) > 0 && Number(defense.cost) <= GOLD_MINE.cost)
    .map((defense) => Object.freeze({
      id: defense.id,
      name: defense.name,
      cost: Number(defense.cost),
      goldDifference: GOLD_MINE.cost - Number(defense.cost)
    }))
    .sort((a, b) => b.cost - a.cost);

  return Object.freeze({
    mineCost: GOLD_MINE.cost,
    breakEvenWave: getGoldMineBreakEvenWave(),
    affordableAlternatives: Object.freeze(affordableAlternatives)
  });
}

export function getGoldMineFixtures(referenceDefenses = []) {
  const breakEvenWave = getGoldMineBreakEvenWave();
  const before = getGoldMinePayback(breakEvenWave - 1);
  const at = getGoldMinePayback(breakEvenWave);
  const opportunity = getGoldMineOpportunityCost(referenceDefenses);

  return Object.freeze({
    breakEvenWaveExpected: 5,
    breakEvenWaveActual: breakEvenWave,
    beforeBreakEvenNegative: before.netGold < 0,
    atBreakEvenNonNegative: at.netGold >= 0,
    includesArcherAlternative: opportunity.affordableAlternatives.some((entry) => entry.id === 'archer'),
    includesFrostAlternative: opportunity.affordableAlternatives.some((entry) => entry.id === 'frost'),
    excludesCannonAlternative: !opportunity.affordableAlternatives.some((entry) => entry.id === 'cannon')
  });
}
