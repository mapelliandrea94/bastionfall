import { BASE_TOWER_GAMEPLAY_BY_ID } from '../towers/baseTowerGameplay.js';
import { TOWER_EVOLUTIONS } from '../towers/evolutions.js';
import { ENEMY_ROSTER_24 } from '../enemies/enemyRoster.js';
import { getCombinedCounterMultiplier } from '../combat/factionCounters.js';

export const PERFORMANCE_TELEMETRY = Object.freeze({
  version: 1,
  maxWaveSamples: 180,
  maxTowerSamplesPerEvolution: 120,
  expectedEvolutionCount: 24,
  expectedEnemyCount: 24,
  expectedCoveragePairs: 24 * 24
});

const round = (value, digits = 3) => Number(Number(value ?? 0).toFixed(digits));

function getEvolutionTowerProfile(evolution) {
  const base = BASE_TOWER_GAMEPLAY_BY_ID[evolution.towerId];
  if (!base) return null;

  return Object.freeze({
    evolutionId: evolution.id,
    evolutionName: evolution.name,
    towerId: evolution.towerId,
    branch: evolution.branch,
    faction: base.faction,
    counterType: base.counterType,
    damage: Number(base.damage ?? 0),
    attackIntervalMs: Number(base.attackIntervalMs ?? 0),
    baseDps: base.attackIntervalMs > 0
      ? round((Number(base.damage ?? 0) * 1000) / Number(base.attackIntervalMs), 4)
      : 0
  });
}

export const EVOLUTION_TELEMETRY_PROFILES = Object.freeze(
  TOWER_EVOLUTIONS.map(getEvolutionTowerProfile).filter(Boolean)
);

export const COUNTER_COVERAGE_MATRIX = Object.freeze(
  EVOLUTION_TELEMETRY_PROFILES.flatMap((tower) =>
    ENEMY_ROSTER_24.map((enemy) => Object.freeze({
      evolutionId: tower.evolutionId,
      enemyId: enemy.id,
      towerFaction: tower.faction,
      enemyFaction: enemy.faction,
      counterType: tower.counterType,
      enemyType: enemy.unitType,
      multiplier: getCombinedCounterMultiplier(tower, enemy)
    }))
  )
);

export function createPerformanceTelemetryState() {
  return {
    waveSamples: [],
    towerSamples: Object.fromEntries(
      TOWER_EVOLUTIONS.map((evolution) => [evolution.id, []])
    )
  };
}

