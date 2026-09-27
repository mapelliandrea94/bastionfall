import { createEnemyBaseState } from './enemyBase.js';

export const FLYING_ENEMY = Object.freeze({
  id: 'flying',
  name: 'Skyrake',
  archetype: 'flying',
  maxHp: 82,
  moveSpeed: 1.32,
  armor: 0,
  shield: 0,
  goldReward: 2,
  threatValue: 1.35,
  bastionDamage: 1,
  airborne: true,
  description: 'Fast airborne enemy that will require explicit anti-air counterplay in later combat rules.'
});

export function createFlyingEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...FLYING_ENEMY,
    ...overrides,
    id: String(overrides.id ?? FLYING_ENEMY.id),
    archetype: FLYING_ENEMY.archetype,
    airborne: true
  });
}

export function getFlyingEnemyBudget() {
  return Object.freeze({
    hpPerThreat: Number((FLYING_ENEMY.maxHp / FLYING_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((FLYING_ENEMY.goldReward / FLYING_ENEMY.threatValue).toFixed(2)),
    speedIndex: FLYING_ENEMY.moveSpeed,
    bastionDamagePerThreat: Number((FLYING_ENEMY.bastionDamage / FLYING_ENEMY.threatValue).toFixed(2)),
    airborne: true
  });
}
