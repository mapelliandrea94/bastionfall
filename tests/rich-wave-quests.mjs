import assert from 'node:assert/strict';
import {
  evaluateMiniObjective,
  getMiniObjectiveForWave,
  getMiniObjectiveLiveState
} from '../src/game/objectives/miniObjectives.js';

assert.equal(getMiniObjectiveForWave(1).id, 'flawless');
assert.equal(getMiniObjectiveForWave(6).id, 'lean-defense');
assert.equal(getMiniObjectiveForWave(11).id, 'faction-focus');
assert.equal(getMiniObjectiveForWave(16).id, 'pressure-clear');
assert.equal(getMiniObjectiveForWave(21).id, 'war-chest');
assert.equal(getMiniObjectiveForWave(26).id, 'evolved-arsenal');

assert.equal(evaluateMiniObjective(getMiniObjectiveForWave(11), { factionCount: 2 }), true);
assert.equal(evaluateMiniObjective(getMiniObjectiveForWave(16), { riskRewardTier: 'pressure' }), true);
assert.equal(evaluateMiniObjective(getMiniObjectiveForWave(21), { gold: 10 }), true);
assert.equal(evaluateMiniObjective(getMiniObjectiveForWave(26), { evolvedTowerCount: 1 }), true);
assert.equal(getMiniObjectiveLiveState(getMiniObjectiveForWave(11), { factionCount: 3 }).status, 'over-limit');
console.log('RICH_WAVE_QUESTS_PASS');
