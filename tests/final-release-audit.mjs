import assert from 'node:assert/strict';
import { getFinalReleaseAudit } from '../src/game/balance/finalReleaseAudit.js';

const audit = getFinalReleaseAudit();
for (const [name, pass] of Object.entries(audit.checks)) {
  assert.equal(pass, true, `Final release check failed: ${name}`);
}
assert.equal(audit.pass, true);

console.table(audit.checks);
console.log('FINAL_RELEASE_AUDIT_PASS');
