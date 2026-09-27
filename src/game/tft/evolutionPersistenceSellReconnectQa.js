import { createTftRunSnapshot, normalizeTftRunSnapshot } from './tftPersistence.js';
import { TFT_BENCH, removeCopyFromBench } from './tftBench.js';
import { TFT_SHOP } from './tftShop.js';
import { mergeTftCopyProgress } from './tftCopyProgression.js';

export function getEvolutionPersistenceSellReconnectQa() {
  const baseTower = Object.freeze({
    id: 'tower-a',
    defenseId: 'human-aa',
    level: 3,
    copyProgress: 6,
    investedGold: 12,
    evolution: null
  });
  const copy = Object.freeze({
    copyId: 'copy-a',
    towerId: 'human-aa',
    cost: TFT_SHOP.copyCost
  });

  const merged = mergeTftCopyProgress(baseTower, copy).tower;
  const mergedWithInvestment = Object.freeze({
    ...merged,
    investedGold: Number(baseTower.investedGold ?? 0) + Number(copy.cost ?? TFT_SHOP.copyCost)
  });

  const evolved = Object.freeze({
    ...mergedWithInvestment,
    evolution: 'skypiercer-ballista',
    evolutionChoice: 'A'
  });

  const snapshot = createTftRunSnapshot({
    run: { mode: 'tft-shop', wave: 12, gold: 9, phase: 'preparation' },
    placedDefenses: [evolved],
    activeWallIds: ['wall-01'],
    tftBench: [copy, null, null, null, null, null, null],
    selectedTftBenchIndex: 0,
    tftRollIndex: 3,
    tftShopLocked: true
  });

  const restored = normalizeTftRunSnapshot(JSON.parse(JSON.stringify(snapshot)));
  const sold = removeCopyFromBench(restored.tftBench, 0);

  return Object.freeze({
    restoreKeepsSevenCopies:
      restored?.placedDefenses?.[0]?.copyProgress === 7 &&
      restored?.placedDefenses?.[0]?.level === 4,
    restoreKeepsEvolution:
      restored?.placedDefenses?.[0]?.evolution === 'skypiercer-ballista' &&
      restored?.placedDefenses?.[0]?.evolutionChoice === 'A',
    restoreKeepsInvestment:
      restored?.placedDefenses?.[0]?.investedGold === 14,
    reconnectKeepsBenchShape:
      restored?.tftBench?.length === TFT_BENCH.slotCount,
    selectedBenchIndexRestores:
      restored?.selectedTftBenchIndex === 0,
    benchSellRemovesExactlyOneCopy:
      sold.ok === true &&
      sold.copy?.copyId === 'copy-a' &&
      sold.bench.filter(Boolean).length === 0,
    benchSellRefundStillTwo:
      TFT_BENCH.copySellRefund === 2,
    noDuplicatePlacedTowerAfterRestore:
      restored?.placedDefenses?.length === 1 &&
      restored?.placedDefenses?.[0]?.id === 'tower-a'
  });
}

export function getEvolutionPersistenceSellReconnectPass() {
  return Object.values(getEvolutionPersistenceSellReconnectQa()).every((value) => value === true);
}
