export const MINI_OBJECTIVES = Object.freeze({
  version: 2,
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
    }),
    Object.freeze({
      id: 'faction-focus',
      name: 'Faction Focus',
      description: 'Clear the wave using towers from no more than 2 factions.'
    }),
    Object.freeze({
      id: 'pressure-clear',
      name: 'Pressure Hunter',
      description: 'Clear the wave with PRESSURE active.'
    }),
    Object.freeze({
      id: 'war-chest',
      name: 'War Chest',
      description: 'Finish the wave with at least 10 Gold unspent.'
    }),
    Object.freeze({
      id: 'evolved-arsenal',
      name: 'Evolved Arsenal',
      description: 'Clear the wave with at least 1 evolved tower deployed.'
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

  if (objective.id === 'faction-focus') {
    return Math.max(0, Number(context.factionCount ?? 0)) <= 2;
  }

  if (objective.id === 'pressure-clear') {
    return context.riskRewardTier === 'pressure';
  }

  if (objective.id === 'war-chest') {
    return Number(context.gold ?? 0) >= 10;
  }

  if (objective.id === 'evolved-arsenal') {
    return Number(context.evolvedTowerCount ?? 0) >= 1;
  }

  return false;
}

export function getMiniObjectiveLiveState(objective, context = {}) {
  if (!objective) {
    return Object.freeze({ status: 'inactive', label: 'NO QUEST', progress: '' });
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

  if (objective.id === 'faction-focus') {
    const count = Math.max(0, Number(context.factionCount ?? 0));
    const onTrack = count <= 2;
    return Object.freeze({
      status: onTrack ? 'on-track' : 'over-limit',
      label: onTrack ? 'ON TRACK' : 'TOO MANY FACTIONS',
      progress: `${count}/2 FACTIONS`
    });
  }

  if (objective.id === 'pressure-clear') {
    const active = context.riskRewardTier === 'pressure';
    return Object.freeze({
      status: active ? 'on-track' : 'failed',
      label: active ? 'PRESSURE ACTIVE' : 'SELECT PRESSURE',
      progress: active ? 'READY' : 'SAFE MODE'
    });
  }

  if (objective.id === 'war-chest') {
    const gold = Math.max(0, Number(context.gold ?? 0));
    const onTrack = gold >= 10;
    return Object.freeze({
      status: onTrack ? 'on-track' : 'failed',
      label: onTrack ? 'ON TRACK' : 'SAVE GOLD',
      progress: `${gold}/10 GOLD`
    });
  }

  if (objective.id === 'evolved-arsenal') {
    const count = Math.max(0, Number(context.evolvedTowerCount ?? 0));
    const onTrack = count >= 1;
    return Object.freeze({
      status: onTrack ? 'on-track' : 'failed',
      label: onTrack ? 'ON TRACK' : 'EVOLVE A TOWER',
      progress: `${count}/1 EVOLVED`
    });
  }

  return Object.freeze({ status: 'inactive', label: 'NO QUEST', progress: '' });
}

export function getMiniObjectiveReward(mode) {
  return MINI_OBJECTIVES.rewardsByMode[mode] ?? MINI_OBJECTIVES.rewardsByMode['single-gate'];
}

export function getMiniObjectiveFixtures() {
  const flawlessOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[0], { coreHp: 20, waveStartCoreHp: 20 });
  const leanOver = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[1], { placedTowerCount: 9 });
  const factionOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[2], { factionCount: 2 });
  const pressureOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[3], { riskRewardTier: 'pressure' });
  const chestOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[4], { gold: 10 });
  const evolvedOk = getMiniObjectiveLiveState(MINI_OBJECTIVES.definitions[5], { evolvedTowerCount: 1 });

  return Object.freeze({
    wave1Flawless: getMiniObjectiveForWave(1).id === 'flawless',
    wave6Lean: getMiniObjectiveForWave(6).id === 'lean-defense',
    wave11FactionFocus: getMiniObjectiveForWave(11).id === 'faction-focus',
    wave16Pressure: getMiniObjectiveForWave(16).id === 'pressure-clear',
    wave21WarChest: getMiniObjectiveForWave(21).id === 'war-chest',
    wave26Evolved: getMiniObjectiveForWave(26).id === 'evolved-arsenal',
    rotatesEveryFive: getMiniObjectiveForWave(5).id !== getMiniObjectiveForWave(6).id,
    tftReward: getMiniObjectiveReward('tft-shop') === 1,
    suddenReward: getMiniObjectiveReward('sudden-siege') === 1,
    triReward: getMiniObjectiveReward('tri-gate') === 10,
    flawlessLiveOnTrack: flawlessOk.status === 'on-track',
    leanLiveOverLimitAtNine: leanOver.status === 'over-limit',
    factionFocusWorks: factionOk.status === 'on-track',
    pressureQuestWorks: pressureOk.status === 'on-track',
    warChestWorks: chestOk.status === 'on-track',
    evolvedArsenalWorks: evolvedOk.status === 'on-track'
  });
}
