const freezePoint = (point) => Object.freeze(point);

const BASE_WAYPOINTS = Object.freeze([
  freezePoint({ id: 'p0', x: 205, y: 680 }),
  freezePoint({ id: 'p1', x: 350, y: 680 }),
  freezePoint({ id: 'p2', x: 350, y: 155 }),
  freezePoint({ id: 'p3', x: 590, y: 155 }),
  freezePoint({ id: 'p4', x: 590, y: 680 }),
  freezePoint({ id: 'p5', x: 810, y: 680 }),
  freezePoint({ id: 'p6', x: 810, y: 155 }),
  freezePoint({ id: 'p7', x: 1030, y: 155 }),
  freezePoint({ id: 'p8', x: 1030, y: 680 }),
  freezePoint({ id: 'p9', x: 1220, y: 680 }),
  freezePoint({ id: 'p10', x: 1220, y: 475 }),
  freezePoint({ id: 'p11', x: 1375, y: 475 })
]);

const WALL_SLOTS = Object.freeze([
  Object.freeze({
    id: 'wall-01',
    x: 350,
    y: 440,
    closesSegment: Object.freeze(['p1', 'p2']),
    detour: Object.freeze([
      freezePoint({ x: 110, y: 620 }),
      freezePoint({ x: 110, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-02',
    x: 590,
    y: 440,
    closesSegment: Object.freeze(['p3', 'p4']),
    detour: Object.freeze([
      freezePoint({ x: 670, y: 280 }),
      freezePoint({ x: 670, y: 620 })
    ])
  }),
  Object.freeze({
    id: 'wall-03',
    x: 810,
    y: 440,
    closesSegment: Object.freeze(['p5', 'p6']),
    detour: Object.freeze([
      freezePoint({ x: 970, y: 620 }),
      freezePoint({ x: 970, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-04',
    x: 1030,
    y: 440,
    closesSegment: Object.freeze(['p7', 'p8']),
    detour: Object.freeze([
      freezePoint({ x: 1260, y: 280 }),
      freezePoint({ x: 1260, y: 620 })
    ])
  })
]);

export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-corridor-bastion',
  version: 5,
  mode: 'single-gate',
  compatibleModes: Object.freeze(['single-gate', 'tft-shop']),
  name: 'Bastion Gauntlet',
  size: Object.freeze({
    width: 1600,
    height: 900
  }),
  anchors: Object.freeze({
    enemySpawn: Object.freeze({
      id: 'enemy-spawn',
      x: 205,
      y: 680
    }),
    bastion: Object.freeze({
      id: 'bastion-core',
      x: 1375,
      y: 475
    })
  }),
  path: Object.freeze({
    id: 'single-gate-serpentine-path',
    width: 84,
    waypoints: BASE_WAYPOINTS
  }),
  buildSlots: Object.freeze({
    footprintRadius: 34,
    minimumPathCenterDistance: 104,
    slots: Object.freeze([
      Object.freeze({ id: 'slot-01', x: 260, y: 63 }),
      Object.freeze({ id: 'slot-02', x: 701, y: 69 }),
      Object.freeze({ id: 'slot-03', x: 1104, y: 71 }),
      Object.freeze({ id: 'slot-04', x: 1208, y: 149 }),
      Object.freeze({ id: 'slot-05', x: 1116, y: 187 }),
      Object.freeze({ id: 'slot-06', x: 1300, y: 230 }),
      Object.freeze({ id: 'slot-07', x: 689, y: 176 }),
      Object.freeze({ id: 'slot-08', x: 184, y: 262 }),
      Object.freeze({ id: 'slot-09', x: 292, y: 268 }),
      Object.freeze({ id: 'slot-10', x: 474, y: 235 }),
      Object.freeze({ id: 'slot-11', x: 913, y: 312 }),
      Object.freeze({ id: 'slot-12', x: 1228, y: 322 }),
      Object.freeze({ id: 'slot-13', x: 195, y: 363 }),
      Object.freeze({ id: 'slot-14', x: 473, y: 373 }),
      Object.freeze({ id: 'slot-15', x: 913, y: 418 }),
      Object.freeze({ id: 'slot-16', x: 1133, y: 420 }),
      Object.freeze({ id: 'slot-17', x: 181, y: 518 }),
      Object.freeze({ id: 'slot-18', x: 266, y: 518 }),
      Object.freeze({ id: 'slot-19', x: 474, y: 543 }),
      Object.freeze({ id: 'slot-20', x: 690, y: 447 }),
      Object.freeze({ id: 'slot-21', x: 689, y: 563 }),
      Object.freeze({ id: 'slot-22', x: 918, y: 540 }),
      Object.freeze({ id: 'slot-23', x: 1140, y: 571 }),
      Object.freeze({ id: 'slot-24', x: 1319, y: 655 }),
      Object.freeze({ id: 'slot-25', x: 463, y: 757 }),
      Object.freeze({ id: 'slot-26', x: 813, y: 790 }),
      Object.freeze({ id: 'slot-27', x: 1131, y: 788 }),
      Object.freeze({ id: 'slot-28', x: 1307, y: 760 })
    ])
  }),
  wallSlots: Object.freeze({
    maximumActive: 4,
    defaultCost: 4,
    sockets: WALL_SLOTS
  }),
  camera: Object.freeze({
    centerX: 800,
    centerY: 450,
    minZoom: 0.7,
    maxZoom: 1.25
  }),
  tags: Object.freeze([
    'single-front',
    'tft-shop-compatible',
    'gauntlet-corridors',
    'buyable-walls',
    'endless-survival'
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

export function getSingleGateWallSlots() {
  return SINGLE_GATE_MAP.wallSlots;
}

export function getSingleGatePathForWalls(activeWallIds = []) {
  void activeWallIds;
  return Object.freeze(
    BASE_WAYPOINTS.map((point) => Object.freeze({ x: point.x, y: point.y }))
  );
}
