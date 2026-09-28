import assert from 'node:assert/strict';
import {
  getTowerSynergyState,
  getTowerSynergyVisualCue
} from '../src/game/towers/towerSynergies.js';

const definitions = {
  h1: { faction: 'human' },
  h2: { faction: 'human' },
  h3: { faction: 'human' },
  i1: { faction: 'insect' }
};

const activeState = getTowerSynergyState(
  [{ defenseId: 'h1' }, { defenseId: 'h2' }, { defenseId: 'h3' }, { defenseId: 'i1' }],
  definitions
);

const human = getTowerSynergyVisualCue({ faction: 'human' }, activeState);
const insect = getTowerSynergyVisualCue({ faction: 'insect' }, activeState);
const unknown = getTowerSynergyVisualCue({}, activeState);

assert.equal(human.active, true);
assert.equal(human.faction, 'human');
assert.equal(human.name, 'Targeting Grid');
assert.equal(insect.active, false);
assert.equal(insect.faction, 'insect');
assert.equal(unknown.active, false);
assert.equal(unknown.faction, null);

console.log('TOWER_SYNERGY_VISUAL_PASS');
