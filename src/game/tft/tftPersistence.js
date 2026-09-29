import { TFT_COPY_PROGRESSION } from './tftCopyProgression.js';
import { TFT_SHOP } from './tftShop.js';

export const TFT_PERSISTENCE = Object.freeze({
  version: 2,
  storageKey: 'bastionfall:tft-run:v2',
  supportedModes: Object.freeze(['tft-shop', 'sudden-siege'])
});

function clampInt(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function createTftRunSnapshot({
  run,
  placedDefenses = [],
  activeWallIds = [],
  wallHpById = {},
  tftBench = [],
  selectedTftBenchIndex = null,
  tftRollIndex = 0,
  tftShopLocked = false,
  tftPurchasedSlotIds = [],
  spawnQueue = [],
  activeEnemies = [],
  preparationRemaining = null,
  waveSpeed = 1,
  riskRewardTier = 'safe',
  tftAutoStartEnabled = false,
  waveClockNow = null,
  waveTimelineStartedAt = null,
  queuedWaveNumber = null,
  spawnedWaveNumber = null,
  bossSummonFiredKeys = [],
  towerAttackChargeById = {},
  blessingRerollCount = 0,
  selectedBlessingPreviewId = null,
  towerRunStats = {}
} = {}) {
  if (!run || !TFT_PERSISTENCE.supportedModes.includes(run.mode)) return null;

  return Object.freeze({
    version: TFT_PERSISTENCE.version,
    savedAt: Date.now(),
    run: Object.freeze({ ...run }),
    placedDefenses: Object.freeze(placedDefenses.map((tower) => Object.freeze({ ...tower }))),
    activeWallIds: Object.freeze(activeWallIds.slice(0, 4)),
    wallHpById: Object.freeze(
      Object.fromEntries(
        activeWallIds.slice(0, 4).map((id) => [
          id,
          clampInt(wallHpById?.[id] ?? 6000, 0, 6000, 6000)
        ])
      )
    ),
    tftBench: Object.freeze(tftBench.map((copy) => copy ? Object.freeze({ ...copy }) : null)),
    selectedTftBenchIndex: selectedTftBenchIndex == null ? null : clampInt(selectedTftBenchIndex, 0, 6, null),
    tftRollIndex: clampInt(tftRollIndex, 0, Number.MAX_SAFE_INTEGER, 0),
    tftShopLocked: Boolean(tftShopLocked),
    tftPurchasedSlotIds: Object.freeze(
      Array.isArray(tftPurchasedSlotIds)
        ? [...new Set(tftPurchasedSlotIds.map((id) => String(id)).filter(Boolean))].slice(0, TFT_SHOP.slotCount)
        : []
    ),
    spawnQueue: Object.freeze(Array.isArray(spawnQueue) ? spawnQueue.map((enemy) => Object.freeze({ ...enemy })) : []),
    activeEnemies: Object.freeze(Array.isArray(activeEnemies) ? activeEnemies.map((enemy) => Object.freeze({
      ...enemy,
      statusEffects: enemy?.statusEffects ? Object.freeze({ ...enemy.statusEffects }) : enemy?.statusEffects
    })) : []),
    preparationRemaining: preparationRemaining == null ? null : Math.max(0, Number(preparationRemaining) || 0),
    waveSpeed: Number(waveSpeed) === 2 ? 2 : 1,
    riskRewardTier: String(riskRewardTier ?? 'safe'),
    tftAutoStartEnabled: Boolean(tftAutoStartEnabled),
    waveClockNow: Number.isFinite(Number(waveClockNow)) ? Number(waveClockNow) : null,
    waveTimelineStartedAt: Number.isFinite(Number(waveTimelineStartedAt)) ? Number(waveTimelineStartedAt) : null,
    queuedWaveNumber: queuedWaveNumber == null ? null : clampInt(queuedWaveNumber, 1, Number.MAX_SAFE_INTEGER, null),
    spawnedWaveNumber: spawnedWaveNumber == null ? null : clampInt(spawnedWaveNumber, 1, Number.MAX_SAFE_INTEGER, null),
    bossSummonFiredKeys: Object.freeze(Array.isArray(bossSummonFiredKeys) ? [...new Set(bossSummonFiredKeys.map(String))] : []),
    towerAttackChargeById: Object.freeze(
      Object.fromEntries(
        Object.entries(towerAttackChargeById ?? {})
          .filter(([id, value]) => id && Number.isFinite(Number(value)))
          .map(([id, value]) => [String(id), Math.max(0, Number(value))])
      )
    ),
    blessingRerollCount: clampInt(blessingRerollCount, 0, 99, 0),
    selectedBlessingPreviewId: selectedBlessingPreviewId == null ? null : String(selectedBlessingPreviewId),
    towerRunStats: Object.freeze(
      Object.fromEntries(
        Object.entries(towerRunStats ?? {}).map(([id, stat]) => [String(id), Object.freeze({ ...stat })])
      )
    )
  });
}

export function normalizeTftRunSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== TFT_PERSISTENCE.version || !TFT_PERSISTENCE.supportedModes.includes(snapshot.run?.mode)) return null;

  const placedDefenses = Array.isArray(snapshot.placedDefenses)
    ? snapshot.placedDefenses.map((tower) => ({
        ...tower,
        copyProgress: clampInt(tower?.copyProgress ?? 1, 1, TFT_COPY_PROGRESSION.maxCopies, 1),
        level: clampInt(tower?.level ?? 1, 1, 4, 1)
      }))
    : [];

  const activeWallIds = Array.isArray(snapshot.activeWallIds) ? snapshot.activeWallIds.slice(0, 4) : [];
  const wallHpById = Object.fromEntries(
    activeWallIds.map((id) => [
      id,
      clampInt(snapshot.wallHpById?.[id] ?? 6000, 0, 6000, 6000)
    ])
  );

  const tftBench = Array.from({ length: 7 }, (_, index) => {
    const copy = Array.isArray(snapshot.tftBench) ? snapshot.tftBench[index] : null;
    return copy ? { ...copy, benchSlot: index } : null;
  });

  return {
    version: TFT_PERSISTENCE.version,
    savedAt: Number(snapshot.savedAt) || 0,
    run: { ...snapshot.run },
    placedDefenses,
    activeWallIds,
    wallHpById,
    tftBench,
    selectedTftBenchIndex: snapshot.selectedTftBenchIndex == null
      ? null
      : clampInt(snapshot.selectedTftBenchIndex, 0, 6, null),
    tftRollIndex: clampInt(snapshot.tftRollIndex, 0, Number.MAX_SAFE_INTEGER, 0),
    tftShopLocked: Boolean(snapshot.tftShopLocked),
    tftPurchasedSlotIds: Array.isArray(snapshot.tftPurchasedSlotIds)
      ? [...new Set(snapshot.tftPurchasedSlotIds.map((id) => String(id)).filter(Boolean))].slice(0, TFT_SHOP.slotCount)
      : [],
    spawnQueue: Array.isArray(snapshot.spawnQueue) ? snapshot.spawnQueue.map((enemy) => ({ ...enemy })) : [],
    activeEnemies: Array.isArray(snapshot.activeEnemies) ? snapshot.activeEnemies.map((enemy) => ({
      ...enemy,
      statusEffects: enemy?.statusEffects ? { ...enemy.statusEffects } : enemy?.statusEffects
    })) : [],
    preparationRemaining: snapshot.preparationRemaining == null ? null : Math.max(0, Number(snapshot.preparationRemaining) || 0),
    waveSpeed: Number(snapshot.waveSpeed) === 2 ? 2 : 1,
    riskRewardTier: String(snapshot.riskRewardTier ?? 'safe'),
    tftAutoStartEnabled: Boolean(snapshot.tftAutoStartEnabled),
    waveClockNow: Number.isFinite(Number(snapshot.waveClockNow)) ? Number(snapshot.waveClockNow) : null,
    waveTimelineStartedAt: Number.isFinite(Number(snapshot.waveTimelineStartedAt)) ? Number(snapshot.waveTimelineStartedAt) : null,
    queuedWaveNumber: snapshot.queuedWaveNumber == null ? null : clampInt(snapshot.queuedWaveNumber, 1, Number.MAX_SAFE_INTEGER, null),
    spawnedWaveNumber: snapshot.spawnedWaveNumber == null ? null : clampInt(snapshot.spawnedWaveNumber, 1, Number.MAX_SAFE_INTEGER, null),
    bossSummonFiredKeys: Array.isArray(snapshot.bossSummonFiredKeys) ? [...new Set(snapshot.bossSummonFiredKeys.map(String))] : [],
    towerAttackChargeById: Object.fromEntries(
      Object.entries(snapshot.towerAttackChargeById ?? {})
        .filter(([id, value]) => id && Number.isFinite(Number(value)))
        .map(([id, value]) => [String(id), Math.max(0, Number(value))])
    ),
    blessingRerollCount: clampInt(snapshot.blessingRerollCount, 0, 99, 0),
    selectedBlessingPreviewId: snapshot.selectedBlessingPreviewId == null ? null : String(snapshot.selectedBlessingPreviewId),
    towerRunStats: Object.fromEntries(
      Object.entries(snapshot.towerRunStats ?? {}).map(([id, stat]) => [String(id), { ...stat }])
    )
  };
}

