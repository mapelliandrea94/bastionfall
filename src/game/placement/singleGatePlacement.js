import { SINGLE_GATE_MAP } from '../maps/singleGate.js';

export const PLACEMENT_RULES = Object.freeze({
  footprintRadius: 34,
  structureSpacing: 12,
  pathClearance: SINGLE_GATE_MAP.buildZones.clearanceFromPath,
  bastionClearance: SINGLE_GATE_MAP.buildZones.clearanceFromBastion
});

function pointInRect(point, rect, margin = 0) {
  return (
    point.x >= rect.x + margin &&
    point.x <= rect.x + rect.width - margin &&
    point.y >= rect.y + margin &&
    point.y <= rect.y + rect.height - margin
  );
}

function distanceToSegment(point, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return Math.hypot(point.x - from.x, point.y - from.y);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared)
  );
  const closestX = from.x + dx * t;
  const closestY = from.y + dy * t;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

function distanceToPath(point, waypoints) {
  let minimum = Number.POSITIVE_INFINITY;

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    minimum = Math.min(
      minimum,
      distanceToSegment(point, waypoints[index], waypoints[index + 1])
    );
  }

  return minimum;
}

export function validateSingleGatePlacement(point, placedStructures = [], footprintRadius = PLACEMENT_RULES.footprintRadius) {
  const buildZone = SINGLE_GATE_MAP.buildZones.zones.find((zone) =>
    pointInRect(point, zone, footprintRadius)
  );

  if (!buildZone) {
    return Object.freeze({ valid: false, reason: 'outside-build-zone', buildZoneId: null });
  }

  const pathDistance = distanceToPath(point, SINGLE_GATE_MAP.path.waypoints);
  const requiredPathDistance =
    SINGLE_GATE_MAP.path.width / 2 +
    PLACEMENT_RULES.pathClearance +
    footprintRadius;

  if (pathDistance < requiredPathDistance) {
    return Object.freeze({ valid: false, reason: 'too-close-to-path', buildZoneId: buildZone.id });
  }

  const bastionDistance = Math.hypot(
    point.x - SINGLE_GATE_MAP.anchors.bastion.x,
    point.y - SINGLE_GATE_MAP.anchors.bastion.y
  );

  if (bastionDistance < PLACEMENT_RULES.bastionClearance + footprintRadius) {
    return Object.freeze({ valid: false, reason: 'too-close-to-bastion', buildZoneId: buildZone.id });
  }

  const blockedBy = placedStructures.find((structure) => {
    const otherRadius = structure.footprintRadius ?? PLACEMENT_RULES.footprintRadius;
    const minimumDistance = footprintRadius + otherRadius + PLACEMENT_RULES.structureSpacing;
    return Math.hypot(point.x - structure.x, point.y - structure.y) < minimumDistance;
  });

  if (blockedBy) {
    return Object.freeze({
      valid: false,
      reason: 'overlaps-structure',
      buildZoneId: buildZone.id,
      blockedById: blockedBy.id ?? null
    });
  }

  return Object.freeze({
    valid: true,
    reason: 'ok',
    buildZoneId: buildZone.id,
    pathDistance: Number(pathDistance.toFixed(2)),
    bastionDistance: Number(bastionDistance.toFixed(2))
  });
}

export function getPlacementValidationFixtures() {
  return Object.freeze([
    Object.freeze({
      id: 'valid-north-west',
      point: Object.freeze({ x: 260, y: 155 }),
      placedStructures: Object.freeze([]),
      expectValid: true
    }),
    Object.freeze({
      id: 'outside-zone',
      point: Object.freeze({ x: 80, y: 450 }),
      placedStructures: Object.freeze([]),
      expectValid: false
    }),
    Object.freeze({
      id: 'near-path',
      point: Object.freeze({ x: 520, y: 330 }),
      placedStructures: Object.freeze([]),
      expectValid: false
    }),
    Object.freeze({
      id: 'near-bastion',
      point: Object.freeze({ x: 1390, y: 450 }),
      placedStructures: Object.freeze([]),
      expectValid: false
    }),
    Object.freeze({
      id: 'overlaps-structure',
      point: Object.freeze({ x: 260, y: 155 }),
      placedStructures: Object.freeze([
        Object.freeze({ id: 'existing-tower', x: 280, y: 155, footprintRadius: 34 })
      ]),
      expectValid: false
    })
  ]);
}
