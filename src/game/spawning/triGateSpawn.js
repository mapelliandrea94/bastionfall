import { TRI_GATE_MAP } from '../maps/triGate.js';

export const TRI_GATE_SPAWN = Object.freeze({
  version: 1,
  laneIds: Object.freeze(TRI_GATE_MAP.pathPlan.lanes.map((lane) => lane.id)),
  strategy: 'least-threat-rotating-tie-break'
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

function getLaneRotation(waveNumber) {
  const laneCount = TRI_GATE_SPAWN.laneIds.length;
  return (normalizeWaveNumber(waveNumber) - 1) % laneCount;
}

export function distributeTriGateWave(composition = [], waveNumber = 1) {
  const rotation = getLaneRotation(waveNumber);
  const lanes = TRI_GATE_SPAWN.laneIds.map((laneId, index) => ({
    laneId,
    laneOrder: index,
    threat: 0,
    enemies: []
  }));

  composition.forEach((enemy, enemyIndex) => {
    const ranked = [...lanes].sort((a, b) => {
      if (a.threat !== b.threat) return a.threat - b.threat;

      const aRotated = (a.laneOrder - rotation + lanes.length) % lanes.length;
      const bRotated = (b.laneOrder - rotation + lanes.length) % lanes.length;
      if (aRotated !== bRotated) return aRotated - bRotated;

      return a.laneOrder - b.laneOrder;
    });

    const targetLane = ranked[0];
    const assignedEnemy = Object.freeze({
      ...enemy,
      laneId: targetLane.laneId,
      spawnIndex: enemyIndex
    });

    targetLane.enemies.push(assignedEnemy);
    targetLane.threat += Math.max(0, Number(enemy?.threatValue) || 0);
  });

  const frozenLanes = lanes.map((lane) => Object.freeze({
    laneId: lane.laneId,
    enemyCount: lane.enemies.length,
    threat: Number(lane.threat.toFixed(2)),
    enemies: Object.freeze(lane.enemies)
  }));

  return Object.freeze({
    waveNumber: normalizeWaveNumber(waveNumber),
    rotation,
    totalEnemies: composition.length,
    totalThreat: Number(
      frozenLanes.reduce((sum, lane) => sum + lane.threat, 0).toFixed(2)
    ),
    lanes: Object.freeze(frozenLanes)
  });
}

export function flattenTriGateDistribution(distribution) {
  return Object.freeze(
    (distribution?.lanes || [])
      .flatMap((lane) => lane.enemies)
      .sort((a, b) => a.spawnIndex - b.spawnIndex)
  );
}

export function getTriGateSpawnFixtures() {
  const composition = Object.freeze([
    Object.freeze({ archetype: 'normal', threatValue: 1 }),
    Object.freeze({ archetype: 'normal', threatValue: 1 }),
    Object.freeze({ archetype: 'tank', threatValue: 2.4 }),
    Object.freeze({ archetype: 'runner', threatValue: 0.9 }),
    Object.freeze({ archetype: 'normal', threatValue: 1 }),
    Object.freeze({ archetype: 'armored', threatValue: 2.2 }),
    Object.freeze({ archetype: 'normal', threatValue: 1 }),
    Object.freeze({ archetype: 'flying', threatValue: 1.35 }),
    Object.freeze({ archetype: 'normal', threatValue: 1 })
  ]);

  const wave1 = distributeTriGateWave(composition, 1);
  const wave2 = distributeTriGateWave(composition, 2);
  const wave3 = distributeTriGateWave(composition, 3);
  const flattened = flattenTriGateDistribution(wave1);
  const counts = wave1.lanes.map((lane) => lane.enemyCount);
  const threats = wave1.lanes.map((lane) => lane.threat);

  return Object.freeze({
    laneCountExpected: 3,
    laneCountActual: wave1.lanes.length,
    allEnemiesAssigned: wave1.totalEnemies === composition.length,
    noDuplicateAssignments: new Set(flattened.map((enemy) => enemy.spawnIndex)).size === composition.length,
    originalOrderRecoverable: flattened.every((enemy, index) => enemy.spawnIndex === index),
    countSpreadAtMostOne: Math.max(...counts) - Math.min(...counts) <= 1,
    threatSpread: Number((Math.max(...threats) - Math.min(...threats)).toFixed(2)),
    wave1RotationExpected: 0,
    wave1RotationActual: wave1.rotation,
    wave2RotationExpected: 1,
    wave2RotationActual: wave2.rotation,
    wave3RotationExpected: 2,
    wave3RotationActual: wave3.rotation,
    rotatesOpeningLane:
      wave1.lanes.find((lane) => lane.enemies.some((enemy) => enemy.spawnIndex === 0))?.laneId !==
        wave2.lanes.find((lane) => lane.enemies.some((enemy) => enemy.spawnIndex === 0))?.laneId &&
      wave2.lanes.find((lane) => lane.enemies.some((enemy) => enemy.spawnIndex === 0))?.laneId !==
        wave3.lanes.find((lane) => lane.enemies.some((enemy) => enemy.spawnIndex === 0))?.laneId
  });
}
