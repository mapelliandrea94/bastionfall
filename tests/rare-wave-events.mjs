import assert from 'node:assert/strict';
import { RARE_WAVE_EVENTS, applyRareWaveEvent, getRareWaveEvent } from '../src/game/waves/rareWaveEvents.js';

const sample = { hp: 100, maxHp: 100, moveSpeed: 1 };
const juggernaut = applyRareWaveEvent(sample, RARE_WAVE_EVENTS.find((entry) => entry.id === 'juggernaut-march'));
const rush = applyRareWaveEvent(sample, RARE_WAVE_EVENTS.find((entry) => entry.id === 'blood-rush'));

assert.equal(juggernaut.maxHp, 138);
assert.equal(rush.moveSpeed, 1.22);
assert.ok(RARE_WAVE_EVENTS.every((event) => event.bonusGold > 0));
assert.equal(getRareWaveEvent('same-seed', 18)?.id, getRareWaveEvent('same-seed', 18)?.id);
assert.equal(getRareWaveEvent('same-seed', 20, { bossWave: true }), null);
console.log('RARE_WAVE_EVENTS_PASS');
