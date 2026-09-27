import { getCombinedCounterMultiplier } from '../combat/factionCounters.js';
import { createEnemyBaseState } from './enemyBase.js';

export const ENEMY_FACTIONS = Object.freeze({
  HUMAN: 'human',
  INSECT: 'insect',
  ALIEN: 'alien'
});

export const ENEMY_UNIT_TYPES = Object.freeze({
  INFANTRY: 'infantry',
  ARMORED: 'armored',
  AIR: 'air'
});

export const ENEMY_TIERS = Object.freeze({
  COMMON: 'common',
  ADVANCED: 'advanced',
  ELITE: 'elite',
  BOSS: 'boss'
});

const VISUAL_SHEET_ID = 'bastionfall-enemies-24';

function defineEnemy({
  id,
  name,
  faction,
  unitType,
  tier = ENEMY_TIERS.COMMON,
  spawnCost,
  minWave,
  traits = [],
  maxHp,
  moveSpeed,
  armor = 0,
  shield = 0,
  goldReward,
  bastionDamage = 1,
  visualIndex
}) {
  return Object.freeze({
    id,
    name,
    faction,
    unitType,
    tier,
    archetype: id,
    spawnCost,
    threatValue: spawnCost,
    minWave,
    traits: Object.freeze([...traits]),
    maxHp,
    moveSpeed,
    armor,
    shield,
    goldReward,
    bastionDamage,
    airborne: unitType === ENEMY_UNIT_TYPES.AIR,
    visualAsset: Object.freeze({
      sheetId: VISUAL_SHEET_ID,
      index: visualIndex,
      faction,
      sourceRole: 'attached-24-enemy-artwork'
    })
  });
}

