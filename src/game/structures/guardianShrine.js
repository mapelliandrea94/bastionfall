export const GUARDIAN_SHRINE = Object.freeze({
  id: 'guardian-shrine',
  name: 'Guardian Shrine',
  role: 'strategic-defense',
  cost: 145,
  auraRadius: 240,
  bastionDamageReduction: 0.18,
  nearbyDefenseRangeMultiplier: 1.05,
  maxConcurrent: 2,
  stackingRule: 'strongest-only',
  minimumBastionDamage: 1,
  description: 'Protects the Bastion and slightly extends nearby defense coverage without replacing offensive investment.'
});

export function getGuardianShrineAura(distance) {
  const active = Number(distance) <= GUARDIAN_SHRINE.auraRadius;

  return Object.freeze({
    active,
    bastionDamageMultiplier: active ? 1 - GUARDIAN_SHRINE.bastionDamageReduction : 1,
    defenseRangeMultiplier: active ? GUARDIAN_SHRINE.nearbyDefenseRangeMultiplier : 1
  });
}

export function applyGuardianShrineToBastionDamage(incomingDamage, distance) {
  const aura = getGuardianShrineAura(distance);
  const incoming = Math.max(0, Number(incomingDamage ?? 0));

  if (!aura.active || incoming === 0) {
    return Object.freeze({
      active: aura.active,
      incomingDamage: incoming,
      preventedDamage: 0,
      finalDamage: incoming
    });
  }

  const reduced = incoming * aura.bastionDamageMultiplier;
  const finalDamage = Math.max(
    GUARDIAN_SHRINE.minimumBastionDamage,
    Math.ceil(reduced)
  );

  return Object.freeze({
    active: true,
    incomingDamage: incoming,
    preventedDamage: Math.max(0, incoming - finalDamage),
    finalDamage
  });
}

export function applyGuardianShrineRangePreview(defense, distance) {
  const aura = getGuardianShrineAura(distance);
  const baseRange = Math.max(0, Number(defense?.range ?? defense?.engageRadius ?? 0));

  return Object.freeze({
    active: aura.active,
    baseRange,
    modifiedRange: Number((baseRange * aura.defenseRangeMultiplier).toFixed(2))
  });
}

export function getGuardianShrineFixtures(referenceDefense) {
  const inRangeDamage = applyGuardianShrineToBastionDamage(10, GUARDIAN_SHRINE.auraRadius);
  const outOfRangeDamage = applyGuardianShrineToBastionDamage(10, GUARDIAN_SHRINE.auraRadius + 1);
  const rangePreview = applyGuardianShrineRangePreview(referenceDefense, GUARDIAN_SHRINE.auraRadius);

  return Object.freeze({
    activeExpected: true,
    activeActual: inRangeDamage.active,
    mitigatedExpected: 9,
    mitigatedActual: inRangeDamage.finalDamage,
    outOfRangeExpected: 10,
    outOfRangeActual: outOfRangeDamage.finalDamage,
    rangeIncreased: rangePreview.modifiedRange > rangePreview.baseRange
  });
}
