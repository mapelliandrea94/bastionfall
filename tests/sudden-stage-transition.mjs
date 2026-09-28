import assert from 'node:assert/strict';
import { getSuddenSiegeStageTransition } from '../src/game/balance/suddenSiege.js';

const escalation = getSuddenSiegeStageTransition('OPENING', 'ESCALATION');
assert.equal(escalation.to, 'ESCALATION');
assert.equal(escalation.title, 'SIEGE ESCALATES');

const onslaught = getSuddenSiegeStageTransition('ESCALATION', 'ONSLAUGHT');
assert.equal(onslaught.to, 'ONSLAUGHT');

const endless = getSuddenSiegeStageTransition('ONSLAUGHT', 'ENDLESS');
assert.equal(endless.title, 'ENDLESS PRESSURE');

assert.equal(getSuddenSiegeStageTransition('ESCALATION', 'ESCALATION'), null);
assert.equal(getSuddenSiegeStageTransition('ONSLAUGHT', 'ESCALATION'), null);
assert.equal(getSuddenSiegeStageTransition(null, 'OPENING'), null);

console.log('SUDDEN_STAGE_TRANSITION_PASS');
