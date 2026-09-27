import { createEnemyBaseState } from './enemyBase.js';

export const ARMORED_ENEMY = Object.freeze({
  id: 'armored',
  name: 'Ironclad',
  faction: 'human',
  unitType: 'armored',
  archetype: 'armored',
  maxHp: 180,
  moveSpeed: 0.88,
  armor: 35,
  shield: 0,
  goldReward: 3,
  threatValue: 2.2,
  bastionDamage: 2,
  airborne: false,
  description: 'Heavy ground enemy with substantial armor that punishes overreliance on mitigated damage.'
});

export function createArmoredEnemyState(overrides = {}) {
  return createEnemyBaseState({
    ...ARMORED_ENEMY,
    ...overrides,
    id: String(overrides.id ?? ARMORED_ENEMY.id),
    archetype: ARMORED_ENEMY.archetype
  });
}

export function getArmoredEnemyBudget() {
  const mitigation = Math.max(0, Math.min(0.8, ARMORED_ENEMY.armor / 100));
  const effectiveHp = ARMORED_ENEMY.maxHp / (1 - mitigation);

  return Object.freeze({
    hpPerThreat: Number((ARMORED_ENEMY.maxHp / ARMORED_ENEMY.threatValue).toFixed(2)),
    effectiveHp: Number(effectiveHp.toFixed(2)),
    effectiveHpPerThreat: Number((effectiveHp / ARMORED_ENEMY.threatValue).toFixed(2)),
    rewardPerThreat: Number((ARMORED_ENEMY.goldReward / ARMORED_ENEMY.threatValue).toFixed(2)),
    speedIndex: ARMORED_ENEMY.moveSpeed
  });
}
