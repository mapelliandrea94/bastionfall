import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const matchmaking = fs.readFileSync(new URL('../server/lastBastionMatchmaking.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260927232536_last_bastion_live_anticheat.sql', import.meta.url),
  'utf8'
);

assert(matchmaking.includes('maxCoreHp: 28'), 'Last Bastion RAM core HP cap must be 28');
assert(server.includes('validateLastBastionWavePace'), 'Heartbeat/elimination must validate live wave pace');
assert(server.includes("'wave_progression_too_fast'"), 'Impossible Last Bastion wave speed must be rejected');
assert(server.includes("'score_mismatch'"), 'Last Bastion final score must be recalculated server-side');
assert(server.includes("'kills_exceed_wave_capacity'"), 'Last Bastion kills must respect deterministic wave capacity');
assert(server.includes("'invalid_last_bastion_core_max_hp'"), 'Last Bastion final max HP must be bounded');
assert(migration.includes("p_core_hp > 28"), 'Database heartbeat must enforce Last Bastion HP cap');
assert(migration.includes("heartbeat_from_future"), 'Database must reject future heartbeat timestamps');
assert(migration.includes("wave_jump_too_large"), 'Database must reject impossible wave jumps');
assert(migration.includes("last_bastion_wave_mismatch"), 'Final result must be bound to persisted live wave state');
assert(migration.includes("last_bastion_core_hp_mismatch"), 'Eliminated final result must match persisted core HP');

console.log('Last Bastion live anti-cheat QA PASS', {
  hpCap: 28,
  wavePaceValidation: true,
  finalStateBinding: true,
  deterministicBounds: true
});
