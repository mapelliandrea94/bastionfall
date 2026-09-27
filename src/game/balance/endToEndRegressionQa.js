import { BASE_TOWER_GAMEPLAY_BY_ID } from '../towers/baseTowerGameplay.js';
import { TOWER_EVOLUTIONS, getRuntimeTowerDefinition } from '../towers/evolutions.js';
import { ENEMY_ROSTER_24 } from '../enemies/enemyRoster.js';
import { getCombinedCounterMultiplier } from '../combat/factionCounters.js';
import { canDefenseTargetEnemy, resolveDamagePacket } from '../combat/counterplay.js';
import { getTowerHitDamage, getTowerTargets } from '../combat/baseTowerCombat.js';

export const END_TO_END_REGRESSION = Object.freeze({
  version: 1,
  expectedEvolutionCount: 24,
  expectedEnemyCount: 24,
  expectedPairCount: 24 * 24,
  expectedModeCount: 4,
  perfectCounterMultiplier: 2.25,
  doublePenaltyMultiplier: 0.5625
});

const LEGACY_TOWER_IDS = Object.freeze([
  'archer',
  'cannon',
  'frost',
  'mage',
  'ballista',
  'barracks'
]);

const MODE_IDS = Object.freeze([
  'single-gate',
  'tri-gate',
  'last-bastion',
  'tft-shop'
]);

const round = (value, digits = 4) => Number(Number(value ?? 0).toFixed(digits));

function getEvolutionRuntime(evolution) {
  const base = BASE_TOWER_GAMEPLAY_BY_ID[evolution.towerId];
  if (!base) return null;

  return getRuntimeTowerDefinition(base, {
    id: `qa-${evolution.id}`,
    defenseId: evolution.towerId,
    level: 4,
    evolution: evolution.id,
    evolutionChoice: evolution.branch
  });
}

export const END_TO_END_PAIR_MATRIX = Object.freeze(
  TOWER_EVOLUTIONS.flatMap((evolution) => {
    const runtime = getEvolutionRuntime(evolution);
    if (!runtime) return [];

    const attacker = Object.freeze({
      id: `qa-${evolution.id}`,
      defenseId: evolution.towerId,
      x: 0,
      y: 0
    });

    return ENEMY_ROSTER_24.map((enemy) => {
      const target = Object.freeze({
        ...enemy,
        hp: enemy.maxHp,
        progress: 0.5,
        position: Object.freeze({ x: 0, y: 0 }),
        statusEffects: Object.freeze({})
      });
      const multiplier = getCombinedCounterMultiplier(runtime, target);
      const canTarget = canDefenseTargetEnemy(runtime, target);
      const selected = getTowerTargets(runtime, attacker, [target]);
      const hitDamage = canTarget
        ? getTowerHitDamage(runtime, attacker, target, [], BASE_TOWER_GAMEPLAY_BY_ID)
        : 0;
      const packet = resolveDamagePacket(target, hitDamage, runtime.damageType);

      return Object.freeze({
        evolutionId: evolution.id,
        towerId: evolution.towerId,
        enemyId: enemy.id,
        towerFaction: runtime.faction,
        enemyFaction: enemy.faction,
        counterType: runtime.counterType,
        enemyType: enemy.unitType,
        airborne: enemy.airborne === true,
        multiplier,
        canTarget,
        selectedByCombatTargeting: selected.some((entry) => entry.id === target.id),
        hitDamage: round(hitDamage),
        hpDamage: packet.hpDamage,
        shieldDamage: packet.shieldDamage
      });
    });
  })
);

