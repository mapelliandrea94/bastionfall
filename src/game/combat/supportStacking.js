export const SUPPORT_STACKING = Object.freeze({
  version: 1,
  policy: 'strongest-wins'
});

export function applyStrongestTimedEffect(statusEffects = {}, {
  valueKey,
  untilKey,
  incomingValue,
  incomingUntilMs
}) {
  const currentValue = Math.max(0, Number(statusEffects[valueKey] ?? 0));
  const incoming = Math.max(0, Number(incomingValue ?? 0));
  const nextValue = Math.max(currentValue, incoming);

  return Object.freeze({
    ...statusEffects,
    [valueKey]: nextValue,
    [untilKey]: Math.max(
      Number(statusEffects[untilKey] ?? 0),
      Number(incomingUntilMs ?? 0)
    )
  });
}

export function applyStrongestArmorShred(enemy, incomingShred, untilMs) {
  const status = { ...(enemy?.statusEffects ?? {}) };
  const previous = Math.max(0, Number(status.armorShred ?? 0));
  const incoming = Math.max(0, Number(incomingShred ?? 0));
  const strongest = Math.max(previous, incoming);
  const restoredArmor = Math.max(0, Number(enemy?.armor ?? 0) + previous);
  const nextArmor = Math.max(0, restoredArmor - strongest);

  return Object.freeze({
    ...enemy,
    armor: nextArmor,
    statusEffects: Object.freeze({
      ...status,
      armorShred: strongest,
      armorShredUntilMs: Math.max(Number(status.armorShredUntilMs ?? 0), Number(untilMs ?? 0))
    })
  });
}

export function getSupportStackingFixtures() {
  const firstSlow = applyStrongestTimedEffect({}, {
    valueKey: 'slowPercent',
    untilKey: 'slowUntilMs',
    incomingValue: 25,
    incomingUntilMs: 1000
  });
  const weakerSlow = applyStrongestTimedEffect(firstSlow, {
    valueKey: 'slowPercent',
    untilKey: 'slowUntilMs',
    incomingValue: 15,
    incomingUntilMs: 1500
  });
  const strongerSlow = applyStrongestTimedEffect(weakerSlow, {
    valueKey: 'slowPercent',
    untilKey: 'slowUntilMs',
    incomingValue: 35,
    incomingUntilMs: 1200
  });

  const firstDebuff = applyStrongestTimedEffect({}, {
    valueKey: 'vulnerabilityPercent',
    untilKey: 'vulnerabilityUntilMs',
    incomingValue: 18,
    incomingUntilMs: 1000
  });
  const duplicateDebuff = applyStrongestTimedEffect(firstDebuff, {
    valueKey: 'vulnerabilityPercent',
    untilKey: 'vulnerabilityUntilMs',
    incomingValue: 18,
    incomingUntilMs: 1600
  });

  const armored = { armor: 40, statusEffects: {} };
  const shredded = applyStrongestArmorShred(armored, 14, 1000);
  const duplicateShred = applyStrongestArmorShred(shredded, 14, 1600);

  return Object.freeze({
    weakerSlowDoesNotStack: weakerSlow.slowPercent === 25,
    strongerSlowWins: strongerSlow.slowPercent === 35,
    durationRefreshes: weakerSlow.slowUntilMs === 1500,
    identicalDebuffDoesNotStack: duplicateDebuff.vulnerabilityPercent === 18,
    duplicateShredDoesNotStack: duplicateShred.armor === 26,
    duplicateShredValueStable: duplicateShred.statusEffects.armorShred === 14
  });
}
