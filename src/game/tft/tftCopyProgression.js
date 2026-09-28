export const TFT_COPY_PROGRESSION = Object.freeze({
  version: 2,
  evolutionCopies: 7,
  redAscensionCopies: 10,
  goldAscensionCopies: 14,
  maxCopies: 14,
  ascensionStepBonus: 0.15,
  levels: Object.freeze([
    Object.freeze({ level: 1, minCopies: 1, maxCopies: 1 }),
    Object.freeze({ level: 2, minCopies: 2, maxCopies: 3 }),
    Object.freeze({ level: 3, minCopies: 4, maxCopies: 6 }),
    Object.freeze({ level: 4, minCopies: 7, maxCopies: 14 })
  ])
});

export function getTftLevelForCopyProgress(copyProgress) {
  const copies = Math.max(1, Math.min(TFT_COPY_PROGRESSION.maxCopies, Number(copyProgress) || 1));
  if (copies >= 7) return 4;
  if (copies >= 4) return 3;
  if (copies >= 2) return 2;
  return 1;
}

export function getTftAscensionTier(copyProgress) {
  const copies = Math.max(1, Math.min(TFT_COPY_PROGRESSION.maxCopies, Number(copyProgress) || 1));
  if (copies >= TFT_COPY_PROGRESSION.goldAscensionCopies) return 'gold';
  if (copies >= TFT_COPY_PROGRESSION.redAscensionCopies) return 'red';
  return 'base';
}

export function getTftAscensionMultiplier(copyProgress) {
  const tier = getTftAscensionTier(copyProgress);
  if (tier === 'gold') return 1 + TFT_COPY_PROGRESSION.ascensionStepBonus * 2;
  if (tier === 'red') return 1 + TFT_COPY_PROGRESSION.ascensionStepBonus;
  return 1;
}

export function getTftProgressDenominator(copyProgress) {
  return Number(copyProgress ?? 1) >= TFT_COPY_PROGRESSION.evolutionCopies
    ? TFT_COPY_PROGRESSION.maxCopies
    : TFT_COPY_PROGRESSION.evolutionCopies;
}

export function getTftFieldMergeOutcome(sourceProgress, targetProgress) {
  const source = Math.max(1, Math.min(TFT_COPY_PROGRESSION.maxCopies, Number(sourceProgress) || 1));
  const target = Math.max(1, Math.min(TFT_COPY_PROGRESSION.maxCopies, Number(targetProgress) || 1));
  const total = source + target;

  if (total <= TFT_COPY_PROGRESSION.maxCopies) {
    return Object.freeze({
      targetProgress: total,
      sourceProgress: 0,
      consumedCopies: 0,
      overflow: false
    });
  }

  const remaining = Math.max(0, total - TFT_COPY_PROGRESSION.maxCopies - 1);
  return Object.freeze({
    targetProgress: TFT_COPY_PROGRESSION.maxCopies,
    sourceProgress: remaining,
    consumedCopies: 1,
    overflow: true
  });
}

export function canMergeTftCopy(placedTower, benchCopy) {
  if (!placedTower || !benchCopy) return Object.freeze({ ok: false, error: 'missing_tower_or_copy' });
  if (placedTower.defenseId !== benchCopy.towerId) return Object.freeze({ ok: false, error: 'wrong_tower_type' });
  if (Number(placedTower.copyProgress ?? 1) >= TFT_COPY_PROGRESSION.maxCopies) {
    return Object.freeze({ ok: false, error: 'copy_progress_maxed' });
  }
  return Object.freeze({ ok: true, error: null });
}

export function mergeTftCopyProgress(placedTower, benchCopy) {
  const validation = canMergeTftCopy(placedTower, benchCopy);
  if (!validation.ok) return Object.freeze({ ok: false, tower: placedTower, error: validation.error });

  const copyProgress = Math.min(
    TFT_COPY_PROGRESSION.maxCopies,
    Number(placedTower.copyProgress ?? 1) + 1
  );

  return Object.freeze({
    ok: true,
    tower: Object.freeze({
      ...placedTower,
      copyProgress,
      level: getTftLevelForCopyProgress(copyProgress)
    }),
    error: null
  });
}

export function getTftCopyProgressionFixtures() {
  const base = Object.freeze({ id: 'tower-a', defenseId: 'human-aa', level: 1, copyProgress: 1 });
  const same = Object.freeze({ copyId: 'copy-a', towerId: 'human-aa' });
  const wrong = Object.freeze({ copyId: 'copy-b', towerId: 'alien-aa' });

  const p2 = mergeTftCopyProgress(base, same).tower;
  const p3 = mergeTftCopyProgress(p2, same).tower;
  const p4 = mergeTftCopyProgress(p3, same).tower;
  const p5 = mergeTftCopyProgress(p4, same).tower;
  const p6 = mergeTftCopyProgress(p5, same).tower;
  const p7 = mergeTftCopyProgress(p6, same).tower;
  let p10 = p7;
  for (let i = 0; i < 3; i += 1) p10 = mergeTftCopyProgress(p10, same).tower;
  let p14 = p10;
  for (let i = 0; i < 4; i += 1) p14 = mergeTftCopyProgress(p14, same).tower;

  return Object.freeze({
    oneCopyLevelOne: getTftLevelForCopyProgress(1) === 1,
    twoAndThreeLevelTwo: getTftLevelForCopyProgress(2) === 2 && getTftLevelForCopyProgress(3) === 2,
    fourToSixLevelThree: [4, 5, 6].every((copies) => getTftLevelForCopyProgress(copies) === 3),
    sevenLevelFour: getTftLevelForCopyProgress(7) === 4,
    wrongTypeBlocked: canMergeTftCopy(base, wrong).ok === false,
    independentProgress: base.copyProgress === 1 && p2.copyProgress === 2,
    reachesSevenExactly: p7.copyProgress === 7 && p7.level === 4,
    sevenSwitchesToFourteenTrack: getTftProgressDenominator(6) === 7 && getTftProgressDenominator(7) === 14,
    redAscensionAtTen: p10.copyProgress === 10 && getTftAscensionTier(p10.copyProgress) === 'red' && getTftAscensionMultiplier(p10.copyProgress) === 1.15,
    goldAscensionAtFourteen: p14.copyProgress === 14 && getTftAscensionTier(p14.copyProgress) === 'gold' && getTftAscensionMultiplier(p14.copyProgress) === 1.3,
    fieldMergeTenPlusTen: (() => {
      const outcome = getTftFieldMergeOutcome(10, 10);
      return outcome.targetProgress === 14 && outcome.sourceProgress === 5 && outcome.consumedCopies === 1;
    })(),
    fieldMergeSevenPlusSeven: (() => {
      const outcome = getTftFieldMergeOutcome(7, 7);
      return outcome.targetProgress === 14 && outcome.sourceProgress === 0 && outcome.consumedCopies === 0;
    })(),
    maxBlocksExtra: canMergeTftCopy(p14, same).ok === false
  });
}
