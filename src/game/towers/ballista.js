export const BALLISTA_TOWER = Object.freeze({
  id: 'ballista',
  name: 'Ballista Tower',
  role: 'long-range-burst',
  cost: 145,
  damage: 52,
  range: 310,
  attackIntervalMs: 2200,
  projectileSpeed: 900,
  damageType: 'piercing',
  targetRule: 'highest-hp',
  description: 'Long-range heavy bolts built to punish durable priority targets.'
});

export function getBallistaTowerDefinition() {
  return BALLISTA_TOWER;
}
