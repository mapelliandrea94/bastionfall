export const CANNON_TOWER = Object.freeze({
  id: 'cannon',
  name: 'Cannon Tower',
  role: 'area-damage',
  cost: 110,
  damage: 36,
  range: 190,
  attackIntervalMs: 1800,
  projectileSpeed: 520,
  splashRadius: 72,
  damageType: 'physical',
  targetRule: 'cluster',
  description: 'Slow, heavy physical shots with splash damage.'
});

export function getCannonTowerDefinition() {
  return CANNON_TOWER;
}
