import {
  getLastBastionMatchmakingFixtures
} from '../server/lastBastionMatchmaking.js';
import { generateWavePlan } from '../src/game/spawning/waveDirector.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const fixture = getLastBastionMatchmakingFixtures();

assert(fixture.joinCreatesTicket, 'Last Bastion join must create a ticket');
assert(fixture.duplicateJoinIsIdempotent, 'Duplicate queue join must be idempotent');
assert(fixture.queuePositionTracksOrder, 'Queue order must remain deterministic');
assert(fixture.firstReadyWaitsForMinimum, 'One ready player must not start a match');
assert(fixture.secondReadyCreatesMatch, 'Two ready players must create a match');
assert(fixture.sharedSeed, 'Matched players must receive the same seed');
assert(fixture.sharedStart, 'Matched players must receive the same synchronized start');
assert(fixture.participantCountCorrect, 'Matched participant count must be consistent');
assert(fixture.matchedPlayersRemovedFromQueue, 'Matched players must leave the queue');
assert(fixture.heartbeatAccepted, 'Last Bastion heartbeat must be accepted');
assert(fixture.heartbeatUpdatesProgress, 'Heartbeat must update participant wave/core HP');
assert(fixture.heartbeatMarksConnected, 'Fresh heartbeat must mark participant connected');
assert(fixture.timeoutMarksDisconnectedWithoutElimination, 'Heartbeat timeout must mark disconnected without eliminating the participant');

const seed = 'last-bastion:sync-fixture';
const playerA = generateWavePlan({ seed, waveNumber: 18, mode: 'last-bastion' });
const playerB = generateWavePlan({ seed, waveNumber: 18, mode: 'last-bastion' });

assert(
  JSON.stringify(playerA.composition) === JSON.stringify(playerB.composition),
  'Same Last Bastion seed must generate identical wave composition'
);
assert(playerA.seed === playerB.seed, 'Wave Director deterministic seed must match');

console.log('Last Bastion shared-seed QA PASS', {
  matchmaking: fixture,
  waveSeed: playerA.seed,
  enemyCount: playerA.enemyCount
});
