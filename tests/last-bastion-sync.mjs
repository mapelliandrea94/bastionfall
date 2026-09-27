import {
  clearLastBastionMatchForUser,
  getLastBastionActiveMatchPersistenceSnapshot,
  getLastBastionMatchmakingFixtures,
  getLastBastionQueueStatus,
  hydrateLastBastionQueue,
  setLastBastionReady
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
assert(fixture.invalidHeartbeatRejected, 'Invalid heartbeat payloads must be rejected');
assert(fixture.rateLimitWorks, 'Heartbeat spam must be rate-limited');
assert(fixture.waveRegressionRejected, 'Participant wave must not move backwards');
assert(fixture.desyncDetected, 'Wave spread beyond tolerance must flag desync');
assert(fixture.eliminationMarksDead, 'Eliminated participant must be marked dead');
assert(fixture.lastAliveWins, 'Last alive participant must resolve as winner');
assert(fixture.placementsResolve, 'Last Bastion winner/loser placements must resolve deterministically');

const persistedA = 'persisted-fixture-a';
const persistedB = 'persisted-fixture-b';
hydrateLastBastionQueue([
  {
    ticketId: 'persisted-ticket-a',
    userId: persistedA,
    joinedAt: '2026-09-27T20:00:00.000Z',
    ready: true
  },
  {
    ticketId: 'persisted-ticket-b',
    userId: persistedB,
    joinedAt: '2026-09-27T20:00:01.000Z',
    ready: false
  }
]);

const restoredA = getLastBastionQueueStatus(persistedA);
assert(restoredA.queued === true, 'Persisted queue hydration must restore queued users');
assert(restoredA.ticket?.ready === true, 'Persisted queue hydration must restore ready state');
assert(restoredA.ticket?.position === 1, 'Persisted queue hydration must preserve queue order');

const restoredMatch = setLastBastionReady(persistedB, true);
assert(restoredMatch.matched === true, 'Hydrated ready player must participate in matchmaking after restart');
assert(restoredMatch.match?.participantCount === 2, 'Hydrated queue must restore enough state to create a match');

const persistenceSnapshot = getLastBastionActiveMatchPersistenceSnapshot(persistedB);
assert(Boolean(persistenceSnapshot?.id), 'Matched Last Bastion state must expose a persistence match id');
assert(persistenceSnapshot?.seed === restoredMatch.match?.seed, 'Persistence snapshot must preserve shared match seed');
assert(persistenceSnapshot?.startedAt === restoredMatch.match?.startedAt, 'Persistence snapshot must preserve synchronized start');
assert(persistenceSnapshot?.participantIds?.length === 2, 'Persistence snapshot must contain every matched participant');

clearLastBastionMatchForUser(persistedA);
clearLastBastionMatchForUser(persistedB);
hydrateLastBastionQueue([]);

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
