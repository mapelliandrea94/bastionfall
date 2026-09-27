import { TOWER_ROSTER } from './towerRoster.js';
import { getUpgradedDefenseStats, UPGRADE_CURVE } from '../balance/upgradeCurves.js';

const evolution = (id, name, towerId, branch) => Object.freeze({
  id,
  name,
  towerId,
  branch,
  levelRequired: 4
});

export const TOWER_EVOLUTIONS = Object.freeze([
  evolution('skypiercer-ballista', 'Skypiercer Ballista', 'human-aa', 'A'),
  evolution('flak-bastion', 'Flak Bastion', 'human-aa', 'B'),
  evolution('railbreaker-cannon', 'Railbreaker Cannon', 'human-armor', 'A'),
  evolution('siegeburst-mortar', 'Siegeburst Mortar', 'human-armor', 'B'),
  evolution('reaper-turret', 'Reaper Turret', 'human-infantry', 'A'),
  evolution('barrage-howitzer', 'Barrage Howitzer', 'human-infantry', 'B'),

  evolution('venom-spitter-nest', 'Venom Spitter Nest', 'insect-aa', 'A'),
  evolution('skyswarm-hive', 'Skyswarm Hive', 'insect-aa', 'B'),
  evolution('corrosive-hive', 'Corrosive Hive', 'insect-armor', 'A'),
  evolution('burrow-mauler-pod', 'Burrow Mauler Pod', 'insect-armor', 'B'),
  evolution('brood-swarm-nest', 'Brood Swarm Nest', 'insect-infantry', 'A'),
  evolution('plague-bloom', 'Plague Bloom', 'insect-infantry', 'B'),

  evolution('prism-beam-array', 'Prism Beam Array', 'alien-aa', 'A'),
  evolution('disruptor-net-spire', 'Disruptor Net Spire', 'alien-aa', 'B'),
  evolution('singularity-lance', 'Singularity Lance', 'alien-armor', 'A'),
  evolution('phase-breaker-core', 'Phase Breaker Core', 'alien-armor', 'B'),
  evolution('plasma-nova-core', 'Plasma Nova Core', 'alien-infantry', 'A'),
  evolution('mindpulse-obelisk', 'Mindpulse Obelisk', 'alien-infantry', 'B'),

  evolution('cryo-field-emitter', 'Cryo Field Emitter', 'slow', 'A'),
  evolution('gravity-well-projector', 'Gravity Well Projector', 'slow', 'B'),
  evolution('weakness-beacon', 'Weakness Beacon', 'debuff', 'A'),
  evolution('corruption-relay', 'Corruption Relay', 'debuff', 'B'),
  evolution('command-relay', 'Command Relay', 'buff', 'A'),
  evolution('overclock-shrine', 'Overclock Shrine', 'buff', 'B')
]);

export const TOWER_EVOLUTIONS_BY_TOWER = Object.freeze(
  Object.fromEntries(TOWER_ROSTER.towers.map((tower) => [
    tower.id,
    Object.freeze(TOWER_EVOLUTIONS.filter((entry) => entry.towerId === tower.id))
  ]))
);

export function getEvolutionChoices(towerId) {
  return TOWER_EVOLUTIONS_BY_TOWER[towerId] ?? Object.freeze([]);
}

export function canChooseEvolution(placedTower) {
  return Number(placedTower?.level ?? 1) >= 4 && !placedTower?.evolution;
}

export function chooseTowerEvolution(placedTower, evolutionId) {
  const choice = getEvolutionChoices(placedTower?.defenseId).find((entry) => entry.id === evolutionId);
  if (!choice || !canChooseEvolution(placedTower)) return placedTower;

  return Object.freeze({
    ...placedTower,
    evolution: choice.id,
    evolutionChoice: choice.branch
  });
}

export function getRuntimeTowerDefinition(baseDefinition, placedTower) {
  const level = Math.max(1, Math.min(UPGRADE_CURVE.maxLevel, Number(placedTower?.level ?? 1) || 1));
  const upgraded = getUpgradedDefenseStats(baseDefinition, level);
  const chosenEvolution = TOWER_EVOLUTIONS.find((entry) => entry.id === placedTower?.evolution) ?? null;

  return Object.freeze({
    ...baseDefinition,
    ...upgraded,
    id: baseDefinition.id,
    faction: baseDefinition.faction,
    counterType: baseDefinition.counterType,
    neutral: baseDefinition.neutral,
    evolution: chosenEvolution?.id ?? null,
    evolutionName: chosenEvolution?.name ?? null
  });
}

export function getEvolutionFixtures() {
  const sample = { defenseId: 'human-aa', level: 4, evolution: null };
  const evolved = chooseTowerEvolution(sample, 'skypiercer-ballista');
  const base = TOWER_ROSTER.byId['human-aa'];

  return Object.freeze({
    evolutionCountExpected: 24,
    evolutionCountActual: TOWER_EVOLUTIONS.length,
    everyTowerHasTwoChoices: TOWER_ROSTER.towers.every((tower) => getEvolutionChoices(tower.id).length === 2),
    levelGateBlocksEarly: canChooseEvolution({ defenseId: 'human-aa', level: 3, evolution: null }) === false,
    levelFourAllowsChoice: canChooseEvolution(sample) === true,
    choiceIsPerTower: evolved.evolution === 'skypiercer-ballista' && evolved.evolutionChoice === 'A',
    counterFactionPreserved: getRuntimeTowerDefinition(base, evolved).faction === base.faction,
    counterTypePreserved: getRuntimeTowerDefinition(base, evolved).counterType === base.counterType
  });
}
