import { NORMAL_MODE_TOWERS } from './normalBuildRoster.js';
import {
  canChooseEvolution,
  chooseTowerEvolution,
  getEvolutionChoices,
  getRuntimeTowerDefinition
} from './evolutions.js';

export function getNormalModeEvolutionFlowQa() {
  const perTower = NORMAL_MODE_TOWERS.map((tower) => {
    const choices = getEvolutionChoices(tower.id);
    const baseState = Object.freeze({
      id: `qa-${tower.id}`,
      defenseId: tower.id,
      level: 4,
      evolution: null,
      evolutionChoice: null
    });
    const earlyState = Object.freeze({ ...baseState, level: 3 });
    const first = choices[0] ? chooseTowerEvolution(baseState, choices[0].id) : baseState;
    const second = choices[1] ? chooseTowerEvolution(baseState, choices[1].id) : baseState;
    const firstRuntime = getRuntimeTowerDefinition(tower, first);
    const secondRuntime = getRuntimeTowerDefinition(tower, second);

    return Object.freeze({
      towerId: tower.id,
      exactlyTwoChoices: choices.length === 2,
      blockedBeforeLevelFour: canChooseEvolution(earlyState) === false,
      allowedAtLevelFour: canChooseEvolution(baseState) === true,
      branchASelectable:
        Boolean(choices[0]) &&
        first.evolution === choices[0].id &&
        first.evolutionChoice === 'A',
      branchBSelectable:
        Boolean(choices[1]) &&
        second.evolution === choices[1].id &&
        second.evolutionChoice === 'B',
      cannotChooseTwice:
        choices[1] ? chooseTowerEvolution(first, choices[1].id).evolution === first.evolution : true,
      runtimePreservesTowerIdentity:
        firstRuntime.id === tower.id &&
        secondRuntime.id === tower.id &&
        firstRuntime.faction === tower.faction &&
        secondRuntime.faction === tower.faction &&
        firstRuntime.counterType === tower.counterType &&
        secondRuntime.counterType === tower.counterType
    });
  });

  return Object.freeze({
    towerCountChecked: perTower.length,
    allTwelveChecked: perTower.length === 12,
    everyTowerExactlyTwoChoices: perTower.every((entry) => entry.exactlyTwoChoices),
    levelGateCorrectForEveryTower:
      perTower.every((entry) => entry.blockedBeforeLevelFour && entry.allowedAtLevelFour),
    branchAWorksForEveryTower: perTower.every((entry) => entry.branchASelectable),
    branchBWorksForEveryTower: perTower.every((entry) => entry.branchBSelectable),
    evolutionIsSingleChoice: perTower.every((entry) => entry.cannotChooseTwice),
    runtimeIdentityPreserved: perTower.every((entry) => entry.runtimePreservesTowerIdentity)
  });
}

export function getNormalModeEvolutionFlowPass() {
  const qa = getNormalModeEvolutionFlowQa();
  return Object.entries(qa)
    .filter(([key]) => key !== 'towerCountChecked')
    .every(([, value]) => value === true);
}
