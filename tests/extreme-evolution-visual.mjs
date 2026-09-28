import assert from 'node:assert/strict';
import {
  chooseTowerEvolution,
  getEvolutionVisualCue
} from '../src/game/towers/evolutions.js';

const base = { defenseId: 'human-aa', level: 4, evolution: null };
assert.equal(getEvolutionVisualCue(base).active, false);

const branchA = chooseTowerEvolution(base, 'skypiercer-ballista');
const visualA = getEvolutionVisualCue(branchA);
assert.equal(visualA.active, true);
assert.equal(visualA.branch, 'A');
assert.equal(visualA.name, 'Skypiercer Ballista');

const branchB = chooseTowerEvolution(base, 'flak-bastion');
const visualB = getEvolutionVisualCue(branchB);
assert.equal(visualB.active, true);
assert.equal(visualB.branch, 'B');

console.log('EXTREME_EVOLUTION_VISUAL_PASS');
