import { randomUUID } from 'node:crypto';

export const LAST_BASTION_MATCHMAKING = Object.freeze({
  version: 1,
  mode: 'last-bastion'
});

const queue = [];
const byUserId = new Map();

function snapshot(entry) {
  if (!entry) return null;
  const position = queue.findIndex((item) => item.userId === entry.userId);
  return Object.freeze({
    ticketId: entry.ticketId,
    userId: entry.userId,
    joinedAt: entry.joinedAt,
    status: 'queued',
    position: position >= 0 ? position + 1 : null,
    queuedPlayers: queue.length
  });
}

export function joinLastBastionQueue(userId) {
  const id = String(userId || '').trim();
  if (!id) return Object.freeze({ ok: false, error: 'invalid_user' });

  const existing = byUserId.get(id);
  if (existing) {
    return Object.freeze({ ok: true, created: false, ticket: snapshot(existing) });
  }

  const entry = Object.freeze({
    ticketId: randomUUID(),
    userId: id,
    joinedAt: new Date().toISOString()
  });
  queue.push(entry);
  byUserId.set(id, entry);

  return Object.freeze({ ok: true, created: true, ticket: snapshot(entry) });
}

export function leaveLastBastionQueue(userId) {
  const id = String(userId || '').trim();
  const existing = byUserId.get(id);
  if (!existing) {
    return Object.freeze({ ok: true, removed: false, queuedPlayers: queue.length });
  }

  const index = queue.findIndex((item) => item.userId === id);
  if (index >= 0) queue.splice(index, 1);
  byUserId.delete(id);

  return Object.freeze({ ok: true, removed: true, queuedPlayers: queue.length });
}

export function getLastBastionQueueStatus(userId) {
  const id = String(userId || '').trim();
  const existing = byUserId.get(id);
  return Object.freeze({
    ok: true,
    queued: Boolean(existing),
    ticket: snapshot(existing),
    queuedPlayers: queue.length
  });
}

export function getLastBastionMatchmakingFixtures() {
  const a = 'fixture-a';
  const b = 'fixture-b';

  leaveLastBastionQueue(a);
  leaveLastBastionQueue(b);

  const joinA = joinLastBastionQueue(a);
  const joinAAgain = joinLastBastionQueue(a);
  const joinB = joinLastBastionQueue(b);
  const statusA = getLastBastionQueueStatus(a);
  const leaveA = leaveLastBastionQueue(a);
  const afterLeaveA = getLastBastionQueueStatus(a);

  leaveLastBastionQueue(b);

  return Object.freeze({
    joinCreatesTicket: joinA.ok === true && joinA.created === true && Boolean(joinA.ticket?.ticketId),
    duplicateJoinIsIdempotent: joinAAgain.ok === true && joinAAgain.created === false && joinAAgain.ticket?.ticketId === joinA.ticket?.ticketId,
    queuePositionTracksOrder: joinB.ticket?.position === 2 && statusA.ticket?.position === 1,
    leaveRemovesUser: leaveA.removed === true && afterLeaveA.queued === false,
    fixtureCleanupLeavesQueueEmpty: getLastBastionQueueStatus('fixture-none').queuedPlayers === 0
  });
}
