import { NORMAL_MODE_TOWERS } from '../towers/normalBuildRoster.js';
import {
  getEvolutionChoices,
  chooseTowerEvolution,
  getRuntimeTowerDefinition
} from '../towers/evolutions.js';
import { applyTowerSynergy } from '../towers/towerSynergies.js';
import { applyBlessingTowerIdentity } from '../blessings/blessingEngine.js';

const IDENTITY_BLESSING = Object.freeze({
  human: 'human-doctrine',
  insect: 'brood-frenzy',
  alien: 'alien-overmind',
  neutral: 'neutral-covenant'
});

const ALL_SYNERGIES_ACTIVE = Object.freeze({
  active: Object.freeze({
    human: true,
    insect: true,
    alien: true,
    neutral: true
  })
});

function finiteOrNull(value) {
  return value == null ? null : Number.isFinite(Number(value)) ? Number(value) : NaN;
}

function getDps(definition) {
  const damage = Math.max(0, Number(definition?.damage ?? 0));
  const interval = Math.max(1, Number(definition?.attackIntervalMs ?? 1000));
  return damage * (1000 / interval);
}

export function getStackedTowerPowerAudit() {
  const rows = [];

  for (const tower of NORMAL_MODE_TOWERS) {
    const baseState = Object.freeze({
      id: `audit-${tower.id}`,
      defenseId: tower.id,
      level: 4,
      evolution: null,
      evolutionChoice: null
    });
    const baseRuntime = getRuntimeTowerDefinition(tower, baseState);
    const baseDps = Math.max(0.0001, getDps(baseRuntime));
    const baseRange = Math.max(1, Number(baseRuntime.range ?? tower.range ?? 1));

    for (const choice of getEvolutionChoices(tower.id)) {
      const evolvedState = chooseTowerEvolution(baseState, choice.id);
      const evolved = getRuntimeTowerDefinition(tower, evolvedState);
      const synergized = applyTowerSynergy(evolved, ALL_SYNERGIES_ACTIVE);
      const blessingId = IDENTITY_BLESSING[tower.faction];
      const stacked = applyBlessingTowerIdentity(
        synergized,
        blessingId ? [blessingId] : []
      );

      const directDpsMultiplier = getDps(stacked) / baseDps;
      const rangeMultiplier = Number(stacked.range ?? baseRange) / baseRange;
      const numericValues = [
        stacked.damage,
        stacked.range,
        stacked.attackIntervalMs,
        stacked.splashRadius,
        stacked.slowPercent,
        stacked.vulnerabilityPercent,
        stacked.armorShred,
        stacked.poisonDamagePerSecond,
        stacked.buffRadius,
        stacked.buffDamageMultiplier,
        stacked.buffAttackSpeedMultiplier,
        stacked.chainTargets
      ]
        .map(finiteOrNull)
        .filter((value) => value != null);

      rows.push(Object.freeze({
        towerId: tower.id,
        faction: tower.faction,
        evolutionId: choice.id,
        branch: choice.branch,
        directDpsMultiplier: Number(directDpsMultiplier.toFixed(3)),
        rangeMultiplier: Number(rangeMultiplier.toFixed(3)),
        attackIntervalMs: Number(stacked.attackIntervalMs ?? 1000),
        slowPercent: Number(stacked.slowPercent ?? 0),
        vulnerabilityPercent: Number(stacked.vulnerabilityPercent ?? 0),
        armorShred: Number(stacked.armorShred ?? 0),
        chainTargets: Number(stacked.chainTargets ?? 0),
        buffDamageMultiplier: Number(stacked.buffDamageMultiplier ?? 1),
        buffAttackSpeedMultiplier: Number(stacked.buffAttackSpeedMultiplier ?? 1),
        allFinite: numericValues.every(Number.isFinite)
      }));
    }
  }

  const maxOf = (key) => Math.max(...rows.map((row) => Number(row[key] ?? 0)));

  return Object.freeze({
    rows: Object.freeze(rows),
    summary: Object.freeze({
      towerCount: NORMAL_MODE_TOWERS.length,
      evolutionCount: rows.length,
      allTwentyFourChecked: rows.length === 24,
      allFinite: rows.every((row) => row.allFinite),
      minAttackIntervalRespected: rows.every((row) => row.attackIntervalMs >= 120),
      directDpsCeilingRespected: rows.every((row) => row.directDpsMultiplier <= 2.6),
      rangeCeilingRespected: rows.every((row) => row.rangeMultiplier <= 1.75),
      slowCapRespected: rows.every((row) => row.slowPercent <= 75),
      vulnerabilityCapRespected: rows.every((row) => row.vulnerabilityPercent <= 55),
      armorShredCapRespected: rows.every((row) => row.armorShred <= 50),
      chainTargetCapRespected: rows.every((row) => row.chainTargets <= 8),
      supportDamageBuffCapRespected: rows.every((row) => row.buffDamageMultiplier <= 1.4),
      supportAttackSpeedBuffCapRespected: rows.every((row) => row.buffAttackSpeedMultiplier <= 1.4),
      maxDirectDpsMultiplier: Number(maxOf('directDpsMultiplier').toFixed(3)),
      maxRangeMultiplier: Number(maxOf('rangeMultiplier').toFixed(3)),
      maxSlowPercent: Number(maxOf('slowPercent').toFixed(2)),
      maxVulnerabilityPercent: Number(maxOf('vulnerabilityPercent').toFixed(2)),
      maxChainTargets: maxOf('chainTargets')
    })
  });
}

export function getStackedTowerPowerAuditPass() {
  const { summary } = getStackedTowerPowerAudit();
  return Object.entries(summary)
    .filter(([key]) => ![
      'towerCount',
      'evolutionCount',
      'maxDirectDpsMultiplier',
      'maxRangeMultiplier',
      'maxSlowPercent',
      'maxVulnerabilityPercent',
      'maxChainTargets'
    ].includes(key))
    .every(([, value]) => value === true);
}
