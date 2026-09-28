function hashSeed(seed) {
  const value = String(seed ?? 'rare-wave-event');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const RARE_WAVE_EVENTS = Object.freeze([
  Object.freeze({
    id: 'treasure-surge',
    name: 'TREASURE SURGE',
    description: 'A richer but denser wave. Clear it for +3 bonus Gold.',
    minWave: 8,
    threatMultiplier: 1.22,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1,
    spawnIntervalMultiplier: 0.92,
    bonusGold: 3
  }),
  Object.freeze({
    id: 'blood-rush',
    name: 'BLOOD RUSH',
    description: 'Enemies move and spawn much faster. Clear it for +2 bonus Gold.',
    minWave: 10,
    threatMultiplier: 1.12,
    hpMultiplier: 1,
    moveSpeedMultiplier: 1.22,
    spawnIntervalMultiplier: 0.72,
    bonusGold: 2
  }),
  Object.freeze({
    id: 'juggernaut-march',
    name: 'JUGGERNAUT MARCH',
    description: 'A brutal high-HP siege. Clear it for +3 bonus Gold.',
    minWave: 12,
    threatMultiplier: 1.1,
    hpMultiplier: 1.38,
    moveSpeedMultiplier: 0.92,
    spawnIntervalMultiplier: 1.08,
    bonusGold: 3
  })
]);

export function getRareWaveEvent(seed, waveNumber, { bossWave = false } = {}) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  if (bossWave || wave < 8) return null;

  const roll = hashSeed(`${seed}:rare-event-roll:${wave}`) % 100;
  if (roll >= 16) return null;

  const eligible = RARE_WAVE_EVENTS.filter((event) => wave >= event.minWave);
  if (!eligible.length) return null;
  return eligible[hashSeed(`${seed}:rare-event-pick:${wave}`) % eligible.length];
}

export function applyRareWaveEvent(enemy, event) {
  if (!enemy || !event) return enemy;

  const maxHp = Math.max(1, Math.round(Number(enemy.maxHp ?? enemy.hp ?? 1) * event.hpMultiplier));
  const hpRatio = Number(enemy.maxHp ?? 0) > 0
    ? Number(enemy.hp ?? enemy.maxHp) / Number(enemy.maxHp)
    : 1;

  return Object.freeze({
    ...enemy,
    maxHp,
    hp: Math.max(1, Math.round(maxHp * Math.max(0, Math.min(1, hpRatio)))),
    moveSpeed: Number((Number(enemy.moveSpeed ?? 1) * event.moveSpeedMultiplier).toFixed(4)),
    rareWaveEventId: event.id
  });
}

export function getRareWaveEventFixtures() {
  const sample = Object.freeze({ hp: 100, maxHp: 100, moveSpeed: 1 });
  const juggernaut = applyRareWaveEvent(sample, RARE_WAVE_EVENTS.find((entry) => entry.id === 'juggernaut-march'));
  const rush = applyRareWaveEvent(sample, RARE_WAVE_EVENTS.find((entry) => entry.id === 'blood-rush'));
  const deterministicA = getRareWaveEvent('fixture', 18);
  const deterministicB = getRareWaveEvent('fixture', 18);

  return Object.freeze({
    juggernautHp: juggernaut.maxHp === 138,
    rushFaster: rush.moveSpeed === 1.22,
    deterministic: deterministicA?.id === deterministicB?.id,
    bossBlocked: getRareWaveEvent('fixture', 20, { bossWave: true }) === null,
    rewardsPositive: RARE_WAVE_EVENTS.every((event) => event.bonusGold > 0)
  });
}
