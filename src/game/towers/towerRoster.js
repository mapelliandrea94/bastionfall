export const TOWER_FACTIONS = Object.freeze({
  HUMAN: 'human',
  INSECT: 'insect',
  ALIEN: 'alien',
  NEUTRAL: 'neutral'
});

export const TOWER_COUNTER_TYPES = Object.freeze({
  AIR: 'air',
  ARMORED: 'armored',
  INFANTRY: 'infantry',
  SUPPORT: 'support'
});

const makeTower = ({ id, name, faction, counterType, role }) => Object.freeze({
  id,
  name,
  faction,
  counterType,
  role,
  neutral: faction === TOWER_FACTIONS.NEUTRAL,
  level: 1,
  maxLevel: 4,
  evolution: null,
  evolutionChoice: null,
  copyProgress: 1,
  copyTarget: 7
});

export const FINAL_TOWER_ROSTER = Object.freeze([
  makeTower({ id: 'human-aa', name: 'Human Anti-Air', faction: TOWER_FACTIONS.HUMAN, counterType: TOWER_COUNTER_TYPES.AIR, role: 'anti-air' }),
  makeTower({ id: 'human-armor', name: 'Human Anti-Armor', faction: TOWER_FACTIONS.HUMAN, counterType: TOWER_COUNTER_TYPES.ARMORED, role: 'anti-armor' }),
  makeTower({ id: 'human-infantry', name: 'Human Anti-Infantry', faction: TOWER_FACTIONS.HUMAN, counterType: TOWER_COUNTER_TYPES.INFANTRY, role: 'anti-infantry' }),

  makeTower({ id: 'insect-aa', name: 'Insect Anti-Air', faction: TOWER_FACTIONS.INSECT, counterType: TOWER_COUNTER_TYPES.AIR, role: 'anti-air' }),
  makeTower({ id: 'insect-armor', name: 'Insect Anti-Armor', faction: TOWER_FACTIONS.INSECT, counterType: TOWER_COUNTER_TYPES.ARMORED, role: 'anti-armor' }),
  makeTower({ id: 'insect-infantry', name: 'Insect Anti-Infantry', faction: TOWER_FACTIONS.INSECT, counterType: TOWER_COUNTER_TYPES.INFANTRY, role: 'anti-infantry' }),

  makeTower({ id: 'alien-aa', name: 'Alien Anti-Air', faction: TOWER_FACTIONS.ALIEN, counterType: TOWER_COUNTER_TYPES.AIR, role: 'anti-air' }),
  makeTower({ id: 'alien-armor', name: 'Alien Anti-Armor', faction: TOWER_FACTIONS.ALIEN, counterType: TOWER_COUNTER_TYPES.ARMORED, role: 'anti-armor' }),
  makeTower({ id: 'alien-infantry', name: 'Alien Anti-Infantry', faction: TOWER_FACTIONS.ALIEN, counterType: TOWER_COUNTER_TYPES.INFANTRY, role: 'anti-infantry' }),

  makeTower({ id: 'slow', name: 'Slow Tower', faction: TOWER_FACTIONS.NEUTRAL, counterType: TOWER_COUNTER_TYPES.SUPPORT, role: 'slow' }),
  makeTower({ id: 'debuff', name: 'Debuff Tower', faction: TOWER_FACTIONS.NEUTRAL, counterType: TOWER_COUNTER_TYPES.SUPPORT, role: 'debuff' }),
  makeTower({ id: 'buff', name: 'Buff Tower', faction: TOWER_FACTIONS.NEUTRAL, counterType: TOWER_COUNTER_TYPES.SUPPORT, role: 'buff' })
]);

export const TOWER_ROSTER = Object.freeze({
  version: 1,
  towers: FINAL_TOWER_ROSTER,
  byId: Object.freeze(Object.fromEntries(FINAL_TOWER_ROSTER.map((tower) => [tower.id, tower])))
});

const LEGACY_TOWER_ALIASES = Object.freeze({
  archer: 'human-aa',
  cannon: 'human-armor',
  frost: 'slow',
  mage: 'alien-infantry',
  ballista: 'human-infantry',
  barracks: 'insect-infantry'
});

export function getTowerDefinition(towerId) {
  const id = LEGACY_TOWER_ALIASES[towerId] ?? towerId;
  return TOWER_ROSTER.byId[id] ?? null;
}

export function normalizeTowerSave(savedTower = {}) {
  const definition = getTowerDefinition(savedTower.defenseId ?? savedTower.towerId ?? savedTower.id);
  if (!definition) return Object.freeze({ ...savedTower });

  return Object.freeze({
    ...definition,
    ...savedTower,
    towerId: definition.id,
    defenseId: savedTower.defenseId ?? definition.id,
    faction: savedTower.faction ?? definition.faction,
    counterType: savedTower.counterType ?? definition.counterType,
    neutral: savedTower.neutral ?? definition.neutral,
    level: Math.max(1, Math.min(4, Number(savedTower.level ?? definition.level) || 1)),
    evolution: savedTower.evolution ?? null,
    copyProgress: Math.max(1, Math.min(7, Number(savedTower.copyProgress ?? definition.copyProgress) || 1))
  });
}

export function getTowerRosterFixtures() {
  const factions = Object.fromEntries(Object.values(TOWER_FACTIONS).map((faction) => [
    faction,
    FINAL_TOWER_ROSTER.filter((tower) => tower.faction === faction).length
  ]));
  const counters = Object.fromEntries(Object.values(TOWER_COUNTER_TYPES).map((counterType) => [
    counterType,
    FINAL_TOWER_ROSTER.filter((tower) => tower.counterType === counterType).length
  ]));

  return Object.freeze({
    towerCountExpected: 12,
    towerCountActual: FINAL_TOWER_ROSTER.length,
    humanCount: factions.human,
    insectCount: factions.insect,
    alienCount: factions.alien,
    neutralCount: factions.neutral,
    airCounterCount: counters.air,
    armoredCounterCount: counters.armored,
    infantryCounterCount: counters.infantry,
    supportCounterCount: counters.support,
    neutralFlagsValid: FINAL_TOWER_ROSTER.filter((tower) => tower.faction === TOWER_FACTIONS.NEUTRAL).every((tower) => tower.neutral === true),
    legacyArcherResolves: getTowerDefinition('archer')?.id === 'human-aa',
    legacySaveNormalizes: normalizeTowerSave({ defenseId: 'cannon' }).towerId === 'human-armor'
  });
}
