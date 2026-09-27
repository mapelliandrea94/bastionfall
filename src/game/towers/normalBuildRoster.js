import { TOWER_ROSTER } from './towerRoster.js';
import { ARCHER_TOWER } from './archer.js';
import { CANNON_TOWER } from './cannon.js';
import { FROST_TOWER } from './frost.js';
import { MAGE_TOWER } from './mage.js';
import { BALLISTA_TOWER } from './ballista.js';
import { BARRACKS } from '../structures/barracks.js';

const TEMPLATE_BY_ID = Object.freeze({
  'human-aa': ARCHER_TOWER,
  'human-armor': CANNON_TOWER,
  'human-infantry': BALLISTA_TOWER,
  'insect-aa': ARCHER_TOWER,
  'insect-armor': CANNON_TOWER,
  'insect-infantry': BARRACKS,
  'alien-aa': MAGE_TOWER,
  'alien-armor': BALLISTA_TOWER,
  'alien-infantry': MAGE_TOWER,
  slow: FROST_TOWER,
  debuff: FROST_TOWER,
  buff: FROST_TOWER
});

function buildFromTemplate(tower) {
  const template = TEMPLATE_BY_ID[tower.id] ?? ARCHER_TOWER;
  return Object.freeze({
    ...template,
    ...tower,
    id: tower.id,
    name: tower.name,
    role: tower.role,
    description: `${tower.name} placeholder gameplay profile; final identity arrives in H5.`
  });
}

export const NORMAL_MODE_TOWERS = Object.freeze(
  TOWER_ROSTER.towers.map(buildFromTemplate)
);

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
    uniqueIds: new Set(NORMAL_MODE_TOWERS.map((tower) => tower.id)).size === 12
  });
}