export function saveTftRunSnapshot(snapshot, storage = globalThis?.localStorage) {
  if (!storage || !snapshot) return false;
  try {
    storage.setItem(TFT_PERSISTENCE.storageKey, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function loadTftRunSnapshot(storage = globalThis?.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(TFT_PERSISTENCE.storageKey);
    if (!raw) return null;
    const snapshot = normalizeTftRunSnapshot(JSON.parse(raw));
    if (!snapshot) return null;
    return snapshot;
  } catch {
    return null;
  }
}

export function clearTftRunSnapshot(storage = globalThis?.localStorage) {
  if (!storage) return false;
  try {
    storage.removeItem(TFT_PERSISTENCE.storageKey);
    return true;
  } catch {
    return false;
  }
}

export function getTftPersistenceFixtures() {
  const source = createTftRunSnapshot({
    run: { mode: 'tft-shop', wave: 8, gold: 17, phase: 'preparation', blessings: ['a'] },
    placedDefenses: [
      { id: 'tower-a', defenseId: 'human-aa', copyProgress: 6, level: 3, evolution: null },
      { id: 'tower-b', defenseId: 'alien-aa', copyProgress: 14, level: 4, evolution: 'prism-beam-array' }
    ],
    activeWallIds: ['wall-01', 'wall-03'],
    wallHpById: { 'wall-01': 4560, 'wall-03': 6000 },
    tftBench: [{ copyId: 'copy-a', towerId: 'human-aa' }, null, null, null, null, null, null],
    selectedTftBenchIndex: 0,
    tftRollIndex: 4,
    tftShopLocked: true,
    tftPurchasedSlotIds: ['human-1', 'human-2', 'insect-1', 'insect-2', 'alien-1', 'alien-2', 'neutral-1', 'neutral-2'],
    spawnQueue: [{ id: 'queued-a', scheduledSpawnAt: 1234 }],
    activeEnemies: [{ id: 'enemy-a', hp: 50, maxHp: 100, progress: 0.42, statusEffects: { slowUntilMs: 2000 } }],
    preparationRemaining: 12,
    waveSpeed: 2,
    riskRewardTier: 'pressure',
    tftAutoStartEnabled: true,
    waveClockNow: 1500,
    waveTimelineStartedAt: 900,
    queuedWaveNumber: 9,
    spawnedWaveNumber: 9,
    bossSummonFiredKeys: ['10:0'],
    towerAttackChargeById: { 'field:copy-a': 375 },
    blessingRerollCount: 2,
    selectedBlessingPreviewId: 'fixture-blessing',
    towerRunStats: { 'tower-a': { towerId: 'tower-a', defenseId: 'human-aa', damage: 1234, kills: 4 } }
  });
  const restored = normalizeTftRunSnapshot(JSON.parse(JSON.stringify(source)));
  const corrupt = normalizeTftRunSnapshot({ version: 999, run: { mode: 'tft-shop' } });
  const sudden = createTftRunSnapshot({ run: { mode: 'sudden-siege', wave: 3, gold: 5, phase: 'preparation' } });

  return Object.freeze({
    validSnapshotCreated: source?.run?.mode === 'tft-shop',
    runFieldsPersist: restored?.run?.wave === 8 && restored?.run?.gold === 17,
    towerProgressPersists: restored?.placedDefenses?.[0]?.copyProgress === 6 && restored?.placedDefenses?.[0]?.level === 3,
    maxProgressPersists:
      restored?.placedDefenses?.[1]?.copyProgress === TFT_COPY_PROGRESSION.maxCopies &&
      restored?.placedDefenses?.[1]?.level === 4,
    evolutionPersists: restored?.placedDefenses?.[1]?.evolution === 'prism-beam-array',
    benchPersists: restored?.tftBench?.[0]?.copyId === 'copy-a' && restored?.tftBench?.length === 7,
    wallsPersist:
      restored?.activeWallIds?.join(',') === 'wall-01,wall-03' &&
      restored?.wallHpById?.['wall-01'] === 4560 &&
      restored?.wallHpById?.['wall-03'] === 6000,
    rollLockPersist: restored?.tftRollIndex === 4 && restored?.tftShopLocked === true,
    purchasedSlotsPersist:
      restored?.tftPurchasedSlotIds?.length === TFT_SHOP.slotCount &&
      restored?.tftPurchasedSlotIds?.includes('neutral-2'),
    activeWavePersists:
      restored?.spawnQueue?.[0]?.id === 'queued-a' &&
      restored?.activeEnemies?.[0]?.id === 'enemy-a' &&
      restored?.activeEnemies?.[0]?.progress === 0.42 &&
      restored?.waveSpeed === 2 &&
      restored?.riskRewardTier === 'pressure' &&
      restored?.waveTimelineStartedAt === 900 &&
      restored?.queuedWaveNumber === 9 &&
      restored?.spawnedWaveNumber === 9 &&
      restored?.towerAttackChargeById?.['field:copy-a'] === 375 &&
      restored?.blessingRerollCount === 2 &&
      restored?.selectedBlessingPreviewId === 'fixture-blessing' &&
      restored?.towerRunStats?.['tower-a']?.damage === 1234 &&
      restored?.towerRunStats?.['tower-a']?.kills === 4,
    suddenSiegeSupported: sudden?.run?.mode === 'sudden-siege',
    invalidVersionRejected: corrupt === null
  });
}
