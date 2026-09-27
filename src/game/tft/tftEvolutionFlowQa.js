import { NORMAL_MODE_TOWERS } from '../towers/normalBuildRoster.js';
import { getEvolutionChoices, chooseTowerEvolution } from '../towers/evolutions.js';
import {
  TFT_COPY_PROGRESSION,
  getTftLevelForCopyProgress,
  canMergeTftCopy,
  mergeTftCopyProgress
} from './tftCopyProgression.js';

export function getTftEvolutionFlowQa() {
  const perTower = NORMAL_MODE_TOWERS.map((tower) => {
    const benchCopy = Object.freeze({ copyId: `qa-${tower.id}`, towerId: tower.id });
    let placed = Object.freeze({
      id: `qa-placed-${tower.id}`,
      defenseId: tower.id,
      level: 1,
      copyProgress: 1,
      evolution: null,
      evolutionChoice: null
    });

    const checkpoints = [{ copies: placed.copyProgress, level: placed.level }];
    for (let copies = 2; copies <= TFT_COPY_PROGRESSION.maxCopies; copies += 1) {
      const merged = mergeTftCopyProgress(placed, benchCopy);
      placed = merged.tower;
      checkpoints.push({ copies: placed.copyProgress, level: placed.level });
    }

    const choices = getEvolutionChoices(tower.id);
    const evolvedA = choices[0] ? chooseTowerEvolution(placed, choices[0].id) : placed;
    const evolvedB = choices[1] ? chooseTowerEvolution(placed, choices[1].id) : placed;

    return Object.freeze({
      towerId: tower.id,
      checkpointLevelsCorrect:
        checkpoints.every((entry) => entry.level === getTftLevelForCopyProgress(entry.copies)),
      sevenCopiesIsLevelFour:
        placed.copyProgress === 7 && placed.level === 4,
      extraMergeBlocked:
        canMergeTftCopy(placed, benchCopy).ok === false,
      hasTwoEvolutionChoices:
        choices.length === 2,
      branchASelectableAtSeven:
        evolvedA.evolution === choices[0]?.id && evolvedA.evolutionChoice === 'A',
      branchBSelectableAtSeven:
        evolvedB.evolution === choices[1]?.id && evolvedB.evolutionChoice === 'B'
    });
  });

  return Object.freeze({
    towerCountChecked: perTower.length,
    allTwelveChecked: perTower.length === 12,
    copyLevelMappingCorrectForEveryTower:
      perTower.every((entry) => entry.checkpointLevelsCorrect),
    sevenCopiesUnlockLevelFourForEveryTower:
      perTower.every((entry) => entry.sevenCopiesIsLevelFour),
    copyCapEnforcedForEveryTower:
      perTower.every((entry) => entry.extraMergeBlocked),
    exactlyTwoEvolutionChoicesForEveryTower:
      perTower.every((entry) => entry.hasTwoEvolutionChoices),
    branchAWorksForEveryTower:
      perTower.every((entry) => entry.branchASelectableAtSeven),
    branchBWorksForEveryTower:
      perTower.every((entry) => entry.branchBSelectableAtSeven)
  });
}

export function getTftEvolutionFlowPass() {
  const qa = getTftEvolutionFlowQa();
  return Object.entries(qa)
    .filter(([key]) => key !== 'towerCountChecked')
    .every(([, value]) => value === true);
}
