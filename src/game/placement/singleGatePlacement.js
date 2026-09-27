import { SINGLE_GATE_MAP } from '../maps/singleGate.js';

export const PLACEMENT_RULES = Object.freeze({
  footprintRadius: SINGLE_GATE_MAP.buildSlots.footprintRadius,
  slotHitRadius: 44,
  minimumPathCenterDistance: SINGLE_GATE_MAP.buildSlots.minimumPathCenterDistance
});

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

export function getSingleGateBuildSlot(slotId) {
  return SINGLE_GATE_MAP.buildSlots.slots.find((slot) => slot.id === slotId) ?? null;
}

export function getSingleGateBuildSlotAtPoint(point) {
  return SINGLE_GATE_MAP.buildSlots.slots
    .map((slot) => ({
      slot,
      distance: Math.hypot(point.x - slot.x, point.y - slot.y)
    }))
    .filter((entry) => entry.distance <= PLACEMENT_RULES.slotHitRadius)
    .sort((a, b) => a.distance - b.distance)[0]?.slot ?? null;
}

export function validateSingleGateSlotPlacement(slotId, placedStructures = []) {
  const slot = getSingleGateBuildSlot(slotId);

  if (!slot) {
    return Object.freeze({ valid: false, reason: 'invalid-slot', slotId: null });
  }

  const occupied = placedStructures.find((structure) => structure.slotId === slot.id);
  if (occupied) {
    return Object.freeze({
      valid: false,
      reason: 'slot-occupied',
      slotId: slot.id,
      blockedById: occupied.id ?? null
    });
  }

  const pathDistance = distanceToPath(slot, SINGLE_GATE_MAP.path.waypoints);
  if (pathDistance < PLACEMENT_RULES.minimumPathCenterDistance) {
    return Object.freeze({
      valid: false,
      reason: 'slot-too-close-to-path',
      slotId: slot.id,
      pathDistance: Number(pathDistance.toFixed(2))
    });
  }

  return Object.freeze({
    valid: true,
    reason: 'ok',
    slotId: slot.id,
    pathDistance: Number(pathDistance.toFixed(2))
  });
}

export function validateSingleGatePlacement(point, placedStructures = []) {
  const slot = getSingleGateBuildSlotAtPoint(point);

  if (!slot) {
    return Object.freeze({ valid: false, reason: 'not-a-build-slot', slotId: null });
  }

  return validateSingleGateSlotPlacement(slot.id, placedStructures);
}

export function tryPurchaseDefenseOnSlot({
  slotId,
  defense,
  gold,
  placedStructures = []
}) {
  const placement = validateSingleGateSlotPlacement(slotId, placedStructures);
  if (!placement.valid) {
    return Object.freeze({ ok: false, reason: placement.reason, goldAfter: gold, structure: null });
  }

  const cost = Math.max(0, Number(defense?.cost) || 0);
  if ((Number(gold) || 0) < cost) {
    return Object.freeze({ ok: false, reason: 'insufficient-gold', goldAfter: gold, structure: null });
  }

  const slot = getSingleGateBuildSlot(slotId);
  const structure = Object.freeze({
    id: `${slot.id}-${defense.id}`,
    slotId: slot.id,
    defenseId: defense.id,
    x: slot.x,
    y: slot.y,
    footprintRadius: PLACEMENT_RULES.footprintRadius,
    level: 1,
    investedGold: cost
  });

  return Object.freeze({
    ok: true,
    reason: 'built',
    goldAfter: (Number(gold) || 0) - cost,
    structure
  });
}

export function getPlacementValidationFixtures() {
  const firstSlot = SINGLE_GATE_MAP.buildSlots.slots[0];

  return Object.freeze([
    Object.freeze({
      id: 'valid-slot',
      point: Object.freeze({ x: firstSlot.x, y: firstSlot.y }),
      placedStructures: Object.freeze([]),
      expectValid: true
    }),
    Object.freeze({
      id: 'off-slot',
      point: Object.freeze({ x: 80, y: 450 }),
      placedStructures: Object.freeze([]),
      expectValid: false
    }),
    Object.freeze({
      id: 'occupied-slot',
      point: Object.freeze({ x: firstSlot.x, y: firstSlot.y }),
      placedStructures: Object.freeze([
        Object.freeze({ id: 'existing-tower', slotId: firstSlot.id, x: firstSlot.x, y: firstSlot.y })
      ]),
      expectValid: false
    })
  ]);
}

export function getTowerSlotPurchaseFixtures(defenses, startingGold) {
  const results = [];

  for (const defense of defenses) {
    for (const slot of SINGLE_GATE_MAP.buildSlots.slots) {
      const attempt = tryPurchaseDefenseOnSlot({
        slotId: slot.id,
        defense,
        gold: startingGold,
        placedStructures: []
      });

      results.push(Object.freeze({
        defenseId: defense.id,
        slotId: slot.id,
        expected: true,
        actual: attempt.ok,
        deductedCorrectly: attempt.ok
          ? attempt.goldAfter === startingGold - defense.cost
          : false
      }));
    }
  }

  return Object.freeze(results);
}
