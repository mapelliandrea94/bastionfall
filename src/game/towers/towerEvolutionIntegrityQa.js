import { TOWER_ROSTER, TOWER_FACTIONS } from '../towers/towerRoster.js';
import { TOWER_EVOLUTIONS, TOWER_EVOLUTIONS_BY_TOWER, getEvolutionChoices } from '../towers/evolutions.js';
import { NORMAL_MODE_TOWERS } from '../towers/normalBuildRoster.js';
import { TFT_COPY_PROGRESSION } from '../tft/tftCopyProgression.js';

export function getTowerEvolutionIntegrityQa() {
  const towerIds = TOWER_ROSTER.towers.map((tower) => tower.id);
  const evolutionIds = TOWER_EVOLUTIONS.map((entry) => entry.id);
  const countsByFaction = Object.fromEntries(
    Object.values(TOWER_FACTIONS).map((faction) => [
      faction,
      TOWER_ROSTER.towers.filter((tower) => tower.faction === faction).length
    ])
  );

  return Object.freeze({
    towerCountIs12: TOWER_ROSTER.towers.length === 12,
    normalBuildCountIs12: NORMAL_MODE_TOWERS.length === 12,
    uniqueTowerIds: new Set(towerIds).size === 12,
    evolutionCountIs24: TOWER_EVOLUTIONS.length === 24,
    uniqueEvolutionIds: new Set(evolutionIds).size === 24,
    everyTowerHasExactlyTwoEvolutions:
      TOWER_ROSTER.towers.every((tower) => getEvolutionChoices(tower.id).length === 2),
    everyEvolutionReferencesValidTower:
      TOWER_EVOLUTIONS.every((entry) => towerIds.includes(entry.towerId)),
    everyTowerMappedInEvolutionIndex:
      towerIds.every((id) => Array.isArray(TOWER_EVOLUTIONS_BY_TOWER[id]) && TOWER_EVOLUTIONS_BY_TOWER[id].length === 2),
    factionsAreThreeThreeThreeThree:
      countsByFaction.human === 3 &&
      countsByFaction.insect === 3 &&
      countsByFaction.alien === 3 &&
      countsByFaction.neutral === 3,
    normalBuildMatchesRoster:
      NORMAL_MODE_TOWERS.every((tower) => towerIds.includes(tower.id)),
    tftProgressionStillSevenCopies:
      TFT_COPY_PROGRESSION.maxCopies === 7,
    noLegacyEvolutionTowerIds:
      TOWER_EVOLUTIONS.every((entry) => !['archer','cannon','frost','mage','ballista','barracks'].includes(entry.towerId))
  });
}

export function getTowerEvolutionIntegrityPass() {
  return Object.values(getTowerEvolutionIntegrityQa()).every((value) => value === true);
}
