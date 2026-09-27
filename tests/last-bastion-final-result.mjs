import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260927225851_idempotent_last_bastion_final_result.sql', import.meta.url),
  'utf8'
);

assert(
  server.includes("'persist_verified_last_bastion_result_v3'"),
  'Server must persist Last Bastion final results through v3'
);
assert(
  !server.includes("'persist_verified_last_bastion_result_v2'"),
  'Server must not use the legacy Last Bastion result RPC'
);
assert(
  migration.includes('completed_matches_last_bastion_user_match_uidx'),
  'Final results need a unique user+Last Bastion match constraint'
);
assert(
  migration.includes('last_bastion_match_id'),
  'Completed matches must retain the authoritative Last Bastion match id'
);
assert(
  migration.includes('update public.profiles'),
  'Profile rewards must be applied inside the same final-result transaction'
);
assert(
  migration.includes('already_recorded boolean') && migration.includes('earned_shards integer'),
  'Idempotent result metadata must be returned by v3'
);
assert(
  server.includes("identity.mode !== 'last-bastion'"),
  'Last Bastion retries must bypass the RAM-only replay guard'
);

console.log('Last Bastion final result QA PASS', {
  rpc: 'persist_verified_last_bastion_result_v3',
  idempotent: true,
  atomicProfileRewards: true
});
