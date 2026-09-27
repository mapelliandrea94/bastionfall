export const WAR_FORGE = Object.freeze({
  id: 'war-forge',
  name: 'War Forge',
  role: 'strategic-offense',
  cost: 150,
  auraRadius: 220,
  damageMultiplier: 1.12,
  attackSpeedMultiplier: 1.08,
  maxConcurrent: 2,
  stackingRule: 'strongest-only',
  description: 'Boosts nearby defenses with a controlled offensive aura.'
});

export function getWarForgeAura(defense, distance) {
  const inRange = Number(distance) <= WAR_FORGE.auraRadius;
  if (!inRange || !defense) {
    return Object.freeze({
      active: false,
      damageMultiplier: 1,
      attackSpeedMultiplier: 1
    });
  }

  return Object.freeze({
    active: true,
    damageMultiplier: WAR_FORGE.damageMultiplier,
    attackSpeedMultiplier: WAR_FORGE.attackSpeedMultiplier
  });
}

export function applyWarForgePreview(defense, distance) {
  const aura = getWarForgeAura(defense, distance);
  const baseDamage = Number(defense?.damage ?? defense?.unitDamage ?? 0);
  const baseInterval = Number(defense?.attackIntervalMs ?? defense?.unitAttackIntervalMs ?? 1000);
  const modifiedDamage = baseDamage * aura.damageMultiplier;
  const modifiedInterval = baseInterval / aura.attackSpeedMultiplier;
  const modifiedDps = modifiedDamage * (1000 / modifiedInterval);

  return Object.freeze({
    active: aura.active,
    modifiedDamage: Number(modifiedDamage.toFixed(2)),
    modifiedIntervalMs: Number(modifiedInterval.toFixed(2)),
    modifiedDps: Number(modifiedDps.toFixed(2))
  });
}

export function getWarForgeFixtures(referenceDefense) {
  const inRange = applyWarForgePreview(referenceDefense, WAR_FORGE.auraRadius);
  const outOfRange = applyWarForgePreview(referenceDefense, WAR_FORGE.auraRadius + 1);

  return Object.freeze({
    activeExpected: true,
    activeActual: inRange.active,
    inactiveExpected: false,
    inactiveActual: outOfRange.active,
    damageBoosted: inRange.modifiedDamage > Number(referenceDefense?.damage ?? referenceDefense?.unitDamage ?? 0),
    intervalReduced: inRange.modifiedIntervalMs < Number(referenceDefense?.attackIntervalMs ?? referenceDefense?.unitAttackIntervalMs ?? 1000)
  });
}
