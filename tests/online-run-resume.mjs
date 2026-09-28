import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getOfflineRunEngineFixtures } from '../src/game/run/offlineRunEngine.js';

const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260928223700_preserve_online_standard_runs.sql', import.meta.url),
  'utf8'
);

assert(server.includes("app.use(express.json({ limit: '1mb', strict: true }))"), 'online snapshots need payload headroom');
assert(server.includes("app.post('/api/run/snapshot'"), 'online snapshot save endpoint missing');
assert(server.includes("app.get('/api/run/active'"), 'online snapshot resume endpoint missing');
assert(server.includes("snapshot_identity_mismatch"), 'snapshot identity binding missing');
assert(server.includes("serialized.length > 750000"), 'snapshot size guard missing');
assert(server.includes('advanceOfflineRunSnapshot(snapshot, offlineElapsedMs)'), 'server must advance stale online snapshots before resume');

assert(main.includes('waveClockNow: getWaveNow()'), 'snapshot must persist virtual combat clock');
assert(main.includes('onlineClockRebasedRef'), 'resume must rebase virtual combat timestamps');
assert(main.includes("matchingOnlineSnapshot?.run?.phase === RUN_PHASES.ACTIVE ? restoredWaveNumber : null"), 'resume must restore queued-wave identity');
assert(main.includes('matchingOnlineSnapshot?.activeEnemies ?? []'), 'resume must restore active enemies');
assert(main.includes('matchingOnlineSnapshot?.spawnQueue ?? []'), 'resume must restore spawn queue');
assert(main.includes('matchingOnlineSnapshot?.riskRewardTier ?? \'safe\''), 'resume must restore risk/reward state');
assert(main.includes('matchingOnlineSnapshot?.tftAutoStartEnabled'), 'resume must restore TFT auto-start state');

const engine = getOfflineRunEngineFixtures();
assert.equal(engine.supportedModeAdvances, true, 'offline server engine must advance supported runs');
assert.equal(engine.preparationCanStartWave, true, 'offline server engine must transition preparation into combat');
assert.equal(engine.generatedWaveQueue, true, 'offline server engine must preserve or generate wave work');
assert.equal(engine.offlineWallsTakeDamage, true, 'offline walls must take damage from blocked enemies');
assert.equal(engine.offlineWallsCanBeDestroyed, true, 'offline walls must be destructible during catch-up');

assert(migration.includes('not exists ('), 'stale cleanup must exempt active online snapshots');
assert(migration.includes("o.status='active'"), 'stale cleanup must only preserve active snapshots');

console.log('ONLINE_RUN_RESUME_PASS');
