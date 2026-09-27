import { BLESSINGS, BLESSING_RARITIES } from './blessings.js';
import { getBlessingModifiers, applyBlessingWaveGold } from './blessingEngine.js';
import { BLESSING_REROLL, getBlessingRerollCost } from './blessingReroll.js';

export const BLESSING_POWER_BUDGET = Object.freeze({
  version: 1,
  rarityBudget: Object.freeze({
    [BLESSING_RARITIES.COMMON]: 1,
    [BLESSING_RARITIES.RARE]: 1.8,
    [BLESSING_RARITIES.EPIC]: 3
  }),
  caps: Object.freeze({
    towerDamageMultiplier: 1.55,
    attackSpeedMultiplier: 1.35,
    bossDamageMultiplier: 1.45,
    bastionDamageTakenMultiplierFloor: 0.72,
    waveClearGoldMultiplier: 1.35,
    waveClearGoldBonus: 6,
    bastionMaxHpBonus: 8,
    slowStrengthBonus: 0.3,
    enemyMoveSpeedMultiplierFloor: 0.88
  })
});

export function clampBlessingModifiers(modifiers) {
  const caps = BLESSING_POWER_BUDGET.caps;
  return Object.freeze({
    ...modifiers,
    towerDamageMultiplier: Math.min(caps.towerDamageMultiplier, modifiers.towerDamageMultiplier),
    attackSpeedMultiplier: Math.min(caps.attackSpeedMultiplier, modifiers.attackSpeedMultiplier),
    bossDamageMultiplier: Math.min(caps.bossDamageMultiplier, modifiers.bossDamageMultiplier),
    bastionDamageTakenMultiplier: Math.max(caps.bastionDamageTakenMultiplierFloor, modifiers.bastionDamageTakenMultiplier),
    waveClearGoldMultiplier: Math.min(caps.waveClearGoldMultiplier, modifiers.waveClearGoldMultiplier),
    waveClearGoldBonus: Math.min(caps.waveClearGoldBonus, modifiers.waveClearGoldBonus),
    bastionMaxHpBonus: Math.min(caps.bastionMaxHpBonus, modifiers.bastionMaxHpBonus),
    slowStrengthBonus: Math.min(caps.slowStrengthBonus, modifiers.slowStrengthBonus),
    enemyMoveSpeedMultiplier: Math.max(caps.enemyMoveSpeedMultiplierFloor, modifiers.enemyMoveSpeedMultiplier)
  });
}

export function getCappedBlessingModifiers(ownedBlessings = []) {
  return clampBlessingModifiers(getBlessingModifiers(ownedBlessings));
}

export function getRerollSpendToCap() {
  let total = 0;
  for (let count = 0; count < BLESSING_REROLL.maxRerollsPerOffer; count += 1) {
    total += getBlessingRerollCost(count);
  }
  return total;
}

export function getBlessingExploitChecks() {
  const maxDamageStack = getCappedBlessingModifiers([
    'keen-edge','keen-edge','keen-edge','golden-tempest'
  ]);
  const maxEconomyStack = getCappedBlessingModifiers([
    'war-chest','war-chest','prosperity','prosperity'
  ]);
  const maxDefenseStack = getCappedBlessingModifiers([
    'iron-bastion','iron-bastion','iron-bastion','unyielding-core','unyielding-core','last-light'
  ]);
  const maxControlStack = getCappedBlessingModifiers([
    'frostbound','frostbound','time-lock'
  ]);

  const baseGold = 10;
  const boostedGold = applyBlessingWaveGold(baseGold, [
    'war-chest','war-chest','prosperity','prosperity'
  ]);

  return Object.freeze({
    definitionsStayWithinDeclaredStacks: BLESSINGS.every((entry) => entry.maxStacks >= 1 && entry.maxStacks <= 3),
    damageCapRespected: maxDamageStack.towerDamageMultiplier <= BLESSING_POWER_BUDGET.caps.towerDamageMultiplier,
    economyMultiplierCapRespected: maxEconomyStack.waveClearGoldMultiplier <= BLESSING_POWER_BUDGET.caps.waveClearGoldMultiplier,
    economyBonusCapRespected: maxEconomyStack.waveClearGoldBonus <= BLESSING_POWER_BUDGET.caps.waveClearGoldBonus,
    defenseFloorRespected: maxDefenseStack.bastionDamageTakenMultiplier >= BLESSING_POWER_BUDGET.caps.bastionDamageTakenMultiplierFloor,
    maxHpCapRespected: maxDefenseStack.bastionMaxHpBonus <= BLESSING_POWER_BUDGET.caps.bastionMaxHpBonus,
    controlSlowCapRespected: maxControlStack.slowStrengthBonus <= BLESSING_POWER_BUDGET.caps.slowStrengthBonus,
    enemySpeedFloorRespected: maxControlStack.enemyMoveSpeedMultiplier >= BLESSING_POWER_BUDGET.caps.enemyMoveSpeedMultiplierFloor,
    rerollSpendToCapExpected: 24,
    rerollSpendToCapActual: getRerollSpendToCap(),
    rerollCannotBeFree: getBlessingRerollCost(0) > 0,
    economyDoesNotExplode: boostedGold <= 20
  });
}
