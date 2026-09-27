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
        destinationId: 'tri-gate-bastion-core'
      }),
      Object.freeze({
        id: 'tri-gate-north-lane',
        entranceId: 'north-gate',
        destinationId: 'tri-gate-bastion-core'
      }),
      Object.freeze({
        id: 'tri-gate-south-lane',
        entranceId: 'south-gate',
        destinationId: 'tri-gate-bastion-core'
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

export function getTriGateMapFixtures() {
  const entranceIds = new Set(TRI_GATE_MAP.anchors.entrances.map((entrance) => entrance.id));
  const laneIds = new Set(TRI_GATE_MAP.pathPlan.lanes.map((lane) => lane.id));
  const lanesResolve = TRI_GATE_MAP.pathPlan.lanes.every(
    (lane) =>
      entranceIds.has(lane.entranceId) &&
      lane.destinationId === TRI_GATE_MAP.anchors.bastion.id
  );

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
    bastionCentered:
      TRI_GATE_MAP.anchors.bastion.x === TRI_GATE_MAP.size.width / 2 &&
      TRI_GATE_MAP.anchors.bastion.y === TRI_GATE_MAP.size.height / 2,
    individualSlotPolicy:
      TRI_GATE_MAP.buildSlotPolicy.type === 'individual-pads' &&
      TRI_GATE_MAP.buildSlotPolicy.oneTowerPerSlot === true &&
      TRI_GATE_MAP.buildSlotPolicy.numericalTowerCap === null
  });
}