function pushBounded(list, sample, limit) {
  const next = [...list, Object.freeze({ ...sample })];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export function recordWavePerformanceSample(state, sample = {}) {
  const source = state ?? createPerformanceTelemetryState();
  return {
    ...source,
    waveSamples: pushBounded(
      source.waveSamples ?? [],
      {
        wave: Math.max(0, Math.floor(Number(sample.wave ?? 0))),
        frameMs: round(Math.max(0, Number(sample.frameMs ?? 0))),
        enemiesAlive: Math.max(0, Math.floor(Number(sample.enemiesAlive ?? 0))),
        projectilesAlive: Math.max(0, Math.floor(Number(sample.projectilesAlive ?? 0))),
        timestampMs: Math.max(0, Math.floor(Number(sample.timestampMs ?? 0)))
      },
      PERFORMANCE_TELEMETRY.maxWaveSamples
    )
  };
}

export function recordTowerTelemetrySample(state, evolutionId, sample = {}) {
  const source = state ?? createPerformanceTelemetryState();
  if (!Object.prototype.hasOwnProperty.call(source.towerSamples ?? {}, evolutionId)) return source;

  return {
    ...source,
    towerSamples: {
      ...source.towerSamples,
      [evolutionId]: pushBounded(
        source.towerSamples[evolutionId] ?? [],
        {
          wave: Math.max(0, Math.floor(Number(sample.wave ?? 0))),
          damage: round(Math.max(0, Number(sample.damage ?? 0))),
          attacks: Math.max(0, Math.floor(Number(sample.attacks ?? 0))),
          kills: Math.max(0, Math.floor(Number(sample.kills ?? 0))),
          activeMs: Math.max(0, Math.floor(Number(sample.activeMs ?? 0)))
        },
        PERFORMANCE_TELEMETRY.maxTowerSamplesPerEvolution
      )
    }
  };
}

export function getPerformanceTelemetryQa() {
  const evolutionIds = EVOLUTION_TELEMETRY_PROFILES.map((entry) => entry.evolutionId);
  const matrixKeys = new Set(
    COUNTER_COVERAGE_MATRIX.map((entry) => entry.evolutionId + ':' + entry.enemyId)
  );

  let bounded = createPerformanceTelemetryState();
  for (let index = 0; index < PERFORMANCE_TELEMETRY.maxWaveSamples + 25; index += 1) {
    bounded = recordWavePerformanceSample(bounded, {
      wave: index,
      frameMs: 16.67,
      enemiesAlive: index % 80,
      projectilesAlive: index % 120,
      timestampMs: index * 1000
    });
  }

  const sampleEvolution = TOWER_EVOLUTIONS[0]?.id;
  for (let index = 0; index < PERFORMANCE_TELEMETRY.maxTowerSamplesPerEvolution + 25; index += 1) {
    bounded = recordTowerTelemetrySample(bounded, sampleEvolution, {
      wave: index,
      damage: 100 + index,
      attacks: 10,
      kills: 2,
      activeMs: 1000
    });
  }

  const perfectPairs = COUNTER_COVERAGE_MATRIX.filter((entry) => entry.multiplier === 2.25);
  const doublePenaltyPairs = COUNTER_COVERAGE_MATRIX.filter((entry) => entry.multiplier === 0.5625);
  const neutralEvolutionIds = new Set(
    EVOLUTION_TELEMETRY_PROFILES
      .filter((entry) => entry.faction === 'neutral')
      .map((entry) => entry.evolutionId)
  );
  const neutralRows = COUNTER_COVERAGE_MATRIX.filter((entry) => neutralEvolutionIds.has(entry.evolutionId));

  return Object.freeze({
    evolutionCountIs24:
      EVOLUTION_TELEMETRY_PROFILES.length === PERFORMANCE_TELEMETRY.expectedEvolutionCount,
    uniqueEvolutionIds:
      new Set(evolutionIds).size === PERFORMANCE_TELEMETRY.expectedEvolutionCount,
    enemyCountIs24:
      ENEMY_ROSTER_24.length === PERFORMANCE_TELEMETRY.expectedEnemyCount,
    fullMatrixCoverage:
      COUNTER_COVERAGE_MATRIX.length === PERFORMANCE_TELEMETRY.expectedCoveragePairs &&
      matrixKeys.size === PERFORMANCE_TELEMETRY.expectedCoveragePairs,
    allProfilesHavePositiveDps:
      EVOLUTION_TELEMETRY_PROFILES.every((entry) => entry.baseDps > 0),
    intendedDoubleCounterPresent:
      perfectPairs.length > 0 &&
      perfectPairs.every((entry) => entry.multiplier === 2.25),
    intendedDoublePenaltyPresent:
      doublePenaltyPairs.length > 0 &&
      doublePenaltyPairs.every((entry) => entry.multiplier === 0.5625),
    neutralSupportNeverGetsFactionBonus:
      neutralRows.every((entry) => ![1.5, 2.25].includes(entry.multiplier)),
    waveSamplesAreBounded:
      bounded.waveSamples.length === PERFORMANCE_TELEMETRY.maxWaveSamples,
    towerSamplesAreBounded:
      bounded.towerSamples[sampleEvolution]?.length === PERFORMANCE_TELEMETRY.maxTowerSamplesPerEvolution,
    finiteCoverageValues:
      COUNTER_COVERAGE_MATRIX.every((entry) => Number.isFinite(entry.multiplier))
  });
}

export function getPerformanceTelemetryPass() {
  return Object.values(getPerformanceTelemetryQa()).every((value) => value === true);
}
