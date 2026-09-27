import { SINGLE_GATE_MAP, getSingleGatePathForWalls } from '../maps/singleGate.js';

export const WALL_SYSTEM = Object.freeze({
  maxActive: SINGLE_GATE_MAP.wallSlots.maximumActive,
  cost: SINGLE_GATE_MAP.wallSlots.defaultCost,
  maxHp: 1000,
  damageTickMs: 500,
  infantryDamagePerTick: 24,
  armoredDamagePerTick: 48,
  refundRate: 0,
  compatibleModes: SINGLE_GATE_MAP.compatibleModes
});

export function getWallSocket(wallId) {
  return SINGLE_GATE_MAP.wallSlots.sockets.find((wall) => wall.id === wallId) ?? null;
}

export function canPurchaseWall({ wallId, gold, activeWallIds = [] }) {
  const socket = getWallSocket(wallId);
  if (!socket) return Object.freeze({ ok: false, reason: 'invalid-wall', cost: WALL_SYSTEM.cost });
  if (activeWallIds.includes(wallId)) return Object.freeze({ ok: false, reason: 'already-built', cost: WALL_SYSTEM.cost });
  if (activeWallIds.length >= WALL_SYSTEM.maxActive) return Object.freeze({ ok: false, reason: 'wall-cap-reached', cost: WALL_SYSTEM.cost });
  if ((Number(gold) || 0) < WALL_SYSTEM.cost) return Object.freeze({ ok: false, reason: 'insufficient-gold', cost: WALL_SYSTEM.cost });
  return Object.freeze({ ok: true, reason: 'ok', cost: WALL_SYSTEM.cost });
}

export function purchaseWall({ wallId, gold, activeWallIds = [] }) {
  const validation = canPurchaseWall({ wallId, gold, activeWallIds });
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      reason: validation.reason,
      goldAfter: Number(gold) || 0,
      activeWallIds: Object.freeze([...activeWallIds]),
      path: getSingleGatePathForWalls(activeWallIds)
    });
  }

  const nextIds = Object.freeze([...activeWallIds, wallId]);
  return Object.freeze({
    ok: true,
    reason: 'built',
    wallId,
    goldAfter: (Number(gold) || 0) - validation.cost,
    activeWallIds: nextIds,
    path: getSingleGatePathForWalls(nextIds)
  });
}

export function getWallSystemFixtures() {
  const ids = SINGLE_GATE_MAP.wallSlots.sockets.map((wall) => wall.id);
  const allBuiltPath = getSingleGatePathForWalls(ids);
  return Object.freeze({
    socketCount: ids.length,
    maximumActive: WALL_SYSTEM.maxActive,
    allSocketIdsUnique: new Set(ids).size === ids.length,
    allWallsKeepPathOpen:
      allBuiltPath.length === SINGLE_GATE_MAP.path.waypoints.length &&
      allBuiltPath.every((point, index) => {
        const base = SINGLE_GATE_MAP.path.waypoints[index];
        return point.x === base.x && point.y === base.y;
      }),
    compatibleWithSingleGate: WALL_SYSTEM.compatibleModes.includes('single-gate'),
    compatibleWithTftShop: WALL_SYSTEM.compatibleModes.includes('tft-shop')
  });
}
