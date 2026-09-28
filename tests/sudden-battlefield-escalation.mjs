import assert from 'node:assert/strict';
import { getSuddenSiegeBattlefieldVisual } from '../src/game/balance/suddenSiege.js';

const opening = getSuddenSiegeBattlefieldVisual(3);
const escalation = getSuddenSiegeBattlefieldVisual(10);
const onslaught = getSuddenSiegeBattlefieldVisual(18);
const endless = getSuddenSiegeBattlefieldVisual(25);

assert.equal(opening.stage, 'OPENING');
assert.equal(escalation.className, 'escalation');
assert.ok(opening.intensity < escalation.intensity);
assert.ok(escalation.intensity < onslaught.intensity);
assert.ok(onslaught.intensity < endless.intensity);
assert.ok(opening.pulseMs > escalation.pulseMs);
assert.ok(escalation.pulseMs > onslaught.pulseMs);
assert.ok(onslaught.pulseMs > endless.pulseMs);
assert.equal(endless.label, 'ENDLESS PRESSURE');

console.log('SUDDEN_BATTLEFIELD_ESCALATION_PASS');
