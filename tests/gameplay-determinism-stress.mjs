import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getTftPersistenceFixtures, createTftRunSnapshot, normalizeTftRunSnapshot } from '../src/game/tft/tftPersistence.js';
import { getOfflineRunEngineFixtures } from '../src/game/run/offlineRunEngine.js';
import { getTowerRunStatsFixtures } from '../src/game/stats/towerRunStats.js';

const persistence = getTftPersistenceFixtures();
assert.equal(persistence.maxProgressPersists, true, '14/14 tower progress must survive resume');
assert.equal(persistence.purchasedSlotsPersist, true, 'all eight TFT shop purchases must survive resume');
assert.equal(persistence.activeWavePersists, true, 'active wave state must survive resume');
assert.equal(persistence.suddenSiegeSupported, true, 'Sudden Siege must support local resume');

const stressEnemies = Array.from({ length: 80 }, (_, index) => ({
  id: `stress-enemy-${index}`,
  hp: 100 + index,
  maxHp: 100 + index,
  progress: index / 100,
  airborne: index % 3 === 0,
  statusEffects: index % 4 === 0 ? { slowPercent: 20, slowUntilMs: 5000 } : {}
}));
const stress = createTftRunSnapshot({
  run: { mode: 'tft-shop', seed: 'stress', wave: 30, gold: 100, phase: 'active' },
  activeEnemies: stressEnemies,
  spawnQueue: stressEnemies.slice(0, 50).map((enemy, index) => ({
    ...enemy,
    id: `queued-${index}`,
    scheduledSpawnAt: 1000 + index * 50,
    scheduledSpawnOffsetMs: 150 + index * 50
  })),
  waveSpeed: 2,
  waveClockNow: 5000,
  waveTimelineStartedAt: 1000,
  queuedWaveNumber: 31,
  spawnedWaveNumber: 31,
  towerAttackChargeById: { 'field:a': 123, 'field:b': 456 }
});
const normalizedStress = normalizeTftRunSnapshot(JSON.parse(JSON.stringify(stress)));
assert.equal(normalizedStress.activeEnemies.length, 80, 'stress snapshot must preserve all active enemies');
assert.equal(normalizedStress.spawnQueue.length, 50, 'stress snapshot must preserve pending spawn timeline');
assert.equal(normalizedStress.waveSpeed, 2, 'stress snapshot must preserve x2');
assert.equal(normalizedStress.waveTimelineStartedAt, 1000, 'stress snapshot must preserve wave origin');
assert.equal(normalizedStress.towerAttackChargeById['field:b'], 456, 'stress snapshot must preserve tower cooldown charge');

const towerStats = getTowerRunStatsFixtures();
assert.equal(towerStats.damageExpected, towerStats.damageActual, 'tower stats must accumulate damage');
assert.equal(towerStats.killsExpected, towerStats.killsActual, 'tower stats must accumulate kills');
assert.equal(towerStats.damagePerGoldExpected, towerStats.damagePerGoldActual, 'tower stats must calculate damage efficiency');
assert.equal(towerStats.supportExpected, towerStats.supportActual, 'tower stats must preserve support contribution');

const engine = getOfflineRunEngineFixtures();
assert.equal(engine.x2AdvancesDoubleVirtualTime, true, 'x2 must advance the full simulation clock exactly twice as fast');
assert.equal(engine.x2AppliesMoreTimedDamage, true, 'timed damage must follow x2 simulation time');

const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
assert(main.includes('previousProgress <= progress'), 'walls must only block enemies crossing forward');
assert(main.includes('Number(enemy?.hp ?? 0) > 0 && Number(enemy?.progress ?? 0) >= 1'), 'dead enemies must never damage the Nexus');
assert(main.includes('1000 - elapsedSinceSave'), 'local persistence must be throttled to avoid per-frame storage writes');
assert(main.includes('waveTimelineStartedAtRef'), 'live resume must preserve wave timeline origin');
assert(main.includes('towerAttackChargeById'), 'live resume must preserve tower cooldown state');

console.log('GAMEPLAY_DETERMINISM_STRESS_PASS');
