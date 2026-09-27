export const TRI_GATE_MAP = Object.freeze({
  id: 'tri-gate-three-fronts',
  version: 1,
  mode: 'tri-gate',
  name: 'Three Fronts',
  size: Object.freeze({
    width: 1600,
    height: 900
  }),
  anchors: Object.freeze({
    bastion: Object.freeze({
      id: 'tri-gate-bastion-core',
      x: 800,
      y: 450
    }),
    entrances: Object.freeze([
      Object.freeze({
        id: 'west-gate',
        side: 'west',
        x: 80,
        y: 450
      }),
      Object.freeze({
        id: 'north-gate',
        side: 'north',
        x: 800,
        y: 80
      }),
      Object.freeze({
        id: 'south-gate',
        side: 'south',
        x: 800,
        y: 820
      })
    ])
  }),
  pathPlan: Object.freeze({
    laneCount: 3,
    sharedBastionId: 'tri-gate-bastion-core',
    defaultWidth: 88,
    lanes: Object.freeze([
      Object.freeze({
        id: 'tri-gate-west-lane',
        entranceId: 'west-gate',
        destinationId: 'tri-gate-bastion-core',
        width: 88,
        waypoints: Object.freeze([
          Object.freeze({ x: 80, y: 450 }),
          Object.freeze({ x: 260, y: 450 }),
          Object.freeze({ x: 410, y: 340 }),
          Object.freeze({ x: 560, y: 340 }),
          Object.freeze({ x: 680, y: 420 }),
          Object.freeze({ x: 800, y: 450 })
        ])
      }),
      Object.freeze({
        id: 'tri-gate-north-lane',
        entranceId: 'north-gate',
        destinationId: 'tri-gate-bastion-core',
        width: 88,
        waypoints: Object.freeze([
          Object.freeze({ x: 800, y: 80 }),
          Object.freeze({ x: 800, y: 190 }),
          Object.freeze({ x: 955, y: 245 }),
          Object.freeze({ x: 970, y: 335 }),
          Object.freeze({ x: 900, y: 405 }),
          Object.freeze({ x: 800, y: 450 })
        ])
      }),
      Object.freeze({
        id: 'tri-gate-south-lane',
        entranceId: 'south-gate',
        destinationId: 'tri-gate-bastion-core',
        width: 88,
        waypoints: Object.freeze([
          Object.freeze({ x: 800, y: 820 }),
          Object.freeze({ x: 800, y: 710 }),
          Object.freeze({ x: 645, y: 655 }),
          Object.freeze({ x: 630, y: 565 }),
          Object.freeze({ x: 700, y: 495 }),
          Object.freeze({ x: 800, y: 450 })
        ])
      })
    ])
  }),
  buildSlotPolicy: Object.freeze({
    type: 'individual-pads',
    oneTowerPerSlot: true,
    numericalTowerCap: null,
    footprintRadius: 34,
    minimumPathCenterDistance: 104,
    slotsDefinedAfterPathGeometry: true
  }),
  camera: Object.freeze({
    centerX: 800,
    centerY: 450,
    minZoom: 0.65,
    maxZoom: 1.2
  }),
  tags: Object.freeze([
    'three-fronts',
    'endless-survival',
    'shared-bastion'
  ])
});

export function getTriGateMapModel() {
  return TRI_GATE_MAP;
}

export function getTriGateEntrances() {
  return TRI_GATE_MAP.anchors.entrances;
}

export function getTriGatePathPlan() {
  return TRI_GATE_MAP.pathPlan;
}

export function getTriGatePaths() {
  return TRI_GATE_MAP.pathPlan.lanes;
}

export function getTriGateMapFixtures() {
  const entranceIds = new Set(TRI_GATE_MAP.anchors.entrances.map((entrance) => entrance.id));
  const laneIds = new Set(TRI_GATE_MAP.pathPlan.lanes.map((lane) => lane.id));
  const bastion = TRI_GATE_MAP.anchors.bastion;
  const entranceById = new Map(
    TRI_GATE_MAP.anchors.entrances.map((entrance) => [entrance.id, entrance])
  );

  const lanesResolve = TRI_GATE_MAP.pathPlan.lanes.every(
    (lane) =>
      entranceIds.has(lane.entranceId) &&
      lane.destinationId === bastion.id
  );

  const pathsStartAtEntrance = TRI_GATE_MAP.pathPlan.lanes.every((lane) => {
    const entrance = entranceById.get(lane.entranceId);
    const start = lane.waypoints?.[0];
    return Boolean(
      entrance &&
      start &&
      start.x === entrance.x &&
      start.y === entrance.y
    );
  });

  const pathsEndAtBastion = TRI_GATE_MAP.pathPlan.lanes.every((lane) => {
    const end = lane.waypoints?.[lane.waypoints.length - 1];
    return Boolean(
      end &&
      end.x === bastion.x &&
      end.y === bastion.y
    );
  });

  const pathsHaveShape = TRI_GATE_MAP.pathPlan.lanes.every(
    (lane) => Array.isArray(lane.waypoints) && lane.waypoints.length >= 5
  );

  const uniqueInteriorWaypoints = TRI_GATE_MAP.pathPlan.lanes.every((lane, laneIndex, lanes) => {
    const interior = lane.waypoints.slice(1, -1);
    return interior.every((point) =>
      lanes.every((otherLane, otherIndex) =>
        otherIndex === laneIndex ||
        otherLane.waypoints.slice(1, -1).every(
          (otherPoint) => otherPoint.x !== point.x || otherPoint.y !== point.y
        )
      )
    );
  });

  return Object.freeze({
    modeExpected: 'tri-gate',
    modeActual: TRI_GATE_MAP.mode,
    entranceCountExpected: 3,
    entranceCountActual: TRI_GATE_MAP.anchors.entrances.length,
    laneCountExpected: 3,
    laneCountActual: TRI_GATE_MAP.pathPlan.lanes.length,
    uniqueEntrances: entranceIds.size === 3,
    uniqueLanes: laneIds.size === 3,
    lanesResolve,
    pathsStartAtEntrance,
    pathsEndAtBastion,
    pathsHaveShape,
    uniqueInteriorWaypoints,
    bastionCentered:
      bastion.x === TRI_GATE_MAP.size.width / 2 &&
      bastion.y === TRI_GATE_MAP.size.height / 2,
    individualSlotPolicy:
      TRI_GATE_MAP.buildSlotPolicy.type === 'individual-pads' &&
      TRI_GATE_MAP.buildSlotPolicy.oneTowerPerSlot === true &&
      TRI_GATE_MAP.buildSlotPolicy.numericalTowerCap === null
  });
}
