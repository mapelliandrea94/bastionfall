export const TOWER_COMBOS = Object.freeze([
  Object.freeze({
    id: 'frost-shatter',
    name: 'FROST SHATTER',
    primerTowerId: 'slow',
    finisherTowerIds: Object.freeze(['human-armor', 'alien-armor']),
    description: 'Heavy armor shots deal +25% damage to slowed enemies.',
    bonusMultiplier: 1.25
  }),
  Object.freeze({
    id: 'marked-overload',
    name: 'MARKED OVERLOAD',
    primerTowerId: 'debuff',
    finisherTowerIds: Object.freeze(['alien-aa', 'alien-infantry']),
    description: 'Alien energy attacks deal +20% damage to marked enemies.',
    bonusMultiplier: 1.20
  }),
  Object.freeze({
    id: 'toxic-suppression',
    name: 'TOXIC SUPPRESSION',
    primerTowerIds: Object.freeze(['insect-aa']),
    finisherTowerIds: Object.freeze(['human-infantry', 'insect-infantry']),
    description: 'Suppression attacks deal +18% damage to poisoned enemies.',
    bonusMultiplier: 1.18
  })
]);

export function getActiveTowerCombos(placedDefenses = []) {
  const ids = new Set(placedDefenses.map((tower) => tower?.defenseId).filter(Boolean));
  return Object.freeze(TOWER_COMBOS.filter((combo) => {
    const primers = combo.primerTowerIds ?? [combo.primerTowerId];
    return primers.some((id) => ids.has(id)) && combo.finisherTowerIds.some((id) => ids.has(id));
  }));
}

export function getTowerComboDamageMultiplier(defenseId, enemy = {}) {
  const status = enemy?.statusEffects ?? {};
  let multiplier = 1;
  if (
    ['human-armor', 'alien-armor'].includes(defenseId) &&
    Number(status.slowPercent ?? 0) > 0
  ) multiplier *= 1.25;
  if (
    ['alien-aa', 'alien-infantry'].includes(defenseId) &&
    Number(status.vulnerabilityPercent ?? 0) > 0
  ) multiplier *= 1.20;
  if (
    ['human-infantry', 'insect-infantry'].includes(defenseId) &&
    Number(status.poisonDamagePerSecond ?? 0) > 0
  ) multiplier *= 1.18;
  return Number(multiplier.toFixed(4));
}
