export const FROST_TOWER = Object.freeze({
  id: 'frost',
  name: 'Frost Tower',
  role: 'control',
  cost: 90,
  damage: 8,
  range: 205,
  attackIntervalMs: 1200,
  projectileSpeed: 640,
  slowPercent: 28,
  slowDurationMs: 1800,
  damageType: 'frost',
  targetRule: 'first',
  description: 'Applies reliable slowing pressure to enemies on the lane.'
});

export function getFrostTowerDefinition() {
  return FROST_TOWER;
}
