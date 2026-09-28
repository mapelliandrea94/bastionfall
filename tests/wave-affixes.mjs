import assert from 'node:assert/strict';
import { WAVE_AFFIXES, applyWaveAffix, getWaveAffix } from '../src/game/waves/waveAffixes.js';

const sample = { hp: 100, maxHp: 100, moveSpeed: 1, armor: 10, shield: 20, maxShield: 20 };
const fortified = applyWaveAffix(sample, WAVE_AFFIXES.find((entry) => entry.id === 'fortified'));
const swarming = WAVE_AFFIXES.find((entry) => entry.id === 'swarming');

assert.equal(fortified.maxHp, 120);
assert.ok(swarming.spawnIntervalMultiplier < 1);
assert.equal(getWaveAffix('same-seed', 14)?.id, getWaveAffix('same-seed', 14)?.id);
assert.equal(getWaveAffix('same-seed', 20, { bossWave: true }), null);
console.log('WAVE_AFFIXES_PASS');
