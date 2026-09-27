export const WORLD_MODIFIER_SYSTEM = Object.freeze({
  version: 2,
  minWave: 21,
  cadence: 5,
  maxActiveModifiers: 1,
  definitions: Object.freeze([
    Object.freeze({
      id: 'pressure-front',
      name: 'Pressure Front',
      description: 'Global siege pressure modifier.',
      tags: Object.freeze(['threat']),
      effects: Object.freeze({ threatMultiplier: 1.18, eliteChanceMultiplier: 1.25 })
    }),
    Object.freeze({
      id: 'scarcity',
      name: 'Scarcity',
      description: 'Global economy pressure modifier.',
      tags: Object.freeze(['economy']),
      effects: Object.freeze({ waveGoldMultiplier: 0.78, rerollCostMultiplier: 1.25 })
    }),
    Object.freeze({
      id: 'unstable-ground',
      name: 'Unstable Ground',
      description: 'Global battlefield control modifier.',
      tags: Object.freeze(['control']),
      effects: Object.freeze({ enemyMoveSpeedMultiplier: 1.12, spawnIntervalMultiplier: 0.9 })
    })
  ])
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

function hashSeed(seed) {
  const value = String(seed ?? 'world-modifier-seed');
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function isWorldModifierWave(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  return wave >= WORLD_MODIFIER_SYSTEM.minWave &&
    (wave - WORLD_MODIFIER_SYSTEM.minWave) % WORLD_MODIFIER_SYSTEM.cadence === 0;
}

export function getWorldModifierForWave(seed, waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  if (!isWorldModifierWave(wave)) return null;

  const index = hashSeed(`${seed}:${wave}:world-modifier`) % WORLD_MODIFIER_SYSTEM.definitions.length;
  const definition = WORLD_MODIFIER_SYSTEM.definitions[index];

  return Object.freeze({
    ...definition,
    waveNumber: wave
  });
}

export function getActiveWorldModifiers(seed, waveNumber) {
  const modifier = getWorldModifierForWave(seed, waveNumber);
  return Object.freeze(modifier ? [modifier] : []);
}

export function getWorldModifierEffects(modifiers = []) {
  const effects = {
    threatMultiplier: 1,
    eliteChanceMultiplier: 1,
    waveGoldMultiplier: 1,
    rerollCostMultiplier: 1,
    enemyMoveSpeedMultiplier: 1,
    spawnIntervalMultiplier: 1
  };

  for (const modifier of modifiers) {
    const source = modifier?.effects ?? {};
    if (source.threatMultiplier) effects.threatMultiplier *= source.threatMultiplier;
    if (source.eliteChanceMultiplier) effects.eliteChanceMultiplier *= source.eliteChanceMultiplier;
    if (source.waveGoldMultiplier) effects.waveGoldMultiplier *= source.waveGoldMultiplier;
    if (source.rerollCostMultiplier) effects.rerollCostMultiplier *= source.rerollCostMultiplier;
    if (source.enemyMoveSpeedMultiplier) effects.enemyMoveSpeedMultiplier *= source.enemyMoveSpeedMultiplier;
    if (source.spawnIntervalMultiplier) effects.spawnIntervalMultiplier *= source.spawnIntervalMultiplier;
  }

  return Object.freeze(effects);
}

export function getWorldModifierFoundationFixtures() {
  const before = getActiveWorldModifiers('fixture', 20);
  const first = getActiveWorldModifiers('fixture', 21);
  const between = getActiveWorldModifiers('fixture', 22);
  const next = getActiveWorldModifiers('fixture', 26);
  const repeat = getActiveWorldModifiers('fixture', 21);

  return Object.freeze({
    inactiveBeforeMinWave: before.length === 0,
    activeAtMinWave: first.length === 1,
    inactiveBetweenCadence: between.length === 0,
    activeAtNextCadence: next.length === 1,
    maxActiveRespected: first.length <= WORLD_MODIFIER_SYSTEM.maxActiveModifiers,
    deterministicSelection:
      first[0]?.id === repeat[0]?.id &&
      first[0]?.waveNumber === repeat[0]?.waveNumber,
    definitionsHaveLiveEffects: WORLD_MODIFIER_SYSTEM.definitions.every(
      (entry) => Object.keys(entry.effects ?? {}).length >= 1
    ),
    pressureRaisesThreat: getWorldModifierEffects([WORLD_MODIFIER_SYSTEM.definitions[0]]).threatMultiplier > 1,
    scarcityCutsGold: getWorldModifierEffects([WORLD_MODIFIER_SYSTEM.definitions[1]]).waveGoldMultiplier < 1,
    unstableGroundAcceleratesPressure: getWorldModifierEffects([WORLD_MODIFIER_SYSTEM.definitions[2]]).enemyMoveSpeedMultiplier > 1
  });
}
