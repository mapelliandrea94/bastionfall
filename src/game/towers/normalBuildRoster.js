import { BASE_TOWER_GAMEPLAY } from './baseTowerGameplay.js';

export const NORMAL_MODE_TOWERS = BASE_TOWER_GAMEPLAY;

export const NORMAL_MODE_TOWERS_BY_ID = Object.freeze(
  Object.fromEntries(NORMAL_MODE_TOWERS.map((tower) => [tower.id, tower]))
);

export function getNormalModeTower(towerId) {
  return NORMAL_MODE_TOWERS_BY_ID[towerId] ?? NORMAL_MODE_TOWERS[0];
}

export function getNormalBuildRosterFixtures() {
  return Object.freeze({
    countExpected: 12,
    countActual: NORMAL_MODE_TOWERS.length,
    allHaveCost: NORMAL_MODE_TOWERS.every((tower) => Number(tower.cost) > 0),
    allHaveRole: NORMAL_MODE_TOWERS.every((tower) => Boolean(tower.role)),
    allHaveFaction: NORMAL_MODE_TOWERS.every((tower) => Boolean(tower.faction)),
    allHaveCounterType: NORMAL_MODE_TOWERS.every((tower) => Boolean(tower.counterType)),
    allHaveCombatStats: NORMAL_MODE_TOWERS.every((tower) => Number(tower.range) > 0 && Number(tower.attackIntervalMs) > 0),
    uniqueIds: new Set(NORMAL_MODE_TOWERS.map((tower) => tower.id)).size === 12
  });
}
