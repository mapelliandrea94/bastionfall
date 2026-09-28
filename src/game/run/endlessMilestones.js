export const ENDLESS_MILESTONES = Object.freeze({
  interval: 25,
  baseGold: 75,
  goldStep: 50
});

const TITLES = Object.freeze({
  25: 'HOLD THE LINE',
  50: 'UNBROKEN',
  75: 'LAST WALL',
  100: 'CENTURY SIEGE'
});

export function getEndlessMilestone(waveNumber, mode = 'single-gate') {
  const wave = Math.max(0, Math.floor(Number(waveNumber) || 0));
  if (wave < ENDLESS_MILESTONES.interval || wave % ENDLESS_MILESTONES.interval !== 0) return null;
  const tier = wave / ENDLESS_MILESTONES.interval;
  const goldReward = mode === 'tft-shop'
    ? 10 + (tier - 1) * 5
    : ENDLESS_MILESTONES.baseGold + (tier - 1) * ENDLESS_MILESTONES.goldStep;
  return Object.freeze({
    wave,
    tier,
    title: TITLES[wave] ?? `ENDLESS ${wave}`,
    goldReward
  });
}
