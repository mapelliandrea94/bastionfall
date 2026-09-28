import assert from 'node:assert/strict';
import { getRiskRewardConfig, applyRiskRewardGold } from '../src/game/balance/riskReward.js';
import { getSuddenSiegeWaveScaling } from '../src/game/balance/suddenSiege.js';

const pressure = getRiskRewardConfig('sudden-siege', 'pressure');
assert.equal(pressure.threatMultiplier, 1.15);
assert.equal(pressure.flatGoldBonus, 1);
assert.equal(applyRiskRewardGold(5, 'sudden-siege', 'pressure'), 6);

const checkpoints = [3, 10, 18, 25];
const combined = checkpoints.map((wave) => {
  const scaling = getSuddenSiegeWaveScaling(wave);
  return {
    wave,
    safeThreat: scaling.suddenThreatMultiplier,
    pressureThreat: Number((scaling.suddenThreatMultiplier * pressure.threatMultiplier).toFixed(3))
  };
});

for (const row of combined) {
  assert.ok(row.pressureThreat > row.safeThreat, `wave ${row.wave}: pressure must increase threat`);
  assert.ok(row.pressureThreat <= 1.70, `wave ${row.wave}: combined threat ceiling exceeded`);
}

assert.ok(combined[0].pressureThreat < combined.at(-1).pressureThreat);
assert.equal(combined.at(-1).pressureThreat, 1.667);

console.table(combined);
console.log('SUDDEN_PRESSURE_AUDIT_PASS');
