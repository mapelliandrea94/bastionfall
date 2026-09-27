import { randomUUID } from 'node:crypto';

export const LAST_BASTION_MATCHMAKING = Object.freeze({
  version: 3,
  mode: 'last-bastion',
  minPlayers: 2,
  maxPlayers: 8,
  synchronizedStartDelayMs: 5000,
  heartbeatIntervalMs: 5000,
  heartbeatTimeoutMs: 15000,
  heartbeatMinIntervalMs: 750,
  maxWave: 9999,
  maxCoreHp: 100000,
  desyncWaveSpreadTolerance: 1
});

const queue = [];
const byUserId = new Map();
const activeMatchByUserId = new Map();
const matchesById = new Map();

function nowIso(nowMs = Date.now()) {
  return new Date(nowMs).toISOString();
}

function getFairnessSnapshot(match, nowMs = Date.now()) {
  if (!match) {
    return Object.freeze({
      connectedAliveCount: 0,
      minWave: 0,
      maxWave: 0,
      waveSpread: 0,
      desynced: false
    });
  }

  const connectedAlive = match.participantIds
    .map((participantId) => match.participants.get(participantId))
    .filter((state) => {
      if (!state || state.alive === false) return false;
      const lastSeenAtMs = Number(state.lastSeenAtMs ?? 0);
      return lastSeenAtMs > 0 && nowMs - lastSeenAtMs <= LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs;
    });

  const waves = connectedAlive.map((state) => Math.max(0, Math.floor(Number(state.wave) || 0)));
  const minWave = waves.length ? Math.min(...waves) : 0;
  const maxWave = waves.length ? Math.max(...waves) : 0;
  const waveSpread = maxWave - minWave;

  return Object.freeze({
    connectedAliveCount: connectedAlive.length,
    minWave,
    maxWave,
    waveSpread,
    desynced: connectedAlive.length > 1 && waveSpread > LAST_BASTION_MATCHMAKING.desyncWaveSpreadTolerance
  });
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
      coreHp: Math.max(0, Math.floor(Number(state?.coreHp ?? 0) || 0)),
      placement: Number.isInteger(state?.placement) ? state.placement : null
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
    status: match.status ?? 'active',
    winnerSlot: match.winnerUserId ? match.participantIds.indexOf(match.winnerUserId) + 1 : null,
    selfPlacement: Number.isInteger(match.participants.get(userId)?.placement)
      ? match.participants.get(userId).placement
      : null,
    selfWon: match.winnerUserId === userId,
    heartbeatIntervalMs: LAST_BASTION_MATCHMAKING.heartbeatIntervalMs,
    heartbeatTimeoutMs: LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs,
    fairness: getFairnessSnapshot(match, nowMs),
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
    coreHp: 20,
    lastHeartbeatAcceptedAtMs: 0,
    rejectedHeartbeatCount: 0,
    placement: null
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
    participants,
    status: 'active',
    winnerUserId: null,
    endedAt: null
  };

  matchesById.set(matchId, match);

  for (const entry of readyEntries) {
    activeMatchByUserId.set(entry.userId, match);
    const index = queue.findIndex((item) => item.userId === entry.userId);
    if (index >= 0) queue.splice(index, 1);
  }

  return match;
}

