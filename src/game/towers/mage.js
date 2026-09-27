export const MAGE_TOWER = Object.freeze({
  id: 'mage',
  name: 'Mage Tower',
  role: 'magic-burst',
  cost: 125,
  damage: 28,
  range: 235,
  attackIntervalMs: 1400,
  projectileSpeed: 680,
  damageType: 'arcane',
  targetRule: 'highest-hp',
  description: 'Arcane burst damage designed to pressure durable targets.'
});

export function getMageTowerDefinition() {
  return MAGE_TOWER;
}
