import assert from 'node:assert/strict';
import {
  SINGLE_GATE_MAP,
  getSingleGatePathForWalls
} from '../src/game/maps/singleGate.js';
import {
  WALL_SYSTEM,
  getWallSystemFixtures,
  purchaseWall
} from '../src/game/structures/walls.js';
import {
  validateSingleGateSlotPlacement
} from '../src/game/placement/singleGatePlacement.js';

const wallIds = SINGLE_GATE_MAP.wallSlots.sockets.map((wall) => wall.id);

assert.equal(wallIds.length, 4, 'battlefield must expose exactly four wall sockets');
assert.equal(WALL_SYSTEM.maxActive, 4, 'wall cap must be four');
assert.equal(new Set(wallIds).size, 4, 'wall ids must be unique');
assert.equal(SINGLE_GATE_MAP.compatibleModes.includes('single-gate'), true);
assert.equal(SINGLE_GATE_MAP.compatibleModes.includes('tower-draft'), true);

const basePath = getSingleGatePathForWalls([]);
const allWallsPath = getSingleGatePathForWalls(wallIds);
assert.equal(basePath[0].x, SINGLE_GATE_MAP.anchors.enemySpawn.x);
assert.equal(basePath.at(-1).x, SINGLE_GATE_MAP.anchors.bastion.x);
assert.ok(allWallsPath.length > basePath.length, 'all walls must add detour waypoints');
assert.deepEqual(allWallsPath.at(-1), {
  x: SINGLE_GATE_MAP.anchors.bastion.x,
  y: SINGLE_GATE_MAP.anchors.bastion.y
});

let gold = 20;
let activeWallIds = [];
for (const wallId of wallIds) {
  const attempt = purchaseWall({ wallId, gold, activeWallIds });
  assert.equal(attempt.ok, true, `${wallId} should be purchasable`);
  gold = attempt.goldAfter;
  activeWallIds = [...attempt.activeWallIds];
}
assert.equal(activeWallIds.length, 4);
assert.equal(purchaseWall({ wallId: wallIds[0], gold, activeWallIds }).ok, false);

for (const slot of SINGLE_GATE_MAP.buildSlots.slots) {
  const validation = validateSingleGateSlotPlacement(slot.id, []);
  assert.equal(validation.valid, true, `${slot.id} must remain valid beside the serpentine path`);
}

const fixtures = getWallSystemFixtures();
assert.equal(fixtures.allWallsKeepPathOpen, true);
assert.equal(fixtures.compatibleWithSingleGate, true);
assert.equal(fixtures.compatibleWithTowerDraft, true);

console.log('serpentine wall QA passed');
