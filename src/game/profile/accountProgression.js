export const ACCOUNT_PROGRESSION = Object.freeze({
  version: 1,
  runBaseXp: 100,
  xpPerWave: 20,
  xpPerKill: 1,
  killXpCap: 750,
  towerSevenBonusXp: 75,
  towerFourteenBonusXp: 200
});

export function getXpRequiredForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const step = safeLevel - 1;
  return 400 + step * 120 + step * step * 8;
}

export function getAccountProgress(totalXp) {
  let remaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;

  while (level < 10000) {
    const required = getXpRequiredForLevel(level);
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }

  const requiredXp = getXpRequiredForLevel(level);
  return Object.freeze({
    level,
    currentXp: remaining,
    requiredXp,
    progress: requiredXp > 0 ? Math.min(1, remaining / requiredXp) : 0
  });
}

export function calculateAccountXpReward({ wave = 0, kills = 0, towerMilestones = {} } = {}) {
  const safeWave = Math.max(0, Math.floor(Number(wave) || 0));
  const safeKills = Math.max(0, Math.floor(Number(kills) || 0));
  const seven = Math.max(0, Math.floor(Number(towerMilestones?.seven) || 0));
  const fourteen = Math.max(0, Math.floor(Number(towerMilestones?.fourteen) || 0));

  const baseXp = ACCOUNT_PROGRESSION.runBaseXp;
  const waveXp = safeWave * ACCOUNT_PROGRESSION.xpPerWave;
  const killXp = Math.min(ACCOUNT_PROGRESSION.killXpCap, safeKills * ACCOUNT_PROGRESSION.xpPerKill);
  const towerXp =
    seven * ACCOUNT_PROGRESSION.towerSevenBonusXp +
    fourteen * ACCOUNT_PROGRESSION.towerFourteenBonusXp;

  return Object.freeze({
    totalXp: baseXp + waveXp + killXp + towerXp,
    baseXp,
    waveXp,
    killXp,
    towerXp,
    milestones: Object.freeze({ seven, fourteen })
  });
}
