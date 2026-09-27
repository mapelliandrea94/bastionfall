export const ATTACK_FEEDBACK = Object.freeze({
  version: 1,
  minimumProjectileTravelMs: 60,
  dpsWindowMs: 5000
});

export function getProjectileTravelMs(defense, distance) {
  const speed = Math.max(1, Number(defense?.projectileSpeed ?? 1));
  const travelMs = Number(distance ?? 0) / speed * 1000;
  return Math.max(ATTACK_FEEDBACK.minimumProjectileTravelMs, Math.round(travelMs));
}

export function createAttackFeedbackEvent(defense, target, distance, timestampMs = 0) {
  const projectileTravelMs = getProjectileTravelMs(defense, distance);
  const damage = Number(defense?.damage ?? defense?.unitDamage ?? 0);

  return Object.freeze({
    type: 'attack',
    defenseId: defense?.id ?? null,
    targetId: target?.id ?? null,
    damage,
    damageType: defense?.damageType ?? 'physical',
    firedAtMs: Number(timestampMs),
    impactAtMs: Number(timestampMs) + projectileTravelMs,
    projectileTravelMs
  });
}

export function calculateObservedDps(events, nowMs, windowMs = ATTACK_FEEDBACK.dpsWindowMs) {
  const windowStart = Number(nowMs) - windowMs;
  const damage = events
    .filter((event) =>
      event?.type === 'attack' &&
      Number(event.impactAtMs) > windowStart &&
      Number(event.impactAtMs) <= Number(nowMs)
    )
    .reduce((total, event) => total + Math.max(0, Number(event.damage ?? 0)), 0);

  return Number((damage / (windowMs / 1000)).toFixed(2));
}

export function getAttackInstrumentation(defense, sampleDistance = 180) {
  const attackIntervalMs = Number(
    defense?.attackIntervalMs ??
    defense?.unitAttackIntervalMs ??
    1000
  );

  const damage = Number(defense?.damage ?? defense?.unitDamage ?? 0);
  const sustainedDps = damage * (1000 / attackIntervalMs);

  return Object.freeze({
    defenseId: defense?.id ?? null,
    attackIntervalMs,
    attacksPerSecond: Number((1000 / attackIntervalMs).toFixed(2)),
    damagePerAttack: damage,
    sustainedDps: Number(sustainedDps.toFixed(2)),
    sampleDistance,
    projectileTravelMs: getProjectileTravelMs(defense, sampleDistance)
  });
}

export function getAttackFeedbackFixtures() {
  const defense = Object.freeze({
    id: 'fixture-tower',
    damage: 20,
    attackIntervalMs: 1000,
    projectileSpeed: 500,
    damageType: 'physical'
  });

  const eventA = createAttackFeedbackEvent(defense, { id: 'enemy-a' }, 100, 0);
  const eventB = createAttackFeedbackEvent(defense, { id: 'enemy-b' }, 100, 1000);

  return Object.freeze({
    travelMsExpected: 200,
    travelMsActual: eventA.projectileTravelMs,
    dpsExpected: 8,
    dpsActual: calculateObservedDps([eventA, eventB], 5000, 5000)
  });
}
