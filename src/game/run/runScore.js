export const RUN_SCORE = Object.freeze({
  version: 1,
  wavePoints: 1000,
  survivalPointsPerSecond: 5,
  killPoints: 25,
  bastionHpPointValue: 40,
  flawlessCoreBonus: 500
});

export function calculateRunScore(run = {}) {
  const wave = Math.max(0, Math.floor(Number(run.wave) || 0));
  const elapsedMs = Math.max(0, Number(run.elapsedMs) || 0);
  const kills = Math.max(0, Math.floor(Number(run.kills) || 0));
  const coreHp = Math.max(0, Number(run.coreHp) || 0);
  const coreMaxHp = Math.max(1, Number(run.coreMaxHp) || 1);
  const survivalSeconds = Math.floor(elapsedMs / 1000);
  const flawless = coreHp >= coreMaxHp;

  const waveScore = wave * RUN_SCORE.wavePoints;
  const survivalScore = survivalSeconds * RUN_SCORE.survivalPointsPerSecond;
  const killScore = kills * RUN_SCORE.killPoints;
  const coreScore = Math.round(coreHp * RUN_SCORE.bastionHpPointValue);
  const flawlessBonus = flawless ? RUN_SCORE.flawlessCoreBonus : 0;
  const totalScore = waveScore + survivalScore + killScore + coreScore + flawlessBonus;

  return Object.freeze({
    totalScore,
    waveScore,
    survivalScore,
    killScore,
    coreScore,
    flawlessBonus,
    survivalSeconds,
    flawless
  });
}

export function getRunScoreFixtures() {
  const baseline = calculateRunScore({
    wave: 3,
    elapsedMs: 65000,
    kills: 10,
    coreHp: 15,
    coreMaxHp: 20
  });
  const flawless = calculateRunScore({
    wave: 1,
    elapsedMs: 10000,
    kills: 0,
    coreHp: 20,
    coreMaxHp: 20
  });

  return Object.freeze({
    baselineExpected: 4175,
    baselineActual: baseline.totalScore,
    flawlessExpected: 2350,
    flawlessActual: flawless.totalScore,
    baselineNotFlawless: baseline.flawless === false,
    flawlessDetected: flawless.flawless === true
  });
}
