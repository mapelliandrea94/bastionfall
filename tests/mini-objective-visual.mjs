import assert from 'node:assert/strict';
import {
  getMiniObjectiveForWave,
  getMiniObjectiveLiveState
} from '../src/game/objectives/miniObjectives.js';

const flawless = getMiniObjectiveForWave(1);
assert.equal(getMiniObjectiveLiveState(flawless, { coreHp: 20, waveStartCoreHp: 20 }).status, 'on-track');
assert.equal(getMiniObjectiveLiveState(flawless, { coreHp: 19, waveStartCoreHp: 20 }).status, 'failed');

const lean = getMiniObjectiveForWave(2);
assert.equal(getMiniObjectiveLiveState(lean, { placedTowerCount: 8 }).label, 'ON TRACK');
assert.equal(getMiniObjectiveLiveState(lean, { placedTowerCount: 9 }).label, 'OVER LIMIT');

console.log('MINI_OBJECTIVE_VISUAL_PASS');
