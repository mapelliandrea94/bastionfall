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
    enemyMoveSpeedMultiplier: 1,
    humanDamageMultiplier: 1,
    nonHumanDamageMultiplier: 1,
    insectAttackSpeedMultiplier: 1,
    insectPoisonMultiplier: 1,
    insectRangeMultiplier: 1,
    neutralSupportMultiplier: 1,
    neutralDamageMultiplier: 1,
    alienRangeMultiplier: 1,
    alienChainBonus: 0,
    alienDamageMultiplier: 1
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
    if (effect.humanDamageMultiplier) result.humanDamageMultiplier *= effect.humanDamageMultiplier;
    if (effect.nonHumanDamageMultiplier) result.nonHumanDamageMultiplier *= effect.nonHumanDamageMultiplier;
    if (effect.insectAttackSpeedMultiplier) result.insectAttackSpeedMultiplier *= effect.insectAttackSpeedMultiplier;
    if (effect.insectPoisonMultiplier) result.insectPoisonMultiplier *= effect.insectPoisonMultiplier;
    if (effect.insectRangeMultiplier) result.insectRangeMultiplier *= effect.insectRangeMultiplier;
    if (effect.neutralSupportMultiplier) result.neutralSupportMultiplier *= effect.neutralSupportMultiplier;
    if (effect.neutralDamageMultiplier) result.neutralDamageMultiplier *= effect.neutralDamageMultiplier;
    if (effect.alienRangeMultiplier) result.alienRangeMultiplier *= effect.alienRangeMultiplier;
    if (effect.alienChainBonus) result.alienChainBonus += effect.alienChainBonus;
    if (effect.alienDamageMultiplier) result.alienDamageMultiplier *= effect.alienDamageMultiplier;
  }

  return Object.freeze(result);
}


const IDENTITY_BLESSING_BY_FACTION = Object.freeze({
  human: 'human-doctrine',
  insect: 'brood-frenzy',
  alien: 'alien-overmind',
  neutral: 'neutral-covenant'
});

export function getBlessingIdentityVisualCue(definition, ownedBlessings = []) {
  const faction = definition?.faction ?? null;
  const blessingId = faction ? IDENTITY_BLESSING_BY_FACTION[faction] ?? null : null;
  const blessing = blessingId ? getBlessingById(blessingId) : null;
  const active = Boolean(blessingId && ownedBlessings.includes(blessingId));

  return Object.freeze({
    active,
    faction,
    blessingId,
    name: active ? blessing?.name ?? blessingId : null
  });
}

export function applyBlessingTowerIdentity(definition, ownedBlessings = []) {
  if (!definition) return definition;
  const modifiers = applyBlessingModifierCaps(getBlessingModifiers(ownedBlessings));
  const faction = definition.faction;
  let next = { ...definition };

  if (faction === 'human') {
    next.damage = Number((Number(next.damage ?? 0) * modifiers.humanDamageMultiplier).toFixed(2));
  } else {
    next.damage = Number((Number(next.damage ?? 0) * modifiers.nonHumanDamageMultiplier).toFixed(2));
  }

  if (faction === 'insect') {
    next.attackIntervalMs = Math.max(120, Math.round(Number(next.attackIntervalMs ?? 1000) / modifiers.insectAttackSpeedMultiplier));
    next.range = Number((Number(next.range ?? 0) * modifiers.insectRangeMultiplier).toFixed(2));
    if (next.poisonDamagePerSecond) {
      next.poisonDamagePerSecond = Number((next.poisonDamagePerSecond * modifiers.insectPoisonMultiplier).toFixed(2));
    }
  }

  if (faction === 'alien') {
    next.range = Number((Number(next.range ?? 0) * modifiers.alienRangeMultiplier).toFixed(2));
    next.damage = Number((Number(next.damage ?? 0) * modifiers.alienDamageMultiplier).toFixed(2));
    if (modifiers.alienChainBonus > 0) {
      next.chainTargets = Math.max(2, Number(next.chainTargets ?? 1) + modifiers.alienChainBonus);
    }
  }

  if (faction === 'neutral') {
    next.damage = Number((Number(next.damage ?? 0) * modifiers.neutralDamageMultiplier).toFixed(2));
    if (next.slowPercent) {
      next.slowPercent = Math.min(
        75,
        Number((next.slowPercent * modifiers.neutralSupportMultiplier).toFixed(2))
      );
    }
    if (next.vulnerabilityPercent) {
      next.vulnerabilityPercent = Math.min(
        55,
        Number((next.vulnerabilityPercent * modifiers.neutralSupportMultiplier).toFixed(2))
      );
    }
    if (next.buffDamageMultiplier) {
      next.buffDamageMultiplier = Math.min(
        1.4,
        Number((1 + (next.buffDamageMultiplier - 1) * modifiers.neutralSupportMultiplier).toFixed(3))
      );
    }
    if (next.buffAttackSpeedMultiplier) {
      next.buffAttackSpeedMultiplier = Math.min(
        1.4,
        Number((1 + (next.buffAttackSpeedMultiplier - 1) * modifiers.neutralSupportMultiplier).toFixed(3))
      );
    }
  }

  return Object.freeze(next);
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
  const mixedGold = applyBlessingWaveGold(10, ['war-chest', 'prosperity']);
  const emergencyDamage = applyBlessingBastionDamage(10, 6, 20, ['last-light']);
  const boostedHp = getBlessingAdjustedMaxHp(20, ['unyielding-core']);
  const humanIdentity = applyBlessingTowerIdentity({ faction: 'human', damage: 100, range: 200, attackIntervalMs: 1000 }, ['human-doctrine']);
  const alienIdentity = applyBlessingTowerIdentity({ faction: 'alien', damage: 100, range: 200, attackIntervalMs: 1000 }, ['alien-overmind']);
  const humanVisual = getBlessingIdentityVisualCue({ faction: 'human' }, ['human-doctrine']);
  const insectVisual = getBlessingIdentityVisualCue({ faction: 'insect' }, ['human-doctrine']);

  return Object.freeze({
    stackedDamageAboveBase: getBlessingModifiers(['golden-tempest']).towerDamageMultiplier > 1.16,
    mixedGoldExpected: 14,
    mixedGoldActual: mixedGold,
    emergencyDamageExpected: 7.5,
    emergencyDamageActual: emergencyDamage,
    boostedHpExpected: 24,
    boostedHpActual: boostedHp,
    humanDoctrineBoostsHuman: humanIdentity.damage === 118,
    alienOvermindAddsRangeAndChain: alienIdentity.range === 224 && alienIdentity.chainTargets === 2,
    humanIdentityVisualActive: humanVisual.active === true && humanVisual.name === 'Human Doctrine',
    unrelatedIdentityVisualInactive: insectVisual.active === false
  });
}
