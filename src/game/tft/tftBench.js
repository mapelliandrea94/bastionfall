export const TFT_BENCH = Object.freeze({
  version: 1,
  slotCount: 7,
  copySellRefund: 2
});

export function createEmptyBench() {
  return Object.freeze(Array.from({ length: TFT_BENCH.slotCount }, () => null));
}

export function addCopyToBench(bench, copy) {
  const next = Array.from(bench ?? createEmptyBench());
  const index = next.findIndex((slot) => slot == null);
  if (index < 0) return Object.freeze({ ok: false, bench: Object.freeze(next), index: -1, error: 'bench_full' });

  next[index] = Object.freeze({ ...copy, benchSlot: index });
  return Object.freeze({ ok: true, bench: Object.freeze(next), index, error: null });
}

export function removeCopyFromBench(bench, index) {
  const next = Array.from(bench ?? createEmptyBench());
  if (index < 0 || index >= next.length || next[index] == null) {
    return Object.freeze({ ok: false, bench: Object.freeze(next), copy: null });
  }

  const copy = next[index];
  next[index] = null;
  return Object.freeze({ ok: true, bench: Object.freeze(next), copy });
}

export function getTftBenchFixtures() {
  const empty = createEmptyBench();
  let bench = empty;
  for (let i = 0; i < 7; i += 1) {
    bench = addCopyToBench(bench, { towerId: 'human-aa', copyId: `copy-${i}` }).bench;
  }
  const fullAttempt = addCopyToBench(bench, { towerId: 'human-aa', copyId: 'overflow' });
  const sold = removeCopyFromBench(bench, 0);

  return Object.freeze({
    slotCountExpected: 7,
    slotCountActual: empty.length,
    buyToBenchWorks: bench.filter(Boolean).length === 7,
    fullBlocksPurchase: fullAttempt.ok === false && fullAttempt.error === 'bench_full',
    sellRemovesCopy: sold.ok === true && sold.bench[0] === null,
    noAutoMerge: bench.filter(Boolean).length === 7
  });
}
