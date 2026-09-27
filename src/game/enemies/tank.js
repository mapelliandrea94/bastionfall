import { createEnemyBaseState } from './enemyBase.js';

export const TANK_ENEMY = Object.freeze({
  id: 'tank',
  name: 'Bulwark',
  faction: 'alien',
  unitType: 'armored',
  archetype: 'tank',
  maxHp: 260,
  moveSpeed: 0.72,
  armor: 0,
  shield: 0,
  goldReward: 3,
  threatValue: 2.4,
  bastionDamage: 2,
  airborne: false,
  description: 'Slow, durable ground enemy that absorbs sustained fire and punishes low single-target damage.'
});

export function createTankEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...TANK_ENEMY,
    ...overrides,
    id: String(overrides.id ?? TANK_ENEMY.id),
    archetype: TANK_ENEMY.archetype
  });
}

export function getTankEnemyBudget() {
  return Object.freeze({
    hpPerThreat: Number((TANK_ENEMY.maxHp / TANK_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((TANK_ENEMY.goldReward / TANK_ENEMY.threatValue).toFixed(2)),
    speedIndex: TANK_ENEMY.moveSpeed,
    bastionDamagePerThreat: Number((TANK_ENEMY.bastionDamage / TANK_ENEMY.threatValue).toFixed(2))
  });
}
