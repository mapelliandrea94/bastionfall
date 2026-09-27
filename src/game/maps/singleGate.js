const freezePoint = (point) => Object.freeze(point);

const BASE_WAYPOINTS = Object.freeze([
  freezePoint({ id: 'p0', x: 90, y: 730 }),
  freezePoint({ id: 'p1', x: 260, y: 730 }),
  freezePoint({ id: 'p2', x: 260, y: 170 }),
  freezePoint({ id: 'p3', x: 520, y: 170 }),
  freezePoint({ id: 'p4', x: 520, y: 730 }),
  freezePoint({ id: 'p5', x: 820, y: 730 }),
  freezePoint({ id: 'p6', x: 820, y: 170 }),
  freezePoint({ id: 'p7', x: 1110, y: 170 }),
  freezePoint({ id: 'p8', x: 1110, y: 730 }),
  freezePoint({ id: 'p9', x: 1360, y: 730 }),
  freezePoint({ id: 'p10', x: 1360, y: 450 }),
  freezePoint({ id: 'p11', x: 1490, y: 450 })
]);

const WALL_SLOTS = Object.freeze([
  Object.freeze({
    id: 'wall-01',
    x: 260,
    y: 450,
    closesSegment: Object.freeze(['p1', 'p2']),
    detour: Object.freeze([
      freezePoint({ x: 110, y: 620 }),
      freezePoint({ x: 110, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-02',
    x: 520,
    y: 450,
    closesSegment: Object.freeze(['p3', 'p4']),
    detour: Object.freeze([
      freezePoint({ x: 670, y: 280 }),
      freezePoint({ x: 670, y: 620 })
    ])
  }),
  Object.freeze({
    id: 'wall-03',
    x: 820,
    y: 450,
    closesSegment: Object.freeze(['p5', 'p6']),
    detour: Object.freeze([
      freezePoint({ x: 970, y: 620 }),
      freezePoint({ x: 970, y: 280 })
    ])
  }),
  Object.freeze({
    id: 'wall-04',
    x: 1110,
    y: 450,
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
      x: 90,
      y: 730
    }),
    bastion: Object.freeze({
      id: 'bastion-core',
      x: 1490,
      y: 450
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
      Object.freeze({ id: 'slot-01', x: 390, y: 290 }),
      Object.freeze({ id: 'slot-02', x: 390, y: 410 }),
      Object.freeze({ id: 'slot-03', x: 390, y: 530 }),
      Object.freeze({ id: 'slot-04', x: 390, y: 650 }),
      Object.freeze({ id: 'slot-05', x: 390, y: 800 }),

      Object.freeze({ id: 'slot-06', x: 670, y: 110 }),
      Object.freeze({ id: 'slot-07', x: 670, y: 300 }),
      Object.freeze({ id: 'slot-08', x: 670, y: 450 }),
      Object.freeze({ id: 'slot-09', x: 670, y: 600 }),

      Object.freeze({ id: 'slot-10', x: 965, y: 300 }),
      Object.freeze({ id: 'slot-11', x: 965, y: 430 }),
      Object.freeze({ id: 'slot-12', x: 965, y: 560 }),
      Object.freeze({ id: 'slot-13', x: 965, y: 690 }),
      Object.freeze({ id: 'slot-14', x: 965, y: 800 }),

      Object.freeze({ id: 'slot-15', x: 1235, y: 110 }),
      Object.freeze({ id: 'slot-16', x: 1235, y: 300 }),
      Object.freeze({ id: 'slot-17', x: 1235, y: 430 }),
      Object.freeze({ id: 'slot-18', x: 1235, y: 580 }),

      Object.freeze({ id: 'slot-19', x: 100, y: 110 }),
      Object.freeze({ id: 'slot-20', x: 100, y: 300 }),
      Object.freeze({ id: 'slot-21', x: 100, y: 450 }),
      Object.freeze({ id: 'slot-22', x: 100, y: 580 }),

      Object.freeze({ id: 'slot-23', x: 1480, y: 110 }),
      Object.freeze({ id: 'slot-24', x: 1480, y: 230 }),
      Object.freeze({ id: 'slot-25', x: 1480, y: 320 }),
      Object.freeze({ id: 'slot-26', x: 1480, y: 560 }),
      Object.freeze({ id: 'slot-27', x: 1480, y: 680 }),
      Object.freeze({ id: 'slot-28', x: 1480, y: 800 })
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
  const active = new Set(activeWallIds);
  const result = [BASE_WAYPOINTS[0]];

  for (let index = 0; index < BASE_WAYPOINTS.length - 1; index += 1) {
    const from = BASE_WAYPOINTS[index];
    const to = BASE_WAYPOINTS[index + 1];
    const wall = WALL_SLOTS.find(
      (entry) =>
        active.has(entry.id) &&
        entry.closesSegment[0] === from.id &&
        entry.closesSegment[1] === to.id
    );

    if (wall) result.push(...wall.detour);
    result.push(to);
  }

  return Object.freeze(result.map((point) => Object.freeze({ x: point.x, y: point.y })));
}
