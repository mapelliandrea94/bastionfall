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
  tftBench = [],
  selectedTftBenchIndex = null,
  tftRollIndex = 0,
  tftShopLocked = false
} = {}) {
  if (!run || run.mode !== 'tft-shop') return null;

  return Object.freeze({
    version: TFT_PERSISTENCE.version,
    savedAt: Date.now(),
    run: Object.freeze({ ...run }),
    placedDefenses: Object.freeze(placedDefenses.map((tower) => Object.freeze({ ...tower }))),
    tftBench: Object.freeze(tftBench.map((copy) => copy ? Object.freeze({ ...copy }) : null)),
    selectedTftBenchIndex: selectedTftBenchIndex == null ? null : clampInt(selectedTftBenchIndex, 0, 6, null),
    tftRollIndex: clampInt(tftRollIndex, 0, Number.MAX_SAFE_INTEGER, 0),
    tftShopLocked: Boolean(tftShopLocked)
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

  const tftBench = Array.from({ length: 7 }, (_, index) => {
    const copy = Array.isArray(snapshot.tftBench) ? snapshot.tftBench[index] : null;
    return copy ? { ...copy, benchSlot: index } : null;
  });

  return {
    version: TFT_PERSISTENCE.version,
    savedAt: Number(snapshot.savedAt) || 0,
    run: { ...snapshot.run },
    placedDefenses,
    tftBench,
    selectedTftBenchIndex: snapshot.selectedTftBenchIndex == null
      ? null
      : clampInt(snapshot.selectedTftBenchIndex, 0, 6, null),
    tftRollIndex: clampInt(snapshot.tftRollIndex, 0, Number.MAX_SAFE_INTEGER, 0),
    tftShopLocked: Boolean(snapshot.tftShopLocked)
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
    tftBench: [{ copyId: 'copy-a', towerId: 'human-aa' }, null, null, null, null, null, null],
    selectedTftBenchIndex: 0,
    tftRollIndex: 4,
    tftShopLocked: true
  });
  const restored = normalizeTftRunSnapshot(JSON.parse(JSON.stringify(source)));
  const corrupt = normalizeTftRunSnapshot({ version: 999, run: { mode: 'tft-shop' } });

  return Object.freeze({
    validSnapshotCreated: source?.run?.mode === 'tft-shop',
    runFieldsPersist: restored?.run?.wave === 8 && restored?.run?.gold === 17,
    towerProgressPersists: restored?.placedDefenses?.[0]?.copyProgress === 6 && restored?.placedDefenses?.[0]?.level === 3,
    evolutionPersists: restored?.placedDefenses?.[1]?.evolution === 'prism-beam-array',
    benchPersists: restored?.tftBench?.[0]?.copyId === 'copy-a' && restored?.tftBench?.length === 7,
    rollLockPersist: restored?.tftRollIndex === 4 && restored?.tftShopLocked === true,
    invalidVersionRejected: corrupt === null
  });
}
