import { createEnemyBaseState } from './enemyBase.js';

export const NORMAL_ENEMY = Object.freeze({
  id: 'normal',
  name: 'Raider',
  archetype: 'normal',
  maxHp: 100,
  moveSpeed: 1,
  armor: 0,
  shield: 0,
  goldReward: 1,
  threatValue: 1,
  bastionDamage: 1,
  airborne: false,
  description: 'Baseline ground enemy used as the reference for all later archetypes.'
});

export function createNormalEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...NORMAL_ENEMY,
    ...overrides,
    id: String(overrides.id ?? NORMAL_ENEMY.id),
    archetype: NORMAL_ENEMY.archetype
  });
}

export function getNormalEnemyBudget() {
  return Object.freeze({
    hpPerThreat: Number((NORMAL_ENEMY.maxHp / NORMAL_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((NORMAL_ENEMY.goldReward / NORMAL_ENEMY.threatValue).toFixed(2)),
    speedIndex: NORMAL_ENEMY.moveSpeed,
    bastionDamagePerThreat: Number((NORMAL_ENEMY.bastionDamage / NORMAL_ENEMY.threatValue).toFixed(2))
  });
}
