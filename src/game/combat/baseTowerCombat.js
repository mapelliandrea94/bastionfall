import { getCombinedCounterMultiplier } from './factionCounters.js';
import { canDefenseTargetEnemy } from './counterplay.js';

function distance(a, b) {
  return Math.hypot(Number(a?.x ?? 0) - Number(b?.x ?? 0), Number(a?.y ?? 0) - Number(b?.y ?? 0));
}

export function getTowerBuffMultiplier(attacker, placedDefenses = [], definitions = {}) {
  let damageMultiplier = 1;
  let attackSpeedMultiplier = 1;

  for (const placed of placedDefenses) {
    const buff = definitions[placed.defenseId];
    if (!buff || buff.id !== 'buff' || placed.id === attacker.id) continue;
    if (distance(attacker, placed) > Number(buff.buffRadius ?? 0)) continue;
    damageMultiplier = Math.max(damageMultiplier, Number(buff.buffDamageMultiplier ?? 1));
    attackSpeedMultiplier = Math.max(attackSpeedMultiplier, Number(buff.buffAttackSpeedMultiplier ?? 1));
  }

  return Object.freeze({ damageMultiplier, attackSpeedMultiplier });
}

export function getEffectiveTowerAttackInterval(definition, attacker, placedDefenses = [], definitions = {}) {
  const buff = getTowerBuffMultiplier(attacker, placedDefenses, definitions);
  return Math.max(150, Math.round(Number(definition.attackIntervalMs ?? 1000) / buff.attackSpeedMultiplier));
}

export function getTowerTargets(definition, attacker, enemies = []) {
  const inRange = enemies.filter((enemy) =>
    canDefenseTargetEnemy(definition, enemy) &&
    distance(attacker, enemy.position ?? enemy) <= Number(definition.range ?? 0)
  );

  const progressOf = (enemy) => Number(enemy?.progress ?? 0);
  const compareByThreatToNexus = (a, b) => progressOf(b) - progressOf(a);

  // Nexus safety is always the primary rule: among valid targets in range,
  // shoot the enemy furthest along the path first. Tower-specific targeting
  // only breaks ties between enemies at effectively the same path progress.
  if (definition.targetRule === 'highest-hp') {
    inRange.sort((a, b) =>
      compareByThreatToNexus(a, b) ||
      Number(b.hp ?? 0) - Number(a.hp ?? 0)
    );
  } else if (definition.targetRule === 'cluster') {
    const countNearby = (candidate) => inRange.filter((other) =>
      distance(candidate.position ?? candidate, other.position ?? other) <= Number(definition.splashRadius ?? 0)
    ).length;

    inRange.sort((a, b) =>
      compareByThreatToNexus(a, b) ||
      countNearby(b) - countNearby(a)
    );
  } else {
    inRange.sort(compareByThreatToNexus);
  }

  return inRange;
}

export function getTowerHitDamage(definition, attacker, enemy, placedDefenses = [], definitions = {}) {
  const buff = getTowerBuffMultiplier(attacker, placedDefenses, definitions);
  const vulnerabilityMultiplier = Number(enemy?.statusEffects?.vulnerabilityPercent ?? 0) > 0 ? 1 + Number(enemy.statusEffects.vulnerabilityPercent) / 100 : 1;
  return Number((
    Number(definition.damage ?? 0) *
    getCombinedCounterMultiplier(definition, enemy) *
    buff.damageMultiplier *
    vulnerabilityMultiplier
  ).toFixed(4));
}

export function getBaseTowerCombatFixtures(definitions) {
  const humanAA = definitions['human-aa'];
  const insectAir = { faction: 'insect', unitType: 'air', hp: 100, progress: .5, position: { x: 0, y: 0 }, statusEffects: {} };
  const attacker = { id: 'a', defenseId: 'human-aa', x: 0, y: 0 };
  const buff = { id: 'b', defenseId: 'buff', x: 10, y: 0 };

  const nearNexus = { ...insectAir, id: 'near-nexus', hp: 20, progress: .9 };
  const highHpBehind = { ...insectAir, id: 'high-hp-behind', hp: 1000, progress: .35 };
  const armorDefinition = { ...definitions['human-armor'], range: 999 };

  return Object.freeze({
    perfectCounterDamageExpected: Number((humanAA.damage * 2.25).toFixed(4)),
    perfectCounterDamageActual: getTowerHitDamage(humanAA, attacker, insectAir, [], definitions),
    buffRaisesDamage: getTowerHitDamage(humanAA, attacker, insectAir, [buff], definitions) > getTowerHitDamage(humanAA, attacker, insectAir, [], definitions),
    buffRaisesAttackSpeed: getEffectiveTowerAttackInterval(humanAA, attacker, [buff], definitions) < humanAA.attackIntervalMs,
    targetInRange: getTowerTargets(humanAA, attacker, [insectAir]).length === 1,
    nexusThreatPriority: getTowerTargets(armorDefinition, attacker, [highHpBehind, nearNexus])[0]?.id === 'near-nexus'
  });
}
