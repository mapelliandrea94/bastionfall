import assert from 'node:assert/strict';
import { getBlessingIdentityVisualCue } from '../src/game/blessings/blessingEngine.js';

const human = getBlessingIdentityVisualCue({ faction: 'human' }, ['human-doctrine']);
assert.equal(human.active, true);
assert.equal(human.blessingId, 'human-doctrine');
assert.equal(human.name, 'Human Doctrine');

const insectInactive = getBlessingIdentityVisualCue({ faction: 'insect' }, ['human-doctrine']);
assert.equal(insectInactive.active, false);

const alien = getBlessingIdentityVisualCue({ faction: 'alien' }, ['alien-overmind']);
assert.equal(alien.active, true);
assert.equal(alien.name, 'Alien Overmind');

const neutral = getBlessingIdentityVisualCue({ faction: 'neutral' }, ['neutral-covenant']);
assert.equal(neutral.active, true);

console.log('IDENTITY_BLESSING_VISUAL_PASS');
