export const TARGETING_RULES = Object.freeze({
  FIRST: 'first',
  HIGHEST_HP: 'highest-hp',
  CLUSTER: 'cluster',
  LANE_CONTROL: 'lane-control'
});

export const TARGETING_VALUE = Object.freeze({
  version: 1,
  multipliers: Object.freeze({
    [TARGETING_RULES.FIRST]: 1.00,
    [TARGETING_RULES.HIGHEST_HP]: 1.08,
    [TARGETING_RULES.CLUSTER]: 1.12,
    [TARGETING_RULES.LANE_CONTROL]: 1.10
  })
});

function normalizeEnemy(enemy) {
  return {
    id: enemy.id,
    progress: Number(enemy.progress ?? 0),
    hp: Number(enemy.hp ?? enemy.maxHp ?? 0),
    maxHp: Number(enemy.maxHp ?? enemy.hp ?? 0),
    x: Number(enemy.x ?? enemy.position?.x ?? 0),
    y: Number(enemy.y ?? enemy.position?.y ?? 0)
  };
}

function sortStable(enemies, compare) {
  return [...enemies].sort((a, b) => compare(a, b) || String(a.id).localeCompare(String(b.id)));
}

function getClusterScore(candidate, enemies, radius) {
  let score = 0;
  for (const enemy of enemies) {
    const distance = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y);
    if (distance <= radius) score += 1;
  }
  return score;
}

export function resolveTarget(defense, enemies, options = {}) {
  const normalized = enemies.map(normalizeEnemy);
  if (normalized.length === 0) return null;

  const rule = defense.targetRule ?? TARGETING_RULES.FIRST;

  if (rule === TARGETING_RULES.HIGHEST_HP) {
    return sortStable(normalized, (a, b) => b.hp - a.hp || b.progress - a.progress)[0];
  }

  if (rule === TARGETING_RULES.CLUSTER) {
    const radius = Number(defense.splashRadius ?? options.clusterRadius ?? 72);
    return sortStable(normalized, (a, b) => {
      const clusterDelta = getClusterScore(b, normalized, radius) - getClusterScore(a, normalized, radius);
      if (clusterDelta !== 0) return clusterDelta;
      return b.progress - a.progress;
    })[0];
  }

  if (rule === TARGETING_RULES.LANE_CONTROL) {
    return sortStable(normalized, (a, b) => b.progress - a.progress || b.hp - a.hp)[0];
  }

  return sortStable(normalized, (a, b) => b.progress - a.progress)[0];
}

export function getTargetingValue(defense) {
  const rule = defense.targetRule ?? (
    defense.role === 'lane-control'
      ? TARGETING_RULES.LANE_CONTROL
      : TARGETING_RULES.FIRST
  );

  return Object.freeze({
    rule,
    multiplier: TARGETING_VALUE.multipliers[rule] ?? 1
  });
}

export function getTargetingFixtures() {
  const enemies = Object.freeze([
    Object.freeze({ id: 'runner', progress: 0.82, hp: 30, maxHp: 30, x: 820, y: 330 }),
    Object.freeze({ id: 'tank', progress: 0.48, hp: 240, maxHp: 240, x: 520, y: 330 }),
    Object.freeze({ id: 'pack-a', progress: 0.62, hp: 70, maxHp: 70, x: 650, y: 340 }),
    Object.freeze({ id: 'pack-b', progress: 0.60, hp: 70, maxHp: 70, x: 675, y: 350 }),
    Object.freeze({ id: 'pack-c', progress: 0.58, hp: 70, maxHp: 70, x: 690, y: 335 })
  ]);

  return Object.freeze([
    Object.freeze({ id: 'first', defense: Object.freeze({ targetRule: TARGETING_RULES.FIRST }), expectedTargetId: 'runner', enemies }),
    Object.freeze({ id: 'highest-hp', defense: Object.freeze({ targetRule: TARGETING_RULES.HIGHEST_HP }), expectedTargetId: 'tank', enemies }),
    Object.freeze({ id: 'cluster', defense: Object.freeze({ targetRule: TARGETING_RULES.CLUSTER, splashRadius: 72 }), expectedTargetId: 'pack-a', enemies }),
    Object.freeze({ id: 'lane-control', defense: Object.freeze({ role: 'lane-control' }), expectedTargetId: 'runner', enemies })
  ]);
}
