import { getWaveDirectorFixtures } from '../src/game/spawning/waveDirector.js';

const fixture = getWaveDirectorFixtures();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fixture.deterministicSameSeed, 'Same seed/wave/mode must be deterministic');
assert(fixture.differentSeedCanDiffer, 'Different seeds should be able to produce different legal waves');
assert(fixture.earlyNoAir, 'Air must not appear before the intended introduction');
assert(fixture.earlySingleFaction, 'Early waves must remain single-faction');
assert(fixture.airUnlockedAt15, 'Air must be available from wave 15');
assert(fixture.mixedFactionAllowed21Plus, 'Wave 21+ mixed-faction policy is invalid');
assert(fixture.allFactionPoolAvailable31Plus, 'Wave 31+ must allow all factions');
assert(fixture.eliteMilestone15, 'Wave 15 must be an elite milestone');
assert(fixture.bossMilestone10, 'Wave 10 must be a boss milestone');
assert(fixture.budgetRespected, 'Generated waves must respect threat budget');
assert(fixture.triGateDeterministic, 'Tri-Gate distribution must be deterministic');
assert(fixture.triGateHasThreeLanes, 'Tri-Gate must distribute across three lanes');
assert(fixture.endlessWaveValid, 'Late endless wave generation must remain valid');

console.log('Wave Director QA PASS', fixture);
