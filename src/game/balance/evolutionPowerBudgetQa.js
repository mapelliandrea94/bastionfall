import { NORMAL_MODE_TOWERS } from '../towers/normalBuildRoster.js';
import {
  getEvolutionChoices,
  chooseTowerEvolution,
  getRuntimeTowerDefinition
} from '../towers/evolutions.js';

const numericKeys = Object.freeze([
  'damage',
  'range',
  'attackIntervalMs',
  'splashRadius',
  'slowPercent',
  'slowDurationMs',
  'vulnerabilityPercent',
  'vulnerabilityDurationMs',
  'armorShred',
  'armorShredDurationMs',
  'poisonDamagePerSecond',
  'poisonDurationMs',
  'buffRadius',
  'buffDamageMultiplier',
  'buffAttackSpeedMultiplier'
]);

function numericSnapshot(runtime) {
  return Object.fromEntries(
    numericKeys
      .filter((key) => Number.isFinite(Number(runtime?.[key])))
      .map((key) => [key, Number(runtime[key])])
  );
}

export function getEvolutionPowerBudgetQa() {
  const perTower = NORMAL_MODE_TOWERS.map((tower) => {
    const choices = getEvolutionChoices(tower.id);
    const baseState = Object.freeze({
      id: `qa-${tower.id}`,
      defenseId: tower.id,
      level: 4,
      evolution: null,
      evolutionChoice: null
    });

    const branchAState = choices[0] ? chooseTowerEvolution(baseState, choices[0].id) : baseState;
    const branchBState = choices[1] ? chooseTowerEvolution(baseState, choices[1].id) : baseState;
    const baseRuntime = getRuntimeTowerDefinition(tower, baseState);
    const branchARuntime = getRuntimeTowerDefinition(tower, branchAState);
    const branchBRuntime = getRuntimeTowerDefinition(tower, branchBState);

    const baseStats = numericSnapshot(baseRuntime);
    const branchAStats = numericSnapshot(branchARuntime);
    const branchBStats = numericSnapshot(branchBRuntime);

    return Object.freeze({
      towerId: tower.id,
      twoBranches: choices.length === 2,
      branchLabelsValid: choices[0]?.branch === 'A' && choices[1]?.branch === 'B',
      branchAIdentityValid:
        branchARuntime.evolution === choices[0]?.id &&
        branchARuntime.evolutionName === choices[0]?.name,
      branchBIdentityValid:
        branchBRuntime.evolution === choices[1]?.id &&
        branchBRuntime.evolutionName === choices[1]?.name,
      branchAWithinCurrentBudget:
        JSON.stringify(branchAStats) === JSON.stringify(baseStats),
      branchBWithinCurrentBudget:
        JSON.stringify(branchBStats) === JSON.stringify(baseStats),
      branchesCurrentlyPowerNeutral:
        JSON.stringify(branchAStats) === JSON.stringify(branchBStats),
      factionPreserved:
        branchARuntime.faction === tower.faction &&
        branchBRuntime.faction === tower.faction,
      counterTypePreserved:
        branchARuntime.counterType === tower.counterType &&
        branchBRuntime.counterType === tower.counterType
    });
  });

  return Object.freeze({
    towerCountChecked: perTower.length,
    evolutionCountChecked: perTower.length * 2,
    allTwelveChecked: perTower.length === 12,
    allTwentyFourChecked: perTower.length * 2 === 24,
    everyTowerHasAB:
      perTower.every((entry) => entry.twoBranches && entry.branchLabelsValid),
    everyBranchIdentityValid:
      perTower.every((entry) => entry.branchAIdentityValid && entry.branchBIdentityValid),
    noBranchExceedsCurrentPowerBudget:
      perTower.every((entry) => entry.branchAWithinCurrentBudget && entry.branchBWithinCurrentBudget),
    allBranchesCurrentlyPowerNeutral:
      perTower.every((entry) => entry.branchesCurrentlyPowerNeutral),
    factionAndCounterIdentityPreserved:
      perTower.every((entry) => entry.factionPreserved && entry.counterTypePreserved)
  });
}

export function getEvolutionPowerBudgetPass() {
  const qa = getEvolutionPowerBudgetQa();
  return Object.entries(qa)
    .filter(([key]) => !['towerCountChecked', 'evolutionCountChecked'].includes(key))
    .every(([, value]) => value === true);
}
