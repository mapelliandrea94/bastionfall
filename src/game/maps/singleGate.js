export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-first-bastion',
  version: 2,
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
  buildSlots: Object.freeze({
    footprintRadius: 34,
    minimumPathCenterDistance: 104,
    slots: Object.freeze([
      Object.freeze({ id: 'slot-01', x: 220, y: 330 }),
      Object.freeze({ id: 'slot-02', x: 360, y: 300 }),
      Object.freeze({ id: 'slot-03', x: 560, y: 200 }),
      Object.freeze({ id: 'slot-04', x: 710, y: 205 }),
      Object.freeze({ id: 'slot-05', x: 850, y: 215 }),
      Object.freeze({ id: 'slot-06', x: 1010, y: 405 }),
      Object.freeze({ id: 'slot-07', x: 1120, y: 760 }),
      Object.freeze({ id: 'slot-08', x: 1200, y: 300 }),
      Object.freeze({ id: 'slot-09', x: 220, y: 580 }),
      Object.freeze({ id: 'slot-10', x: 400, y: 575 }),
      Object.freeze({ id: 'slot-11', x: 560, y: 500 }),
      Object.freeze({ id: 'slot-12', x: 700, y: 505 }),
      Object.freeze({ id: 'slot-13', x: 820, y: 650 }),
      Object.freeze({ id: 'slot-14', x: 1040, y: 700 }),
      Object.freeze({ id: 'slot-15', x: 1180, y: 420 })
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

export function getSingleGateBuildSlots() {
  return SINGLE_GATE_MAP.buildSlots;
}
