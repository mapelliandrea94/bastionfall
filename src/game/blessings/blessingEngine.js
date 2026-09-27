import { getBlessingById } from './blessings.js';

export const BLESSING_ENGINE = Object.freeze({
  version: 1,
  defaultModifiers: Object.freeze({
    towerDamageMultiplier: 1,
    attackSpeedMultiplier: 1,
    bossDamageMultiplier: 1,
    bastionDamageTakenMultiplier: 1,
    lowHpDamageReductionMultiplier: 1,
    lowHpTriggerRatio: 0,
    waveClearGoldBonus: 0,
    waveClearGoldMultiplier: 1,
    bastionMaxHpBonus: 0,
    slowStrengthBonus: 0,
    enemyMoveSpeedMultiplier: 1
  })
});

export function getBlessingModifiers(ownedBlessings = []) {
  const result = { ...BLESSING_ENGINE.defaultModifiers };

  for (const blessingId of ownedBlessings) {
    const blessing = getBlessingById(blessingId);
    if (!blessing) continue;
    const effect = blessing.effect ?? {};

    if (effect.towerDamageMultiplier) result.towerDamageMultiplier *= effect.towerDamageMultiplier;
    if (effect.attackSpeedMultiplier) result.attackSpeedMultiplier *= effect.attackSpeedMultiplier;
    if (effect.bossDamageMultiplier) result.bossDamageMultiplier *= effect.bossDamageMultiplier;
    if (effect.bastionDamageTakenMultiplier) result.bastionDamageTakenMultiplier *= effect.bastionDamageTakenMultiplier;
    if (effect.lowHpDamageReductionMultiplier) result.lowHpDamageReductionMultiplier *= effect.lowHpDamageReductionMultiplier;
    if (effect.triggerHpRatio) result.lowHpTriggerRatio = Math.max(result.lowHpTriggerRatio, effect.triggerHpRatio);
    if (effect.waveClearGoldBonus) result.waveClearGoldBonus += effect.waveClearGoldBonus;
    if (effect.waveClearGoldMultiplier) result.waveClearGoldMultiplier *= effect.waveClearGoldMultiplier;
    if (effect.bastionMaxHpBonus) result.bastionMaxHpBonus += effect.bastionMaxHpBonus;
    if (effect.slowStrengthBonus) result.slowStrengthBonus += effect.slowStrengthBonus;
    if (effect.enemyMoveSpeedMultiplier) result.enemyMoveSpeedMultiplier *= effect.enemyMoveSpeedMultiplier;
  }

  return Object.freeze(result);
}


export function applyBlessingModifierCaps(modifiers) {
  return Object.freeze({
    ...modifiers,
    towerDamageMultiplier: Math.min(1.55, modifiers.towerDamageMultiplier),
    attackSpeedMultiplier: Math.min(1.35, modifiers.attackSpeedMultiplier),
    bossDamageMultiplier: Math.min(1.45, modifiers.bossDamageMultiplier),
    bastionDamageTakenMultiplier: Math.max(0.72, modifiers.bastionDamageTakenMultiplier),
    waveClearGoldMultiplier: Math.min(1.35, modifiers.waveClearGoldMultiplier),
    waveClearGoldBonus: Math.min(6, modifiers.waveClearGoldBonus),
    bastionMaxHpBonus: Math.min(8, modifiers.bastionMaxHpBonus),
    slowStrengthBonus: Math.min(0.3, modifiers.slowStrengthBonus),
    enemyMoveSpeedMultiplier: Math.max(0.88, modifiers.enemyMoveSpeedMultiplier)
  });
}

export function applyBlessingWaveGold(baseGold, ownedBlessings = []) {
  const modifiers = applyBlessingModifierCaps(getBlessingModifiers(ownedBlessings));
  return Math.max(0, Math.round((Math.max(0, Number(baseGold) || 0) + modifiers.waveClearGoldBonus) * modifiers.waveClearGoldMultiplier));
}

export function applyBlessingBastionDamage(baseDamage, coreHp, coreMaxHp, ownedBlessings = []) {
  const modifiers = applyBlessingModifierCaps(getBlessingModifiers(ownedBlessings));
  const maxHp = Math.max(1, Number(coreMaxHp) || 1);
  const hpRatio = Math.max(0, Number(coreHp) || 0) / maxHp;
  const emergencyMultiplier =
    modifiers.lowHpTriggerRatio > 0 && hpRatio <= modifiers.lowHpTriggerRatio
      ? modifiers.lowHpDamageReductionMultiplier
      : 1;

  return Math.max(0, (Number(baseDamage) || 0) * modifiers.bastionDamageTakenMultiplier * emergencyMultiplier);
}

export function getBlessingAdjustedMaxHp(baseMaxHp, ownedBlessings = []) {
  return Math.max(1, Math.round((Number(baseMaxHp) || 1) + applyBlessingModifierCaps(getBlessingModifiers(ownedBlessings)).bastionMaxHpBonus));
}

export function getBlessingEngineFixtures() {
  const stackedDamage = getBlessingModifiers(['keen-edge', 'keen-edge']);
  const mixedGold = applyBlessingWaveGold(10, ['war-chest', 'prosperity']);
  const emergencyDamage = applyBlessingBastionDamage(10, 6, 20, ['last-light']);
  const boostedHp = getBlessingAdjustedMaxHp(20, ['unyielding-core']);

  return Object.freeze({
    stackedDamageAboveBase: stackedDamage.towerDamageMultiplier > 1.16,
    mixedGoldExpected: 14,
    mixedGoldActual: mixedGold,
    emergencyDamageExpected: 7.5,
    emergencyDamageActual: emergencyDamage,
    boostedHpExpected: 24,
    boostedHpActual: boostedHp,
    timeLockSlows: getBlessingModifiers(['time-lock']).enemyMoveSpeedMultiplier === 0.9,
    frostboundAddsControl: getBlessingModifiers(['frostbound']).slowStrengthBonus === 0.12
  });
}
