import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260927231420_standard_run_validation_foundation.sql', import.meta.url),
  'utf8'
);

assert(migration.includes('create table if not exists public.standard_run_sessions'), 'Standard run session table must exist');
assert(migration.includes('persist_standard_run_checkpoint'), 'Checkpoint RPC must exist');
assert(migration.includes('wave_regression'), 'Checkpoint RPC must reject wave regression');
assert(migration.includes('kills_regression'), 'Checkpoint RPC must reject kills regression');
assert(server.includes("app.post('/api/run/progress'"), 'Server must expose standard run progress endpoint');
assert(server.includes("'persist_standard_run_checkpoint'"), 'Server must persist standard run checkpoints');
assert(server.includes("'final_wave_checkpoint_mismatch'"), 'Completion must compare final wave with checkpoint');
assert(server.includes("'run_checkpoint_missing'"), 'Completion must reject missing checkpoint state');
assert(main.includes("fetch('/api/run/progress'"), 'Client must report standard run progress');
assert(main.includes('lastStandardProgressRef'), 'Client must deduplicate per-wave checkpoint reports');


assert(server.includes("'persist_verified_standard_result_v2'"), 'Server must use idempotent standard result v2 RPC');
assert(server.includes("'score_mismatch'"), 'Server must reject tampered score values');
assert(server.includes("'kills_exceed_wave_capacity'"), 'Server must cap kills by deterministic wave capacity');
assert(server.includes("'elapsed_time_below_wave_minimum'"), 'Server must reject impossible wave completion timing');
assert(server.includes("'final_gold_checkpoint_mismatch'"), 'Final gold must match the final checkpoint');
assert(server.includes("'final_core_checkpoint_mismatch'"), 'Final core state must match the final checkpoint');
assert(main.includes('const finalCheckpoint = await reportStandardRunProgress'), 'Client must send a final standard-run checkpoint before completion');
assert(migration.includes('standard_run_sessions'), 'Standard validation migration must persist run sessions');

console.log('Standard run validation foundation QA PASS', {
  persistedSessions: true,
  waveCheckpoints: true,
  completionValidation: true
});
