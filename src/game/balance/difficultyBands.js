export const DIFFICULTY_BANDS = Object.freeze([
  Object.freeze({
    id: 'early',
    minWave: 1,
    maxWave: 5,
    threatMultiplier: 1,
    travelDurationBaseMs: 7000,
    travelDurationStepMs: 120,
    spawnIntervalBaseMs: 900,
    spawnIntervalStepMs: 18,
    bastionDamage: 1
  }),
  Object.freeze({
    id: 'mid',
    minWave: 6,
    maxWave: 12,
    threatMultiplier: 1.08,
    travelDurationBaseMs: 6350,
    travelDurationStepMs: 150,
    spawnIntervalBaseMs: 800,
    spawnIntervalStepMs: 22,
    bastionDamage: 1
  }),
  Object.freeze({
    id: 'late',
    minWave: 13,
    maxWave: 20,
    threatMultiplier: 1.18,
    travelDurationBaseMs: 5250,
    travelDurationStepMs: 170,
    spawnIntervalBaseMs: 650,
    spawnIntervalStepMs: 24,
    bastionDamage: 2
  }),
  Object.freeze({
    id: 'endless',
    minWave: 21,
    maxWave: Number.POSITIVE_INFINITY,
    threatMultiplier: 1.3,
    travelDurationBaseMs: 3900,
    travelDurationStepMs: 55,
    spawnIntervalBaseMs: 460,
    spawnIntervalStepMs: 8,
    bastionDamage: 3
  })
]);

export function getDifficultyBand(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  return DIFFICULTY_BANDS.find((band) => wave >= band.minWave && wave <= band.maxWave) ?? DIFFICULTY_BANDS.at(-1);
}

export function getBandWaveScaling(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  const band = getDifficultyBand(wave);
  const offset = wave - band.minWave;

  return Object.freeze({
    waveNumber: wave,
    bandId: band.id,
    threatMultiplier: band.threatMultiplier,
    travelDurationMs: Math.max(2800, band.travelDurationBaseMs - offset * band.travelDurationStepMs),
    spawnIntervalMs: Math.max(320, band.spawnIntervalBaseMs - offset * band.spawnIntervalStepMs),
    bastionDamage: band.bastionDamage + Math.floor(Math.max(0, wave - 21) / 10)
  });
}

export function getDifficultyBandFixtures() {
  const wave1 = getBandWaveScaling(1);
  const wave6 = getBandWaveScaling(6);
  const wave13 = getBandWaveScaling(13);
  const wave21 = getBandWaveScaling(21);

  return Object.freeze({
    wave1BandExpected: 'early',
    wave1BandActual: wave1.bandId,
    wave6BandExpected: 'mid',
    wave6BandActual: wave6.bandId,
    wave13BandExpected: 'late',
    wave13BandActual: wave13.bandId,
    wave21BandExpected: 'endless',
    wave21BandActual: wave21.bandId,
    monotonicTravel: wave1.travelDurationMs > wave6.travelDurationMs && wave6.travelDurationMs > wave13.travelDurationMs && wave13.travelDurationMs > wave21.travelDurationMs,
    monotonicSpawn: wave1.spawnIntervalMs > wave6.spawnIntervalMs && wave6.spawnIntervalMs > wave13.spawnIntervalMs && wave13.spawnIntervalMs > wave21.spawnIntervalMs
  });
}
