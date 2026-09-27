const UINT32_MAX_PLUS_ONE = 0x100000000;

export function hashRunSeed(input) {
  const text = String(input ?? '');
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function normalizeRunSeed(input) {
  if (Number.isInteger(input)) return input >>> 0;
  return hashRunSeed(input);
}

export function createSeededRandom(seedInput) {
  let state = normalizeRunSeed(seedInput);

  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE;
  };
}
