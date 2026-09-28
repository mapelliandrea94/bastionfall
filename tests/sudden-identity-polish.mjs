import assert from 'node:assert/strict';
import {
  getSuddenSiegeTelemetry,
  getSuddenSiegeWaveReward
} from '../src/game/balance/suddenSiege.js';

const opening = getSuddenSiegeTelemetry(3);
const escalation = getSuddenSiegeTelemetry(10);
const onslaught = getSuddenSiegeTelemetry(18);
const endless = getSuddenSiegeTelemetry(25);

assert.equal(opening.stage, 'OPENING');
assert.equal(escalation.stage, 'ESCALATION');
assert.equal(onslaught.stage, 'ONSLAUGHT');
assert.equal(endless.stage, 'ENDLESS');
assert.ok(opening.threatMultiplier < endless.threatMultiplier);
assert.ok(opening.hpMultiplier < endless.hpMultiplier);
assert.equal(escalation.waveReward, getSuddenSiegeWaveReward(10));
assert.equal(endless.preparationSeconds, 9);

console.log('SUDDEN_IDENTITY_POLISH_PASS');
