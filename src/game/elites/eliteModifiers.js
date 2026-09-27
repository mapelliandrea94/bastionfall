export const ELITE_MODIFIER_SYSTEM = Object.freeze({
  version: 1,
  minWave: 15,
  baseEliteChance: 0.08,
  eliteChancePerFiveWaves: 0.02,
  maxEliteChance: 0.28,
  maxModifiersPerEnemy: 1,
  modifiers: Object.freeze([
    Object.freeze({ id: 'brutal', name: 'Brutal', hpMultiplier: 1.35, bastionDamageMultiplier: 1.35, moveSpeedMultiplier: 0.95 }),
    Object.freeze({ id: 'swift', name: 'Swift', hpMultiplier: 0.95, bastionDamageMultiplier: 1, moveSpeedMultiplier: 1.3 }),
    Object.freeze({ id: 'fortified', name: 'Fortified', hpMultiplier: 1.2, bastionDamageMultiplier: 1, moveSpeedMultiplier: 0.9, armorBonus: 18 })
  ]),
  excludedArchetypes: Object.freeze([])
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

function hashSeed(seed) {
  const value = String(seed ?? 'elite-seed');
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getEliteChanceForWave(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  if (wave < ELITE_MODIFIER_SYSTEM.minWave) return 0;

  const steps = Math.floor((wave - ELITE_MODIFIER_SYSTEM.minWave) / 5);
  return Math.min(
    ELITE_MODIFIER_SYSTEM.maxEliteChance,
    ELITE_MODIFIER_SYSTEM.baseEliteChance + steps * ELITE_MODIFIER_SYSTEM.eliteChancePerFiveWaves
  );
}

export function isEnemyEligibleForElite(enemy) {
  if (!enemy) return false;
  if (enemy.isBoss === true) return false;
  if (ELITE_MODIFIER_SYSTEM.excludedArchetypes.includes(enemy.archetype)) return false;
  return true;
}

export function shouldAssignEliteModifier({ seed, waveNumber, enemyIndex, enemy }) {
  if (!isEnemyEligibleForElite(enemy)) return false;

  const chance = getEliteChanceForWave(waveNumber);
  if (chance <= 0) return false;

  const roll = (hashSeed(`${seed}:${waveNumber}:${enemyIndex}`) % 10000) / 10000;
  return roll < chance;
}

export function attachEliteModifierFoundation(enemy, context) {
  if (!shouldAssignEliteModifier({ ...context, enemy })) {
    return Object.freeze({
      ...enemy,
      elite: false,
      eliteModifierIds: Object.freeze([])
    });
  }

  const modifierIndex = hashSeed(`${context.seed}:${context.waveNumber}:${context.enemyIndex}:modifier`) % ELITE_MODIFIER_SYSTEM.modifiers.length;
  const modifier = ELITE_MODIFIER_SYSTEM.modifiers[modifierIndex];

  return Object.freeze({
    ...enemy,
    elite: true,
    eliteModifierIds: Object.freeze([modifier.id])
  });
}

export function applyEliteModifiers(enemy) {
  if (!enemy?.elite || !enemy.eliteModifierIds?.length) return Object.freeze({ ...enemy });

  let result = { ...enemy };
  for (const modifierId of enemy.eliteModifierIds) {
    const modifier = ELITE_MODIFIER_SYSTEM.modifiers.find((entry) => entry.id === modifierId);
    if (!modifier) continue;

    const maxHp = Math.max(1, Math.round(Number(result.maxHp ?? result.hp ?? 1) * (modifier.hpMultiplier ?? 1)));
    const hpRatio = Number(result.maxHp ?? result.hp ?? 1) > 0
      ? Number(result.hp ?? result.maxHp ?? 1) / Number(result.maxHp ?? result.hp ?? 1)
      : 1;

    result = {
      ...result,
      maxHp,
      hp: Math.max(1, Math.round(maxHp * hpRatio)),
      moveSpeed: Number((Number(result.moveSpeed ?? 1) * (modifier.moveSpeedMultiplier ?? 1)).toFixed(4)),
      armor: Math.max(0, Number(result.armor ?? 0) + Number(modifier.armorBonus ?? 0)),
      bastionDamage: Math.max(0, Number(result.bastionDamage ?? 1) * Number(modifier.bastionDamageMultiplier ?? 1))
    };
  }

  return Object.freeze(result);
}

export function getEliteModifierFoundationFixtures() {
  const normal = { id: 'normal', archetype: 'normal', isBoss: false };
  const boss = { id: 'boss', archetype: 'normal', isBoss: true };
  const below = attachEliteModifierFoundation(normal, { seed: 'fixture', waveNumber: 10, enemyIndex: 0 });
  const laterChance = getEliteChanceForWave(40);

  return Object.freeze({
    belowMinWaveNeverElite: below.elite === false,
    bossNeverElite: isEnemyEligibleForElite(boss) === false,
    normalEligible: isEnemyEligibleForElite(normal) === true,
    baseChanceExpected: 0.08,
    baseChanceActual: getEliteChanceForWave(15),
    chanceScales: laterChance > getEliteChanceForWave(15),
    chanceCapped: getEliteChanceForWave(999) === ELITE_MODIFIER_SYSTEM.maxEliteChance,
    deterministicAssignment:
      shouldAssignEliteModifier({ seed: 'same', waveNumber: 30, enemyIndex: 3, enemy: normal }) ===
      shouldAssignEliteModifier({ seed: 'same', waveNumber: 30, enemyIndex: 3, enemy: normal }),
    concreteModifierAssigned:
      attachEliteModifierFoundation(normal, { seed: 'same', waveNumber: 30, enemyIndex: 3 }).eliteModifierIds.length <= 1,
    modifierSetCountExpected: 3,
    modifierSetCountActual: ELITE_MODIFIER_SYSTEM.modifiers.length,
    brutalIncreasesHp: applyEliteModifiers({ elite: true, eliteModifierIds: ['brutal'], maxHp: 100, hp: 100, moveSpeed: 1, bastionDamage: 1, armor: 0 }).maxHp === 135,
    swiftIncreasesSpeed: applyEliteModifiers({ elite: true, eliteModifierIds: ['swift'], maxHp: 100, hp: 100, moveSpeed: 1, bastionDamage: 1, armor: 0 }).moveSpeed === 1.3,
    fortifiedAddsArmor: applyEliteModifiers({ elite: true, eliteModifierIds: ['fortified'], maxHp: 100, hp: 100, moveSpeed: 1, bastionDamage: 1, armor: 0 }).armor === 18
  });
}
