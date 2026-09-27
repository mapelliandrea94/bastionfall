export const ARCHER_TOWER = Object.freeze({
  id: 'archer',
  name: 'Archer Tower',
  role: 'single-target',
  cost: 70,
  damage: 12,
  range: 220,
  attackIntervalMs: 900,
  projectileSpeed: 720,
  damageType: 'physical',
  targetRule: 'first',
  description: 'Fast, reliable single-target physical damage.'
});

export function getArcherTowerDefinition() {
  return ARCHER_TOWER;
}