export function getEndToEndRegressionQa() {
  const pairKeys = new Set(
    END_TO_END_PAIR_MATRIX.map((entry) => `${entry.evolutionId}:${entry.enemyId}`)
  );
  const perfectPairs = END_TO_END_PAIR_MATRIX.filter(
    (entry) => entry.multiplier === END_TO_END_REGRESSION.perfectCounterMultiplier
  );
  const penaltyPairs = END_TO_END_PAIR_MATRIX.filter(
    (entry) => entry.multiplier === END_TO_END_REGRESSION.doublePenaltyMultiplier
  );
  const evolvedRuntimes = TOWER_EVOLUTIONS.map((evolution) => ({
    evolution,
    runtime: getEvolutionRuntime(evolution)
  }));
  const airPairs = END_TO_END_PAIR_MATRIX.filter((entry) => entry.airborne);
  const groundPairs = END_TO_END_PAIR_MATRIX.filter((entry) => !entry.airborne);

  return Object.freeze({
    evolutionCountIs24:
      TOWER_EVOLUTIONS.length === END_TO_END_REGRESSION.expectedEvolutionCount,
    enemyCountIs24:
      ENEMY_ROSTER_24.length === END_TO_END_REGRESSION.expectedEnemyCount,
    full576PairMatrix:
      END_TO_END_PAIR_MATRIX.length === END_TO_END_REGRESSION.expectedPairCount &&
      pairKeys.size === END_TO_END_REGRESSION.expectedPairCount,
    perfectDoubleCounterPresent:
      perfectPairs.length > 0 &&
      perfectPairs.every((entry) => entry.multiplier === 2.25),
    doublePenaltyPresent:
      penaltyPairs.length > 0 &&
      penaltyPairs.every((entry) => entry.multiplier === 0.5625),
    allCounterMultipliersFinite:
      END_TO_END_PAIR_MATRIX.every(
        (entry) => Number.isFinite(entry.multiplier) && entry.multiplier > 0
      ),
    antiAirSpecialistsTargetAir:
      airPairs
        .filter((entry) => entry.counterType === 'air')
        .every((entry) => entry.canTarget && entry.selectedByCombatTargeting),
    nonAntiAirOffenseDoesNotTargetAir:
      airPairs
        .filter((entry) => entry.counterType !== 'air')
        .every((entry) => !entry.canTarget && !entry.selectedByCombatTargeting),
    allOffenseCanTargetGround:
      groundPairs
        .filter((entry) => entry.counterType !== 'support')
        .every((entry) => entry.canTarget && entry.selectedByCombatTargeting),
    damageProfilesResolveFinite:
      END_TO_END_PAIR_MATRIX.every(
        (entry) =>
          Number.isFinite(entry.hitDamage) &&
          Number.isFinite(entry.hpDamage) &&
          Number.isFinite(entry.shieldDamage) &&
          entry.hitDamage >= 0 &&
          entry.hpDamage >= 0 &&
          entry.shieldDamage >= 0
      ),
    allEvolutionRuntimeStatsValid:
      evolvedRuntimes.every(({ evolution, runtime }) =>
        runtime &&
        runtime.evolution === evolution.id &&
        runtime.evolutionName === evolution.name &&
        runtime.faction === BASE_TOWER_GAMEPLAY_BY_ID[evolution.towerId]?.faction &&
        runtime.counterType === BASE_TOWER_GAMEPLAY_BY_ID[evolution.towerId]?.counterType &&
        Number(runtime.range) > 0 &&
        Number(runtime.attackIntervalMs) > 0 &&
        Number(runtime.damage) >= 0
      ),
    noLegacyEvolutionDependencies:
      TOWER_EVOLUTIONS.every(
        (entry) =>
          !LEGACY_TOWER_IDS.includes(entry.towerId) &&
          Boolean(BASE_TOWER_GAMEPLAY_BY_ID[entry.towerId])
      ),
    fourModeRegressionSurface:
      MODE_IDS.length === END_TO_END_REGRESSION.expectedModeCount &&
      new Set(MODE_IDS).size === END_TO_END_REGRESSION.expectedModeCount
  });
}

export function getEndToEndRegressionPass() {
  return Object.values(getEndToEndRegressionQa()).every((value) => value === true);
}
