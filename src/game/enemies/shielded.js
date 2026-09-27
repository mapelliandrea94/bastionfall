import { createEnemyBaseState } from './enemyBase.js';

export const SHIELDED_ENEMY = Object.freeze({
  id: 'shielded',
  name: 'Aegis',
  archetype: 'shielded',
  maxHp: 140,
  moveSpeed: 0.94,
  armor: 0,
  shield: 95,
  goldReward: 3,
  threatValue: 2.15,
  bastionDamage: 2,
  airborne: false,
  description: 'Ground enemy protected by a separate barrier that must be depleted before health can be damaged.'
});

export function createShieldedEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...SHIELDED_ENEMY,
    ...overrides,
    id: String(overrides.id ?? SHIELDED_ENEMY.id),
    archetype: SHIELDED_ENEMY.archetype
  });
}

export function getShieldedEnemyBudget() {
  const totalDurability = SHIELDED_ENEMY.maxHp + SHIELDED_ENEMY.shield;

  return Object.freeze({
    hpPerThreat: Number((SHIELDED_ENEMY.maxHp / SHIELDED_ENEMY.threatValue).toFixed(2)),
    shieldPerThreat: Number((SHIELDED_ENEMY.shield / SHIELDED_ENEMY.threatValue).toFixed(2)),
    totalDurability,
    durabilityPerThreat: Number((totalDurability / SHIELDED_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((SHIELDED_ENEMY.goldReward / SHIELDED_ENEMY.threatValue).toFixed(2)),
    speedIndex: SHIELDED_ENEMY.moveSpeed
  });
}
