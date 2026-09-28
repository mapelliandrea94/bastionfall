export function getEffectiveTowerRange(definition) {
  if (!definition) return 0;
  const attackRange = Math.max(0, Number(definition.range ?? 0) || 0);
  const supportRange = Math.max(0, Number(definition.buffRadius ?? 0) || 0);
  return Math.max(attackRange, supportRange);
}

export function getTowerRangeKind(definition) {
  if (!definition) return 'attack';
  const attackRange = Math.max(0, Number(definition.range ?? 0) || 0);
  const supportRange = Math.max(0, Number(definition.buffRadius ?? 0) || 0);
  return supportRange > attackRange ? 'support' : 'attack';
}

export function getTowerRangeFixtures() {
  return Object.freeze({
    attackUsesRange: getEffectiveTowerRange({ range: 240 }) === 240,
    supportUsesAura: getEffectiveTowerRange({ range: 180, buffRadius: 210 }) === 210,
    missingIsZero: getEffectiveTowerRange(null) === 0,
    supportKind: getTowerRangeKind({ range: 180, buffRadius: 210 }) === 'support'
  });
}
