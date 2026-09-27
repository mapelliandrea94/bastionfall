export const ELITE_MODIFIER_SYSTEM = Object.freeze({
  version: 1,
  minWave: 15,
  baseEliteChance: 0.08,
  eliteChancePerFiveWaves: 0.02,
  maxEliteChance: 0.28,
  maxModifiersPerEnemy: 1,
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

  return Object.freeze({
    ...enemy,
    elite: true,
    eliteModifierIds: Object.freeze([])
  });
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
    foundationHasNoConcreteModifiers:
      attachEliteModifierFoundation(normal, { seed: 'same', waveNumber: 30, enemyIndex: 3 }).eliteModifierIds.length === 0
  });
}
