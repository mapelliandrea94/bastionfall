import assert from 'node:assert/strict';
import { getRiskRewardVisualState } from '../src/game/balance/riskReward.js';

const active = getRiskRewardVisualState('single-gate', 'pressure', 'active');
assert.equal(active.active, true);
assert.equal(active.label, 'PRESSURE WAVE');
assert.equal(active.threatMultiplier, 1.25);

assert.equal(getRiskRewardVisualState('single-gate', 'pressure', 'preparation').active, false);
assert.equal(getRiskRewardVisualState('single-gate', 'safe', 'active').active, false);

const sudden = getRiskRewardVisualState('sudden-siege', 'pressure', 'active');
assert.equal(sudden.active, true);
assert.equal(sudden.threatMultiplier, 1.15);
assert.equal(sudden.flatGoldBonus, 1);

console.log('RISK_REWARD_VISUAL_PASS');