export function hydrateLastBastionActiveMatches(matchRows = [], participantRows = []) {
  activeMatchByUserId.clear();
  matchesById.clear();

  const participantsByMatch = new Map();
  for (const row of participantRows) {
    const matchId = String(row?.matchId || row?.match_id || '').trim();
    const userId = String(row?.userId || row?.user_id || '').trim();
    const slot = Number(row?.slot);
    if (!matchId || !userId || !Number.isInteger(slot) || slot < 1 || slot > LAST_BASTION_MATCHMAKING.maxPlayers) continue;
    if (!participantsByMatch.has(matchId)) participantsByMatch.set(matchId, []);
    participantsByMatch.get(matchId).push({ ...row, matchId, userId, slot });
  }

  let hydratedMatches = 0;
  let hydratedParticipants = 0;

  for (const row of matchRows) {
    const id = String(row?.id || '').trim();
    const seed = String(row?.seed || '').trim();
    const createdAt = String(row?.createdAt || row?.created_at || '');
    const startedAt = String(row?.startedAt || row?.started_at || '');
    const waveStartsAt = String(row?.waveStartsAt || row?.wave_starts_at || '');
    const status = String(row?.status || 'active');
    if (!id || !seed || !createdAt || !startedAt || !waveStartsAt || !['active', 'finished'].includes(status)) continue;

    const participantRowsForMatch = (participantsByMatch.get(id) || [])
      .sort((a, b) => a.slot - b.slot);

    if (
      participantRowsForMatch.length < LAST_BASTION_MATCHMAKING.minPlayers ||
      participantRowsForMatch.length > LAST_BASTION_MATCHMAKING.maxPlayers
    ) continue;

    const participantIds = Object.freeze(participantRowsForMatch.map((entry) => entry.userId));
    const participants = new Map();

    for (const entry of participantRowsForMatch) {
      const lastSeenAt = String(entry.lastSeenAt || entry.last_seen_at || createdAt);
      const eliminatedAt = entry.eliminatedAt || entry.eliminated_at || null;
      participants.set(entry.userId, {
        alive: entry.alive !== false,
        lastSeenAtMs: Number.isFinite(Date.parse(lastSeenAt)) ? Date.parse(lastSeenAt) : Date.parse(createdAt),
        wave: Math.max(0, Math.floor(Number(entry.wave) || 0)),
        coreHp: Math.max(0, Math.floor(Number(entry.coreHp ?? entry.core_hp) || 0)),
        lastHeartbeatAcceptedAtMs: 0,
        rejectedHeartbeatCount: 0,
        placement: Number.isInteger(Number(entry.placement)) ? Number(entry.placement) : null,
        eliminatedAtMs: eliminatedAt && Number.isFinite(Date.parse(String(eliminatedAt)))
          ? Date.parse(String(eliminatedAt))
          : null
      });
    }

    const match = {
      id,
      seed,
      createdAt,
      startedAt,
      waveStartsAt,
      participantIds,
      participants,
      status,
      winnerUserId: row?.winnerUserId || row?.winner_user_id || null,
      endedAt: row?.endedAt || row?.ended_at || null
    };

    matchesById.set(id, match);
    for (const participantId of participantIds) {
      activeMatchByUserId.set(participantId, match);
      hydratedParticipants += 1;
    }
    hydratedMatches += 1;
  }

  return Object.freeze({ hydratedMatches, hydratedParticipants });
}

export function hydrateLastBastionQueue(entries = []) {
  queue.length = 0;
  byUserId.clear();

  const normalized = [...entries]
    .map((entry) => ({
      ticketId: String(entry?.ticketId || entry?.ticket_id || '').trim(),
      userId: String(entry?.userId || entry?.user_id || '').trim(),
      joinedAt: String(entry?.joinedAt || entry?.joined_at || ''),
      ready: Boolean(entry?.ready)
    }))
    .filter((entry) => entry.ticketId && entry.userId && entry.joinedAt)
    .sort((a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt));

  for (const entry of normalized) {
    if (activeMatchByUserId.get(entry.userId)?.status === 'active') continue;
    const frozen = Object.freeze(entry);
    queue.push(frozen);
    byUserId.set(entry.userId, frozen);
  }

  return Object.freeze({
    queuedPlayers: queue.length,
    readyPlayers: queue.filter((entry) => entry.ready).length
  });
}

