import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const matchmaking = fs.readFileSync(new URL('../server/lastBastionMatchmaking.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260928004022_race_safe_completion_and_stale_run_cleanup.sql', import.meta.url),
  'utf8'
);

assert(migration.includes('for update of m, p'), 'Last Bastion final result must serialize concurrent completions');
assert(migration.includes("status='abandoned'"), 'Stale standard runs must be marked abandoned');
assert(migration.includes('p_timeout_seconds integer DEFAULT 21600'), 'Standard stale timeout must default to six hours');
assert(server.includes('STANDARD_RUN_STALE_TIMEOUT_SECONDS = 6 * 60 * 60'), 'Server stale timeout must match six-hour DB policy');
assert((server.match(/abandonStaleStandardRuns\(serverDb\)/g) || []).length >= 3, 'Start, progress and completion must all run stale cleanup');
assert(matchmaking.includes("const activeMatch = recoveredMatch?.status === 'active' ? recoveredMatch : null;"), 'Finished Last Bastion matches must not block a new queue state');

console.log('Race/state cleanup QA PASS', {
  lastBastionCompletionSerialized: true,
  standardInactivityTtlHours: 6,
  finishedMatchQueueRelease: true
});
