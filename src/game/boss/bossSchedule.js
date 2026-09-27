export const BOSS_SCHEDULE = Object.freeze({
  version: 1,
  firstBossWave: 10,
  interval: 10,
  profiles: Object.freeze([
    Object.freeze({
      id: 'siege-wyrm',
      name: 'Siege Wyrm',
      unlockBossIndex: 1
    }),
    Object.freeze({
      id: 'iron-colossus',
      name: 'Iron Colossus',
      unlockBossIndex: 2
    }),
    Object.freeze({
      id: 'storm-tyrant',
      name: 'Storm Tyrant',
      unlockBossIndex: 3
    })
  ])
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

export function isBossWave(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  return wave >= BOSS_SCHEDULE.firstBossWave && wave % BOSS_SCHEDULE.interval === 0;
}

export function getBossIndexForWave(waveNumber) {
  if (!isBossWave(waveNumber)) return null;
  return Math.floor(normalizeWaveNumber(waveNumber) / BOSS_SCHEDULE.interval);
}

export function getBossProfileForWave(waveNumber) {
  const bossIndex = getBossIndexForWave(waveNumber);
  if (bossIndex === null) return null;

  const unlockedProfiles = BOSS_SCHEDULE.profiles.filter(
    (profile) => bossIndex >= profile.unlockBossIndex
  );

  const profile = unlockedProfiles[(bossIndex - 1) % unlockedProfiles.length] ?? BOSS_SCHEDULE.profiles[0];

  return Object.freeze({
    waveNumber: normalizeWaveNumber(waveNumber),
    bossIndex,
    profileId: profile.id,
    name: profile.name
  });
}

export function getUpcomingBossWave(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  if (isBossWave(wave)) return wave;
  return Math.ceil(wave / BOSS_SCHEDULE.interval) * BOSS_SCHEDULE.interval;
}

export function getBossScheduleFixtures() {
  const wave9 = getBossProfileForWave(9);
  const wave10 = getBossProfileForWave(10);
  const wave20 = getBossProfileForWave(20);
  const wave30 = getBossProfileForWave(30);
  const wave40 = getBossProfileForWave(40);

  return Object.freeze({
    wave9NotBoss: wave9 === null,
    wave10BossIndexExpected: 1,
    wave10BossIndexActual: wave10?.bossIndex ?? null,
    wave20BossIndexExpected: 2,
    wave20BossIndexActual: wave20?.bossIndex ?? null,
    wave30BossIndexExpected: 3,
    wave30BossIndexActual: wave30?.bossIndex ?? null,
    wave40BossIndexExpected: 4,
    wave40BossIndexActual: wave40?.bossIndex ?? null,
    cadenceStable:
      isBossWave(10) &&
      isBossWave(20) &&
      isBossWave(30) &&
      isBossWave(40) &&
      !isBossWave(11),
    cyclesProfiles:
      wave10?.profileId === 'siege-wyrm' &&
      wave20?.profileId === 'iron-colossus' &&
      wave30?.profileId === 'storm-tyrant' &&
      wave40?.profileId === 'siege-wyrm',
    upcomingBossFrom11: getUpcomingBossWave(11) === 20,
    upcomingBossFrom20: getUpcomingBossWave(20) === 20
  });
}
