export const RISK_REWARD = Object.freeze({
  version: 1,
  safeTier: 'safe',
  pressureTier: 'pressure',
  byMode: Object.freeze({
    'single-gate': Object.freeze({ threatMultiplier: 1.25, rewardMultiplier: 1.35, flatGoldBonus: 0 }),
    'tri-gate': Object.freeze({ threatMultiplier: 1.20, rewardMultiplier: 1.25, flatGoldBonus: 0 }),
    'tft-shop': Object.freeze({ threatMultiplier: 1.25, rewardMultiplier: 1, flatGoldBonus: 2 }),
    'sudden-siege': Object.freeze({ threatMultiplier: 1.30, rewardMultiplier: 1, flatGoldBonus: 2 }),
    'last-bastion': Object.freeze({ threatMultiplier: 1.15, rewardMultiplier: 1.20, flatGoldBonus: 0 })
  })
});

export function getRiskRewardConfig(mode, tier = RISK_REWARD.safeTier) {
  const pressure = RISK_REWARD.byMode[mode] ?? RISK_REWARD.byMode['single-gate'];
  if (tier !== RISK_REWARD.pressureTier) {
    return Object.freeze({
      tier: RISK_REWARD.safeTier,
      threatMultiplier: 1,
      rewardMultiplier: 1,
      flatGoldBonus: 0
    });
  }
  return Object.freeze({ tier: RISK_REWARD.pressureTier, ...pressure });
}
export function applyRiskRewardGold(baseGold, mode, tier = RISK_REWARD.safeTier) {
  const base = Math.max(0, Number(baseGold) || 0);
  const config = getRiskRewardConfig(mode, tier);
  return Math.max(
    0,
    Math.round(base * config.rewardMultiplier + config.flatGoldBonus)
  );
}

export function getRiskRewardFixtures() {
  return Object.freeze({
    safeSingleThreat: getRiskRewardConfig('single-gate', 'safe').threatMultiplier,
    pressuredSingleGold: applyRiskRewardGold(20, 'single-gate', 'pressure'),
    pressuredTriGold: applyRiskRewardGold(20, 'tri-gate', 'pressure'),
    pressuredTftGold: applyRiskRewardGold(5, 'tft-shop', 'pressure'),
    lastBastionThreat: getRiskRewardConfig('last-bastion', 'pressure').threatMultiplier
  });
}
