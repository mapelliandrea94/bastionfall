export const TFT_PERSISTENCE = Object.freeze({
  version: 1,
  storageKey: 'bastionfall:tft-run:v1'
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
  tftPurchasedSlotIds = []
} = {}) {
  if (!run || run.mode !== 'tft-shop') return null;

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
          clampInt(wallHpById?.[id] ?? 1000, 0, 1000, 1000)
        ])
      )
    ),
    tftBench: Object.freeze(tftBench.map((copy) => copy ? Object.freeze({ ...copy }) : null)),
    selectedTftBenchIndex: selectedTftBenchIndex == null ? null : clampInt(selectedTftBenchIndex, 0, 6, null),
    tftRollIndex: clampInt(tftRollIndex, 0, Number.MAX_SAFE_INTEGER, 0),
    tftShopLocked: Boolean(tftShopLocked),
    tftPurchasedSlotIds: Object.freeze(
      Array.isArray(tftPurchasedSlotIds)
        ? [...new Set(tftPurchasedSlotIds.map((id) => String(id)).filter(Boolean))].slice(0, 7)
        : []
    )
  });
}

export function normalizeTftRunSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== TFT_PERSISTENCE.version || snapshot.run?.mode !== 'tft-shop') return null;

  const placedDefenses = Array.isArray(snapshot.placedDefenses)
    ? snapshot.placedDefenses.map((tower) => ({
        ...tower,
        copyProgress: clampInt(tower?.copyProgress ?? 1, 1, 7, 1),
        level: clampInt(tower?.level ?? 1, 1, 4, 1)
      }))
    : [];

  const activeWallIds = Array.isArray(snapshot.activeWallIds) ? snapshot.activeWallIds.slice(0, 4) : [];
  const wallHpById = Object.fromEntries(
    activeWallIds.map((id) => [
      id,
      clampInt(snapshot.wallHpById?.[id] ?? 1000, 0, 1000, 1000)
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
      ? [...new Set(snapshot.tftPurchasedSlotIds.map((id) => String(id)).filter(Boolean))].slice(0, 7)
      : []
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
    return raw ? normalizeTftRunSnapshot(JSON.parse(raw)) : null;
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
      { id: 'tower-b', defenseId: 'alien-aa', copyProgress: 7, level: 4, evolution: 'prism-beam-array' }
    ],
    activeWallIds: ['wall-01', 'wall-03'],
    wallHpById: { 'wall-01': 760, 'wall-03': 1000 },
    tftBench: [{ copyId: 'copy-a', towerId: 'human-aa' }, null, null, null, null, null, null],
    selectedTftBenchIndex: 0,
    tftRollIndex: 4,
    tftShopLocked: true,
    tftPurchasedSlotIds: ['human-1', 'alien-2']
  });
  const restored = normalizeTftRunSnapshot(JSON.parse(JSON.stringify(source)));
  const corrupt = normalizeTftRunSnapshot({ version: 999, run: { mode: 'tft-shop' } });

  return Object.freeze({
    validSnapshotCreated: source?.run?.mode === 'tft-shop',
    runFieldsPersist: restored?.run?.wave === 8 && restored?.run?.gold === 17,
    towerProgressPersists: restored?.placedDefenses?.[0]?.copyProgress === 6 && restored?.placedDefenses?.[0]?.level === 3,
    evolutionPersists: restored?.placedDefenses?.[1]?.evolution === 'prism-beam-array',
    benchPersists: restored?.tftBench?.[0]?.copyId === 'copy-a' && restored?.tftBench?.length === 7,
    wallsPersist:
      restored?.activeWallIds?.join(',') === 'wall-01,wall-03' &&
      restored?.wallHpById?.['wall-01'] === 760 &&
      restored?.wallHpById?.['wall-03'] === 1000,
    rollLockPersist: restored?.tftRollIndex === 4 && restored?.tftShopLocked === true,
    purchasedSlotsPersist:
      restored?.tftPurchasedSlotIds?.join(',') === 'human-1,alien-2',
    invalidVersionRejected: corrupt === null
  });
}
