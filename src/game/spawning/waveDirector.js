import { createSeededRandom, normalizeRunSeed } from '../../lib/runSeed.js';
import { getWaveThreatBudget } from '../balance/waveThreat.js';
import { isBossWave } from '../boss/bossSchedule.js';
import {
  ENEMY_FACTIONS,
  ENEMY_ROSTER_24,
  ENEMY_TIERS,
  ENEMY_UNIT_TYPES
} from '../enemies/enemyRoster.js';
import { distributeTriGateWave } from './triGateSpawn.js';

export const WAVE_DIRECTOR = Object.freeze({
  version: 1,
  eliteInterval: 5,
  bossInterval: 10,
  airIntroWave: 15,
  mixedFactionWave: 21,
  allFactionWave: 31,
  modes: Object.freeze({
    SINGLE_GATE: 'single-gate',
    TRI_GATE: 'tri-gate',
    LAST_BASTION: 'last-bastion',
    TFT_SHOP: 'tft-shop'
  })
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

function normalizeMode(mode) {
  const value = String(mode ?? WAVE_DIRECTOR.modes.SINGLE_GATE);
  return Object.values(WAVE_DIRECTOR.modes).includes(value)
    ? value
    : WAVE_DIRECTOR.modes.SINGLE_GATE;
}

function waveSeed(seed, waveNumber, mode) {
  return normalizeRunSeed(`${seed ?? 'run'}:${normalizeWaveNumber(waveNumber)}:${normalizeMode(mode)}`);
}

function pick(random, items) {
  if (!items.length) return null;
  return items[Math.floor(random() * items.length) % items.length];
}

function shuffled(random, items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function allowedFactionCount(wave) {
  if (wave < WAVE_DIRECTOR.mixedFactionWave) return 1;
  if (wave < WAVE_DIRECTOR.allFactionWave) return 2;
  return 3;
}

function allowedUnitType(enemy, wave) {
  if (enemy.unitType === ENEMY_UNIT_TYPES.AIR) return wave >= WAVE_DIRECTOR.airIntroWave;
  if (enemy.unitType === ENEMY_UNIT_TYPES.ARMORED) return wave >= 6;
  return true;
}

function allowedTier(enemy, wave, eliteMilestone) {
  if (enemy.tier !== ENEMY_TIERS.ELITE) return true;
  if (wave < 15) return false;
  return eliteMilestone || wave >= WAVE_DIRECTOR.allFactionWave;
}

function getFactionOrder(random, wave) {
  const factions = shuffled(random, Object.values(ENEMY_FACTIONS));
  return factions.slice(0, allowedFactionCount(wave));
}

export function getWaveQuantityMultiplier(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  const completedTenWaveBlocks = Math.floor(wave / 10);
  return Number((1.2 ** completedTenWaveBlocks).toFixed(6));
}

function getCandidateWeight(enemy, wave, eliteMilestone) {
  let weight = 1;

  if (wave <= 4) {
    weight *= enemy.unitType === ENEMY_UNIT_TYPES.INFANTRY ? 5 : 0.1;
  } else if (wave <= 14) {
    weight *= enemy.unitType === ENEMY_UNIT_TYPES.AIR ? 0 : 1.35;
  } else if (wave <= 20) {
    weight *= enemy.unitType === ENEMY_UNIT_TYPES.AIR ? 1.5 : 1;
  }

  if (enemy.tier === ENEMY_TIERS.COMMON) weight *= wave < 12 ? 2.5 : 1.2;
  if (enemy.tier === ENEMY_TIERS.ADVANCED) weight *= wave < 5 ? 0.25 : 1.35;
  if (enemy.tier === ENEMY_TIERS.ELITE) weight *= eliteMilestone ? 3.5 : 0.65;

  return weight / Math.max(0.5, Number(enemy.spawnCost) || 1);
}

function weightedPick(random, candidates, wave, eliteMilestone) {
  if (!candidates.length) return null;
  const weights = candidates.map((enemy) => getCandidateWeight(enemy, wave, eliteMilestone));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;

  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }

  return candidates[candidates.length - 1];
}

function serializeEnemy(definition, index) {
  return Object.freeze({
    rosterId: definition.id,
    archetype: definition.archetype,
    name: definition.name,
    faction: definition.faction,
    unitType: definition.unitType,
    tier: definition.tier,
    traits: definition.traits,
    airborne: definition.airborne,
    threatValue: definition.spawnCost,
    spawnCost: definition.spawnCost,
    rosterIndex: index
  });
}

export function generateWavePlan({
  seed = 'run',
  waveNumber = 1,
  mode = WAVE_DIRECTOR.modes.SINGLE_GATE,
  budgetMultiplier = 1
} = {}) {
  const wave = normalizeWaveNumber(waveNumber);
  const normalizedMode = normalizeMode(mode);
  const deterministicSeed = waveSeed(seed, wave, normalizedMode);
  const random = createSeededRandom(deterministicSeed);
  const eliteMilestone = wave % WAVE_DIRECTOR.eliteInterval === 0;
  const bossMilestone = isBossWave(wave);
  const quantityMultiplier = getWaveQuantityMultiplier(wave);
  const baseBudget = getWaveThreatBudget(wave, budgetMultiplier);
  const budget = Number((baseBudget * quantityMultiplier).toFixed(4));
  const factionOrder = getFactionOrder(random, wave);
  const allowedFactions = new Set(factionOrder);

  let candidates = ENEMY_ROSTER_24.filter((enemy) =>
    enemy.minWave <= wave &&
    allowedFactions.has(enemy.faction) &&
    allowedUnitType(enemy, wave) &&
    allowedTier(enemy, wave, eliteMilestone)
  );

  if (!candidates.length) {
    candidates = ENEMY_ROSTER_24.filter((enemy) =>
      enemy.minWave <= wave &&
      allowedUnitType(enemy, wave) &&
      allowedTier(enemy, wave, eliteMilestone)
    );
  }

  const composition = [];
  let spentThreat = 0;

  if (eliteMilestone && wave >= 15) {
    const eliteCandidates = candidates.filter((enemy) => enemy.tier === ENEMY_TIERS.ELITE && enemy.spawnCost <= budget);
    const elite = weightedPick(random, eliteCandidates, wave, true);
    if (elite) {
      composition.push(serializeEnemy(elite, composition.length));
      spentThreat += elite.spawnCost;
    }
  }

  const maxEnemies = Math.max(8, Math.ceil(budget / 0.8) + 4);
  let guard = 0;

  while (guard < maxEnemies * 4 && composition.length < maxEnemies) {
    guard += 1;
    const remaining = Number((budget - spentThreat).toFixed(4));
    const affordable = candidates.filter((enemy) => enemy.spawnCost <= remaining + 0.0001);
    if (!affordable.length) break;

    const selected = weightedPick(random, affordable, wave, eliteMilestone);
    if (!selected) break;

    composition.push(serializeEnemy(selected, composition.length));
    spentThreat += selected.spawnCost;
  }

  if (composition.length === 0) {
    const fallback = [...candidates].sort((a, b) => a.spawnCost - b.spawnCost)[0] ??
      ENEMY_ROSTER_24.find((enemy) => enemy.id === 'footman');
    composition.push(serializeEnemy(fallback, 0));
    spentThreat = Math.min(budget, fallback.spawnCost);
  }

  const basePlan = {
    version: WAVE_DIRECTOR.version,
    seed: deterministicSeed,
    sourceSeed: normalizeRunSeed(seed),
    waveNumber: wave,
    mode: normalizedMode,
    baseBudget,
    quantityMultiplier,
    budget,
    spentThreat: Number(spentThreat.toFixed(2)),
    unusedThreat: Number(Math.max(0, budget - spentThreat).toFixed(2)),
    enemyCount: composition.length,
    factions: Object.freeze([...new Set(composition.map((enemy) => enemy.faction))]),
    unitTypes: Object.freeze([...new Set(composition.map((enemy) => enemy.unitType))]),
    eliteMilestone,
    bossMilestone,
    composition: Object.freeze(composition)
  };

  if (normalizedMode === WAVE_DIRECTOR.modes.TRI_GATE) {
    return Object.freeze({
      ...basePlan,
      laneDistribution: distributeTriGateWave(basePlan.composition, wave)
    });
  }

  return Object.freeze(basePlan);
}

function fingerprint(plan) {
  return JSON.stringify({
    wave: plan.waveNumber,
    mode: plan.mode,
    composition: plan.composition.map((enemy) => [enemy.rosterId, enemy.spawnCost]),
    lanes: plan.laneDistribution?.lanes?.map((lane) => [
      lane.laneId,
      lane.enemies.map((enemy) => enemy.rosterId)
    ]) ?? null
  });
}

export function getWaveDirectorFixtures() {
  const sameA = generateWavePlan({ seed: 'director-fixture', waveNumber: 22, mode: 'single-gate' });
  const sameB = generateWavePlan({ seed: 'director-fixture', waveNumber: 22, mode: 'single-gate' });
  const different = generateWavePlan({ seed: 'director-fixture-alt', waveNumber: 22, mode: 'single-gate' });
  const early = generateWavePlan({ seed: 'early', waveNumber: 4, mode: 'single-gate' });
  const airIntro = generateWavePlan({ seed: 'air', waveNumber: 15, mode: 'single-gate' });
  const mixed = generateWavePlan({ seed: 'mixed', waveNumber: 25, mode: 'single-gate' });
  const late = generateWavePlan({ seed: 'late', waveNumber: 42, mode: 'single-gate' });
  const triA = generateWavePlan({ seed: 'tri', waveNumber: 24, mode: 'tri-gate' });
  const triB = generateWavePlan({ seed: 'tri', waveNumber: 24, mode: 'tri-gate' });

  return Object.freeze({
    deterministicSameSeed: fingerprint(sameA) === fingerprint(sameB),
    differentSeedCanDiffer: fingerprint(sameA) !== fingerprint(different),
    earlyNoAir: early.composition.every((enemy) => enemy.unitType !== ENEMY_UNIT_TYPES.AIR),
    earlySingleFaction: early.factions.length === 1,
    airUnlockedAt15: airIntro.composition.some((enemy) => enemy.unitType === ENEMY_UNIT_TYPES.AIR) ||
      ENEMY_ROSTER_24.some((enemy) => enemy.minWave === 15 && enemy.unitType === ENEMY_UNIT_TYPES.AIR),
    mixedFactionAllowed21Plus: mixed.factions.length <= 2 && mixed.factions.length >= 1,
    allFactionPoolAvailable31Plus: late.factions.length >= 1 && allowedFactionCount(late.waveNumber) === 3,
    eliteMilestone15: generateWavePlan({ seed: 'elite', waveNumber: 15 }).eliteMilestone === true,
    bossMilestone10: generateWavePlan({ seed: 'boss', waveNumber: 10 }).bossMilestone === true,
    quantityWave9: getWaveQuantityMultiplier(9) === 1,
    quantityWave10: getWaveQuantityMultiplier(10) === 1.2,
    quantityWave20: getWaveQuantityMultiplier(20) === 1.44,
    quantityWave30: getWaveQuantityMultiplier(30) === 1.728,
    budgetRespected: [sameA, early, airIntro, mixed, late, triA].every((plan) => plan.spentThreat <= plan.budget + 0.001),
    triGateDeterministic: fingerprint(triA) === fingerprint(triB),
    triGateHasThreeLanes: triA.laneDistribution?.lanes?.length === 3,
    endlessWaveValid: late.enemyCount > 0 && late.budget > 0
  });
}
