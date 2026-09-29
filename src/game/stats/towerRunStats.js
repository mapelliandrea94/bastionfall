export const TOWER_RUN_STATS = Object.freeze({
  version: 1
});

export function createTowerRunStat(tower = {}, nowMs = 0) {
  return {
    towerId: String(tower.id ?? ''),
    defenseId: String(tower.defenseId ?? ''),
    damage: 0,
    kills: 0,
    bossDamage: 0,
    supportDamage: 0,
    slowAppliedMs: 0,
    attacks: 0,
    firstActiveAtMs: Number(nowMs) || 0,
    lastActiveAtMs: Number(nowMs) || 0
  };
}

export function normalizeTowerRunStats(input = {}) {
  return Object.fromEntries(
    Object.entries(input ?? {}).map(([id, stat]) => [String(id), {
      towerId: String(stat?.towerId ?? id),
      defenseId: String(stat?.defenseId ?? ''),
      damage: Math.max(0, Number(stat?.damage ?? 0)),
      kills: Math.max(0, Math.floor(Number(stat?.kills ?? 0))),
      bossDamage: Math.max(0, Number(stat?.bossDamage ?? 0)),
      supportDamage: Math.max(0, Number(stat?.supportDamage ?? 0)),
      slowAppliedMs: Math.max(0, Number(stat?.slowAppliedMs ?? 0)),
      attacks: Math.max(0, Math.floor(Number(stat?.attacks ?? 0))),
      firstActiveAtMs: Math.max(0, Number(stat?.firstActiveAtMs ?? 0)),
      lastActiveAtMs: Math.max(0, Number(stat?.lastActiveAtMs ?? 0))
    }])
  );
}

export function recordTowerStat(stats, tower, delta = {}, nowMs = 0) {
  if (!tower?.id) return stats;
  const next = normalizeTowerRunStats(stats);
  const id = String(tower.id);
  const current = next[id] ?? createTowerRunStat(tower, nowMs);
  next[id] = {
    ...current,
    towerId: id,
    defenseId: String(tower.defenseId ?? current.defenseId ?? ''),
    damage: current.damage + Math.max(0, Number(delta.damage ?? 0)),
    kills: current.kills + Math.max(0, Math.floor(Number(delta.kills ?? 0))),
    bossDamage: current.bossDamage + Math.max(0, Number(delta.bossDamage ?? 0)),
    supportDamage: current.supportDamage + Math.max(0, Number(delta.supportDamage ?? 0)),
    slowAppliedMs: current.slowAppliedMs + Math.max(0, Number(delta.slowAppliedMs ?? 0)),
    attacks: current.attacks + Math.max(0, Math.floor(Number(delta.attacks ?? 0))),
    firstActiveAtMs: current.firstActiveAtMs || Number(nowMs) || 0,
    lastActiveAtMs: Math.max(current.lastActiveAtMs, Number(nowMs) || 0)
  };
  return next;
}

export function getTowerStatSummary(stat, tower = {}) {
  const damage = Math.max(0, Number(stat?.damage ?? 0));
  const investedGold = Math.max(0, Number(tower?.investedGold ?? 0));
  const first = Math.max(0, Number(stat?.firstActiveAtMs ?? 0));
  const last = Math.max(first, Number(stat?.lastActiveAtMs ?? first));
  const activeSeconds = Math.max(1, (last - first) / 1000);
  return Object.freeze({
    ...stat,
    dps: Number((damage / activeSeconds).toFixed(1)),
    damagePerGold: investedGold > 0 ? Number((damage / investedGold).toFixed(1)) : damage,
    investedGold,
    activeSeconds: Number(activeSeconds.toFixed(1))
  });
}

export function getTowerRunAwards(stats = {}, towers = []) {
  const summaries = towers
    .map((tower) => ({ tower, stat: getTowerStatSummary(stats[tower.id] ?? createTowerRunStat(tower), tower) }))
    .filter((entry) => entry.stat.damage > 0 || entry.stat.supportDamage > 0 || entry.stat.kills > 0);

  const maxBy = (key) => summaries.reduce((best, entry) =>
    !best || Number(entry.stat[key] ?? 0) > Number(best.stat[key] ?? 0) ? entry : best, null);

  return Object.freeze({
    mostDamage: maxBy('damage'),
    mostEfficient: maxBy('damagePerGold'),
    bossKiller: maxBy('bossDamage'),
    bestSupport: maxBy('supportDamage')
  });
}

export function getTowerRunStatsFixtures() {
  const tower = { id: 'tower-a', defenseId: 'human-aa', investedGold: 10 };
  let stats = {};
  stats = recordTowerStat(stats, tower, { damage: 120, kills: 2, bossDamage: 40, attacks: 3 }, 1000);
  stats = recordTowerStat(stats, tower, { damage: 80, supportDamage: 20, slowAppliedMs: 500 }, 3000);
  const summary = getTowerStatSummary(stats[tower.id], tower);
  return Object.freeze({
    damageExpected: 200,
    damageActual: summary.damage,
    killsExpected: 2,
    killsActual: summary.kills,
    damagePerGoldExpected: 20,
    damagePerGoldActual: summary.damagePerGold,
    supportExpected: 20,
    supportActual: summary.supportDamage
  });
}
