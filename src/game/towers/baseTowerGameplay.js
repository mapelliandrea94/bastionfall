import { TOWER_ROSTER } from './towerRoster.js';

const profile = (id, stats) => Object.freeze({
  ...TOWER_ROSTER.byId[id],
  ...stats
});

export const BASE_TOWER_GAMEPLAY = Object.freeze([
  profile('human-aa', {
    cost: 70, damage: 13, range: 260, attackIntervalMs: 650, projectileSpeed: 900,
    damageType: 'physical', targetRule: 'first',
    description: 'Precision rapid-fire anti-air tower.'
  }),
  profile('human-armor', {
    cost: 110, damage: 54, range: 220, attackIntervalMs: 1900, projectileSpeed: 560,
    damageType: 'physical', targetRule: 'highest-hp',
    description: 'Heavy burst cannon for armored targets.'
  }),
  profile('human-infantry', {
    cost: 95, damage: 22, range: 215, attackIntervalMs: 1100, projectileSpeed: 620,
    splashRadius: 80, damageType: 'physical', targetRule: 'cluster',
    description: 'Suppression fire with compact splash.'
  }),
  profile('insect-aa', {
    cost: 72, damage: 9, range: 245, attackIntervalMs: 800, projectileSpeed: 760,
    damageType: 'physical', targetRule: 'first', poisonDamagePerSecond: 5, poisonDurationMs: 2400,
    description: 'Poison-spitting anti-air pressure.'
  }),
  profile('insect-armor', {
    cost: 105, damage: 24, range: 210, attackIntervalMs: 1300, projectileSpeed: 610,
    damageType: 'physical', targetRule: 'highest-hp', armorShred: 14, armorShredDurationMs: 2600,
    description: 'Acid strikes that shred armor.'
  }),
  profile('insect-infantry', {
    cost: 88, damage: 14, range: 205, attackIntervalMs: 700, projectileSpeed: 680,
    splashRadius: 65, damageType: 'physical', targetRule: 'cluster',
    description: 'Fast swarm volleys with area pressure.'
  }),
  profile('alien-aa', {
    cost: 92, damage: 16, range: 255, attackIntervalMs: 850, projectileSpeed: 1100,
    chainTargets: 3, chainFalloff: 0.65, damageType: 'arcane', targetRule: 'first',
    description: 'Chain beam that jumps between nearby targets.'
  }),
  profile('alien-armor', {
    cost: 118, damage: 42, range: 235, attackIntervalMs: 1500, projectileSpeed: 1200,
    damageType: 'piercing', targetRule: 'highest-hp',
    description: 'Focused penetration beam for hard targets.'
  }),
  profile('alien-infantry', {
    cost: 102, damage: 26, range: 220, attackIntervalMs: 1250, projectileSpeed: 820,
    splashRadius: 88, damageType: 'arcane', targetRule: 'cluster',
    description: 'Plasma burst with wide area damage.'
  }),
  profile('slow', {
    cost: 82, damage: 4, range: 253, attackIntervalMs: 1100, projectileSpeed: 650,
    slowPercent: 25, slowDurationMs: 1800, damageType: 'frost', targetRule: 'lane-control',
    description: 'Low damage control tower that slows enemies.'
  }),
  profile('debuff', {
    cost: 86, damage: 3, range: 247.25, attackIntervalMs: 1200, projectileSpeed: 700,
    vulnerabilityPercent: 18, vulnerabilityDurationMs: 2200, damageType: 'arcane', targetRule: 'highest-hp',
    description: 'Marks enemies to take increased damage.'
  }),
  profile('buff', {
    cost: 90, damage: 1, range: 207, attackIntervalMs: 1500, projectileSpeed: 620,
    buffRadius: 241.5, buffDamageMultiplier: 1.12, buffAttackSpeedMultiplier: 1.1,
    damageType: 'physical', targetRule: 'first',
    description: 'Support relay that boosts nearby towers.'
  })
]);

export const BASE_TOWER_GAMEPLAY_BY_ID = Object.freeze(
  Object.fromEntries(BASE_TOWER_GAMEPLAY.map((tower) => [tower.id, tower]))
);

export function getBaseTowerGameplay(towerId) {
  return BASE_TOWER_GAMEPLAY_BY_ID[towerId] ?? null;
}

export function getBaseTowerGameplayFixtures() {
  return Object.freeze({
    towerCount: BASE_TOWER_GAMEPLAY.length,
    offensiveCount: BASE_TOWER_GAMEPLAY.filter((tower) => tower.faction !== 'neutral').length,
    slowWorks: BASE_TOWER_GAMEPLAY_BY_ID.slow.slowPercent > 0,
    debuffWorks: BASE_TOWER_GAMEPLAY_BY_ID.debuff.vulnerabilityPercent > 0,
    buffWorks: BASE_TOWER_GAMEPLAY_BY_ID.buff.buffDamageMultiplier > 1,
    utilityBelowBurst:
      BASE_TOWER_GAMEPLAY_BY_ID.slow.damage < BASE_TOWER_GAMEPLAY_BY_ID['human-armor'].damage &&
      BASE_TOWER_GAMEPLAY_BY_ID.debuff.damage < BASE_TOWER_GAMEPLAY_BY_ID['human-armor'].damage &&
      BASE_TOWER_GAMEPLAY_BY_ID.buff.damage < BASE_TOWER_GAMEPLAY_BY_ID['human-armor'].damage
  });
}
