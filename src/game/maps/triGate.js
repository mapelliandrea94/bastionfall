export const TRI_GATE_MAP = Object.freeze({
  id: 'tri-gate-three-fronts',
  version: 2,
  mode: 'tri-gate',
  name: 'Three Fronts',
  size: Object.freeze({
    width: 1600,
    height: 900
  }),
  anchors: Object.freeze({
    bastion: Object.freeze({
      id: 'tri-gate-bastion-core',
      x: 918,
      y: 430
    }),
    entrances: Object.freeze([
      Object.freeze({
        id: 'west-gate',
        side: 'west',
        x: 0,
        y: 374
      }),
      Object.freeze({
        id: 'north-gate',
        side: 'north',
        x: 950,
        y: 0
      }),
      Object.freeze({
        id: 'south-gate',
        side: 'south',
        x: 950,
        y: 900
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
          Object.freeze({ x: 0, y: 374 }),
          Object.freeze({ x: 155, y: 386 }),
          Object.freeze({ x: 315, y: 354 }),
          Object.freeze({ x: 450, y: 397 }),
          Object.freeze({ x: 610, y: 415 }),
          Object.freeze({ x: 750, y: 410 }),
          Object.freeze({ x: 918, y: 430 })
        ])
      }),
      Object.freeze({
        id: 'tri-gate-north-lane',
        entranceId: 'north-gate',
        destinationId: 'tri-gate-bastion-core',
        width: 88,
        waypoints: Object.freeze([
          Object.freeze({ x: 950, y: 0 }),
          Object.freeze({ x: 953, y: 61 }),
          Object.freeze({ x: 1009, y: 146 }),
          Object.freeze({ x: 990, y: 225 }),
          Object.freeze({ x: 958, y: 290 }),
          Object.freeze({ x: 918, y: 430 })
        ])
      }),
      Object.freeze({
        id: 'tri-gate-south-lane',
        entranceId: 'south-gate',
        destinationId: 'tri-gate-bastion-core',
        width: 88,
        waypoints: Object.freeze([
          Object.freeze({ x: 950, y: 900 }),
          Object.freeze({ x: 952, y: 783 }),
          Object.freeze({ x: 971, y: 695 }),
          Object.freeze({ x: 1002, y: 623 }),
          Object.freeze({ x: 950, y: 545 }),
          Object.freeze({ x: 918, y: 430 })
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
    slotsDefinedAfterPathGeometry: true,
    slots: Object.freeze([
      [207,352], [308,322], [458,367], [665,396], [402,459], [565,470], [767,500],
      [880,78], [1067,87], [963,137], [1125,170], [936,238], [1067,260],
      [1051,563], [905,586], [992,652], [1133,674], [930,777], [1082,784]
    ].map(([x, y], index) => Object.freeze({
      id: `tri-slot-${String(index + 1).padStart(2, '0')}`,
      x: Math.round(x * 1600 / 1672),
      y: Math.round(y * 900 / 941)
    })))
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
      Math.abs(bastion.x - TRI_GATE_MAP.size.width / 2) < 130 &&
      Math.abs(bastion.y - TRI_GATE_MAP.size.height / 2) < 50,
    individualSlotPolicy:
      TRI_GATE_MAP.buildSlotPolicy.type === 'individual-pads' &&
      TRI_GATE_MAP.buildSlotPolicy.oneTowerPerSlot === true &&
      TRI_GATE_MAP.buildSlotPolicy.numericalTowerCap === null
  });
}
