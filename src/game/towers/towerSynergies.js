export const TOWER_SYNERGIES = Object.freeze({
  human: Object.freeze({
    faction: 'human',
    threshold: 3,
    name: 'Targeting Grid',
    description: '3+ Human towers: +12% damage.'
  }),
  insect: Object.freeze({
    faction: 'insect',
    threshold: 3,
    name: 'Brood Network',
    description: '3+ Insect towers: +12% attack speed and +20% poison pressure.'
  }),
  alien: Object.freeze({
    faction: 'alien',
    threshold: 3,
    name: 'Resonance Matrix',
    description: '3+ Alien towers: +8% range and +1 chain target.'
  }),
  neutral: Object.freeze({
    faction: 'neutral',
    threshold: 2,
    name: 'Support Lattice',
    description: '2+ Neutral towers: +20% slow, vulnerability and support effects.'
  })
});

const SYNERGY_ORDER = Object.freeze(['human', 'insect', 'alien', 'neutral']);
export function getTowerSynergyState(placedDefenses = [], definitions = {}) {
  const counts = Object.fromEntries(SYNERGY_ORDER.map((faction) => [faction, 0]));

  for (const placed of placedDefenses) {
    const faction = definitions[placed?.defenseId]?.faction;
    if (Object.prototype.hasOwnProperty.call(counts, faction)) counts[faction] += 1;
  }

  const active = Object.fromEntries(
    SYNERGY_ORDER.map((faction) => {
      const synergy = TOWER_SYNERGIES[faction];
      return [faction, counts[faction] >= synergy.threshold];
    })
  );

  return Object.freeze({
    counts: Object.freeze(counts),
    active: Object.freeze(active),
    entries: Object.freeze(SYNERGY_ORDER.map((faction) => Object.freeze({
      ...TOWER_SYNERGIES[faction],
      count: counts[faction],
      active: active[faction]
    })))
  });
}
export function applyTowerSynergy(definition, synergyState) {
  if (!definition) return definition;
  const faction = definition.faction;
  if (!synergyState?.active?.[faction]) return definition;

  if (faction === 'human') {
    return Object.freeze({ ...definition, damage: Number((Number(definition.damage ?? 0) * 1.12).toFixed(2)) });
  }

  if (faction === 'insect') {
    return Object.freeze({
      ...definition,
      attackIntervalMs: Math.max(120, Math.round(Number(definition.attackIntervalMs ?? 1000) / 1.12)),
      poisonDamagePerSecond: definition.poisonDamagePerSecond
        ? Number((definition.poisonDamagePerSecond * 1.2).toFixed(2))
        : definition.poisonDamagePerSecond
    });
  }

  if (faction === 'alien') {
    return Object.freeze({
      ...definition,
      range: Number((Number(definition.range ?? 0) * 1.08).toFixed(2)),
      chainTargets: Math.max(2, Number(definition.chainTargets ?? 1) + 1)
    });
  }
  if (faction === 'neutral') {
    return Object.freeze({
      ...definition,
      slowPercent: definition.slowPercent ? Number((definition.slowPercent * 1.2).toFixed(2)) : definition.slowPercent,
      vulnerabilityPercent: definition.vulnerabilityPercent ? Number((definition.vulnerabilityPercent * 1.2).toFixed(2)) : definition.vulnerabilityPercent,
      buffDamageMultiplier: definition.buffDamageMultiplier
        ? Number((1 + (definition.buffDamageMultiplier - 1) * 1.2).toFixed(3))
        : definition.buffDamageMultiplier,
      buffAttackSpeedMultiplier: definition.buffAttackSpeedMultiplier
        ? Number((1 + (definition.buffAttackSpeedMultiplier - 1) * 1.2).toFixed(3))
        : definition.buffAttackSpeedMultiplier
    });
  }

  return definition;
}

export function getTowerSynergyFixtures() {
  const definitions = {
    a: { faction: 'human' },
    b: { faction: 'human' },
    c: { faction: 'human' },
    n1: { faction: 'neutral' },
    n2: { faction: 'neutral' }
  };
  const state = getTowerSynergyState([
    { defenseId: 'a' }, { defenseId: 'b' }, { defenseId: 'c' },
    { defenseId: 'n1' }, { defenseId: 'n2' }
  ], definitions);

  return Object.freeze({
    humanActivatesAtThree: state.active.human === true,
    neutralActivatesAtTwo: state.active.neutral === true,
    insectInactiveWithoutThree: state.active.insect === false
  });
}