export function joinLastBastionQueue(userId) {
  const id = String(userId || '').trim();
  if (!id) return Object.freeze({ ok: false, error: 'invalid_user' });

  const activeMatch = activeMatchByUserId.get(id);
  if (activeMatch?.status === 'active') {
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

  if (activeMatchByUserId.get(id)?.status === 'active') {
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
  if (activeMatch?.status === 'active') {
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

export function getLastBastionActiveMatchPersistenceSnapshot(userId) {
  const id = String(userId || '').trim();
  const match = activeMatchByUserId.get(id);
  if (!match || match.status !== 'active') return null;

  return Object.freeze({
    id: match.id,
    seed: match.seed,
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    waveStartsAt: match.waveStartsAt,
    participantIds: Object.freeze([...match.participantIds])
  });
}

export function getLastBastionActiveMatchUserIds(userId) {
  const id = String(userId || '').trim();
  const match = activeMatchByUserId.get(id);
  return match?.status === 'active' ? [...match.participantIds] : [];
}

export function getLastBastionQueueStatus(userId) {
  const id = String(userId || '').trim();
  const recoveredMatch = activeMatchByUserId.get(id);
  const activeMatch = recoveredMatch?.status === 'active' ? recoveredMatch : null;
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
  if (match.status === 'finished') return Object.freeze({ ok: false, error: 'match_finished' });
  if (state.alive === false) return Object.freeze({ ok: false, error: 'participant_eliminated' });

  const wave = Number(payload.wave ?? state.wave);
  const coreHp = Number(payload.coreHp ?? state.coreHp);

  if (!Number.isInteger(wave) || wave < 0 || wave > LAST_BASTION_MATCHMAKING.maxWave) {
    state.rejectedHeartbeatCount += 1;
    return Object.freeze({ ok: false, error: 'invalid_wave' });
  }

  if (!Number.isInteger(coreHp) || coreHp < 0 || coreHp > LAST_BASTION_MATCHMAKING.maxCoreHp) {
    state.rejectedHeartbeatCount += 1;
    return Object.freeze({ ok: false, error: 'invalid_core_hp' });
  }

  if (wave < state.wave) {
    state.rejectedHeartbeatCount += 1;
    return Object.freeze({ ok: false, error: 'wave_regression' });
  }

  if (
    state.lastHeartbeatAcceptedAtMs > 0 &&
    nowMs - state.lastHeartbeatAcceptedAtMs < LAST_BASTION_MATCHMAKING.heartbeatMinIntervalMs
  ) {
    state.rejectedHeartbeatCount += 1;
    return Object.freeze({ ok: false, error: 'heartbeat_rate_limited' });
  }

  state.lastSeenAtMs = nowMs;
  state.lastHeartbeatAcceptedAtMs = nowMs;
  state.wave = wave;
  state.coreHp = state.alive === false ? 0 : coreHp;

  return Object.freeze({
    ok: true,
    match: publicMatch(match, id, nowMs)
  });
}

export function eliminateLastBastionParticipant(userId, matchId, payload = {}, nowMs = Date.now()) {
  const id = String(userId || '').trim();
  const requestedMatchId = String(matchId || '').trim();
  const match = activeMatchByUserId.get(id);

  if (!match || !requestedMatchId || match.id !== requestedMatchId) {
    return Object.freeze({ ok: false, error: 'match_not_found' });
  }

  const state = match.participants.get(id);
  if (!state) return Object.freeze({ ok: false, error: 'participant_not_found' });

  const eliminationWave = Number(payload.wave ?? state.wave);
  if (!Number.isInteger(eliminationWave) || eliminationWave < 0 || eliminationWave > LAST_BASTION_MATCHMAKING.maxWave) {
    return Object.freeze({ ok: false, error: 'invalid_wave' });
  }

  if (state.alive === false) {
    return Object.freeze({
      ok: true,
      eliminated: true,
      duplicate: true,
      match: publicMatch(match, id, nowMs)
    });
  }

  state.lastSeenAtMs = nowMs;
  state.wave = eliminationWave;
  state.coreHp = 0;
  state.alive = false;
  state.eliminatedAtMs = state.eliminatedAtMs ?? nowMs;

  const aliveIds = match.participantIds.filter((participantId) => match.participants.get(participantId)?.alive !== false);
  state.placement = aliveIds.length + 1;

  if (aliveIds.length === 1) {
    const winnerState = match.participants.get(aliveIds[0]);
    if (winnerState) winnerState.placement = 1;
    match.status = 'finished';
    match.winnerUserId = aliveIds[0];
    match.endedAt = nowIso(nowMs);
  } else if (aliveIds.length === 0) {
    match.status = 'finished';
    match.winnerUserId = null;
    match.endedAt = nowIso(nowMs);
  }

  return Object.freeze({
    ok: true,
    eliminated: true,
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
  const invalidWaveHeartbeat = recordLastBastionHeartbeat(a, statusA.match?.id, { wave: -1, coreHp: 14 }, heartbeatAt - 3000);
  const heartbeatA = recordLastBastionHeartbeat(a, statusA.match?.id, { wave: 7, coreHp: 14 }, heartbeatAt);
  const rateLimitedHeartbeat = recordLastBastionHeartbeat(a, statusA.match?.id, { wave: 7, coreHp: 14 }, heartbeatAt + 100);
  const regressingHeartbeat = recordLastBastionHeartbeat(a, statusA.match?.id, { wave: 6, coreHp: 14 }, heartbeatAt + 1000);
  const heartbeatB = recordLastBastionHeartbeat(b, statusB.match?.id, { wave: 5, coreHp: 20 }, heartbeatAt + 1000);
  const fairnessAfterSpread = getLastBastionMatchStatus(a, statusA.match?.id, heartbeatAt + 1100);
  const afterHeartbeatA = getLastBastionMatchStatus(a, statusA.match?.id, heartbeatAt + 1000);
  const afterTimeoutA = getLastBastionMatchStatus(a, statusA.match?.id, heartbeatAt + LAST_BASTION_MATCHMAKING.heartbeatTimeoutMs + 1);

  const selfA = afterHeartbeatA.match?.participants?.find((participant) => participant.self);
  const selfAAfterTimeout = afterTimeoutA.match?.participants?.find((participant) => participant.self);

  const eliminationA = eliminateLastBastionParticipant(a, statusA.match?.id, { wave: 7 }, heartbeatAt + 2000);
  const winnerStatusB = getLastBastionMatchStatus(b, statusB.match?.id, heartbeatAt + 2001);
  const selfAfterElimination = eliminationA.match?.participants?.find((participant) => participant.self);
  const winnerParticipant = winnerStatusB.match?.participants?.find((participant) => participant.self);
  const loserParticipant = eliminationA.match?.participants?.find((participant) => participant.self);

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
    timeoutMarksDisconnectedWithoutElimination: selfAAfterTimeout?.connected === false && selfAAfterTimeout?.alive === true,
    invalidHeartbeatRejected: invalidWaveHeartbeat.ok === false && invalidWaveHeartbeat.error === 'invalid_wave',
    rateLimitWorks: rateLimitedHeartbeat.ok === false && rateLimitedHeartbeat.error === 'heartbeat_rate_limited',
    waveRegressionRejected: regressingHeartbeat.ok === false && regressingHeartbeat.error === 'wave_regression',
    desyncDetected: heartbeatB.ok === true && fairnessAfterSpread.match?.fairness?.desynced === true && fairnessAfterSpread.match?.fairness?.waveSpread === 2,
    eliminationMarksDead: eliminationA.ok === true && selfAfterElimination?.alive === false,
    lastAliveWins: winnerStatusB.match?.status === 'finished' && winnerStatusB.match?.winnerSlot === 2 && winnerParticipant?.alive === true,
    placementsResolve: loserParticipant?.placement === 2 && winnerParticipant?.placement === 1 && winnerStatusB.match?.selfPlacement === 1 && winnerStatusB.match?.selfWon === true
  });
}
