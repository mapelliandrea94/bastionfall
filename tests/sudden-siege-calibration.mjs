import assert from 'node:assert/strict';
import { composeWaveByThreatBudget } from '../src/game/balance/waveThreat.js';
import {
  getSuddenSiegeWaveReward,
  getSuddenSiegeWaveScaling
} from '../src/game/balance/suddenSiege.js';

const checkpoints = Object.freeze([
  { wave: 1, maxCountRatio: 1.25, expectedReward: 5 },
  { wave: 5, maxCountRatio: 1.25, expectedReward: 5 },
  { wave: 8, maxCountRatio: 1.35, expectedReward: 5 },
  { wave: 12, maxCountRatio: 1.35, expectedReward: 5 },
  { wave: 15, maxCountRatio: 1.50, expectedReward: 5 },
  { wave: 20, maxCountRatio: 1.50, expectedReward: 5 },
  { wave: 25, maxCountRatio: 1.65, expectedReward: 5 }
]);

const rows = checkpoints.map(({ wave, maxCountRatio, expectedReward }) => {
  const scaling = getSuddenSiegeWaveScaling(wave);
  const baseline = composeWaveByThreatBudget(wave, 1);
  const sudden = composeWaveByThreatBudget(wave, scaling.suddenThreatMultiplier);
  const countRatio = baseline.enemyCount > 0 ? sudden.enemyCount / baseline.enemyCount : 1;
  const reward = getSuddenSiegeWaveReward(wave);
  const pressureIndex = Number((
    scaling.suddenThreatMultiplier *
    scaling.enemyHpMultiplier *
    (1000 / scaling.spawnIntervalMs)
  ).toFixed(3));

  assert.ok(
    countRatio <= maxCountRatio,
    `wave ${wave}: enemy-count ratio ${countRatio.toFixed(2)} exceeded ceiling ${maxCountRatio}`
  );
  assert.equal(reward, expectedReward, `wave ${wave}: unexpected reward`);

  return Object.freeze({
    wave,
    baselineEnemies: baseline.enemyCount,
    suddenEnemies: sudden.enemyCount,
    countRatio: Number(countRatio.toFixed(2)),
    threat: scaling.suddenThreatMultiplier,
    hp: scaling.enemyHpMultiplier,
    spawnMs: scaling.spawnIntervalMs,
    reward,
    pressureIndex
  });
});

for (let index = 1; index < rows.length; index += 1) {
  assert.ok(
    rows[index].pressureIndex >= rows[index - 1].pressureIndex,
    `pressure index regressed between wave ${rows[index - 1].wave} and ${rows[index].wave}`
  );
}

assert.ok(rows[0].pressureIndex < rows.at(-1).pressureIndex, 'endless pressure must exceed early pressure');

console.table(rows);
console.log('SUDDEN_SIEGE_CALIBRATION_PASS');
