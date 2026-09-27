import {
  clearLastBastionMatchForUser,
  getLastBastionActiveMatchPersistenceSnapshot,
  getLastBastionMatchmakingFixtures,
  getLastBastionQueueStatus,
  getLastBastionMatchStatus,
  hydrateLastBastionActiveMatches,
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

const reconnectA = 'restart-fixture-a';
const reconnectB = 'restart-fixture-b';
const reconnectMatchId = 'restart-match-001';
const reconnectStartedAt = '2026-09-27T20:10:05.000Z';

const hydratedRestart = hydrateLastBastionActiveMatches(
  [{
    id: reconnectMatchId,
    seed: 'last-bastion:restart-match-001',
    status: 'active',
    created_at: '2026-09-27T20:10:00.000Z',
    started_at: reconnectStartedAt,
    wave_starts_at: reconnectStartedAt,
    winner_user_id: null,
    ended_at: null
  }],
  [
    {
      match_id: reconnectMatchId,
      user_id: reconnectA,
      slot: 1,
      alive: true,
      last_seen_at: '2026-09-27T20:10:10.000Z',
      wave: 9,
      core_hp: 15,
      placement: null,
      eliminated_at: null
    },
    {
      match_id: reconnectMatchId,
      user_id: reconnectB,
      slot: 2,
      alive: true,
      last_seen_at: '2026-09-27T20:10:11.000Z',
      wave: 9,
      core_hp: 18,
      placement: null,
      eliminated_at: null
    }
  ]
);

hydrateLastBastionQueue([
  {
    ticketId: 'stale-restart-ticket',
    userId: reconnectA,
    joinedAt: '2026-09-27T20:09:00.000Z',
    ready: true
  }
]);

const reconnectStatusA = getLastBastionMatchStatus(reconnectA, reconnectMatchId, Date.parse('2026-09-27T20:10:12.000Z'));
const reconnectQueueA = getLastBastionQueueStatus(reconnectA);

assert(hydratedRestart.hydratedMatches === 1, 'Restart hydration must restore the active match');
assert(hydratedRestart.hydratedParticipants === 2, 'Restart hydration must restore all match participants');
assert(reconnectStatusA.ok === true, 'Reconnected player must resolve its persisted active match');
assert(reconnectStatusA.match?.seed === 'last-bastion:restart-match-001', 'Reconnect must preserve the original shared seed');
assert(reconnectStatusA.match?.startedAt === reconnectStartedAt, 'Reconnect must preserve the original synchronized start');
assert(reconnectStatusA.match?.participants?.find((p) => p.self)?.slot === 1, 'Reconnect must preserve the original participant slot');
assert(reconnectStatusA.match?.participants?.find((p) => p.self)?.wave === 9, 'Reconnect must restore persisted wave progress');
assert(reconnectQueueA.matched === true && reconnectQueueA.queued === false, 'Active match must win over any stale queue ticket after restart');

clearLastBastionMatchForUser(reconnectA);
clearLastBastionMatchForUser(reconnectB);
hydrateLastBastionActiveMatches([], []);
hydrateLastBastionQueue([]);

const finishedA = 'finished-restart-a';
const finishedB = 'finished-restart-b';
const finishedMatchId = 'finished-match-001';
const finishedEndedAt = '2026-09-27T20:20:30.000Z';

const hydratedFinished = hydrateLastBastionActiveMatches(
  [{
    id: finishedMatchId,
    seed: 'last-bastion:finished-match-001',
    status: 'finished',
    created_at: '2026-09-27T20:20:00.000Z',
    started_at: '2026-09-27T20:20:05.000Z',
    wave_starts_at: '2026-09-27T20:20:05.000Z',
    winner_user_id: finishedB,
    ended_at: finishedEndedAt
  }],
  [
    {
      match_id: finishedMatchId,
      user_id: finishedA,
      slot: 1,
      alive: false,
      last_seen_at: finishedEndedAt,
      wave: 14,
      core_hp: 0,
      placement: 2,
      eliminated_at: finishedEndedAt
    },
    {
      match_id: finishedMatchId,
      user_id: finishedB,
      slot: 2,
      alive: true,
      last_seen_at: finishedEndedAt,
      wave: 14,
      core_hp: 7,
      placement: 1,
      eliminated_at: null
    }
  ]
);

const finishedStatusA = getLastBastionMatchStatus(finishedA, finishedMatchId, Date.parse('2026-09-27T20:21:00.000Z'));
const finishedStatusB = getLastBastionMatchStatus(finishedB, finishedMatchId, Date.parse('2026-09-27T20:21:00.000Z'));

assert(hydratedFinished.hydratedMatches === 1, 'Finished restart hydration must restore the completed match');
assert(hydratedFinished.hydratedParticipants === 2, 'Finished restart hydration must restore all final participants');
assert(finishedStatusA.ok === true && finishedStatusA.match?.status === 'finished', 'Loser must recover final finished status after restart');
assert(finishedStatusB.ok === true && finishedStatusB.match?.status === 'finished', 'Winner must recover final finished status after restart');
assert(finishedStatusB.match?.selfWon === true && finishedStatusB.match?.selfPlacement === 1, 'Winner result must survive restart');
assert(finishedStatusA.match?.selfWon === false && finishedStatusA.match?.selfPlacement === 2, 'Loser placement must survive restart');

hydrateLastBastionQueue([{
  ticketId: 'finished-player-new-ticket',
  userId: finishedB,
  joinedAt: '2026-09-27T20:22:00.000Z',
  ready: false
}]);
const finishedPlayerQueue = getLastBastionQueueStatus(finishedB);
assert(finishedPlayerQueue.queued === true && finishedPlayerQueue.matched === false, 'Recovered finished match must not block a new queue entry');

clearLastBastionMatchForUser(finishedA);
clearLastBastionMatchForUser(finishedB);
hydrateLastBastionActiveMatches([], []);
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
