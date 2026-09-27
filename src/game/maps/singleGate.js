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
      freezePoint({ x: 140, y: 610 }),
      freezePoint({ x: 140, y: 300 })
    ])
  }),
  Object.freeze({
    id: 'wall-02',
    x: 520,
    y: 450,
    closesSegment: Object.freeze(['p3', 'p4']),
    detour: Object.freeze([
      freezePoint({ x: 650, y: 300 }),
      freezePoint({ x: 650, y: 610 })
    ])
  }),
  Object.freeze({
    id: 'wall-03',
    x: 820,
    y: 450,
    closesSegment: Object.freeze(['p5', 'p6']),
    detour: Object.freeze([
      freezePoint({ x: 690, y: 610 }),
      freezePoint({ x: 690, y: 300 })
    ])
  }),
  Object.freeze({
    id: 'wall-04',
    x: 1110,
    y: 450,
    closesSegment: Object.freeze(['p7', 'p8']),
    detour: Object.freeze([
      freezePoint({ x: 1240, y: 300 }),
      freezePoint({ x: 1240, y: 610 })
    ])
  })
]);

export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-corridor-bastion',
  version: 3,
  mode: 'single-gate',
  compatibleModes: Object.freeze(['single-gate', 'tower-draft']),
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
      Object.freeze({ id: 'slot-01', x: 115, y: 190 }),
      Object.freeze({ id: 'slot-02', x: 115, y: 450 }),
      Object.freeze({ id: 'slot-03', x: 115, y: 700 }),
      Object.freeze({ id: 'slot-04', x: 390, y: 320 }),
      Object.freeze({ id: 'slot-05', x: 390, y: 580 }),
      Object.freeze({ id: 'slot-06', x: 650, y: 120 }),
      Object.freeze({ id: 'slot-07', x: 650, y: 450 }),
      Object.freeze({ id: 'slot-08', x: 650, y: 780 }),
      Object.freeze({ id: 'slot-09', x: 965, y: 320 }),
      Object.freeze({ id: 'slot-10', x: 965, y: 580 }),
      Object.freeze({ id: 'slot-11', x: 1235, y: 120 }),
      Object.freeze({ id: 'slot-12', x: 1235, y: 450 }),
      Object.freeze({ id: 'slot-13', x: 1235, y: 780 }),
      Object.freeze({ id: 'slot-14', x: 1490, y: 250 }),
      Object.freeze({ id: 'slot-15', x: 1490, y: 650 }),
      Object.freeze({ id: 'slot-16', x: 390, y: 120 }),
      Object.freeze({ id: 'slot-17', x: 965, y: 120 }),
      Object.freeze({ id: 'slot-18', x: 1470, y: 800 })
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
    'tower-draft-compatible',
    'serpentine',
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

    if (wall) {
      result.push(...wall.detour);
    }

    result.push(to);
  }

  return Object.freeze(result.map((point) => Object.freeze({ x: point.x, y: point.y })));
}
