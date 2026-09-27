import { randomUUID } from 'node:crypto';

export const LAST_BASTION_MATCHMAKING = Object.freeze({
  version: 2,
  mode: 'last-bastion',
  minPlayers: 2,
  maxPlayers: 8,
  synchronizedStartDelayMs: 5000
});

const queue = [];
const byUserId = new Map();
const activeMatchByUserId = new Map();

function publicMatch(match, userId) {
  if (!match || !match.participantIds.includes(userId)) return null;
  return Object.freeze({
    id: match.id,
    mode: LAST_BASTION_MATCHMAKING.mode,
    seed: match.seed,
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    waveStartsAt: match.waveStartsAt,
    participantCount: match.participantIds.length
  });
}

function snapshot(entry) {
  if (!entry) return null;
  const position = queue.findIndex((item) => item.userId === entry.userId);
  const activeMatch = activeMatchByUserId.get(entry.userId);
  return Object.freeze({
    ticketId: entry.ticketId,
    userId: entry.userId,
    joinedAt: entry.joinedAt,
    ready: Boolean(entry.ready),
    status: activeMatch ? 'matched' : entry.ready ? 'ready' : 'queued',
    position: activeMatch ? null : position >= 0 ? position + 1 : null,
    queuedPlayers: queue.length,
    match: publicMatch(activeMatch, entry.userId)
  });
}

function tryCreateReadyMatch() {
  const readyEntries = queue
    .filter((entry) => entry.ready && !activeMatchByUserId.has(entry.userId))
    .slice(0, LAST_BASTION_MATCHMAKING.maxPlayers);

  if (readyEntries.length < LAST_BASTION_MATCHMAKING.minPlayers) return null;

  const createdAtMs = Date.now();
  const matchId = randomUUID();
  const startedAtMs = createdAtMs + LAST_BASTION_MATCHMAKING.synchronizedStartDelayMs;
  const participantIds = Object.freeze(readyEntries.map((entry) => entry.userId));
  const match = Object.freeze({
    id: matchId,
    seed: `last-bastion:${matchId}`,
    createdAt: new Date(createdAtMs).toISOString(),
    startedAt: new Date(startedAtMs).toISOString(),
    waveStartsAt: new Date(startedAtMs).toISOString(),
    participantIds
  });

  for (const entry of readyEntries) {
    activeMatchByUserId.set(entry.userId, match);
    const index = queue.findIndex((item) => item.userId === entry.userId);
    if (index >= 0) queue.splice(index, 1);
  }

  return match;
}

export function joinLastBastionQueue(userId) {
  const id = String(userId || '').trim();
  if (!id) return Object.freeze({ ok: false, error: 'invalid_user' });

  const activeMatch = activeMatchByUserId.get(id);
  if (activeMatch) {
    return Object.freeze({
      ok: true,
      created: false,
      matched: true,
      match: publicMatch(activeMatch, id),
      ticket: null
    });
  }

  const existing = byUserId.get(id);
  if (existing) {
    return Object.freeze({ ok: true, created: false, matched: false, ticket: snapshot(existing) });
  }

  const entry = Object.freeze({
    ticketId: randomUUID(),
    userId: id,
    joinedAt: new Date().toISOString(),
    ready: false
  });
  queue.push(entry);
  byUserId.set(id, entry);

  return Object.freeze({ ok: true, created: true, matched: false, ticket: snapshot(entry) });
}

export function leaveLastBastionQueue(userId) {
  const id = String(userId || '').trim();

  if (activeMatchByUserId.has(id)) {
    return Object.freeze({ ok: false, error: 'match_already_started' });
  }

  const existing = byUserId.get(id);
  if (!existing) {
    return Object.freeze({ ok: true, removed: false, queuedPlayers: queue.length });
  }

  const index = queue.findIndex((item) => item.userId === id);
  if (index >= 0) queue.splice(index, 1);
  byUserId.delete(id);

  return Object.freeze({ ok: true, removed: true, queuedPlayers: queue.length });
}

export function setLastBastionReady(userId, ready = true) {
  const id = String(userId || '').trim();

  const activeMatch = activeMatchByUserId.get(id);
  if (activeMatch) {
    return Object.freeze({
      ok: true,
      matched: true,
      match: publicMatch(activeMatch, id),
      ticket: null
    });
  }

  const existing = byUserId.get(id);
  if (!existing) return Object.freeze({ ok: false, error: 'not_queued' });

  const next = Object.freeze({ ...existing, ready: Boolean(ready) });
  const index = queue.findIndex((item) => item.userId === id);
  if (index >= 0) queue[index] = next;
  byUserId.set(id, next);

  const match = next.ready ? tryCreateReadyMatch() : null;
  if (match && match.participantIds.includes(id)) {
    return Object.freeze({
      ok: true,
      matched: true,
      match: publicMatch(match, id),
      ticket: null
    });
  }

  return Object.freeze({ ok: true, matched: false, ticket: snapshot(next) });
}

export function getLastBastionQueueStatus(userId) {
  const id = String(userId || '').trim();
  const activeMatch = activeMatchByUserId.get(id);
  const existing = byUserId.get(id);

  return Object.freeze({
    ok: true,
    queued: Boolean(existing) && !activeMatch,
    matched: Boolean(activeMatch),
    ticket: activeMatch ? null : snapshot(existing),
    match: publicMatch(activeMatch, id),
    queuedPlayers: queue.length
  });
}

export function clearLastBastionMatchForUser(userId) {
  const id = String(userId || '').trim();
  return activeMatchByUserId.delete(id);
}

export function getLastBastionMatchmakingFixtures() {
  const a = 'fixture-a';
  const b = 'fixture-b';

  clearLastBastionMatchForUser(a);
  clearLastBastionMatchForUser(b);
  leaveLastBastionQueue(a);
  leaveLastBastionQueue(b);

  const joinA = joinLastBastionQueue(a);
  const joinAAgain = joinLastBastionQueue(a);
  const joinB = joinLastBastionQueue(b);
  const readyA = setLastBastionReady(a, true);
  const beforeReadyB = getLastBastionQueueStatus(a);
  const readyB = setLastBastionReady(b, true);
  const statusA = getLastBastionQueueStatus(a);
  const statusB = getLastBastionQueueStatus(b);

  const sharedSeed =
    statusA.match?.seed &&
    statusA.match.seed === statusB.match?.seed &&
    statusA.match.id === statusB.match?.id;
  const sharedStart =
    statusA.match?.startedAt &&
    statusA.match.startedAt === statusB.match?.startedAt &&
    statusA.match.waveStartsAt === statusB.match?.waveStartsAt;

  clearLastBastionMatchForUser(a);
  clearLastBastionMatchForUser(b);
  byUserId.delete(a);
  byUserId.delete(b);

  return Object.freeze({
    joinCreatesTicket: joinA.ok === true && joinA.created === true && Boolean(joinA.ticket?.ticketId),
    duplicateJoinIsIdempotent: joinAAgain.ok === true && joinAAgain.created === false && joinAAgain.ticket?.ticketId === joinA.ticket?.ticketId,
    queuePositionTracksOrder: joinB.ticket?.position === 2,
    firstReadyWaitsForMinimum: readyA.ok === true && beforeReadyB.matched === false,
    secondReadyCreatesMatch: readyB.ok === true && statusA.matched === true && statusB.matched === true,
    sharedSeed,
    sharedStart,
    participantCountCorrect: statusA.match?.participantCount === 2 && statusB.match?.participantCount === 2,
    matchedPlayersRemovedFromQueue: getLastBastionQueueStatus('fixture-none').queuedPlayers === 0
  });
}
