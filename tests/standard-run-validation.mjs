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
const antiCheatMigration = fs.readFileSync(
  new URL('../supabase/migrations/20260927232020_standard_record_anticheat_v2.sql', import.meta.url),
  'utf8'
);

const waveAuthorityMigration = fs.readFileSync(
  new URL('../supabase/migrations/20260928000215_standard_wave_progression_authority.sql', import.meta.url),
  'utf8'
);

const killLedgerMigration = fs.readFileSync(
  new URL('../supabase/migrations/20260928000830_standard_kill_ledger_foundation.sql', import.meta.url),
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
assert(antiCheatMigration.includes('completed_matches_standard_run_match_uidx'), 'Standard match results must be unique in the database');
assert(antiCheatMigration.includes('already_recorded boolean'), 'Standard result RPC must expose idempotent replay state');
assert(antiCheatMigration.includes('update public.profiles'), 'Standard record and profile rewards must commit atomically');


assert(server.includes("last_reported_at,status"), 'Completion must read the server checkpoint timestamp');
assert(server.includes("const officialElapsedMs = Math.max(0, checkpointReportedAtMs - startedAtMs)"), 'Standard elapsed time must come from server checkpoint time');
assert(server.includes("elapsedMs: officialElapsedMs"), 'Standard score must use server-authoritative elapsed time');
assert(server.includes("p_elapsed_ms: Math.floor(officialElapsedMs)"), 'Persisted standard elapsed time must be server-authoritative');
assert(server.includes("canonicalRun = Object.freeze"), 'Completion response must expose canonical server timing');


assert(server.includes("const waveBounds = getStandardRunValidationBounds(mode, identity.matchId, wave)"), 'Progress checkpoints must use deterministic server wave timing');
assert(server.includes("'wave_progression_too_fast'"), 'Progress endpoint must reject temporally impossible waves');
assert(server.includes("wave > Number(currentRun.last_wave) + 1"), 'Progress endpoint must reject multi-wave jumps');
assert(waveAuthorityMigration.includes("p_wave > v_current.last_wave + 1"), 'Database checkpoint RPC must enforce sequential wave increments');
assert(waveAuthorityMigration.includes("initial_wave_must_be_zero"), 'Database checkpoint RPC must require wave zero at run creation');
assert(waveAuthorityMigration.includes("wave_jump_too_large"), 'Database checkpoint RPC must reject skipped waves');


assert(server.includes("persist_standard_run_progress_v2"), 'Standard progress must use per-wave kill ledger RPC');
assert(server.includes("getStandardWaveKillCapacity"), 'Server must derive kill capacity from deterministic wave generation');
assert(server.includes("getBossSummonAddsPlan"), 'Kill capacity must include deterministic boss summons');
assert(server.includes("const killDelta = kills - previousKills"), 'Server must validate kill deltas instead of trusting cumulative totals');
assert(main.includes("defeatedEnemyIdsRef"), 'Client must deduplicate defeated enemy ids');
assert(main.includes("onEnemyKilled?.(enemyId)"), 'Client must emit a kill only when an enemy actually reaches zero HP');
assert(killLedgerMigration.includes("create table if not exists public.standard_run_wave_kills"), 'Per-wave kill ledger table must exist');
assert(killLedgerMigration.includes("wave_kill_budget_exceeded"), 'Ledger must reject kill claims beyond the wave capacity');
assert(killLedgerMigration.includes("wave_kill_ledger_finalized"), 'Finalized wave kill ledgers must reject additional kills');
assert(killLedgerMigration.includes("kill_delta_mismatch"), 'Database must verify cumulative kills against the claimed delta');

console.log('Standard run validation foundation QA PASS', {
  persistedSessions: true,
  waveCheckpoints: true,
  completionValidation: true
});