export const ENEMY_ROSTER_24 = Object.freeze([
  // Human — 8
  defineEnemy({ id: 'footman', name: 'Footman', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.INFANTRY, spawnCost: 1, minWave: 1, traits: ['balanced'], maxHp: 100, moveSpeed: 1, goldReward: 1, visualIndex: 0 }),
  defineEnemy({ id: 'ranger', name: 'Ranger', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.INFANTRY, spawnCost: 1.1, minWave: 2, traits: ['fast', 'fragile'], maxHp: 72, moveSpeed: 1.42, goldReward: 1, visualIndex: 1 }),
  defineEnemy({ id: 'vanguard', name: 'Vanguard', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.INFANTRY, tier: ENEMY_TIERS.ADVANCED, spawnCost: 2.2, minWave: 5, traits: ['spawn-shield'], maxHp: 128, moveSpeed: 0.98, shield: 58, goldReward: 2, visualIndex: 2 }),
  defineEnemy({ id: 'ironclad', name: 'Ironclad', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 4, minWave: 6, traits: ['heavy-armor', 'slow'], maxHp: 205, moveSpeed: 0.78, armor: 36, goldReward: 3, bastionDamage: 2, visualIndex: 3 }),
  defineEnemy({ id: 'siegebreaker', name: 'Siegebreaker', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 5.4, minWave: 9, traits: ['high-hp', 'bastion-threat'], maxHp: 340, moveSpeed: 0.68, armor: 18, goldReward: 4, bastionDamage: 4, visualIndex: 4 }),
  defineEnemy({ id: 'bastion-ram', name: 'Bastion Ram', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ELITE, spawnCost: 8.5, minWave: 15, traits: ['reinforced', 'bastion-threat', 'elite'], maxHp: 520, moveSpeed: 0.62, armor: 28, goldReward: 6, bastionDamage: 6, visualIndex: 5 }),
  defineEnemy({ id: 'skyguard', name: 'Skyguard', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ADVANCED, spawnCost: 3.2, minWave: 15, traits: ['airborne'], maxHp: 132, moveSpeed: 1.22, goldReward: 3, visualIndex: 6 }),
  defineEnemy({ id: 'gryphon-knight', name: 'Gryphon Knight', faction: ENEMY_FACTIONS.HUMAN, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ELITE, spawnCost: 8, minWave: 18, traits: ['airborne', 'fast', 'durable', 'elite'], maxHp: 285, moveSpeed: 1.35, armor: 12, goldReward: 6, bastionDamage: 3, visualIndex: 7 }),

  // Insect — 8
  defineEnemy({ id: 'skitterling', name: 'Skitterling', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.INFANTRY, spawnCost: 0.8, minWave: 1, traits: ['swarm', 'very-fast'], maxHp: 58, moveSpeed: 1.62, goldReward: 1, visualIndex: 8 }),
  defineEnemy({ id: 'ravager', name: 'Ravager', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.INFANTRY, spawnCost: 1.5, minWave: 3, traits: ['wounded-haste'], maxHp: 104, moveSpeed: 1.18, goldReward: 1, visualIndex: 9 }),
  defineEnemy({ id: 'broodling', name: 'Broodling', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.INFANTRY, tier: ENEMY_TIERS.ADVANCED, spawnCost: 2.3, minWave: 5, traits: ['death-brood'], maxHp: 120, moveSpeed: 1.08, goldReward: 2, visualIndex: 10 }),
  defineEnemy({ id: 'carapace-beast', name: 'Carapace Beast', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 4.2, minWave: 6, traits: ['natural-armor'], maxHp: 230, moveSpeed: 0.82, armor: 32, goldReward: 3, bastionDamage: 2, visualIndex: 11 }),
  defineEnemy({ id: 'burrower', name: 'Burrower', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 4.8, minWave: 10, traits: ['burrow-emerge'], maxHp: 250, moveSpeed: 0.92, armor: 22, goldReward: 4, bastionDamage: 2, visualIndex: 12 }),
  defineEnemy({ id: 'hive-guard', name: 'Hive Guard', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ELITE, spawnCost: 8.2, minWave: 15, traits: ['heavy-carapace', 'elite'], maxHp: 470, moveSpeed: 0.7, armor: 38, goldReward: 6, bastionDamage: 4, visualIndex: 13 }),
  defineEnemy({ id: 'stinger', name: 'Stinger', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ADVANCED, spawnCost: 2.8, minWave: 15, traits: ['airborne', 'fast'], maxHp: 92, moveSpeed: 1.55, goldReward: 2, visualIndex: 14 }),
  defineEnemy({ id: 'broodwing', name: 'Broodwing', faction: ENEMY_FACTIONS.INSECT, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ELITE, spawnCost: 8.4, minWave: 18, traits: ['airborne', 'brood-pressure', 'elite'], maxHp: 300, moveSpeed: 1.18, goldReward: 6, bastionDamage: 3, visualIndex: 15 }),

  // Alien — 8
  defineEnemy({ id: 'voidling', name: 'Voidling', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.INFANTRY, spawnCost: 1.1, minWave: 1, traits: ['balanced'], maxHp: 108, moveSpeed: 1.02, goldReward: 1, visualIndex: 16 }),
  defineEnemy({ id: 'phasewalker', name: 'Phasewalker', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.INFANTRY, tier: ENEMY_TIERS.ADVANCED, spawnCost: 2.1, minWave: 5, traits: ['phase-dash'], maxHp: 112, moveSpeed: 1.16, goldReward: 2, visualIndex: 17 }),
  defineEnemy({ id: 'assimilator', name: 'Assimilator', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.INFANTRY, tier: ENEMY_TIERS.ADVANCED, spawnCost: 2.8, minWave: 8, traits: ['adaptive-resistance'], maxHp: 158, moveSpeed: 0.98, armor: 8, goldReward: 2, visualIndex: 18 }),
  defineEnemy({ id: 'null-guardian', name: 'Null Guardian', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 4.5, minWave: 6, traits: ['energy-shield'], maxHp: 170, moveSpeed: 0.84, armor: 10, shield: 150, goldReward: 4, bastionDamage: 2, visualIndex: 19 }),
  defineEnemy({ id: 'obliterator', name: 'Obliterator', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ADVANCED, spawnCost: 5.8, minWave: 11, traits: ['siege', 'slow'], maxHp: 365, moveSpeed: 0.66, armor: 20, goldReward: 5, bastionDamage: 5, visualIndex: 20 }),
  defineEnemy({ id: 'rift-juggernaut', name: 'Rift Juggernaut', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.ARMORED, tier: ENEMY_TIERS.ELITE, spawnCost: 9, minWave: 15, traits: ['crystalline-armor', 'void-core', 'elite'], maxHp: 510, moveSpeed: 0.68, armor: 34, shield: 60, goldReward: 7, bastionDamage: 4, visualIndex: 21 }),
  defineEnemy({ id: 'watcher', name: 'Watcher', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ADVANCED, spawnCost: 3, minWave: 15, traits: ['airborne', 'hover'], maxHp: 112, moveSpeed: 1.38, shield: 34, goldReward: 3, visualIndex: 22 }),
  defineEnemy({ id: 'overmind', name: 'Overmind', faction: ENEMY_FACTIONS.ALIEN, unitType: ENEMY_UNIT_TYPES.AIR, tier: ENEMY_TIERS.ELITE, spawnCost: 9.2, minWave: 18, traits: ['airborne', 'commander', 'elite'], maxHp: 320, moveSpeed: 1.08, shield: 135, goldReward: 7, bastionDamage: 4, visualIndex: 23 })
]);

