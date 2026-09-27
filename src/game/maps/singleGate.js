export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-first-bastion',
  version: 1,
  mode: 'single-gate',
  name: 'First Bastion',
  size: Object.freeze({
    width: 1600,
    height: 900
  }),
  anchors: Object.freeze({
    enemySpawn: Object.freeze({
      id: 'enemy-spawn',
      x: 80,
      y: 450
    }),
    bastion: Object.freeze({
      id: 'bastion-core',
      x: 1460,
      y: 450
    })
  }),
  path: Object.freeze({
    id: 'single-gate-main-path',
    width: 96,
    waypoints: Object.freeze([
      Object.freeze({ x: 80, y: 450 }),
      Object.freeze({ x: 320, y: 450 }),
      Object.freeze({ x: 520, y: 330 }),
      Object.freeze({ x: 760, y: 330 }),
      Object.freeze({ x: 960, y: 560 }),
      Object.freeze({ x: 1190, y: 560 }),
      Object.freeze({ x: 1320, y: 450 }),
      Object.freeze({ x: 1460, y: 450 })
    ])
  }),
  buildZones: Object.freeze({
    clearanceFromPath: 72,
    clearanceFromBastion: 110,
    zones: Object.freeze([
      Object.freeze({
        id: 'north-west',
        x: 180,
        y: 90,
        width: 420,
        height: 190
      }),
      Object.freeze({
        id: 'north-east',
        x: 760,
        y: 90,
        width: 430,
        height: 170
      }),
      Object.freeze({
        id: 'south-west',
        x: 180,
        y: 610,
        width: 470,
        height: 190
      }),
      Object.freeze({
        id: 'south-east',
        x: 920,
        y: 670,
        width: 300,
        height: 140
      })
    ])
  }),
  camera: Object.freeze({
    centerX: 800,
    centerY: 450,
    minZoom: 0.7,
    maxZoom: 1.25
  }),
  tags: Object.freeze([
    'single-front',
    'endless-survival',
    'first-bastion'
  ])
});

export function getSingleGateMapModel() {
  return SINGLE_GATE_MAP;
}

export function getSingleGatePath() {
  return SINGLE_GATE_MAP.path;
}

export function getSingleGateBuildZones() {
  return SINGLE_GATE_MAP.buildZones;
}
