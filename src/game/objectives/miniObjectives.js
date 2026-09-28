export const MINI_OBJECTIVES = Object.freeze({
  version: 1,
  wavesPerObjective: 5,
  rewardsByMode: Object.freeze({
    'single-gate': 8,
    'tri-gate': 10,
    'tft-shop': 1,
    'sudden-siege': 1,
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
  const objectiveIndex = Math.floor((wave - 1) / MINI_OBJECTIVES.wavesPerObjective);
  return MINI_OBJECTIVES.definitions[objectiveIndex % MINI_OBJECTIVES.definitions.length];
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

export function getMiniObjectiveLiveState(objective, context = {}) {
  if (!objective) {
    return Object.freeze({ status: 'inactive', label: 'NO OBJECTIVE', progress: '' });
  }

  if (objective.id === 'flawless') {
    const coreHp = Number(context.coreHp ?? 0);
    const waveStartCoreHp = Number(context.waveStartCoreHp ?? coreHp);
    const intact = coreHp >= waveStartCoreHp;
    return Object.freeze({
      status: intact ? 'on-track' : 'failed',
      label: intact ? 'ON TRACK' : 'FAILED',
      progress: intact ? `${coreHp}/${waveStartCoreHp} HP` : `LOST ${Math.max(0, waveStartCoreHp - coreHp)} HP`
    });
  }

  if (objective.id === 'lean-defense') {
    const count = Math.max(0, Number(context.placedTowerCount ?? 0));
    const onTrack = count <= 8;
    return Object.freeze({
      status: onTrack ? 'on-track' : 'over-limit',
      label: onTrack ? 'ON TRACK' : 'OVER LIMIT',
      progress: `${count}/8 TOWERS`
    });
  }

  return Object.freeze({ status: 'inactive', label: 'NO OBJECTIVE', progress: '' });
}

export function getMiniObjectiveReward(mode) {
  return MINI_OBJECTIVES.rewardsByMode[mode] ?? MINI_OBJECTIVES.rewardsByMode['single-gate'];
}

export function getMiniObjectiveFixtures() {
  const flawlessOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[0], { coreHp: 20, waveStartCoreHp: 20 });
  const flawlessFailed = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[0], { coreHp: 18, waveStartCoreHp: 20 });
  const leanOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[1], { placedTowerCount: 8 });
  const leanOver = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[1], { placedTowerCount: 9 });

  return Object.freeze({
    wave1Flawless: getMiniObjectiveForWave(1).id === 'flawless',
    wave5Flawless: getMiniObjectiveForWave(5).id === 'flawless',
    wave6Lean: getMiniObjectiveForWave(6).id === 'lean-defense',
    wave10Lean: getMiniObjectiveForWave(10).id === 'lean-defense',
    wave11Flawless: getMiniObjectiveForWave(11).id === 'flawless',
    tftReward: getMiniObjectiveReward('tft-shop') === 1,
    suddenReward: getMiniObjectiveReward('sudden-siege') === 1,
    triReward: getMiniObjectiveReward('tri-gate') === 10,
    flawlessLiveOnTrack: flawlessOk.status === 'on-track',
    flawlessLiveFailsAfterDamage: flawlessFailed.status === 'failed',
    leanLiveOnTrackAtEight: leanOk.status === 'on-track',
    leanLiveOverLimitAtNine: leanOver.status === 'over-limit'
  });
}
