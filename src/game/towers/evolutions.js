import { TOWER_ROSTER } from './towerRoster.js';
import { getUpgradedDefenseStats, UPGRADE_CURVE } from '../balance/upgradeCurves.js';

const evolution = (id, name, towerId, branch, description, effect) => Object.freeze({
  id,
  name,
  towerId,
  branch,
  description,
  effect: Object.freeze(effect),
  levelRequired: 4
});

function applyEvolutionEffect(definition, effect = {}) {
  const next = { ...definition };
  const mul = (key, factor, digits = 2) => {
    if (factor == null || next[key] == null) return;
    next[key] = Number((Number(next[key]) * factor).toFixed(digits));
  };
  const add = (key, amount) => {
    if (amount == null) return;
    next[key] = Number(next[key] ?? 0) + amount;
  };

  mul('damage', effect.damageMultiplier);
  mul('range', effect.rangeMultiplier);
  mul('attackIntervalMs', effect.attackIntervalMultiplier, 0);
  mul('projectileSpeed', effect.projectileSpeedMultiplier, 0);
  mul('splashRadius', effect.splashRadiusMultiplier);
  mul('poisonDamagePerSecond', effect.poisonMultiplier);
  mul('slowPercent', effect.slowMultiplier);
  mul('vulnerabilityPercent', effect.vulnerabilityMultiplier);
  mul('buffRadius', effect.buffRadiusMultiplier);
  if (effect.buffDamageBonusMultiplier && next.buffDamageMultiplier) {
    next.buffDamageMultiplier = Number((1 + (next.buffDamageMultiplier - 1) * effect.buffDamageBonusMultiplier).toFixed(3));
  }
  if (effect.buffAttackSpeedBonusMultiplier && next.buffAttackSpeedMultiplier) {
    next.buffAttackSpeedMultiplier = Number((1 + (next.buffAttackSpeedMultiplier - 1) * effect.buffAttackSpeedBonusMultiplier).toFixed(3));
  }
  add('splashRadius', effect.splashRadiusBonus);
  add('chainTargets', effect.chainTargetsBonus);
  add('armorShred', effect.armorShredBonus);
  add('slowPercent', effect.slowPercentBonus);
  add('poisonDamagePerSecond', effect.poisonDamageBonus);
  add('slowDurationMs', effect.slowDurationBonusMs);
  add('vulnerabilityDurationMs', effect.vulnerabilityDurationBonusMs);
  add('poisonDurationMs', effect.poisonDurationBonusMs);
  return next;
}

