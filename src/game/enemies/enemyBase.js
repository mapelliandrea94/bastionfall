export const ENEMY_BASE_MODEL = Object.freeze({
  version: 1,
  defaults: Object.freeze({
    archetype: 'base',
    maxHp: 100,
    moveSpeed: 1,
    armor: 0,
    shield: 0,
    goldReward: 1,
    threatValue: 1,
    bastionDamage: 1,
    airborne: false
  })
});

export function createEnemyBaseState(overrides = {}) {
  const model = {
    id: String(overrides.id ?? 'enemy'),
    archetype: overrides.archetype ?? ENEMY_BASE_MODEL.defaults.archetype,
    maxHp: Math.max(1, Number(overrides.maxHp ?? ENEMY_BASE_MODEL.defaults.maxHp)),
    hp: Math.max(0, Number(overrides.hp ?? overrides.maxHp ?? ENEMY_BASE_MODEL.defaults.maxHp)),
    moveSpeed: Math.max(0, Number(overrides.moveSpeed ?? ENEMY_BASE_MODEL.defaults.moveSpeed)),
    armor: Math.max(0, Number(overrides.armor ?? ENEMY_BASE_MODEL.defaults.armor)),
    maxShield: Math.max(0, Number(overrides.maxShield ?? overrides.shield ?? ENEMY_BASE_MODEL.defaults.shield)),
    shield: Math.max(0, Number(overrides.shield ?? ENEMY_BASE_MODEL.defaults.shield)),
    goldReward: Math.max(0, Number(overrides.goldReward ?? ENEMY_BASE_MODEL.defaults.goldReward)),
    threatValue: Math.max(0, Number(overrides.threatValue ?? ENEMY_BASE_MODEL.defaults.threatValue)),
    bastionDamage: Math.max(0, Number(overrides.bastionDamage ?? ENEMY_BASE_MODEL.defaults.bastionDamage)),
    airborne: Boolean(overrides.airborne ?? ENEMY_BASE_MODEL.defaults.airborne),
    progress: Math.max(0, Math.min(1, Number(overrides.progress ?? 0))),
    spawnedAt: Number(overrides.spawnedAt ?? 0),
    statusEffects: Object.freeze({
      slowPercent: Math.max(0, Number(overrides.statusEffects?.slowPercent ?? 0)),
      slowUntilMs: Math.max(0, Number(overrides.statusEffects?.slowUntilMs ?? 0))
    })
  };

  model.hp = Math.min(model.hp, model.maxHp);
  model.shield = Math.min(model.shield, model.maxShield);

  return Object.freeze(model);
}

export function getEnemyEffectiveSpeed(enemy, nowMs = 0) {
  const slowActive =
    Number(enemy?.statusEffects?.slowUntilMs ?? 0) > Number(nowMs) &&
    Number(enemy?.statusEffects?.slowPercent ?? 0) > 0;

  const slowMultiplier = slowActive
    ? Math.max(0, 1 - Number(enemy.statusEffects.slowPercent) / 100)
    : 1;

  return Number((Number(enemy?.moveSpeed ?? 0) * slowMultiplier).toFixed(4));
}

export function applyEnemyDamage(enemy, amount) {
  let remaining = Math.max(0, Number(amount ?? 0));
  const shieldDamage = Math.min(enemy.shield ?? 0, remaining);
  remaining -= shieldDamage;

  const armorMitigation = Math.max(0, Math.min(0.8, Number(enemy.armor ?? 0) / 100));
  const hpDamage = remaining * (1 - armorMitigation);

  return Object.freeze({
    ...enemy,
    shield: Math.max(0, Number(enemy.shield ?? 0) - shieldDamage),
    hp: Math.max(0, Number(enemy.hp ?? 0) - hpDamage)
  });
}

export function getEnemyBaseFixtures() {
  const base = createEnemyBaseState({ id: 'base-fixture', maxHp: 100, hp: 100, shield: 20, armor: 25 });
  const damaged = applyEnemyDamage(base, 40);
  const slowed = createEnemyBaseState({
    id: 'slow-fixture',
    moveSpeed: 1.2,
    statusEffects: { slowPercent: 25, slowUntilMs: 2000 }
  });

  return Object.freeze({
    shieldExpected: 0,
    shieldActual: damaged.shield,
    hpExpected: 85,
    hpActual: Number(damaged.hp.toFixed(2)),
    slowedSpeedExpected: 0.9,
    slowedSpeedActual: getEnemyEffectiveSpeed(slowed, 1000),
    expiredSlowSpeedExpected: 1.2,
    expiredSlowSpeedActual: getEnemyEffectiveSpeed(slowed, 2500)
  });
}
