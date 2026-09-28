import { TOWER_ROSTER } from './towerRoster.js';
import { getUpgradedDefenseStats, UPGRADE_CURVE } from '../balance/upgradeCurves.js';

const evolution = (id, name, towerId, branch, description) => Object.freeze({
  id,
  name,
  towerId,
  branch,
  description,
  levelRequired: 4
});

export const TOWER_EVOLUTIONS = Object.freeze([
  evolution('skypiercer-ballista', 'Skypiercer Ballista', 'human-aa', 'A', 'Precision anti-air path focused on long-range priority targets.'),
  evolution('flak-bastion', 'Flak Bastion', 'human-aa', 'B', 'Area anti-air path built to punish clustered flying enemies.'),
  evolution('railbreaker-cannon', 'Railbreaker Cannon', 'human-armor', 'A', 'Heavy single-target armor breaker for high-value armored enemies.'),
  evolution('siegeburst-mortar', 'Siegeburst Mortar', 'human-armor', 'B', 'Explosive siege path focused on splash pressure against armored groups.'),
  evolution('reaper-turret', 'Reaper Turret', 'human-infantry', 'A', 'Fast anti-infantry path focused on sustained single-target cleanup.'),
  evolution('barrage-howitzer', 'Barrage Howitzer', 'human-infantry', 'B', 'Area bombardment path for clearing dense infantry waves.'),

  evolution('venom-spitter-nest', 'Venom Spitter Nest', 'insect-aa', 'A', 'Focused venom anti-air path for priority flying targets.'),
  evolution('skyswarm-hive', 'Skyswarm Hive', 'insect-aa', 'B', 'Swarm anti-air path designed to pressure multiple flying enemies.'),
  evolution('corrosive-hive', 'Corrosive Hive', 'insect-armor', 'A', 'Corrosion path focused on weakening and melting armored targets.'),
  evolution('burrow-mauler-pod', 'Burrow Mauler Pod', 'insect-armor', 'B', 'Brutal anti-armor path centered on heavy direct damage.'),
  evolution('brood-swarm-nest', 'Brood Swarm Nest', 'insect-infantry', 'A', 'Rapid swarm path for sustained anti-infantry pressure.'),
  evolution('plague-bloom', 'Plague Bloom', 'insect-infantry', 'B', 'Area plague path for controlling and damaging infantry packs.'),

  evolution('prism-beam-array', 'Prism Beam Array', 'alien-aa', 'A', 'Precision beam path focused on deleting priority air targets.'),
  evolution('disruptor-net-spire', 'Disruptor Net Spire', 'alien-aa', 'B', 'Control-oriented anti-air path for disrupting groups of flyers.'),
  evolution('singularity-lance', 'Singularity Lance', 'alien-armor', 'A', 'Extreme single-target anti-armor path for elite heavy enemies.'),
  evolution('phase-breaker-core', 'Phase Breaker Core', 'alien-armor', 'B', 'Armor disruption path focused on weakening durable targets.'),
  evolution('plasma-nova-core', 'Plasma Nova Core', 'alien-infantry', 'A', 'High-output area damage path against packed infantry.'),
  evolution('mindpulse-obelisk', 'Mindpulse Obelisk', 'alien-infantry', 'B', 'Control-oriented infantry path for slowing enemy wave pressure.'),

  evolution('cryo-field-emitter', 'Cryo Field Emitter', 'slow', 'A', 'Wide control path focused on stronger battlefield slowing.'),
  evolution('gravity-well-projector', 'Gravity Well Projector', 'slow', 'B', 'Concentrated control path for locking dangerous enemies in place longer.'),
  evolution('weakness-beacon', 'Weakness Beacon', 'debuff', 'A', 'Damage-support path focused on making marked enemies easier to kill.'),
  evolution('corruption-relay', 'Corruption Relay', 'debuff', 'B', 'Attrition path focused on spreading debuffs across groups.'),
  evolution('command-relay', 'Command Relay', 'buff', 'A', 'Balanced support path focused on empowering nearby towers.'),
  evolution('overclock-shrine', 'Overclock Shrine', 'buff', 'B', 'Aggressive support path focused on faster offensive output.')
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
