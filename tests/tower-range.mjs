import assert from 'node:assert/strict';
import { getEffectiveTowerRange, getTowerRangeKind } from '../src/game/towers/towerRange.js';

assert.equal(getEffectiveTowerRange({ range: 260 }), 260);
assert.equal(getEffectiveTowerRange({ range: 180, buffRadius: 210 }), 210);
assert.equal(getEffectiveTowerRange({ range: 0, buffRadius: 0 }), 0);
assert.equal(getTowerRangeKind({ range: 180, buffRadius: 210 }), 'support');
assert.equal(getTowerRangeKind({ range: 260 }), 'attack');

console.log('TOWER_RANGE_PASS');
