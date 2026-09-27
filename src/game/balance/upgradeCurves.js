export const UPGRADE_CURVE = Object.freeze({
  version: 1,
  maxLevel: 4,
  levelProfiles: Object.freeze([
    Object.freeze({ level: 1, upgradeCostMultiplier: 0, damageMultiplier: 1, attackIntervalMultiplier: 1, rangeMultiplier: 1, utilityMultiplier: 1 }),
    Object.freeze({ level: 2, upgradeCostMultiplier: 0.55, damageMultiplier: 1.28, attackIntervalMultiplier: 0.97, rangeMultiplier: 1.03, utilityMultiplier: 1.08 }),
    Object.freeze({ level: 3, upgradeCostMultiplier: 0.75, damageMultiplier: 1.62, attackIntervalMultiplier: 0.93, rangeMultiplier: 1.06, utilityMultiplier: 1.16 }),
    Object.freeze({ level: 4, upgradeCostMultiplier: 1.00, damageMultiplier: 2.02, attackIntervalMultiplier: 0.88, rangeMultiplier: 1.09, utilityMultiplier: 1.25 })
  ])
});

function getProfile(level) {
  const normalizedLevel = Math.max(1, Math.min(UPGRADE_CURVE.maxLevel, Math.floor(level || 1)));
  return UPGRADE_CURVE.levelProfiles[normalizedLevel - 1];
}

function roundStat(value) {
  return Number(Number(value).toFixed(2));
}

export function getUpgradeCost(defense, targetLevel) {
  const profile = getProfile(targetLevel);
  if (profile.level <= 1) return 0;
  return Math.max(1, Math.ceil(defense.cost * profile.upgradeCostMultiplier));
}

export function getTotalDefenseInvestment(defense, level = 1) {
  let total = defense.cost;
  for (let targetLevel = 2; targetLevel <= Math.min(level, UPGRADE_CURVE.maxLevel); targetLevel += 1) {
    total += getUpgradeCost(defense, targetLevel);
  }
  return total;
}

export function getUpgradedDefenseStats(defense, level = 1) {
  const profile = getProfile(level);
  const upgraded = {
    id: defense.id,
    name: defense.name,
    level: profile.level,
    cost: defense.cost,
    totalInvestment: getTotalDefenseInvestment(defense, profile.level),
    damageType: defense.damageType,
    role: defense.role
  };

  if ('damage' in defense) upgraded.damage = roundStat(defense.damage * profile.damageMultiplier);
  if ('range' in defense) upgraded.range = roundStat(defense.range * profile.rangeMultiplier);
  if ('attackIntervalMs' in defense) upgraded.attackIntervalMs = Math.max(250, Math.round(defense.attackIntervalMs * profile.attackIntervalMultiplier));
  if ('splashRadius' in defense) upgraded.splashRadius = roundStat(defense.splashRadius * profile.utilityMultiplier);
  if ('slowPercent' in defense) upgraded.slowPercent = roundStat(defense.slowPercent * profile.utilityMultiplier);
  if ('slowDurationMs' in defense) upgraded.slowDurationMs = Math.round(defense.slowDurationMs * profile.utilityMultiplier);

  if ('unitDamage' in defense) upgraded.unitDamage = roundStat(defense.unitDamage * profile.damageMultiplier);
  if ('unitHp' in defense) upgraded.unitHp = roundStat(defense.unitHp * profile.utilityMultiplier);
  if ('unitAttackIntervalMs' in defense) upgraded.unitAttackIntervalMs = Math.max(250, Math.round(defense.unitAttackIntervalMs * profile.attackIntervalMultiplier));
  if ('engageRadius' in defense) upgraded.engageRadius = roundStat(defense.engageRadius * profile.rangeMultiplier);
  if ('rallyRange' in defense) upgraded.rallyRange = roundStat(defense.rallyRange * profile.rangeMultiplier);
  if ('respawnIntervalMs' in defense) upgraded.respawnIntervalMs = Math.max(1000, Math.round(defense.respawnIntervalMs / profile.utilityMultiplier));

  return Object.freeze(upgraded);
}

export function getUpgradeEfficiency(defense, level = 1) {
  const stats = getUpgradedDefenseStats(defense, level);
  const sustainedDps =
    'damage' in stats
      ? stats.damage * (1000 / stats.attackIntervalMs)
      : defense.squadSize * stats.unitDamage * (1000 / stats.unitAttackIntervalMs);

  return Object.freeze({
    level: stats.level,
    totalInvestment: stats.totalInvestment,
    sustainedDps: roundStat(sustainedDps),
    dpsPer100Gold: roundStat(sustainedDps * 100 / stats.totalInvestment)
  });
}

export function getNextUpgradePreview(defense, currentLevel = 1) {
  const nextLevel = Math.min(UPGRADE_CURVE.maxLevel, Math.max(1, currentLevel + 1));
  if (currentLevel >= UPGRADE_CURVE.maxLevel) {
    return Object.freeze({ maxed: true, currentLevel: UPGRADE_CURVE.maxLevel });
  }

  return Object.freeze({
    maxed: false,
    currentLevel,
    nextLevel,
    upgradeCost: getUpgradeCost(defense, nextLevel),
    current: getUpgradedDefenseStats(defense, currentLevel),
    next: getUpgradedDefenseStats(defense, nextLevel),
    efficiency: getUpgradeEfficiency(defense, nextLevel)
  });
}