export const TOWER_EVOLUTIONS = Object.freeze([
  evolution('skypiercer-ballista', 'Skypiercer Ballista', 'human-aa', 'A', '+45% range, +35% damage, slower fire. Pure priority sniper.', { rangeMultiplier: 1.45, damageMultiplier: 1.35, attackIntervalMultiplier: 1.18 }),
  evolution('flak-bastion', 'Flak Bastion', 'human-aa', 'B', 'Less direct damage, but gains heavy splash for clustered air waves.', { damageMultiplier: 0.82, splashRadiusBonus: 115, attackIntervalMultiplier: 0.9 }),
  evolution('railbreaker-cannon', 'Railbreaker Cannon', 'human-armor', 'A', '+55% damage, slower fire. Extreme single-target armor killer.', { damageMultiplier: 1.55, attackIntervalMultiplier: 1.28, rangeMultiplier: 1.08 }),
  evolution('siegeburst-mortar', 'Siegeburst Mortar', 'human-armor', 'B', 'Huge splash radius, lower direct damage and slower projectiles.', { damageMultiplier: 0.78, splashRadiusBonus: 145, projectileSpeedMultiplier: 0.7 }),
  evolution('reaper-turret', 'Reaper Turret', 'human-infantry', 'A', 'Very fast fire and higher direct DPS, but loses splash.', { damageMultiplier: 1.18, attackIntervalMultiplier: 0.62, splashRadiusMultiplier: 0.2 }),
  evolution('barrage-howitzer', 'Barrage Howitzer', 'human-infantry', 'B', 'Massive infantry splash, slower cadence, lower direct hit.', { damageMultiplier: 0.82, attackIntervalMultiplier: 1.22, splashRadiusMultiplier: 1.9 }),

  evolution('venom-spitter-nest', 'Venom Spitter Nest', 'insect-aa', 'A', 'Poison damage +80% and longer poison duration; slower shots.', { poisonMultiplier: 1.8, poisonDurationBonusMs: 1600, attackIntervalMultiplier: 1.12 }),
  evolution('skyswarm-hive', 'Skyswarm Hive', 'insect-aa', 'B', 'Fast swarm fire and extra reach, but weaker venom.', { attackIntervalMultiplier: 0.65, rangeMultiplier: 1.18, poisonMultiplier: 0.55 }),
  evolution('corrosive-hive', 'Corrosive Hive', 'insect-armor', 'A', 'Extreme corrosion: much stronger armor shred, lower raw damage.', { armorShredBonus: 22, damageMultiplier: 0.72 }),
  evolution('burrow-mauler-pod', 'Burrow Mauler Pod', 'insect-armor', 'B', '+60% direct damage with slower attacks. Pure brute-force anti-armor.', { damageMultiplier: 1.6, attackIntervalMultiplier: 1.3 }),
  evolution('brood-swarm-nest', 'Brood Swarm Nest', 'insect-infantry', 'A', 'Near-continuous fire, smaller splash, lower per-hit damage.', { attackIntervalMultiplier: 0.55, damageMultiplier: 0.78, splashRadiusMultiplier: 0.65 }),
  evolution('plague-bloom', 'Plague Bloom', 'insect-infantry', 'B', 'Large plague splash plus a new poison effect, but slow firing.', { splashRadiusMultiplier: 1.9, poisonDamageBonus: 7, poisonDurationBonusMs: 2600, attackIntervalMultiplier: 1.28 }),

  evolution('prism-beam-array', 'Prism Beam Array', 'alien-aa', 'A', '+50% damage and +25% range, but slower cadence. Precision beam.', { damageMultiplier: 1.5, rangeMultiplier: 1.25, attackIntervalMultiplier: 1.2 }),
  evolution('disruptor-net-spire', 'Disruptor Net Spire', 'alien-aa', 'B', 'Gains extra chain targets and faster fire, but lower direct damage.', { damageMultiplier: 0.72, attackIntervalMultiplier: 0.8, chainTargetsBonus: 3 }),
  evolution('singularity-lance', 'Singularity Lance', 'alien-armor', 'A', '+70% direct damage, slower cadence. Elite execution path.', { damageMultiplier: 1.7, attackIntervalMultiplier: 1.32, rangeMultiplier: 1.1 }),
  evolution('phase-breaker-core', 'Phase Breaker Core', 'alien-armor', 'B', 'Adds major armor shred and extra reach, sacrificing direct damage.', { armorShredBonus: 26, rangeMultiplier: 1.2, damageMultiplier: 0.7 }),
  evolution('plasma-nova-core', 'Plasma Nova Core', 'alien-infantry', 'A', 'Enormous plasma splash with higher damage, but much slower fire.', { damageMultiplier: 1.22, splashRadiusMultiplier: 2, attackIntervalMultiplier: 1.35 }),
  evolution('mindpulse-obelisk', 'Mindpulse Obelisk', 'alien-infantry', 'B', 'Control conversion: lower damage, gains a strong slow and longer reach.', { damageMultiplier: 0.58, rangeMultiplier: 1.2, slowPercentBonus: 28, slowDurationBonusMs: 2200 }),

  evolution('cryo-field-emitter', 'Cryo Field Emitter', 'slow', 'A', 'Wide cryo field: +45% slow strength and +30% range, almost no damage.', { slowMultiplier: 1.45, rangeMultiplier: 1.3, damageMultiplier: 0.35 }),
  evolution('gravity-well-projector', 'Gravity Well Projector', 'slow', 'B', 'Smaller range but very long, brutal slow duration.', { slowMultiplier: 1.7, slowDurationBonusMs: 2200, rangeMultiplier: 0.82 }),
  evolution('weakness-beacon', 'Weakness Beacon', 'debuff', 'A', 'Marks one priority target much harder: +70% vulnerability, less range.', { vulnerabilityMultiplier: 1.7, rangeMultiplier: 0.86, damageMultiplier: 0.5 }),
  evolution('corruption-relay', 'Corruption Relay', 'debuff', 'B', 'Wider relay with longer debuff uptime, weaker vulnerability per target.', { vulnerabilityMultiplier: 0.78, vulnerabilityDurationBonusMs: 2400, rangeMultiplier: 1.35 }),
  evolution('command-relay', 'Command Relay', 'buff', 'A', 'Large support aura with much stronger tower damage buffs.', { buffRadiusMultiplier: 1.45, buffDamageBonusMultiplier: 1.7, damageMultiplier: 0.3 }),
  evolution('overclock-shrine', 'Overclock Shrine', 'buff', 'B', 'Compact aggressive aura with extreme attack-speed support.', { buffRadiusMultiplier: 0.82, buffAttackSpeedBonusMultiplier: 2.1, damageMultiplier: 0.3 })
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

  const evolved = chosenEvolution
    ? applyEvolutionEffect({ ...baseDefinition, ...upgraded }, chosenEvolution.effect)
    : { ...baseDefinition, ...upgraded };

  return Object.freeze({
    ...evolved,
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
