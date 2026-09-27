const freezePoint = (point) => Object.freeze(point);

const BASE_WAYPOINTS = Object.freeze([
  freezePoint({ id: 'p0', x: 80, y: 450 }),
  freezePoint({ id: 'p1', x: 260, y: 450 }),
  freezePoint({ id: 'p2', x: 360, y: 220 }),
  freezePoint({ id: 'p3', x: 590, y: 220 }),
  freezePoint({ id: 'p4', x: 700, y: 680 }),
  freezePoint({ id: 'p5', x: 960, y: 680 }),
  freezePoint({ id: 'p6', x: 1080, y: 250 }),
  freezePoint({ id: 'p7', x: 1300, y: 250 }),
  freezePoint({ id: 'p8', x: 1390, y: 520 }),
  freezePoint({ id: 'p9', x: 1490, y: 450 })
]);

const WALL_SLOTS = Object.freeze([
  Object.freeze({
    id: 'wall-01',
    x: 315,
    y: 338,
    closesSegment: Object.freeze(['p1', 'p2']),
    detour: Object.freeze([
      freezePoint({ x: 215, y: 250 }),
      freezePoint({ x: 310, y: 145 })
    ])
  }),
  Object.freeze({
    id: 'wall-02',
    x: 645,
    y: 445,
    closesSegment: Object.freeze(['p3', 'p4']),
    detour: Object.freeze([
      freezePoint({ x: 760, y: 300 }),
      freezePoint({ x: 800, y: 560 })
    ])
  }),
  Object.freeze({
    id: 'wall-03',
    x: 1020,
    y: 465,
    closesSegment: Object.freeze(['p5', 'p6']),
    detour: Object.freeze([
      freezePoint({ x: 880, y: 470 }),
      freezePoint({ x: 960, y: 325 })
    ])
  }),
  Object.freeze({
    id: 'wall-04',
    x: 1345,
    y: 385,
    closesSegment: Object.freeze(['p7', 'p8']),
    detour: Object.freeze([
      freezePoint({ x: 1490, y: 250 }),
      freezePoint({ x: 1510, y: 430 })
    ])
  })
]);

export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-serpentine-bastion',
  version: 3,
  mode: 'single-gate',
  compatibleModes: Object.freeze(['single-gate', 'tower-draft']),
  name: 'Serpent Bastion',
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
      Object.freeze({ id: 'slot-01', x: 120, y: 190 }),
      Object.freeze({ id: 'slot-02', x: 190, y: 610 }),
      Object.freeze({ id: 'slot-03', x: 330, y: 560 }),
      Object.freeze({ id: 'slot-04', x: 420, y: 370 }),
      Object.freeze({ id: 'slot-05', x: 470, y: 90 }),
      Object.freeze({ id: 'slot-06', x: 560, y: 760 }),
      Object.freeze({ id: 'slot-07', x: 760, y: 140 }),
      Object.freeze({ id: 'slot-08', x: 820, y: 810 }),
      Object.freeze({ id: 'slot-09', x: 1040, y: 120 }),
      Object.freeze({ id: 'slot-10', x: 1160, y: 400 }),
      Object.freeze({ id: 'slot-11', x: 1190, y: 720 }),
      Object.freeze({ id: 'slot-12', x: 1350, y: 100 }),
      Object.freeze({ id: 'slot-13', x: 1490, y: 120 }),
      Object.freeze({ id: 'slot-14', x: 1430, y: 700 }),
      Object.freeze({ id: 'slot-15', x: 900, y: 180 }),
      Object.freeze({ id: 'slot-16', x: 300, y: 760 }),
      Object.freeze({ id: 'slot-17', x: 650, y: 800 }),
      Object.freeze({ id: 'slot-18', x: 1240, y: 540 })
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
