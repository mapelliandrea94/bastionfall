import { BLESSING_SYSTEM, getBlessingOffer } from './blessings.js';

export const BLESSING_REROLL = Object.freeze({
  version: 1,
  baseCost: 5,
  costStep: 3,
  maxRerollsPerOffer: 3
});

export function getBlessingRerollCost(rerollCount = 0) {
  const count = Math.max(0, Math.floor(Number(rerollCount) || 0));
  return BLESSING_REROLL.baseCost + count * BLESSING_REROLL.costStep;
}

export function canRerollBlessings(gold, rerollCount = 0) {
  const count = Math.max(0, Math.floor(Number(rerollCount) || 0));
  return count < BLESSING_REROLL.maxRerollsPerOffer &&
    Math.max(0, Number(gold) || 0) >= getBlessingRerollCost(count);
}

export function getRerolledBlessingOffer(seed, ownedBlessings = [], rerollCount = 0) {
  const count = Math.max(0, Math.floor(Number(rerollCount) || 0));
  return getBlessingOffer(
    `${seed}:reroll:${count + 1}`,
    ownedBlessings,
    BLESSING_SYSTEM.choiceCount
  );
}

export function getBlessingRerollFixtures() {
  const baseOffer = getBlessingOffer('run-123:boss:10', [], 3);
  const rerolled = getRerolledBlessingOffer('run-123:boss:10', [], 0);
  const rerolledAgain = getRerolledBlessingOffer('run-123:boss:10', [], 1);

  return Object.freeze({
    baseCostExpected: 5,
    baseCostActual: getBlessingRerollCost(0),
    secondCostExpected: 8,
    secondCostActual: getBlessingRerollCost(1),
    affordableAtExactCost: canRerollBlessings(5, 0) === true,
    blockedBelowCost: canRerollBlessings(4, 0) === false,
    blockedAtCap: canRerollBlessings(999, BLESSING_REROLL.maxRerollsPerOffer) === false,
    firstRerollChangesOffer:
      baseOffer.map((entry) => entry.id).join('|') !== rerolled.map((entry) => entry.id).join('|'),
    rerollsAdvanceDeterministically:
      rerolled.map((entry) => entry.id).join('|') !== rerolledAgain.map((entry) => entry.id).join('|')
  });
}
