import { randomUUID } from 'node:crypto';

export const LAST_BASTION_MATCHMAKING = Object.freeze({
  version: 3,
  mode: 'last-bastion',
  minPlayers: 2,
  maxPlayers: 8,
  synchronizedStartDelayMs: 5000,
  heartbeatIntervalMs: 5000,
  heartbeatTimeoutMs: 15000
});

const queue = [];
const byUserId = new Map();
const activeMatchByUserId = new Map();
const matchesById = new Map();

function nowIso(nowMs = Date.now()) {
  return new Date(nowMs).toISOString();
}

function participantSnapshot(match, userId, nowMs = Date.now()) {
  if (!match) return [];
  return match.participantIds.map((participantId, index) => {
    const state = match.participants.get(participantId);
    const lastSeenAtMs = Number(state?.lastSeenAtMs ?? 0);
    const connected =
      lastSeenAtMs > 0 &&
      nowMs - lastSeenAtMs <= LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs;

    return Object.freeze({
      slot: index + 1,
      self: participantId === userId,
      alive: state?.alive !== false,
      connected,
      lastSeenAt: lastSeenAtMs > 0 ? nowIso(lastSeenAtMs) : null,
      wave: Math.max(0, Math.floor(Number(state?.wave ?? 0) || 0)),
      coreHp: Math.max(0, Math.floor(Number(state?.coreHp ?? 0) || 0))
    });
  });
}

function publicMatch(match, userId, nowMs = Date.now()) {
  if (!match || !match.participantIds.includes(userId)) return null;
  return Object.freeze({
    id: match.id,
    mode: LAST_BASTION_MATCHMAKING.mode,
    seed: match.seed,
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    waveStartsAt: match.waveStartsAt,
    participantCount: match.participantIds.length,
    heartbeatIntervalMs: LAST_BASTION_MATCHMAKING.heartbeatIntervalMs,
    heartbeatTimeoutMs: LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs,
    participants: Object.freeze(participantSnapshot(match, userId, nowMs))
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

function createParticipantState(createdAtMs) {
  return {
    alive: true,
    lastSeenAtMs: createdAtMs,
    wave: 0,
    coreHp: 20
  };
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
  const participants = new Map(
    participantIds.map((participantId) => [participantId, createParticipantState(createdAtMs)])
  );
  const match = {
    id: matchId,
    seed: `last-bastion:${matchId}`,
    createdAt: nowIso(createdAtMs),
    startedAt: nowIso(startedAtMs),
    waveStartsAt: nowIso(startedAtMs),
    participantIds,
    participants
  };

  matchesById.set(matchId, match);

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
    joinedAt: nowIso(),
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

export function recordLastBastionHeartbeat(userId, matchId, payload = {}, nowMs = Date.now()) {
  const id = String(userId || '').trim();
  const requestedMatchId = String(matchId || '').trim();
  const match = activeMatchByUserId.get(id);

  if (!match || !requestedMatchId || match.id !== requestedMatchId) {
    return Object.freeze({ ok: false, error: 'match_not_found' });
  }

  const state = match.participants.get(id);
  if (!state) return Object.freeze({ ok: false, error: 'participant_not_found' });

  state.lastSeenAtMs = nowMs;
  state.wave = Math.max(0, Math.floor(Number(payload.wave ?? state.wave) || 0));
  state.coreHp = Math.max(0, Math.floor(Number(payload.coreHp ?? state.coreHp) || 0));

  return Object.freeze({
    ok: true,
    match: publicMatch(match, id, nowMs)
  });
}

export function getLastBastionMatchStatus(userId, matchId, nowMs = Date.now()) {
  const id = String(userId || '').trim();
  const requestedMatchId = String(matchId || '').trim();
  const match = activeMatchByUserId.get(id);

  if (!match || !requestedMatchId || match.id !== requestedMatchId) {
    return Object.freeze({ ok: false, error: 'match_not_found' });
  }

  return Object.freeze({
    ok: true,
    match: publicMatch(match, id, nowMs)
  });
}

export function clearLastBastionMatchForUser(userId) {
  const id = String(userId || '').trim();
  const match = activeMatchByUserId.get(id);
  if (!match) return false;

  activeMatchByUserId.delete(id);
  match.participants.delete(id);

  const anyRemaining = match.participantIds.some((participantId) => activeMatchByUserId.has(participantId));
  if (!anyRemaining) matchesById.delete(match.id);
  return true;
}

export function getLastBastionMatchmakingFixtures() {
  const a = 'fixture-a';
  const b = 'fixture-b';

  clearLastBastionMatchForUser(a);
  clearLastBastionMatchForUser(b);
  byUserId.delete(a);
  byUserId.delete(b);
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    if (queue[index].userId === a || queue[index].userId === b) queue.splice(index, 1);
  }

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

  const heartbeatAt = Date.now();
  const heartbeatA = recordLastBastionHeartbeat(a, statusA.match?.id, { wave: 7, coreHp: 14 }, heartbeatAt);
  const afterHeartbeatA = getLastBastionMatchStatus(a, statusA.match?.id, heartbeatAt + 1000);
  const afterTimeoutA = getLastBastionMatchStatus(a, statusA.match?.id, heartbeatAt + LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs + 1);

  const selfA = afterHeartbeatA.match?.participants?.find((participant) => participant.self);
  const selfAAfterTimeout = afterTimeoutA.match?.participants?.find((participant) => participant.self);

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
    matchedPlayersRemovedFromQueue: getLastBastionQueueStatus('fixture-none').queuedPlayers === 0,
    heartbeatAccepted: heartbeatA.ok === true,
    heartbeatUpdatesProgress: selfA?.wave === 7 && selfA?.coreHp === 14,
    heartbeatMarksConnected: selfA?.connected === true,
    timeoutMarksDisconnectedWithoutElimination: selfAAfterTimeout?.connected === false && selfAAfterTimeout?.alive === true
  });
}
