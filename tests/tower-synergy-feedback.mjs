import assert from 'node:assert/strict';
import {
  getNewlyActivatedTowerSynergies,
  getTowerSynergyState
} from '../src/game/towers/towerSynergies.js';

const definitions = {
  h1: { faction: 'human' },
  h2: { faction: 'human' },
  h3: { faction: 'human' },
  a1: { faction: 'alien' },
  a2: { faction: 'alien' },
  a3: { faction: 'alien' }
};

const humanState = getTowerSynergyState(
  [{ defenseId: 'h1' }, { defenseId: 'h2' }, { defenseId: 'h3' }],
  definitions
);
const firstActivation = getNewlyActivatedTowerSynergies(
  { human: false, insect: false, alien: false, neutral: false },
  humanState
);
assert.equal(firstActivation.length, 1);
assert.equal(firstActivation[0].faction, 'human');

const repeated = getNewlyActivatedTowerSynergies(
  { human: true, insect: false, alien: false, neutral: false },
  humanState
);
assert.equal(repeated.length, 0);

const alienState = getTowerSynergyState(
  [{ defenseId: 'a1' }, { defenseId: 'a2' }, { defenseId: 'a3' }],
  definitions
);
const swappedActivation = getNewlyActivatedTowerSynergies(
  { human: true, insect: false, alien: false, neutral: false },
  alienState
);
assert.equal(swappedActivation.length, 1);
assert.equal(swappedActivation[0].faction, 'alien');

console.log('TOWER_SYNERGY_FEEDBACK_PASS');
