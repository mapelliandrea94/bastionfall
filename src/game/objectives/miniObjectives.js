export const MINI_OBJECTIVES = Object.freeze({
  version: 1,
  rewardsByMode: Object.freeze({
    'single-gate': 8,
    'tri-gate': 10,
    'tft-shop': 1,
    'last-bastion': 6
  }),
  definitions: Object.freeze([
    Object.freeze({
      id: 'flawless',
      name: 'Flawless Defense',
      description: 'Clear the wave without losing Bastion HP.'
    }),
    Object.freeze({
      id: 'lean-defense',
      name: 'Lean Defense',
      description: 'Clear the wave with 8 or fewer towers on the field.'
    })
  ])
});

export function getMiniObjectiveForWave(waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  return MINI_OBJECTIVES.definitions[(wave - 1) % MINI_OBJECTIVES.definitions.length];
}
export function evaluateMiniObjective(objective, context = {}) {
  if (!objective) return false;

  if (objective.id === 'flawless') {
    return Number(context.coreHp ?? 0) >= Number(context.waveStartCoreHp ?? context.coreHp ?? 0);
  }

  if (objective.id === 'lean-defense') {
    return Number(context.placedTowerCount ?? 0) <= 8;
  }

  return false;
}

export function getMiniObjectiveReward(mode) {
  return MINI_OBJECTIVES.rewardsByMode[mode] ?? MINI_OBJECTIVES.rewardsByMode['single-gate'];
}

export function getMiniObjectiveFixtures() {
  return Object.freeze({
    wave1Flawless: getMiniObjectiveForWave(1).id === 'flawless',
    wave2Lean: getMiniObjectiveForWave(2).id === 'lean-defense',
    tftReward: getMiniObjectiveReward('tft-shop') === 1,
    triReward: getMiniObjectiveReward('tri-gate') === 10
  });
}
