import { createEnemyBaseState } from './enemyBase.js';

export const RUNNER_ENEMY = Object.freeze({
  id: 'runner',
  name: 'Runner',
  faction: 'insect',
  unitType: 'infantry',
  archetype: 'runner',
  maxHp: 62,
  moveSpeed: 1.55,
  armor: 0,
  shield: 0,
  goldReward: 1,
  threatValue: 0.9,
  bastionDamage: 1,
  airborne: false,
  description: 'Fast, fragile ground enemy that pressures reaction time and lane coverage.'
});

export function createRunnerEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...RUNNER_ENEMY,
    ...overrides,
    id: String(overrides.id ?? RUNNER_ENEMY.id),
    archetype: RUNNER_ENEMY.archetype
  });
}

export function getRunnerEnemyBudget() {
  return Object.freeze({
    hpPerThreat: Number((RUNNER_ENEMY.maxHp / RUNNER_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((RUNNER_ENEMY.goldReward / RUNNER_ENEMY.threatValue).toFixed(2)),
    speedIndex: RUNNER_ENEMY.moveSpeed,
    bastionDamagePerThreat: Number((RUNNER_ENEMY.bastionDamage / RUNNER_ENEMY.threatValue).toFixed(2))
  });
}
