import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');

const targetedHelperStart = server.indexOf('async function hydratePersistentLastBastionMatch');
const targetedHelperEnd = server.indexOf('async function persistLastBastionQueueTicket', targetedHelperStart);
assert(targetedHelperStart >= 0 && targetedHelperEnd > targetedHelperStart, 'Targeted Last Bastion hydration helper must exist');
const targetedHelper = server.slice(targetedHelperStart, targetedHelperEnd);

assert(targetedHelper.includes(".eq('id', requestedMatchId)"), 'Targeted hydration must fetch exactly one match id');
assert(
  targetedHelper.includes("resolve_stale_last_bastion_participants_for_match"),
  'Targeted hydration must resolve abandons only for the requested match'
);
assert(
  !targetedHelper.includes("resolve_stale_last_bastion_participants',"),
  'Targeted hydration must not invoke the global abandon sweep'
);

assert(targetedHelper.includes(".eq('match_id', requestedMatchId)"), 'Targeted hydration must fetch participants only for one match id');
assert(!targetedHelper.includes(".eq('status', 'active')"), 'Targeted hydration must not scan all active matches');
assert(!targetedHelper.includes("recentFinishedMatchesRead"), 'Targeted hydration must not scan recent finished matches');
assert(!targetedHelper.includes("last_bastion_queue"), 'Live match hydration must not read the global queue');

for (const route of [
  "/api/last-bastion/match/heartbeat",
  "/api/last-bastion/match/status",
  "/api/last-bastion/match/eliminate"
]) {
  const start = server.indexOf(route);
  const nextRoute = server.indexOf("\napp.", start + route.length);
  const block = server.slice(start, nextRoute > start ? nextRoute : server.length);
  assert(block.includes('hydratePersistentLastBastionMatch(req, identity.matchId)'), route + ' must use match-scoped hydration');
  assert(!block.includes('hydratePersistentLastBastionState(req)'), route + ' must not use global hydration');
}

console.log('Last Bastion hydration scope QA PASS', {
  targetedMatchRead: true,
  targetedParticipantsRead: true,
  globalQueueReadOnLiveRoutes: false
});
