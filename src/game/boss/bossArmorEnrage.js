export const BOSS_ARMOR_ENRAGE = Object.freeze({
  version: 1,
  baseArmor: 20,
  armorPerBossIndex: 5,
  maxArmor: 45,
  enrageThreshold: 0.35,
  enrageMoveSpeedMultiplier: 1.35,
  enrageBastionDamageMultiplier: 1.5
});

export function getBossArmorForIndex(bossIndex) {
  const index = Math.max(1, Math.floor(Number(bossIndex) || 1));
  return Math.min(
    BOSS_ARMOR_ENRAGE.maxArmor,
    BOSS_ARMOR_ENRAGE.baseArmor + (index - 1) * BOSS_ARMOR_ENRAGE.armorPerBossIndex
  );
}

export function isBossEnraged(currentHp, maxHp) {
  const max = Math.max(1, Number(maxHp) || 1);
  const current = Math.max(0, Number(currentHp) || 0);
  return current / max <= BOSS_ARMOR_ENRAGE.enrageThreshold;
}

export function applyBossEnrageStats(enemy) {
  if (!enemy?.isBoss || !isBossEnraged(enemy.hp, enemy.maxHp)) {
    return Object.freeze({
      enraged: false,
      moveSpeed: Number(enemy?.moveSpeed || 1),
      bastionDamageMultiplier: 1
    });
  }

  return Object.freeze({
    enraged: true,
    moveSpeed: Number(enemy.moveSpeed || 1) * BOSS_ARMOR_ENRAGE.enrageMoveSpeedMultiplier,
    bastionDamageMultiplier: BOSS_ARMOR_ENRAGE.enrageBastionDamageMultiplier
  });
}

export function getBossArmorEnrageFixtures() {
  return Object.freeze({
    armorBoss1Expected: 20,
    armorBoss1Actual: getBossArmorForIndex(1),
    armorBoss3Expected: 30,
    armorBoss3Actual: getBossArmorForIndex(3),
    armorCaps: getBossArmorForIndex(20) === BOSS_ARMOR_ENRAGE.maxArmor,
    aboveThresholdNotEnraged: isBossEnraged(36, 100) === false,
    atThresholdEnraged: isBossEnraged(35, 100) === true,
    enrageBoostsMovement: applyBossEnrageStats({ isBoss: true, hp: 30, maxHp: 100, moveSpeed: 1 }).moveSpeed > 1,
    nonBossUnaffected: applyBossEnrageStats({ isBoss: false, hp: 1, maxHp: 100, moveSpeed: 1 }).enraged === false
  });
}