export const ENEMY_ROSTER = Object.freeze({
  version: 1,
  visualSheetId: VISUAL_SHEET_ID,
  enemies: ENEMY_ROSTER_24,
  byId: Object.freeze(Object.fromEntries(ENEMY_ROSTER_24.map((enemy) => [enemy.id, enemy])))
});

export function getEnemyDefinition(enemyId) {
  return ENEMY_ROSTER.byId[String(enemyId ?? '')] ?? null;
}

export function createRosterEnemyState(enemyId, overrides = {}) {
  const definition = getEnemyDefinition(enemyId);
  if (!definition) return null;

  return createEnemyBaseState({
    ...definition,
    ...overrides,
    id: String(overrides.id ?? definition.id),
    archetype: definition.archetype,
    airborne: definition.airborne
  });
}

export function getEnemyRosterFixtures() {
  const byFaction = Object.fromEntries(
    Object.values(ENEMY_FACTIONS).map((faction) => [
      faction,
      ENEMY_ROSTER_24.filter((enemy) => enemy.faction === faction).length
    ])
  );
  const validUnitTypes = new Set(Object.values(ENEMY_UNIT_TYPES));
  const uniqueIds = new Set(ENEMY_ROSTER_24.map((enemy) => enemy.id));
  const visualIndexes = ENEMY_ROSTER_24.map((enemy) => enemy.visualAsset.index);
  const allSpawn = ENEMY_ROSTER_24.every((enemy) => createRosterEnemyState(enemy.id)?.archetype === enemy.id);

  const perfectHumanVsInsectInfantry = getCombinedCounterMultiplier(
    { faction: 'human', counterType: 'infantry' },
    { faction: 'insect', unitType: 'infantry' }
  );

  return Object.freeze({
    enemyCountExpected: 24,
    enemyCountActual: ENEMY_ROSTER_24.length,
    humanCountExpected: 8,
    humanCountActual: byFaction.human,
    insectCountExpected: 8,
    insectCountActual: byFaction.insect,
    alienCountExpected: 8,
    alienCountActual: byFaction.alien,
    uniqueIdsValid: uniqueIds.size === 24,
    unitTypesValid: ENEMY_ROSTER_24.every((enemy) => validUnitTypes.has(enemy.unitType)),
    spawnCostsValid: ENEMY_ROSTER_24.every((enemy) => Number(enemy.spawnCost) > 0),
    minWavesValid: ENEMY_ROSTER_24.every((enemy) => Number.isInteger(enemy.minWave) && enemy.minWave >= 1),
    visualMappingValid:
      new Set(visualIndexes).size === 24 &&
      Math.min(...visualIndexes) === 0 &&
      Math.max(...visualIndexes) === 23,
    allDefinitionsSpawnable: allSpawn,
    airFlagsValid: ENEMY_ROSTER_24.every((enemy) => enemy.airborne === (enemy.unitType === ENEMY_UNIT_TYPES.AIR)),
    perfectCounterExpected: 2.25,
    perfectCounterActual: perfectHumanVsInsectInfantry
  });
}
