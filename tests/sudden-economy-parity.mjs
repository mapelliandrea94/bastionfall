import assert from 'node:assert/strict';
import { TFT_SHOP } from '../src/game/tft/tftShop.js';
import {
  getSuddenSiegeEconomyParity,
  getSuddenSiegeWaveReward
} from '../src/game/balance/suddenSiege.js';

for (const wave of [1, 5, 8, 12, 15, 20, 25, 50]) {
  const parity = getSuddenSiegeEconomyParity(wave, TFT_SHOP);
  assert.equal(parity.exactParity, true, `wave ${wave} must keep TFT base-clear parity`);
  assert.equal(parity.delta, 0);
  assert.equal(getSuddenSiegeWaveReward(wave), TFT_SHOP.waveClearGold);
}

const cumulativeTft = Array.from({ length: 25 }, (_, index) => TFT_SHOP.waveClearGold)
  .reduce((sum, gold) => sum + gold, 0);
const cumulativeSudden = Array.from({ length: 25 }, (_, index) => getSuddenSiegeWaveReward(index + 1))
  .reduce((sum, gold) => sum + gold, 0);

assert.equal(cumulativeSudden, cumulativeTft);
assert.equal(cumulativeSudden, TFT_SHOP.waveClearGold * 25);

console.log('SUDDEN_ECONOMY_PARITY_PASS');
