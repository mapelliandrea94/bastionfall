import assert from 'node:assert/strict';
import {
  getMiniObjectiveForWave,
  getMiniObjectiveLiveState
} from '../src/game/objectives/miniObjectives.js';

const flawless = getMiniObjectiveForWave(1);
assert.equal(getMiniObjectiveLiveState(flawless, { coreHp: 20, waveStartCoreHp: 20 }).status, 'on-track');
assert.equal(getMiniObjectiveLiveState(flawless, { coreHp: 19, waveStartCoreHp: 20 }).status, 'failed');

assert.equal(getMiniObjectiveForWave(5).id, 'flawless');
assert.equal(getMiniObjectiveForWave(10).id, 'lean-defense');
assert.equal(getMiniObjectiveForWave(11).id, 'faction-focus');
const lean = getMiniObjectiveForWave(6);
assert.equal(getMiniObjectiveLiveState(lean, { placedTowerCount: 8 }).label, 'ON TRACK');
assert.equal(getMiniObjectiveLiveState(lean, { placedTowerCount: 9 }).label, 'OVER LIMIT');

console.log('MINI_OBJECTIVE_VISUAL_PASS');
