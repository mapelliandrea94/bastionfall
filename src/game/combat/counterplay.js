export const DAMAGE_TYPES = Object.freeze({
  PHYSICAL: 'physical',
  PIERCING: 'piercing',
  ARCANE: 'arcane',
  FROST: 'frost'
});

export const COUNTERPLAY_MATRIX = Object.freeze({
  version: 1,
  damageProfiles: Object.freeze({
    [DAMAGE_TYPES.PHYSICAL]: Object.freeze({
      armorEffectiveness: 1,
      shieldMultiplier: 1
    }),
    [DAMAGE_TYPES.PIERCING]: Object.freeze({
      armorEffectiveness: 0.35,
      shieldMultiplier: 1
    }),
    [DAMAGE_TYPES.ARCANE]: Object.freeze({
      armorEffectiveness: 0,
      shieldMultiplier: 1.25
    }),
    [DAMAGE_TYPES.FROST]: Object.freeze({
      armorEffectiveness: 0.75,
      shieldMultiplier: 0.9
    })
  }),
  antiAirByDefenseId: Object.freeze({
    archer: true,
    cannon: false,
    frost: true,
    mage: true,
    ballista: true,
    barracks: false
  })
});

export function getDamageProfile(damageType) {
  return COUNTERPLAY_MATRIX.damageProfiles[damageType] ??
    COUNTERPLAY_MATRIX.damageProfiles[DAMAGE_TYPES.PHYSICAL];
}

export function canDefenseTargetEnemy(defense, enemy) {
  if (!enemy?.airborne) return true;

  if (defense?.counterType) {
    return defense.counterType === 'air';
  }

  return COUNTERPLAY_MATRIX.antiAirByDefenseId[defense?.id] ?? false;
}

export function resolveDamagePacket(enemy, amount, damageType = DAMAGE_TYPES.PHYSICAL) {
  const profile = getDamageProfile(damageType);
  const incoming = Math.max(0, Number(amount ?? 0));
  const currentShield = Math.max(0, Number(enemy?.shield ?? 0));

  const shieldCapacityDamage = incoming * profile.shieldMultiplier;
  const shieldDamage = Math.min(currentShield, shieldCapacityDamage);
  const rawSpentOnShield = profile.shieldMultiplier > 0
    ? shieldDamage / profile.shieldMultiplier
    : 0;
  const remainingRawDamage = Math.max(0, incoming - rawSpentOnShield);

  const effectiveArmor = Math.max(
    0,
    Math.min(80, Number(enemy?.armor ?? 0) * profile.armorEffectiveness)
  );
  const hpDamage = remainingRawDamage * (1 - effectiveArmor / 100);

  return Object.freeze({
    damageType,
    incomingDamage: incoming,
    shieldDamage: Number(shieldDamage.toFixed(2)),
    hpDamage: Number(hpDamage.toFixed(2)),
    effectiveArmor: Number(effectiveArmor.toFixed(2)),
    shieldMultiplier: profile.shieldMultiplier,
    armorEffectiveness: profile.armorEffectiveness
  });
}

export function getCounterplayFixtures() {
  const armored = Object.freeze({ armor: 40, shield: 0, airborne: false });
  const shielded = Object.freeze({ armor: 0, shield: 100, airborne: false });
  const flying = Object.freeze({ armor: 0, shield: 0, airborne: true });

  return Object.freeze({
    physicalVsArmor: resolveDamagePacket(armored, 100, DAMAGE_TYPES.PHYSICAL),
    piercingVsArmor: resolveDamagePacket(armored, 100, DAMAGE_TYPES.PIERCING),
    arcaneVsShield: resolveDamagePacket(shielded, 100, DAMAGE_TYPES.ARCANE),
    archerVsFlying: canDefenseTargetEnemy({ id: 'archer' }, flying),
    cannonVsFlying: canDefenseTargetEnemy({ id: 'cannon' }, flying),
    barracksVsFlying: canDefenseTargetEnemy({ id: 'barracks' }, flying)
  });
}
