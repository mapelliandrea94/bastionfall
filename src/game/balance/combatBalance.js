import { ARCHER_TOWER } from '../towers/archer.js';
import { CANNON_TOWER } from '../towers/cannon.js';
import { FROST_TOWER } from '../towers/frost.js';
import { MAGE_TOWER } from '../towers/mage.js';
import { BALLISTA_TOWER } from '../towers/ballista.js';
import { BARRACKS } from '../structures/barracks.js';

export const COMBAT_BALANCE_MODEL = Object.freeze({
  version: 1,
  referenceDpsPer100Gold: 18,
  referenceRange: 220,
  weights: Object.freeze({
    offense: 0.65,
    coverage: 0.15,
    utility: 0.20
  }),
  targetPowerBand: Object.freeze({
    min: 0.90,
    max: 1.10
  }),
  utilityCredits: Object.freeze({
    archer: 0,
    cannon: 0.35,
    frost: 0.28,
    mage: 0.10,
    ballista: 0.12,
    barracks: 0.30
  })
});

function getSustainedDps(definition) {
  if (definition.id === 'barracks') {
    return definition.squadSize * definition.unitDamage * (1000 / definition.unitAttackIntervalMs);
  }

  return definition.damage * (1000 / definition.attackIntervalMs);
}

function getCoverageRange(definition) {
  return definition.range ?? definition.rallyRange ?? COMBAT_BALANCE_MODEL.referenceRange;
}

export function evaluateCombatDefinition(definition) {
  const sustainedDps = getSustainedDps(definition);
  const dpsPer100Gold = sustainedDps * 100 / definition.cost;
  const offenseScore = dpsPer100Gold / COMBAT_BALANCE_MODEL.referenceDpsPer100Gold;
  const coverageScore = getCoverageRange(definition) / COMBAT_BALANCE_MODEL.referenceRange;
  const utilityCredit = COMBAT_BALANCE_MODEL.utilityCredits[definition.id] ?? 0;
  const utilityScore = 1 + utilityCredit;

  const powerIndex =
    offenseScore * COMBAT_BALANCE_MODEL.weights.offense +
    coverageScore * COMBAT_BALANCE_MODEL.weights.coverage +
    utilityScore * COMBAT_BALANCE_MODEL.weights.utility;

  const status =
    powerIndex < COMBAT_BALANCE_MODEL.targetPowerBand.min
      ? 'under-budget'
      : powerIndex > COMBAT_BALANCE_MODEL.targetPowerBand.max
        ? 'over-budget'
        : 'in-band';

  return Object.freeze({
    id: definition.id,
    name: definition.name,
    role: definition.role,
    cost: definition.cost,
    sustainedDps: Number(sustainedDps.toFixed(2)),
    dpsPer100Gold: Number(dpsPer100Gold.toFixed(2)),
    coverageScore: Number(coverageScore.toFixed(3)),
    utilityCredit,
    powerIndex: Number(powerIndex.toFixed(3)),
    status
  });
}

const COMBAT_DEFINITIONS = Object.freeze([
  ARCHER_TOWER,
  CANNON_TOWER,
  FROST_TOWER,
  MAGE_TOWER,
  BALLISTA_TOWER,
  BARRACKS
]);

export const COMBAT_BALANCE_SNAPSHOT = Object.freeze(
  COMBAT_DEFINITIONS.map(evaluateCombatDefinition)
);

export function getCombatBalanceSnapshot() {
  return COMBAT_BALANCE_SNAPSHOT;
}
