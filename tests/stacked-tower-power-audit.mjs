import assert from 'node:assert/strict';
import {
  getStackedTowerPowerAudit,
  getStackedTowerPowerAuditPass
} from '../src/game/balance/stackedTowerPowerAudit.js';

const audit = getStackedTowerPowerAudit();
assert.equal(audit.summary.towerCount, 12);
assert.equal(audit.summary.evolutionCount, 24);
assert.equal(audit.summary.allTwentyFourChecked, true);
assert.equal(audit.summary.allFinite, true);
assert.equal(audit.summary.minAttackIntervalRespected, true);
assert.equal(audit.summary.directDpsCeilingRespected, true);
assert.equal(audit.summary.rangeCeilingRespected, true);
assert.equal(audit.summary.slowCapRespected, true);
assert.equal(audit.summary.vulnerabilityCapRespected, true);
assert.equal(audit.summary.armorShredCapRespected, true);
assert.equal(audit.summary.chainTargetCapRespected, true);
assert.equal(audit.summary.supportDamageBuffCapRespected, true);
assert.equal(audit.summary.supportAttackSpeedBuffCapRespected, true);
assert.equal(getStackedTowerPowerAuditPass(), true);

const gravity = audit.rows.find((row) => row.evolutionId === 'gravity-well-projector');
assert.ok(gravity);
assert.equal(gravity.slowPercent, 75);

const disruptor = audit.rows.find((row) => row.evolutionId === 'disruptor-net-spire');
assert.ok(disruptor);
assert.ok(disruptor.chainTargets <= 8);

console.table(audit.rows.map((row) => ({
  tower: row.towerId,
  evolution: row.evolutionId,
  dpsX: row.directDpsMultiplier,
  rangeX: row.rangeMultiplier,
  slow: row.slowPercent,
  vuln: row.vulnerabilityPercent,
  chain: row.chainTargets
})));
console.log('STACKED_TOWER_POWER_AUDIT_PASS', audit.summary);
