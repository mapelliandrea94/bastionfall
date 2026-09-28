import './online-run-resume.mjs';
import './race-state-cleanup.mjs';
import './standard-run-validation.mjs';
import assert from 'node:assert/strict';
import {
  END_TO_END_PAIR_MATRIX,
  getEndToEndRegressionPass,
  getEndToEndRegressionQa
} from '../src/game/balance/endToEndRegressionQa.js';

const qa = getEndToEndRegressionQa();

assert.equal(END_TO_END_PAIR_MATRIX.length, 576, 'expected full 24 x 24 pair matrix');
assert.equal(qa.full576PairMatrix, true, '24 x 24 pair coverage failed');
assert.equal(qa.perfectDoubleCounterPresent, true, '2.25 double-counter regression');
assert.equal(qa.doublePenaltyPresent, true, '0.5625 double-penalty regression');
assert.equal(qa.antiAirSpecialistsTargetAir, true, 'anti-air specialists must target flying enemies');
assert.equal(qa.allOffenseCanTargetAir, true, 'all offensive towers must target flying enemies in range');
assert.equal(qa.damageProfilesResolveFinite, true, 'damage profile produced invalid values');
assert.equal(qa.allEvolutionRuntimeStatsValid, true, 'evolution runtime stats/identity regression');
assert.equal(qa.noLegacyEvolutionDependencies, true, 'legacy six-tower dependency detected');
assert.equal(qa.fourModeRegressionSurface, true, 'four-mode regression surface missing');
assert.equal(getEndToEndRegressionPass(), true, 'end-to-end regression suite failed');

console.log('BATCH 118 end-to-end regression: PASS');
console.log(JSON.stringify(qa, null, 2));
