const freezePoint = (point) => Object.freeze(point);

const BASE_WAYPOINTS = Object.freeze([
  freezePoint({ id: 'p0', x: 188, y: 692 }),
  freezePoint({ id: 'p1', x: 375, y: 692 }),
  freezePoint({ id: 'p2', x: 375, y: 146 }),
  freezePoint({ id: 'p3', x: 576, y: 146 }),
  freezePoint({ id: 'p4', x: 576, y: 692 }),
  freezePoint({ id: 'p5', x: 812, y: 692 }),
  freezePoint({ id: 'p6', x: 812, y: 146 }),
  freezePoint({ id: 'p7', x: 1026, y: 146 }),
  freezePoint({ id: 'p8', x: 1026, y: 692 }),
  freezePoint({ id: 'p9', x: 1220, y: 692 }),
  freezePoint({ id: 'p10', x: 1220, y: 485 }),
  freezePoint({ id: 'p11', x: 1350, y: 485 })
]);

const WALL_SLOTS = Object.freeze([
  Object.freeze({
    id: 'wall-01',
    x: 375,
    y: 462,
    closesSegment: Object.freeze(['p1', 'p2']),
    detour: Object.freeze([
      freezePoint({ x: 110, y: 620 }),
      freezePoint({ x: 110, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-02',
    x: 576,
    y: 462,
    closesSegment: Object.freeze(['p3', 'p4']),
    detour: Object.freeze([
      freezePoint({ x: 670, y: 280 }),
      freezePoint({ x: 670, y: 620 })
    ])
  }),
  Object.freeze({
    id: 'wall-03',
    x: 812,
    y: 462,
    closesSegment: Object.freeze(['p5', 'p6']),
    detour: Object.freeze([
      freezePoint({ x: 970, y: 620 }),
      freezePoint({ x: 970, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-04',
    x: 1026,
    y: 462,
    closesSegment: Object.freeze(['p7', 'p8']),
    detour: Object.freeze([
      freezePoint({ x: 1260, y: 280 }),
      freezePoint({ x: 1260, y: 620 })
    ])
  })
]);

export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-corridor-bastion',
  version: 6,
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
      x: 188,
      y: 692
    }),
    bastion: Object.freeze({
      id: 'bastion-core',
      x: 1350,
      y: 485
    })
  }),
  path: Object.freeze({
    id: 'single-gate-serpentine-path',
    width: 84,
    waypoints: BASE_WAYPOINTS
  }),
  buildSlots: Object.freeze({
    footprintRadius: 34,
    minimumPathCenterDistance: 76,
    slots: Object.freeze([
      Object.freeze({ id: 'slot-01', x: 262, y: 79 }),
      Object.freeze({ id: 'slot-02', x: 701, y: 79 }),
      Object.freeze({ id: 'slot-03', x: 1103, y: 78 }),
      Object.freeze({ id: 'slot-04', x: 695, y: 190 }),
      Object.freeze({ id: 'slot-05', x: 1118, y: 210 }),
      Object.freeze({ id: 'slot-06', x: 1205, y: 155 }),
      Object.freeze({ id: 'slot-07', x: 1301, y: 240 }),
      Object.freeze({ id: 'slot-08', x: 189, y: 273 }),
      Object.freeze({ id: 'slot-09', x: 293, y: 276 }),
      Object.freeze({ id: 'slot-10', x: 477, y: 252 }),
      Object.freeze({ id: 'slot-11', x: 195, y: 388 }),
      Object.freeze({ id: 'slot-12', x: 477, y: 387 }),
      Object.freeze({ id: 'slot-13', x: 916, y: 321 }),
      Object.freeze({ id: 'slot-14', x: 1224, y: 329 }),
      Object.freeze({ id: 'slot-15', x: 917, y: 425 }),
      Object.freeze({ id: 'slot-16', x: 1139, y: 426 }),
      Object.freeze({ id: 'slot-17', x: 700, y: 462 }),
      Object.freeze({ id: 'slot-18', x: 189, y: 530 }),
      Object.freeze({ id: 'slot-19', x: 286, y: 517 }),
      Object.freeze({ id: 'slot-20', x: 477, y: 559 }),
      Object.freeze({ id: 'slot-21', x: 702, y: 585 }),
      Object.freeze({ id: 'slot-22', x: 919, y: 560 }),
      Object.freeze({ id: 'slot-23', x: 1143, y: 586 }),
      Object.freeze({ id: 'slot-24', x: 1323, y: 668 }),
      Object.freeze({ id: 'slot-25', x: 466, y: 767 }),
      Object.freeze({ id: 'slot-26', x: 813, y: 802 }),
      Object.freeze({ id: 'slot-27', x: 1137, y: 802 }),
      Object.freeze({ id: 'slot-28', x: 1321, y: 780 })
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
