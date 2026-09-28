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
assert(server.includes("res.setHeader('X-Frame-Options', 'DENY')"), 'production server must block framing');
assert(server.includes("res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')"), 'production server must restrict unused browser capabilities');
assert(server.includes("rateLimitUser('lb-status'"), 'Last Bastion status must be rate limited');
assert(server.includes("rateLimitUser('lb-heartbeat'"), 'Last Bastion heartbeat must be rate limited');

assert(main.includes('waveClockNow: getWaveNow()'), 'snapshot must persist virtual combat clock');
assert(main.includes('onlineClockRebasedRef'), 'resume must rebase virtual combat timestamps');
assert(
  main.includes('matchingOnlineSnapshot?.queuedWaveNumber') &&
  main.includes('matchingTftSnapshot?.queuedWaveNumber') &&
  main.includes('restoredWaveNumber'),
  'resume must restore queued-wave identity from online or local TFT snapshots'
);
assert(
  main.includes('matchingOnlineSnapshot?.activeEnemies ?? matchingTftSnapshot?.activeEnemies ?? []'),
  'resume must restore active enemies from online or local TFT snapshots'
);
assert(
  main.includes('matchingOnlineSnapshot?.spawnQueue ?? matchingTftSnapshot?.spawnQueue ?? []'),
  'resume must restore spawn queue from online or local TFT snapshots'
);
assert(
  main.includes("matchingOnlineSnapshot?.riskRewardTier ?? matchingTftSnapshot?.riskRewardTier ?? 'safe'"),
  'resume must restore risk/reward state from online or local TFT snapshots'
);
assert(main.includes('matchingOnlineSnapshot?.tftAutoStartEnabled'), 'resume must restore TFT auto-start state');
assert(main.includes('onlineSnapshotInFlightRef'), 'online snapshot saves must prevent overlapping requests');
assert(main.includes('pendingOnlineSnapshotRef'), 'online snapshot saves must coalesce to the latest pending state');
assert(main.includes("window.addEventListener('pagehide'"), 'latest online snapshot must flush on page exit');
assert(main.includes('keepalive: true'), 'page-exit snapshot must use fetch keepalive when payload is safe');

const engine = getOfflineRunEngineFixtures();
assert.equal(engine.supportedModeAdvances, true, 'offline server engine must advance supported runs');
assert.equal(engine.preparationCanStartWave, true, 'offline server engine must transition preparation into combat');
assert.equal(engine.generatedWaveQueue, true, 'offline server engine must preserve or generate wave work');
assert.equal(engine.offlineWallsTakeDamage, true, 'offline walls must take damage from blocked enemies');
assert.equal(engine.offlineWallsCanBeDestroyed, true, 'offline walls must be destructible during catch-up');

assert(migration.includes('not exists ('), 'stale cleanup must exempt active online snapshots');
assert(migration.includes("o.status='active'"), 'stale cleanup must only preserve active snapshots');

console.log('ONLINE_RUN_RESUME_PASS');
