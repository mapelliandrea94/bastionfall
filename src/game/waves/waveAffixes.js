function hashSeed(seed) {
  const value = String(seed ?? 'wave-affix');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const WAVE_AFFIXES = Object.freeze([
  Object.freeze({
    id: 'fortified',
    name: 'FORTIFIED',
    description: 'Enemies gain 20% more HP.',
    minWave: 6,
    hpMultiplier: 1.2,
    moveSpeedMultiplier: 1,
    armorBonus: 0,
    shieldMultiplier: 1,
    shieldBonus: 0,
    spawnIntervalMultiplier: 1
  }),
  Object.freeze({
    id: 'frenzied',
    name: 'FRENZIED',
    description: 'Enemies move 18% faster.',
    minWave: 6,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1.18,
    armorBonus: 0,
    shieldMultiplier: 1,
    shieldBonus: 0,
    spawnIntervalMultiplier: 1
  }),
  Object.freeze({
    id: 'iron-skin',
    name: 'IRON SKIN',
    description: 'Enemies gain +12 armor.',
    minWave: 8,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1,
    armorBonus: 12,
    shieldMultiplier: 1,
    shieldBonus: 0,
    spawnIntervalMultiplier: 1
  }),
  Object.freeze({
    id: 'overcharged',
    name: 'OVERCHARGED',
    description: 'Enemies gain extra shields.',
    minWave: 10,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1,
    armorBonus: 0,
    shieldMultiplier: 1.25,
    shieldBonus: 35,
    spawnIntervalMultiplier: 1
  }),
  Object.freeze({
    id: 'swarming',
    name: 'SWARMING',
    description: 'Enemies spawn 22% faster.',
    minWave: 8,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1,
    armorBonus: 0,
    shieldMultiplier: 1,
    shieldBonus: 0,
    spawnIntervalMultiplier: 0.78
  })
]);

export function getWaveAffix(seed, waveNumber, { bossWave = false } = {}) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  if (bossWave || wave < 6) return null;

  const roll = hashSeed(`${seed}:affix-roll:${wave}`) % 100;
  if (roll >= 42) return null;

  const eligible = WAVE_AFFIXES.filter((affix) => wave >= affix.minWave);
  if (!eligible.length) return null;
  return eligible[hashSeed(`${seed}:affix-pick:${wave}`) % eligible.length];
}

export function applyWaveAffix(enemy, affix) {
  if (!enemy || !affix) return enemy;

  const maxHp = Math.max(1, Math.round(Number(enemy.maxHp ?? enemy.hp ?? 1) * affix.hpMultiplier));
  const hpRatio = Number(enemy.maxHp ?? 0) > 0
    ? Number(enemy.hp ?? enemy.maxHp) / Number(enemy.maxHp)
    : 1;
  const hp = Math.max(1, Math.round(maxHp * Math.max(0, Math.min(1, hpRatio))));
  const baseMaxShield = Math.max(0, Number(enemy.maxShield ?? enemy.shield ?? 0));
  const maxShield = Math.max(0, Math.round(baseMaxShield * affix.shieldMultiplier + affix.shieldBonus));
  const shieldRatio = baseMaxShield > 0
    ? Number(enemy.shield ?? baseMaxShield) / baseMaxShield
    : 1;
  const shield = Math.max(0, Math.round(maxShield * Math.max(0, Math.min(1, shieldRatio))));

  return Object.freeze({
    ...enemy,
    hp,
    maxHp,
    moveSpeed: Number((Number(enemy.moveSpeed ?? 1) * affix.moveSpeedMultiplier).toFixed(4)),
    armor: Math.max(0, Number(enemy.armor ?? 0) + affix.armorBonus),
    shield,
    maxShield,
    waveAffixId: affix.id
  });
}

export function getWaveAffixFixtures() {
  const sample = Object.freeze({ hp: 100, maxHp: 100, moveSpeed: 1, armor: 10, shield: 20, maxShield: 20 });
  const fortified = applyWaveAffix(sample, WAVE_AFFIXES.find((entry) => entry.id === 'fortified'));
  const frenzied = applyWaveAffix(sample, WAVE_AFFIXES.find((entry) => entry.id === 'frenzied'));
  const shielded = applyWaveAffix(sample, WAVE_AFFIXES.find((entry) => entry.id === 'overcharged'));
  const deterministicA = getWaveAffix('fixture', 12);
  const deterministicB = getWaveAffix('fixture', 12);

  return Object.freeze({
    fortifiedHp: fortified.maxHp === 120,
    frenziedSpeed: frenzied.moveSpeed === 1.18,
    overchargedShield: shielded.maxShield > sample.maxShield,
    deterministic: deterministicA?.id === deterministicB?.id,
    bossBlocked: getWaveAffix('fixture', 20, { bossWave: true }) === null
  });
}
