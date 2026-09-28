import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import { normalizeRunSeed } from './lib/runSeed.js';
import { SINGLE_GATE_MAP, getSingleGatePathForWalls } from './game/maps/singleGate.js';
import { TRI_GATE_MAP, getTriGateMapFixtures } from './game/maps/triGate.js';
import { TRI_GATE_SPAWN, distributeTriGateWave, flattenTriGateDistribution, getTriGateSpawnFixtures } from './game/spawning/triGateSpawn.js';
import { WAVE_DIRECTOR, generateWavePlan, getWaveDirectorFixtures } from './game/spawning/waveDirector.js';
import { ARCHER_TOWER } from './game/towers/archer.js';
import { CANNON_TOWER } from './game/towers/cannon.js';
import { FROST_TOWER } from './game/towers/frost.js';
import { TOWER_ROSTER, getTowerRosterFixtures } from './game/towers/towerRoster.js';
import { applyTowerSynergy, getTowerSynergyState } from './game/towers/towerSynergies.js';
import { NORMAL_MODE_TOWERS, NORMAL_MODE_TOWERS_BY_ID, getNormalBuildRosterFixtures } from './game/towers/normalBuildRoster.js';
import { BASE_TOWER_GAMEPLAY_BY_ID, getBaseTowerGameplayFixtures } from './game/towers/baseTowerGameplay.js';
import { TOWER_EVOLUTIONS, canChooseEvolution, chooseTowerEvolution, getEvolutionChoices, getEvolutionFixtures, getRuntimeTowerDefinition } from './game/towers/evolutions.js';
import { TOWER_ART_SYSTEM, getTowerArtFixtures, getTowerArtStyle, getTowerArtStyleForTower } from './game/towers/towerArt.js';
import { getTowerEvolutionIntegrityPass, getTowerEvolutionIntegrityQa } from './game/towers/towerEvolutionIntegrityQa.js';
import { getNormalModeEvolutionFlowPass, getNormalModeEvolutionFlowQa } from './game/towers/normalModeEvolutionFlowQa.js';
import { TFT_SHOP, createTftShopOffers, getTftShopFixtures } from './game/tft/tftShop.js';
import { TFT_BENCH, addCopyToBench, createEmptyBench, getTftBenchFixtures, removeCopyFromBench } from './game/tft/tftBench.js';
import { TFT_COPY_PROGRESSION, canMergeTftCopy, getTftCopyProgressionFixtures, mergeTftCopyProgress } from './game/tft/tftCopyProgression.js';
import { TFT_PERSISTENCE, clearTftRunSnapshot, createTftRunSnapshot, getTftPersistenceFixtures, loadTftRunSnapshot, saveTftRunSnapshot } from './game/tft/tftPersistence.js';
import { getTftEvolutionFlowPass, getTftEvolutionFlowQa } from './game/tft/tftEvolutionFlowQa.js';
import { getEvolutionPersistenceSellReconnectPass, getEvolutionPersistenceSellReconnectQa } from './game/tft/evolutionPersistenceSellReconnectQa.js';
import { MAGE_TOWER } from './game/towers/mage.js';
import { BALLISTA_TOWER } from './game/towers/ballista.js';
import { BARRACKS } from './game/structures/barracks.js';
import { COMBAT_BALANCE_MODEL, COMBAT_BALANCE_SNAPSHOT } from './game/balance/combatBalance.js';
import { getPlacementValidationFixtures, getTowerSlotPurchaseFixtures, tryPurchaseDefenseOnSlot, validateSingleGatePlacement } from './game/placement/singleGatePlacement.js';
import { SELL_ECONOMY, getSellPreview } from './game/economy/sellEconomy.js';
import { ECONOMY_BASELINE, getEconomyBaselineFixtures, getWaveClearReward } from './game/economy/economyBaseline.js';
import { GOLD_MINE, getGoldMineBreakEvenWave, getGoldMineFixtures, getGoldMineOpportunityCost } from './game/structures/goldMine.js';
import { WAR_FORGE, applyWarForgePreview, getWarForgeFixtures } from './game/structures/warForge.js';
import { GUARDIAN_SHRINE, applyGuardianShrineRangePreview, applyGuardianShrineToBastionDamage, getGuardianShrineFixtures } from './game/structures/guardianShrine.js';
import { WALL_SYSTEM, getWallSystemFixtures, purchaseWall } from './game/structures/walls.js';
import { ECONOMY_SPEND_CURVE, getEconomyRiskProfile, getSpendCurveFixtures, getStrategicSpendProfile } from './game/balance/economySpendCurve.js';
import { UPGRADE_CURVE, getNextUpgradePreview, getUpgradeCost } from './game/balance/upgradeCurves.js';
import { getTargetingFixtures, getTargetingValue, resolveTarget } from './game/combat/targeting.js';
import { ATTACK_FEEDBACK, getAttackFeedbackFixtures, getAttackInstrumentation } from './game/combat/attackFeedback.js';
import { COUNTERPLAY_MATRIX, getCounterplayFixtures } from './game/combat/counterplay.js';
import { FACTION_COUNTER_ENGINE, getFactionCounterFixtures } from './game/combat/factionCounters.js';
import { getBaseTowerCombatFixtures, getEffectiveTowerAttackInterval, getTowerHitDamage, getTowerTargets } from './game/combat/baseTowerCombat.js';
import { SUPPORT_STACKING, applyStrongestArmorShred, applyStrongestTimedEffect, getSupportStackingFixtures } from './game/combat/supportStacking.js';
import { WAVE_THREAT_MODEL, composeWaveByThreatBudget, getThreatModelFixtures } from './game/balance/waveThreat.js';
import { DIFFICULTY_BANDS, getBandWaveScaling, getDifficultyBandFixtures } from './game/balance/difficultyBands.js';
import { TRI_GATE_PACING, getTriGateEconomyFixtures, getTriGateWaveClearReward, getTriGateWaveScaling } from './game/balance/triGatePacing.js';
import { getLateGameSoakPass, getLateGameSoakQa } from './game/balance/lateGameSoakQa.js';
import { getPerformanceTelemetryPass, getPerformanceTelemetryQa } from './game/balance/performanceTelemetryQa.js';
import { getEndToEndRegressionPass, getEndToEndRegressionQa } from './game/balance/endToEndRegressionQa.js';
import { getEvolutionPowerBudgetPass, getEvolutionPowerBudgetQa } from './game/balance/evolutionPowerBudgetQa.js';
import { getTriGateBalanceSmokeTest } from './game/balance/triGateBalanceSmoke.js';
import { applyRiskRewardGold, getRiskRewardConfig } from './game/balance/riskReward.js';
import { evaluateMiniObjective, getMiniObjectiveForWave, getMiniObjectiveReward } from './game/objectives/miniObjectives.js';
import { BOSS_SCHEDULE, getBossScheduleFixtures, getUpcomingBossWave, isBossWave } from './game/boss/bossSchedule.js';
import { BOSS_ARMOR_ENRAGE, applyBossEnrageStats, getBossArmorEnrageFixtures, getBossArmorForIndex } from './game/boss/bossArmorEnrage.js';
import { BOSS_TUNING, getBossTuningFixtures, getBossTuningForWave } from './game/boss/bossTuning.js';
import { BLESSING_SYSTEM, addBlessingToLoadout, getBlessingOffer, getBlessingSystemFixtures } from './game/blessings/blessings.js';
import { BLESSING_ENGINE, applyBlessingBastionDamage, applyBlessingTowerIdentity, applyBlessingWaveGold, getBlessingAdjustedMaxHp, getBlessingEngineFixtures, getBlessingModifiers } from './game/blessings/blessingEngine.js';
import { BLESSING_REROLL, canRerollBlessings, getBlessingRerollCost, getBlessingRerollFixtures, getRerolledBlessingOffer } from './game/blessings/blessingReroll.js';
import { BLESSING_POWER_BUDGET, getBlessingExploitChecks } from './game/blessings/blessingPowerBudget.js';
import { BOSS_SUMMON_ADDS, getBossSummonAddsFixtures, getBossSummonAddsPlan } from './game/boss/bossSummonAdds.js';
import { RUN_TIMER, formatSurvivalTime, getElapsedRunMs, getRunTimerFixtures } from './game/run/runTimer.js';
import { RUN_SCORE, calculateRunScore, getRunScoreFixtures } from './game/run/runScore.js';
import { RUN_END_REASONS, createRunEndSnapshot, getRunEndFixtures } from './game/run/runEndSnapshot.js';
import { PERSONAL_BEST, comparePersonalBest, getPersonalBestFixtures } from './game/run/personalBest.js';
import { ENEMY_BASE_MODEL, applyEnemyDamage, getEnemyBaseFixtures, getEnemyEffectiveSpeed } from './game/enemies/enemyBase.js';
import { ENEMY_ROSTER, createRosterEnemyState, getEnemyRosterFixtures } from './game/enemies/enemyRoster.js';
import { NORMAL_ENEMY, createNormalEnemyState, getNormalEnemyBudget } from './game/enemies/normal.js';
import { RUNNER_ENEMY, createRunnerEnemyState, getRunnerEnemyBudget } from './game/enemies/runner.js';
import { TANK_ENEMY, createTankEnemyState, getTankEnemyBudget } from './game/enemies/tank.js';
import { ARMORED_ENEMY, createArmoredEnemyState, getArmoredEnemyBudget } from './game/enemies/armored.js';
import { SHIELDED_ENEMY, createShieldedEnemyState, getShieldedEnemyBudget } from './game/enemies/shielded.js';
import { FLYING_ENEMY, createFlyingEnemyState, getFlyingEnemyBudget } from './game/enemies/flying.js';
import { ELITE_MODIFIER_SYSTEM, applyEliteModifiers, attachEliteModifierFoundation, getEliteModifierFoundationFixtures } from './game/elites/eliteModifiers.js';
import { WORLD_MODIFIER_SYSTEM, getActiveWorldModifiers, getWorldModifierEffects, getWorldModifierFoundationFixtures } from './game/world/worldModifiers.js';
import { GAME_FEEDBACK_EVENTS, emitGameFeedback, getGameFeedbackFixtures } from './game/feedback/gameFeedback.js';
import './menu.css';

const SCREENS = Object.freeze({
  MENU: 'menu',
  PLAY: 'play',
  MODE_PREP: 'mode-prep',
  SINGLE_GATE_RUN: 'single-gate-run',
  RESULTS: 'results',
  LEADERBOARD: 'leaderboard',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  HOW_TO_PLAY: 'how-to-play'
});

const MODES = Object.freeze({
  SINGLE_GATE: 'single-gate',
  TRI_GATE: 'tri-gate',
  LAST_BASTION: 'last-bastion',
  TFT_SHOP: 'tft-shop'
});

const MODE_PRE_RUN = Object.freeze({
  [MODES.SINGLE_GATE]: Object.freeze({
    kicker: 'SINGLE GATE',
    title: 'ONE FRONT. ONE BASTION.',
    description: 'Classic endless survival on a single attack front.',
    fronts: '1 FRONT',
    objective: 'SURVIVE',
    record: 'HIGHEST WAVE',
    status: 'READY TO INITIALIZE'
  }),
  [MODES.TRI_GATE]: Object.freeze({
    kicker: 'TRI-GATE',
    title: 'THREE FRONTS. TOTAL SIEGE.',
    description: 'Defend three simultaneous attack fronts in one survival run.',
    fronts: '3 FRONTS',
    objective: 'SURVIVE',
    record: 'HIGHEST WAVE',
    status: 'MODE LOGIC LATER'
  }),
  [MODES.TFT_SHOP]: Object.freeze({
    kicker: 'TFT SHOP',
    title: 'ROLL. BENCH. BUILD.',
    description: 'Shop-driven survival using random tower copies.',
    fronts: '1 FRONT',
    objective: 'SURVIVE',
    record: 'HIGHEST WAVE',
    status: 'READY TO INITIALIZE'
  }),
  [MODES.LAST_BASTION]: Object.freeze({
    kicker: 'LAST BASTION',
    title: 'LAST SURVIVOR WINS.',
    description: 'Competitive survival: every player faces the same siege and the last defender standing wins.',
    fronts: 'SHARED SIEGE',
    objective: 'OUTLAST',
    record: 'SURVIVAL RESULT',
    status: 'MATCHMAKING LATER'
  })
});

const COMBAT_BALANCE_BY_ID = Object.freeze(
  Object.fromEntries(COMBAT_BALANCE_SNAPSHOT.map((entry) => [entry.id, entry]))
);

const PLACEMENT_VALIDATION_SNAPSHOT = Object.freeze(
  getPlacementValidationFixtures().map((fixture) => ({
    id: fixture.id,
    expected: fixture.expectValid,
    actual: validateSingleGatePlacement(fixture.point, fixture.placedStructures).valid
  }))
);

const TARGETING_VALIDATION_SNAPSHOT = Object.freeze(
  getTargetingFixtures().map((fixture) => ({
    id: fixture.id,
    expected: fixture.expectedTargetId,
    actual: resolveTarget(fixture.defense, fixture.enemies)?.id ?? null
  }))
);

const ATTACK_FEEDBACK_FIXTURE = Object.freeze(getAttackFeedbackFixtures());

const COUNTERPLAY_FIXTURE = Object.freeze(getCounterplayFixtures());
const FACTION_COUNTER_FIXTURE = Object.freeze(getFactionCounterFixtures());

const THREAT_MODEL_FIXTURE = Object.freeze(getThreatModelFixtures());
const WAVE_DIRECTOR_FIXTURE = Object.freeze(getWaveDirectorFixtures());

const DIFFICULTY_BAND_FIXTURE = Object.freeze(getDifficultyBandFixtures());

const RUN_TIMER_FIXTURE = Object.freeze(getRunTimerFixtures());

const RUN_SCORE_FIXTURE = Object.freeze(getRunScoreFixtures());

const RUN_END_FIXTURE = Object.freeze(getRunEndFixtures());

const PERSONAL_BEST_FIXTURE = Object.freeze(getPersonalBestFixtures());

const ENEMY_BASE_FIXTURE = Object.freeze(getEnemyBaseFixtures());
const ENEMY_ROSTER_FIXTURE = Object.freeze(getEnemyRosterFixtures());

const NORMAL_ENEMY_BUDGET = Object.freeze(getNormalEnemyBudget());

const RUNNER_ENEMY_BUDGET = Object.freeze(getRunnerEnemyBudget());

const TANK_ENEMY_BUDGET = Object.freeze(getTankEnemyBudget());

const ARMORED_ENEMY_BUDGET = Object.freeze(getArmoredEnemyBudget());

const SHIELDED_ENEMY_BUDGET = Object.freeze(getShieldedEnemyBudget());

const FLYING_ENEMY_BUDGET = Object.freeze(getFlyingEnemyBudget());
const TOWER_ROSTER_FIXTURE = Object.freeze(getTowerRosterFixtures());
const NORMAL_BUILD_ROSTER_FIXTURE = Object.freeze(getNormalBuildRosterFixtures());
const NORMAL_BUILD_PURCHASE_FIXTURE = Object.freeze(getTowerSlotPurchaseFixtures(NORMAL_MODE_TOWERS, 10000));
const BASE_TOWER_GAMEPLAY_FIXTURE = Object.freeze(getBaseTowerGameplayFixtures());
const BASE_TOWER_COMBAT_FIXTURE = Object.freeze(getBaseTowerCombatFixtures(BASE_TOWER_GAMEPLAY_BY_ID));
const SUPPORT_STACKING_FIXTURE = Object.freeze(getSupportStackingFixtures());
const EVOLUTION_FIXTURE = Object.freeze(getEvolutionFixtures());
const TOWER_ART_FIXTURE = Object.freeze(getTowerArtFixtures());
const TOWER_EVOLUTION_INTEGRITY_QA = Object.freeze(getTowerEvolutionIntegrityQa());
const TOWER_EVOLUTION_INTEGRITY_PASS = getTowerEvolutionIntegrityPass();
const NORMAL_MODE_EVOLUTION_FLOW_QA = Object.freeze(getNormalModeEvolutionFlowQa());
const NORMAL_MODE_EVOLUTION_FLOW_PASS = getNormalModeEvolutionFlowPass();
const WALL_SYSTEM_FIXTURE = Object.freeze(getWallSystemFixtures());
const WALL_PROGRESS_BY_ID = Object.freeze({
  'wall-01': 0.115,
  'wall-02': 0.324,
  'wall-03': 0.543,
  'wall-04': 0.760
});
const TFT_SHOP_FIXTURE = Object.freeze(getTftShopFixtures());
const TFT_BENCH_FIXTURE = Object.freeze(getTftBenchFixtures());
const TFT_COPY_PROGRESSION_FIXTURE = Object.freeze(getTftCopyProgressionFixtures());
const TFT_EVOLUTION_FLOW_QA = Object.freeze(getTftEvolutionFlowQa());
const TFT_EVOLUTION_FLOW_PASS = getTftEvolutionFlowPass();
const EVOLUTION_PERSISTENCE_SELL_RECONNECT_QA = Object.freeze(getEvolutionPersistenceSellReconnectQa());
const EVOLUTION_PERSISTENCE_SELL_RECONNECT_PASS = getEvolutionPersistenceSellReconnectPass();
const TFT_PERSISTENCE_FIXTURE = Object.freeze(getTftPersistenceFixtures());
const ELITE_MODIFIER_FIXTURE = Object.freeze(getEliteModifierFoundationFixtures());
const WORLD_MODIFIER_FIXTURE = Object.freeze(getWorldModifierFoundationFixtures());
const GAME_FEEDBACK_FIXTURE = Object.freeze(getGameFeedbackFixtures());

const ECONOMY_BASELINE_FIXTURE = Object.freeze(getEconomyBaselineFixtures({
  archer: ARCHER_TOWER,
  cannon: CANNON_TOWER,
  frost: FROST_TOWER,
  mage: MAGE_TOWER,
  ballista: BALLISTA_TOWER,
  barracks: BARRACKS
}));


const TOWER_SLOT_PURCHASE_FIXTURE = Object.freeze(getTowerSlotPurchaseFixtures(
  [ARCHER_TOWER, CANNON_TOWER, FROST_TOWER, MAGE_TOWER, BALLISTA_TOWER, BARRACKS],
  ECONOMY_BASELINE.startingGold
));

const TRI_GATE_MAP_FIXTURE = Object.freeze(getTriGateMapFixtures());
const TRI_GATE_SPAWN_FIXTURE = Object.freeze(getTriGateSpawnFixtures());
const TRI_GATE_ECONOMY_FIXTURE = Object.freeze(getTriGateEconomyFixtures());
const TRI_GATE_BALANCE_SMOKE = Object.freeze(getTriGateBalanceSmokeTest());
const LATE_GAME_SOAK_QA = Object.freeze(getLateGameSoakQa());
const LATE_GAME_SOAK_PASS = getLateGameSoakPass();
const PERFORMANCE_TELEMETRY_QA = Object.freeze(getPerformanceTelemetryQa());
const PERFORMANCE_TELEMETRY_PASS = getPerformanceTelemetryPass();
const END_TO_END_REGRESSION_QA = Object.freeze(getEndToEndRegressionQa());
const END_TO_END_REGRESSION_PASS = getEndToEndRegressionPass();
const EVOLUTION_POWER_BUDGET_QA = Object.freeze(getEvolutionPowerBudgetQa());
const EVOLUTION_POWER_BUDGET_PASS = getEvolutionPowerBudgetPass();
const BOSS_SCHEDULE_FIXTURE = Object.freeze(getBossScheduleFixtures());
const BOSS_SUMMON_ADDS_FIXTURE = Object.freeze(getBossSummonAddsFixtures());
const BOSS_ARMOR_ENRAGE_FIXTURE = Object.freeze(getBossArmorEnrageFixtures());
const BOSS_TUNING_FIXTURE = Object.freeze(getBossTuningFixtures());
const ENEMY_TAG_FIXTURE = Object.freeze({
  allTemplatesTagged: [NORMAL_ENEMY, RUNNER_ENEMY, TANK_ENEMY, ARMORED_ENEMY, SHIELDED_ENEMY, FLYING_ENEMY].every((enemy) => Boolean(enemy.faction) && Boolean(enemy.unitType)),
  runtimeTagsPersist: ENEMY_BASE_FIXTURE.tagsPersist === true,
  bossTagsPresent: BOSS_TUNING_FIXTURE.bossTagsPresent === true
});
const BLESSING_SYSTEM_FIXTURE = Object.freeze(getBlessingSystemFixtures());
const BLESSING_ENGINE_FIXTURE = Object.freeze(getBlessingEngineFixtures());
const BLESSING_REROLL_FIXTURE = Object.freeze(getBlessingRerollFixtures());
const BLESSING_EXPLOIT_FIXTURE = Object.freeze(getBlessingExploitChecks());
const OPENING_BLESSING_OFFER = Object.freeze(getBlessingOffer('prototype-run', [], BLESSING_SYSTEM.choiceCount));

const GOLD_MINE_OPPORTUNITY = Object.freeze(getGoldMineOpportunityCost([
  ARCHER_TOWER,
  CANNON_TOWER,
  FROST_TOWER,
  MAGE_TOWER,
  BALLISTA_TOWER,
  BARRACKS
]));
const GOLD_MINE_FIXTURE = Object.freeze(getGoldMineFixtures([
  ARCHER_TOWER,
  CANNON_TOWER,
  FROST_TOWER,
  MAGE_TOWER,
  BALLISTA_TOWER,
  BARRACKS
]));

const WAR_FORGE_FIXTURE = Object.freeze(getWarForgeFixtures(ARCHER_TOWER));
const WAR_FORGE_ARCHER_PREVIEW = Object.freeze(applyWarForgePreview(ARCHER_TOWER, WAR_FORGE.auraRadius));

const GUARDIAN_SHRINE_FIXTURE = Object.freeze(getGuardianShrineFixtures(ARCHER_TOWER));
const GUARDIAN_SHRINE_RANGE_PREVIEW = Object.freeze(applyGuardianShrineRangePreview(ARCHER_TOWER, GUARDIAN_SHRINE.auraRadius));
const GUARDIAN_SHRINE_DAMAGE_PREVIEW = Object.freeze(applyGuardianShrineToBastionDamage(10, GUARDIAN_SHRINE.auraRadius));

const SPEND_CURVE_FIXTURE = Object.freeze(getSpendCurveFixtures());
const OPENING_ECONOMY_RISK = Object.freeze(getEconomyRiskProfile({ waveNumber: 1, currentGold: ECONOMY_BASELINE.startingGold, mineCount: 1 }));
const OPENING_STRATEGIC_SPEND = Object.freeze(getStrategicSpendProfile(ECONOMY_BASELINE.startingGold));

const RUN_PHASES = Object.freeze({
  PREPARATION: 'preparation',
  ACTIVE: 'active',
  RESOLVING: 'resolving',
  ENDED: 'ended'
});

const WAVE_PHASE_TRANSITIONS = Object.freeze({
  [RUN_PHASES.PREPARATION]: Object.freeze([RUN_PHASES.ACTIVE, RUN_PHASES.ENDED]),
  [RUN_PHASES.ACTIVE]: Object.freeze([RUN_PHASES.RESOLVING, RUN_PHASES.ENDED]),
  [RUN_PHASES.RESOLVING]: Object.freeze([RUN_PHASES.PREPARATION, RUN_PHASES.ENDED]),
  [RUN_PHASES.ENDED]: Object.freeze([])
});

function canTransitionWavePhase(from, to) {
  return WAVE_PHASE_TRANSITIONS[from]?.includes(to) ?? false;
}

function getWaveScaling(completedWaves, mode = MODES.SINGLE_GATE) {
  const waveNumber = Math.max(1, completedWaves + 1);
  return mode === MODES.TRI_GATE
    ? getTriGateWaveScaling(waveNumber)
    : getBandWaveScaling(waveNumber);
}

const RUN_DEFAULTS = Object.freeze({
  startingGold: ECONOMY_BASELINE.startingGold,
  coreHp: 20,
  preparationSeconds: 15
});

function createInitialRunState(mode, seedInput = `${mode}:prototype`, serverMatch = null) {
  if (!Object.values(MODES).includes(mode)) return null;

  return {
    mode,
    matchId: serverMatch?.id ?? null,
    matchToken: serverMatch?.token ?? null,
    serverStartedAt: serverMatch?.startedAt ?? null,
    seed: normalizeRunSeed(seedInput),
    phase: RUN_PHASES.PREPARATION,
    preparationSeconds: mode === MODES.TRI_GATE ? TRI_GATE_PACING.preparationSeconds : RUN_DEFAULTS.preparationSeconds,
    wave: 0,
    gold:
      mode === MODES.TRI_GATE
        ? TRI_GATE_PACING.startingGold
        : mode === MODES.TFT_SHOP
          ? TFT_SHOP.startingGold
          : RUN_DEFAULTS.startingGold,
    coreHp: RUN_DEFAULTS.coreHp,
    coreMaxHp: RUN_DEFAULTS.coreHp,
    waveStartCoreHp: RUN_DEFAULTS.coreHp,
    bastionHitId: 0,
    kills: 0,
    startedAtMs: Number.isFinite(Date.parse(serverMatch?.startedAt))
      ? Date.parse(serverMatch.startedAt)
      : Date.now(),
    syncWaveStartsAtMs: Number.isFinite(Date.parse(serverMatch?.waveStartsAt))
      ? Date.parse(serverMatch.waveStartsAt)
      : null,
    elapsedMs: 0,
    endedAtMs: null,
    result: null,
    endSnapshot: null,
    personalBestResult: null,
    blessings: []
  };
}

async function startServerMatch(session, mode) {
  if (!session?.access_token) {
    return { ok: false, error: 'authentication_required' };
  }

  const response = await fetch('/api/match/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ mode })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.match) {
    return { ok: false, error: payload?.error || 'match_start_failed' };
  }

  return { ok: true, match: payload.match };
}

async function reportStandardRunProgress(session, run) {
  if (
    !session?.access_token ||
    !run?.matchToken ||
    !run?.matchId ||
    ![MODES.SINGLE_GATE, MODES.TRI_GATE].includes(run.mode)
  ) {
    return { ok: false, error: 'progress_not_ready' };
  }

  const response = await fetch('/api/run/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      matchToken: run.matchToken,
      mode: run.mode,
      wave: run.wave ?? 0,
      coreHp: run.coreHp ?? 0,
      coreMaxHp: run.coreMaxHp ?? 20,
      kills: run.kills ?? 0,
      gold: run.gold ?? 0
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: payload?.error || 'progress_failed' };
  return { ok: true, payload };
}

async function completeServerRun(session, run) {
  if (!session?.access_token || !run?.matchToken || !run?.endSnapshot) {
    return { ok: false, error: 'completion_not_ready' };
  }

  const snapshot = run.endSnapshot;

  if ([MODES.SINGLE_GATE, MODES.TRI_GATE].includes(snapshot.mode)) {
    const finalCheckpoint = await reportStandardRunProgress(session, {
      ...run,
      wave: snapshot.wave,
      gold: snapshot.gold,
      coreHp: snapshot.coreHp,
      coreMaxHp: snapshot.coreMaxHp,
      kills: snapshot.kills
    });
    if (!finalCheckpoint.ok) {
      return { ok: false, error: finalCheckpoint.error || 'final_checkpoint_failed' };
    }
  }

  const response = await fetch('/api/run/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      matchToken: run.matchToken,
      mode: snapshot.mode,
      wave: snapshot.wave,
      elapsedMs: snapshot.elapsedMs,
      score: snapshot.score,
      gold: snapshot.gold,
      coreHp: snapshot.coreHp,
      coreMaxHp: snapshot.coreMaxHp,
      kills: snapshot.kills,
      resultReason: snapshot.reason
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: payload?.error || 'run_completion_failed' };
  }

  return { ok: true, payload };
}

async function fetchProfileData(session) {
  if (!session?.access_token) {
    return { ok: false, error: 'authentication_required' };
  }

  const response = await fetch('/api/profile', {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: payload?.error || 'profile_load_failed' };
  }

  return { ok: true, payload };
}

async function lastBastionMatchmakingRequest(session, action, body = null) {
  if (!session?.access_token) return { ok: false, error: 'authentication_required' };
  const method = action === 'status' ? 'GET' : 'POST';
  const response = await fetch(`/api/last-bastion/matchmaking/${action}`, {
    method,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${session.access_token}`
    },
    ...(body != null ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: payload?.error || 'matchmaking_request_failed' };
  return { ok: true, payload };
}

async function lastBastionMatchHeartbeat(session, run) {
  if (!session?.access_token || !run?.matchToken || run?.mode !== MODES.LAST_BASTION) {
    return { ok: false, error: 'heartbeat_not_ready' };
  }

  const response = await fetch('/api/last-bastion/match/heartbeat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      matchToken: run.matchToken,
      wave: run.wave ?? 0,
      coreHp: run.coreHp ?? 0
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: payload?.error || 'heartbeat_failed' };
  return { ok: true, payload };
}

async function lastBastionEliminate(session, run) {
  if (!session?.access_token || !run?.matchToken || run?.mode !== MODES.LAST_BASTION) {
    return { ok: false, error: 'elimination_not_ready' };
  }

  const response = await fetch('/api/last-bastion/match/eliminate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      matchToken: run.matchToken,
      wave: run.wave ?? 0
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: payload?.error || 'elimination_failed' };
  return { ok: true, payload };
}

async function lastBastionMatchStatus(session, run) {
  if (!session?.access_token || !run?.matchToken || run?.mode !== MODES.LAST_BASTION) {
    return { ok: false, error: 'match_status_not_ready' };
  }

  const response = await fetch(
    `/api/last-bastion/match/status?matchToken=${encodeURIComponent(run.matchToken)}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: payload?.error || 'match_status_failed' };
  return { ok: true, payload };
}

async function fetchLeaderboardData(session, mode) {
  if (!session?.access_token) {
    return { ok: false, error: 'authentication_required' };
  }

  const response = await fetch(`/api/leaderboards/${encodeURIComponent(mode)}?limit=50`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: payload?.error || 'leaderboard_load_failed' };
  }

  return { ok: true, payload };
}

function getPathLength(waypoints) {
  let total = 0;
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    total += Math.hypot(
      waypoints[index + 1].x - waypoints[index].x,
      waypoints[index + 1].y - waypoints[index].y
    );
  }
  return total;
}

function getPathPosition(waypoints, progress) {
  if (!waypoints.length) return { x: 0, y: 0 };
  if (waypoints.length === 1) return waypoints[0];

  const segments = [];
  let totalLength = 0;

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const from = waypoints[index];
    const to = waypoints[index + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({ from, to, length });
    totalLength += length;
  }

  let remaining = Math.max(0, Math.min(1, progress)) * totalLength;

  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
        y: segment.from.y + (segment.to.y - segment.from.y) * ratio
      };
    }
    remaining -= segment.length;
  }

  return waypoints[waypoints.length - 1];
}

function Shell({ title, kicker, subtitle, onBack, children }) {
  return (
    <main className="main-menu main-menu--inner">
      <div className="menu-creature menu-creature--left" aria-hidden="true"><img src="/assets/enemies/gryphon-knight.png" alt="" /></div>
      <div className="menu-creature menu-creature--right" aria-hidden="true"><img src="/assets/enemies/rift-juggernaut.png" alt="" /></div>
      <section className="mode-screen" aria-labelledby="screen-title">
        <button className="mode-screen__back" onClick={onBack} aria-label={`Back from ${title}`}>← BACK</button>
        <p className="main-menu__kicker">{kicker}</p>
        <h2 id="screen-title">{title}</h2>
        {subtitle && <p className="mode-screen__subtitle">{subtitle}</p>}
        {children}
      </section>
    </main>
  );
}

function ModeSelect({ onBack, onSelect }) {
  return (
    <Shell
      onBack={onBack}
      kicker="CHOOSE YOUR DEFENSE"
      title="SELECT MODE"
      subtitle="Choose a survival format. Each mode has its own pre-run contract."
    >
      <div className="mode-grid" role="group" aria-label="Game modes">
        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.SINGLE_GATE)}>
          <span className="mode-card__players">ONE FRONT</span>
          <strong>SINGLE GATE</strong>
          <small>One front. One Bastion. Survive.</small>
          <em>SELECT MODE</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.TRI_GATE)}>
          <span className="mode-card__players">THREE FRONTS</span>
          <strong>TRI-GATE</strong>
          <small>Three fronts. Total siege.</small>
          <em>SELECT MODE</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.TFT_SHOP)}>
          <span className="mode-card__players">SHOP SURVIVAL</span>
          <strong>TFT SHOP</strong>
          <small>Roll tower copies, build from a bench, survive.</small>
          <em>SELECT MODE</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.LAST_BASTION)}>
          <span className="mode-card__players">COMPETITIVE SURVIVAL</span>
          <strong>LAST BASTION</strong>
          <small>Same siege. Last survivor wins.</small>
          <em>SELECT MODE</em>
        </button>
      </div>
    </Shell>
  );
}


function TriGateBattlefieldPreview() {
  const bastion = TRI_GATE_MAP.anchors.bastion;

  return (
    <section
      className="tri-gate-preview"
      aria-label="Tri-Gate battlefield preview"
      data-tri-gate-rendered-lanes={TRI_GATE_MAP.pathPlan.lanes.length}
      data-tri-gate-rendered-entrances={TRI_GATE_MAP.anchors.entrances.length}
    >
      <div className="tri-gate-preview__header">
        <span>THREE FRONTS</span>
        <strong>{TRI_GATE_MAP.name}</strong>
        <small>Battlefield render only — live multi-lane spawning arrives next.</small>
      </div>

      <svg
        className="tri-gate-preview__map"
        viewBox={`0 0 ${TRI_GATE_MAP.size.width} ${TRI_GATE_MAP.size.height}`}
        role="img"
        aria-label="Three entrance paths converging on the central Bastion"
      >
        <defs>
          <linearGradient id="tri-terrain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a9d98e" />
            <stop offset="55%" stopColor="#7fbd7c" />
            <stop offset="100%" stopColor="#67a16e" />
          </linearGradient>
          <linearGradient id="tri-path" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d2c49f" />
            <stop offset="100%" stopColor="#b9a77b" />
          </linearGradient>
          <radialGradient id="tri-bastion-glow">
            <stop offset="0%" stopColor="rgba(104,190,255,.75)" />
            <stop offset="100%" stopColor="rgba(104,190,255,0)" />
          </radialGradient>
        </defs>

        <rect width={TRI_GATE_MAP.size.width} height={TRI_GATE_MAP.size.height} fill="url(#tri-terrain)" />

        <g className="tri-gate-preview__terrain-detail" opacity=".42">
          <path d="M0 180Q210 100 390 190T760 160T1120 210T1600 140V0H0Z" />
          <path d="M0 760Q220 700 420 760T820 720T1210 770T1600 710V900H0Z" />
          <circle cx="260" cy="180" r="72" />
          <circle cx="1310" cy="220" r="96" />
          <circle cx="1315" cy="690" r="88" />
          <circle cx="260" cy="700" r="82" />
        </g>

        {TRI_GATE_MAP.pathPlan.lanes.map((lane) => (
          <polyline
            key={lane.id}
            className="tri-gate-preview__path-shadow"
            points={lane.waypoints.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            strokeWidth={lane.width + 18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {TRI_GATE_MAP.pathPlan.lanes.map((lane) => (
          <polyline
            key={`${lane.id}-road`}
            className="tri-gate-preview__path"
            points={lane.waypoints.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke="url(#tri-path)"
            strokeWidth={lane.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {TRI_GATE_MAP.anchors.entrances.map((entrance) => (
          <g
            key={entrance.id}
            className="tri-gate-preview__entrance"
            transform={`translate(${entrance.x} ${entrance.y})`}
          >
            <circle r="54" />
            <path d="M-28 28V-8L0-36L28-8V28Z" />
            <rect x="-9" y="2" width="18" height="26" rx="4" />
            <text x="0" y="82" textAnchor="middle">{entrance.side.toUpperCase()}</text>
          </g>
        ))}

        <circle
          className="tri-gate-preview__bastion-glow"
          cx={bastion.x}
          cy={bastion.y}
          r="120"
          fill="url(#tri-bastion-glow)"
        />

        <g
          className="tri-gate-preview__bastion"
          transform={`translate(${bastion.x} ${bastion.y})`}
        >
          <circle r="72" />
          <path d="M-48 42V-26L-24-48L0-26L24-48L48-26V42Z" />
          <rect x="-18" y="2" width="36" height="40" rx="6" />
          <text x="0" y="96" textAnchor="middle">BASTION</text>
        </g>
      </svg>
    </section>
  );
}

function LastBastionLobby({ session, onBack, onStart }) {
  const startedMatchIdRef = useRef(null);
  const [state, setState] = useState({ loading: true, queued: false, matched: false, match: null, ticket: null, queuedPlayers: 0, readyPlayers: 0, fillWindowRemainingMs: null, error: '' });

  const refresh = async () => {
    const result = await lastBastionMatchmakingRequest(session, 'status');
    if (!result.ok) {
      setState((current) => ({ ...current, loading: false, error: result.error }));
      return;
    }
    setState({
      loading: false,
      queued: Boolean(result.payload?.queued),
      matched: Boolean(result.payload?.matched),
      match: result.payload?.match ?? null,
      ticket: result.payload?.ticket ?? null,
      queuedPlayers: result.payload?.queuedPlayers ?? 0,
      readyPlayers: result.payload?.readyPlayers ?? 0,
      fillWindowRemainingMs: result.payload?.fillWindowRemainingMs ?? null,
      error: ''
    });
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await lastBastionMatchmakingRequest(session, 'status');
      if (cancelled) return;
      if (!result.ok) {
        setState((current) => ({ ...current, loading: false, error: result.error }));
        return;
      }
      setState({
        loading: false,
        queued: Boolean(result.payload?.queued),
        matched: Boolean(result.payload?.matched),
        match: result.payload?.match ?? null,
        ticket: result.payload?.ticket ?? null,
        queuedPlayers: result.payload?.queuedPlayers ?? 0,
        error: ''
      });
    };
    run();
    const timer = window.setInterval(run, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!state.matched || !state.match?.id || startedMatchIdRef.current === state.match.id) return;
    if (!state.match?.seed || !state.match?.token || !state.match?.startedAt) return;
    startedMatchIdRef.current = state.match.id;
    onStart(MODES.LAST_BASTION, state.match);
  }, [state.matched, state.match?.id, state.match?.seed, state.match?.token, state.match?.startedAt, onStart]);

  const join = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    const result = await lastBastionMatchmakingRequest(session, 'join', {});
    if (!result.ok) return setState((current) => ({ ...current, loading: false, error: result.error }));
    await refresh();
  };

  const setReady = async (ready) => {
    const result = await lastBastionMatchmakingRequest(session, 'ready', { ready });
    if (!result.ok) return setState((current) => ({ ...current, error: result.error }));
    await refresh();
  };

  const leave = async () => {
    const result = await lastBastionMatchmakingRequest(session, 'leave', {});
    if (!result.ok) return setState((current) => ({ ...current, error: result.error }));
    await refresh();
  };

  return (
    <Shell
      onBack={async () => {
        if (state.queued) await lastBastionMatchmakingRequest(session, 'leave', {});
        onBack();
      }}
      kicker="LAST BASTION"
      title="LAST SURVIVOR WINS."
      subtitle="Join the shared queue, ready up, and wait for a synchronized match."
    >
      <div className="pre-run-grid">
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">QUEUE</span>
          <strong>{state.queued ? `#${state.ticket?.position ?? '-'}` : 'NOT QUEUED'}</strong>
          <small>{state.queuedPlayers} defender{state.queuedPlayers === 1 ? '' : 's'} queued</small>
        </section>
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">STATUS</span>
          <strong>{state.ticket?.ready ? 'READY' : state.queued ? 'WAITING' : 'IDLE'}</strong>
          <small>{state.ticket?.ready ? 'Ready for matchmaking.' : 'Ready status can be changed any time before match start.'}</small>
        </section>
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">MATCH</span>
          <strong>
            {state.matched
              ? 'MATCH FOUND'
              : state.readyPlayers >= 2 && Number.isFinite(Number(state.fillWindowRemainingMs))
                ? `FILLING ${Math.max(0, Math.ceil(Number(state.fillWindowRemainingMs) / 1000))}s`
                : 'SHARED SIEGE'}
          </strong>
          <small>
            {state.matched
              ? 'Shared seed locked. Synchronizing start...'
              : state.readyPlayers >= 2
                ? `READY ${state.readyPlayers}/8 · filling the lobby before launch.`
                : `READY ${state.readyPlayers}/8 · minimum 2 defenders.`}
          </small>
        </section>
      </div>

      <div className="pre-run-footer">
        <p>Status: <strong>{state.error || (state.loading ? 'SYNCING...' : state.ticket?.status?.toUpperCase() || 'READY TO QUEUE')}</strong></p>
        {!state.queued ? (
          <button className="pre-run-start" onClick={join} disabled={state.loading}>JOIN QUEUE<small>Enter Last Bastion matchmaking</small></button>
        ) : (
          <div className="last-bastion-lobby-actions">
            <button className="pre-run-start" onClick={() => setReady(!state.ticket?.ready)}>
              {state.ticket?.ready ? 'NOT READY' : 'READY'}
              <small>{state.ticket?.ready ? 'Return to waiting' : 'Lock in for the match'}</small>
            </button>
            <button className="mode-screen__back" onClick={leave}>LEAVE QUEUE</button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function ModePreRun({ mode, onBack, onStart, session }) {
  const contract = MODE_PRE_RUN[mode];

  if (!contract) return null;
  if (mode === MODES.LAST_BASTION) return <LastBastionLobby session={session} onBack={onBack} onStart={onStart} />;

  return (
    <Shell
      onBack={onBack}
      kicker={contract.kicker}
      title={contract.title}
      subtitle={contract.description}
    >
      <div className="pre-run-grid">
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">FORMAT</span>
          <strong>{contract.fronts}</strong>
          <small>{mode === MODES.TRI_GATE ? 'Three rendered fronts converge on one central Bastion.' : 'Single-front battlefield.'}</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">OBJECTIVE</span>
          <strong>{contract.objective}</strong>
          <small>Every defender begins from equal combat power.</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">RECORD</span>
          <strong>{contract.record}</strong>
          <small>Mode-specific persistence and validation arrive in later roadmap batches.</small>
        </section>
      </div>

      {mode === MODES.TRI_GATE && <TriGateBattlefieldPreview />}

      <div className="pre-run-footer">
        <p>Status: <strong>{contract.status}</strong></p>
        <button
          className="pre-run-start"
          disabled={mode === MODES.LAST_BASTION}
          onClick={() => mode !== MODES.LAST_BASTION && onStart(mode)}
        >
          START RUN
          <small>{mode !== MODES.LAST_BASTION ? 'Initialize run' : contract.status}</small>
        </button>
      </div>
    </Shell>
  );
}


function SoloRun({ run, onExit, onDamageBastion, onPhaseChange, onTimerTick, onSpendGold, onGainGold, onEnemyKilled }) {
  const restoredTftSnapshot = useRef(run?.mode === MODES.TFT_SHOP ? loadTftRunSnapshot() : null);
  const matchingTftSnapshot = restoredTftSnapshot.current?.run?.seed === run?.seed ? restoredTftSnapshot.current : null;
  const [spawnQueue, setSpawnQueue] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [preparationRemaining, setPreparationRemaining] = useState(run?.preparationSeconds ?? RUN_DEFAULTS.preparationSeconds);
  const [selectedDefenseId, setSelectedDefenseId] = useState('human-aa');
  const [placedDefenses, setPlacedDefenses] = useState(() => matchingTftSnapshot?.placedDefenses ?? []);
  const [activeWallIds, setActiveWallIds] = useState(() => matchingTftSnapshot?.activeWallIds ?? []);
  const [wallHpById, setWallHpById] = useState(() => matchingTftSnapshot?.wallHpById ?? {});
  const [hoveredSlotId, setHoveredSlotId] = useState(null);
  const [selectedPlacedDefenseId, setSelectedPlacedDefenseId] = useState(null);
  const [movingPlacedDefenseId, setMovingPlacedDefenseId] = useState(null);
  const [riskRewardTier, setRiskRewardTier] = useState('safe');
  const [miniObjectiveFeedback, setMiniObjectiveFeedback] = useState('');
  const [selectedBlessingPreviewId, setSelectedBlessingPreviewId] = useState(null);
  const [blessingRerollCount, setBlessingRerollCount] = useState(0);
  const [tftRollIndex, setTftRollIndex] = useState(() => matchingTftSnapshot?.tftRollIndex ?? 0);
  const [tftShopLocked, setTftShopLocked] = useState(() => matchingTftSnapshot?.tftShopLocked ?? false);
  const [tftPurchasedSlotIds, setTftPurchasedSlotIds] = useState(
    () => matchingTftSnapshot?.tftPurchasedSlotIds ?? []
  );
  const [tftBench, setTftBench] = useState(() => matchingTftSnapshot?.tftBench ?? createEmptyBench());
  const [tftFeedback, setTftFeedback] = useState(() => matchingTftSnapshot ? 'RUN RESTORED' : '');
  const [selectedTftShopSlotId, setSelectedTftShopSlotId] = useState(null);
  const [selectedTftBenchIndex, setSelectedTftBenchIndex] = useState(() => matchingTftSnapshot?.selectedTftBenchIndex ?? null);
  const [confirmedTftSetupKey, setConfirmedTftSetupKey] = useState(null);
  const availableGoldRef = useRef(run?.gold ?? RUN_DEFAULTS.startingGold);
  const activeEnemiesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const queuedWaveRef = useRef(null);
  const spawnedWaveRef = useRef(null);
  const bossSummonTimeoutsRef = useRef([]);
  const towerAttackTimesRef = useRef({});
  const projectileQueueRef = useRef([]);
  const projectileIdRef = useRef(0);
  const defeatedEnemyIdsRef = useRef(new Set());
  const [projectiles, setProjectiles] = useState([]);

  const removeAndCountDefeatedEnemies = (enemies) => {
    const survivors = [];
    for (const enemy of enemies) {
      if (Number(enemy?.hp ?? 0) > 0) {
        survivors.push(enemy);
        continue;
      }

      const enemyId = String(enemy?.id || '');
      if (enemyId && !defeatedEnemyIdsRef.current.has(enemyId)) {
        defeatedEnemyIdsRef.current.add(enemyId);
        onEnemyKilled?.(enemyId);
      }
    }
    return survivors;
  };
  const waveScaling = getWaveScaling(run?.wave ?? 0, run?.mode);
  const nextWaveNumber = Math.max(1, (run?.wave ?? 0) + 1);
  const upcomingBossWave = getUpcomingBossWave(nextWaveNumber);
  const bossWaveIncoming = isBossWave(nextWaveNumber);
  const bossSummonPlan = getBossSummonAddsPlan(waveScaling.waveNumber);
  const bossIndex = bossWaveIncoming ? Math.max(1, Math.floor(waveScaling.waveNumber / BOSS_SCHEDULE.interval)) : null;
  const bossArmor = bossIndex ? getBossArmorForIndex(bossIndex) : 0;
  const bossTuning = bossWaveIncoming ? getBossTuningForWave(waveScaling.waveNumber) : null;
  const bossEnragePreview = applyBossEnrageStats({ isBoss: bossWaveIncoming, hp: 35, maxHp: 100, moveSpeed: 1 });
  const blessingModifiers = getBlessingModifiers(run?.blessings ?? []);
  const blessingOfferSeed = `${run?.seed ?? 'run'}:boss:${waveScaling.waveNumber}`;
  const blessingOffer = blessingRerollCount > 0
    ? getRerolledBlessingOffer(blessingOfferSeed, run?.blessings ?? [], blessingRerollCount - 1)
    : getBlessingOffer(blessingOfferSeed, run?.blessings ?? [], BLESSING_SYSTEM.choiceCount);
  const blessingRerollCost = getBlessingRerollCost(blessingRerollCount);
  const blessingCanReroll = canRerollBlessings(run?.gold ?? 0, blessingRerollCount);
  const blessingChoiceVisible = run?.phase === RUN_PHASES.RESOLVING && isBossWave(waveScaling.waveNumber);
  const activeWorldModifiers = getActiveWorldModifiers(run?.seed ?? 'run', waveScaling.waveNumber);
  const tftShopOffers = createTftShopOffers(run?.seed ?? 'run', tftRollIndex)
    .filter((offer) => !tftPurchasedSlotIds.includes(offer.slotId));
  const selectedTftShopOffer = tftShopOffers.find((offer) => offer.slotId === selectedTftShopSlotId) ?? null;
  const worldModifierEffects = getWorldModifierEffects(activeWorldModifiers);
  const riskRewardConfig = getRiskRewardConfig(run?.mode ?? MODES.SINGLE_GATE, riskRewardTier);
  const pressureRiskRewardConfig = getRiskRewardConfig(run?.mode ?? MODES.SINGLE_GATE, 'pressure');
  const miniObjective = getMiniObjectiveForWave(waveScaling.waveNumber);
  const miniObjectiveReward = getMiniObjectiveReward(run?.mode ?? MODES.SINGLE_GATE);
  const threatWave = generateWavePlan({
    seed: run?.seed ?? 'run',
    waveNumber: waveScaling.waveNumber,
    mode: run?.mode ?? MODES.SINGLE_GATE,
    budgetMultiplier:
      (run?.mode === MODES.TRI_GATE ? TRI_GATE_PACING.threatMultiplier : 1) *
      worldModifierEffects.threatMultiplier *
      riskRewardConfig.threatMultiplier
  });
  const runScore = calculateRunScore(run ?? {});
  const triGateLaneById = Object.fromEntries(
    TRI_GATE_MAP.pathPlan.lanes.map((lane) => [lane.id, lane.waypoints])
  );
  const activePath = SINGLE_GATE_MAP.path.waypoints;
  const getEnemyPath = (enemy) =>
    run?.mode === MODES.TRI_GATE
      ? (triGateLaneById[enemy?.laneId] ?? TRI_GATE_MAP.pathPlan.lanes[0].waypoints)
      : activePath;
  const renderedPaths = run?.mode === MODES.TRI_GATE
    ? TRI_GATE_MAP.pathPlan.lanes.map((lane) => lane.waypoints)
    : [activePath];
  const spawnAnchors = run?.mode === MODES.TRI_GATE
    ? TRI_GATE_MAP.anchors.entrances
    : [SINGLE_GATE_MAP.anchors.enemySpawn];
  const bastionAnchor = run?.mode === MODES.TRI_GATE
    ? TRI_GATE_MAP.anchors.bastion
    : SINGLE_GATE_MAP.anchors.bastion;
  const wallTravelMultiplier = 1;
  const defenseDefinitions = NORMAL_MODE_TOWERS_BY_ID;
  const towerSynergyState = getTowerSynergyState(placedDefenses, defenseDefinitions);
  const selectedDefense = defenseDefinitions[selectedDefenseId] ?? NORMAL_MODE_TOWERS[0];
  const selectedPlacedDefense = placedDefenses.find((entry) => entry.id === selectedPlacedDefenseId) ?? null;
  const inspectedDefenseBase = selectedPlacedDefense
    ? defenseDefinitions[selectedPlacedDefense.defenseId] ?? selectedDefense
    : selectedDefense;
  const inspectedDefense = applyBlessingTowerIdentity(
    applyTowerSynergy(
      selectedPlacedDefense
        ? getRuntimeTowerDefinition(inspectedDefenseBase, selectedPlacedDefense)
        : inspectedDefenseBase,
      towerSynergyState
    ),
    run?.blessings ?? []
  );
  const selectedSellPreview = getSellPreview(
    selectedPlacedDefense
      ? { id: inspectedDefenseBase.id, cost: Math.max(0, Number(selectedPlacedDefense.investedGold ?? inspectedDefenseBase.cost)) }
      : inspectedDefenseBase,
    0
  );
  const selectedUpgradePreview = getNextUpgradePreview(inspectedDefenseBase, selectedPlacedDefense?.level ?? 1);
  const selectedEvolutionChoices = selectedPlacedDefense ? getEvolutionChoices(selectedPlacedDefense.defenseId) : [];
  const selectedTargetingValue = getTargetingValue(inspectedDefense);
  const selectedAttackInstrumentation = getAttackInstrumentation(inspectedDefense);
  const lastBastionParticipants = run?.mode === MODES.LAST_BASTION
    ? run?.lastBastionParticipants ?? []
    : [];
  const lastBastionSelf = lastBastionParticipants.find((participant) => participant.self) ?? null;
  const lastBastionAliveCount = lastBastionParticipants.filter((participant) => participant.alive).length;
  const lastBastionFairness = run?.lastBastionFairness ?? null;
  const isLastBastionSpectating =
    run?.mode === MODES.LAST_BASTION &&
    lastBastionSelf?.alive === false &&
    run?.lastBastionMatchStatus !== 'finished';
  const isLastBastionFinished =
    run?.mode === MODES.LAST_BASTION &&
    run?.lastBastionMatchStatus === 'finished';
  const tftSetupKey = run?.mode === MODES.TFT_SHOP
    ? JSON.stringify({
        wave: run?.wave ?? 0,
        bench: tftBench.map((copy) => copy?.copyId ?? null),
        placed: placedDefenses
          .map((tower) => [tower.id, tower.defenseId, tower.slotId ?? null, tower.level ?? 1, tower.copyProgress ?? 1, tower.evolution ?? null])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      })
    : '';
  const tftSetupConfirmed = run?.mode === MODES.TFT_SHOP && confirmedTftSetupKey === tftSetupKey;

  const coreRatio = Math.max(0, Math.min(1, (run?.coreHp ?? 0) / (run?.coreMaxHp || 1)));
  const bastionStateClass = coreRatio <= 0.25
    ? 'battlefield-map__bastion--critical'
    : coreRatio <= 0.5
      ? 'battlefield-map__bastion--damaged'
      : '';


  useEffect(() => {
    availableGoldRef.current = run?.gold ?? 0;
  }, [run?.gold]);

  useEffect(() => {
    activeEnemiesRef.current = activeEnemies;
  }, [activeEnemies]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || activeWallIds.length === 0) return undefined;

    const wallProgress = WALL_PROGRESS_BY_ID;

    const intervalId = window.setInterval(() => {
      const enemies = activeEnemiesRef.current ?? [];
      if (enemies.length === 0) return;

      const damageByWall = {};
      for (const wallId of activeWallIds) {
        const targetProgress = wallProgress[wallId];
        if (!Number.isFinite(targetProgress)) continue;

        let damage = 0;
        for (const enemy of enemies) {
          if (enemy.airborne) continue;
          if (Math.abs(Number(enemy.progress ?? 0) - targetProgress) > 0.045) continue;
          damage += enemy.unitType === 'armored'
            ? WALL_SYSTEM.armoredDamagePerTick
            : WALL_SYSTEM.infantryDamagePerTick;
        }
        if (damage > 0) damageByWall[wallId] = damage;
      }

      if (Object.keys(damageByWall).length === 0) return;

      setWallHpById((current) => {
        const next = { ...current };
        const destroyed = [];

        for (const [wallId, damage] of Object.entries(damageByWall)) {
          const hp = Math.max(0, Number(next[wallId] ?? WALL_SYSTEM.maxHp) - damage);
          next[wallId] = hp;
          if (hp <= 0) destroyed.push(wallId);
        }

        if (destroyed.length > 0) {
          setActiveWallIds((ids) => ids.filter((id) => !destroyed.includes(id)));
          if (run?.mode === MODES.TFT_SHOP) {
            setTftFeedback(`WALL DESTROYED · ${destroyed.join(', ').toUpperCase()}`);
          }
        }

        return next;
      });
    }, WALL_SYSTEM.damageTickMs);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, run?.mode, activeWallIds.join('|')]);

  useEffect(() => {
    if (run?.mode !== MODES.TFT_SHOP || run?.phase === RUN_PHASES.ENDED) return;
    const snapshot = createTftRunSnapshot({
      run,
      placedDefenses,
      activeWallIds,
      wallHpById,
      tftBench,
      selectedTftBenchIndex,
      tftRollIndex,
      tftShopLocked,
      tftPurchasedSlotIds
    });
    saveTftRunSnapshot(snapshot);
  }, [run, placedDefenses, activeWallIds, wallHpById, tftBench, selectedTftBenchIndex, tftRollIndex, tftShopLocked, tftPurchasedSlotIds]);

  useEffect(() => {
    if (!run || run.phase === RUN_PHASES.ENDED) return undefined;

    const tick = () => {
      onTimerTick(getElapsedRunMs(run.startedAtMs, Date.now()));
    };

    tick();
    const intervalId = window.setInterval(tick, RUN_TIMER.tickIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [run?.startedAtMs, run?.phase]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.PREPARATION) return undefined;

    if (run?.mode === MODES.TFT_SHOP && !tftSetupConfirmed) {
      setPreparationRemaining(run?.preparationSeconds ?? RUN_DEFAULTS.preparationSeconds);
      return undefined;
    }

    if (run?.syncWaveStartsAtMs && run.wave === 0) {
      const sync = () => {
        const remainingMs = run.syncWaveStartsAtMs - Date.now();
        setPreparationRemaining(Math.max(0, Math.ceil(remainingMs / 1000)));
        if (remainingMs <= 0) {
          onPhaseChange(RUN_PHASES.ACTIVE);
          return true;
        }
        return false;
      };

      if (sync()) return undefined;
      const intervalId = window.setInterval(() => {
        if (sync()) window.clearInterval(intervalId);
      }, 100);
      return () => window.clearInterval(intervalId);
    }

    setPreparationRemaining(run?.preparationSeconds ?? RUN_DEFAULTS.preparationSeconds);

    const intervalId = window.setInterval(() => {
      setPreparationRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          onPhaseChange(RUN_PHASES.ACTIVE);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, run?.wave, run?.mode, run?.syncWaveStartsAtMs, tftSetupConfirmed]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE) return;

    const spawnWaveNumber = waveScaling.waveNumber;
    if (queuedWaveRef.current === spawnWaveNumber) return;

    const waveComposition = threatWave.composition;
    if (!waveComposition.length) return;

    const laneAwareComposition = run?.mode === MODES.TRI_GATE
      ? flattenTriGateDistribution(distributeTriGateWave(waveComposition, spawnWaveNumber))
      : waveComposition;

    queuedWaveRef.current = spawnWaveNumber;
    setSpawnQueue(
      laneAwareComposition.map((enemy, index) => attachEliteModifierFoundation({
        ...enemy,
        id: `wave-${spawnWaveNumber}-enemy-${index + 1}`
      }, {
        seed: run?.seed ?? 'run',
        waveNumber: spawnWaveNumber,
        enemyIndex: index
      }))
    );
  }, [run?.phase, run?.wave, waveScaling.waveNumber]);

  useEffect(() => {
    bossSummonTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    bossSummonTimeoutsRef.current = [];

    if (run?.phase !== RUN_PHASES.ACTIVE || !bossSummonPlan.active) return undefined;

    bossSummonTimeoutsRef.current = bossSummonPlan.pulses.map((pulse) =>
      window.setTimeout(() => {
        const adds = run?.mode === MODES.TRI_GATE
          ? pulse.adds.map((enemy, index) => ({
              ...enemy,
              laneId: TRI_GATE_MAP.pathPlan.lanes[index % TRI_GATE_MAP.pathPlan.lanes.length].id
            }))
          : pulse.adds;
        setSpawnQueue((current) => [...current, ...adds]);
      }, pulse.offsetMs)
    );

    return () => {
      bossSummonTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      bossSummonTimeoutsRef.current = [];
    };
  }, [run?.phase, run?.wave, bossSummonPlan.active, bossSummonPlan.waveNumber]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || spawnQueue.length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSpawnQueue((current) => {
        if (current.length === 0) return current;
        const [nextEnemy, ...remaining] = current;
        const baseEnemyState = nextEnemy.rosterId
          ? createRosterEnemyState(nextEnemy.rosterId, {
              ...nextEnemy,
              progress: 0,
              spawnedAt: performance.now()
            })
          : nextEnemy.archetype === FLYING_ENEMY.archetype
            ? createFlyingEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() })
            : nextEnemy.archetype === SHIELDED_ENEMY.archetype
              ? createShieldedEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() })
              : nextEnemy.archetype === ARMORED_ENEMY.archetype
                ? createArmoredEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() })
                : nextEnemy.archetype === TANK_ENEMY.archetype
                  ? createTankEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() })
                  : nextEnemy.archetype === RUNNER_ENEMY.archetype
                    ? createRunnerEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() })
                    : createNormalEnemyState({ ...nextEnemy, progress: 0, spawnedAt: performance.now() });

        spawnedWaveRef.current = waveScaling.waveNumber;
        setActiveEnemies((active) => [...active, applyEliteModifiers(baseEnemyState)]);
        return remaining;
      });
    }, activeEnemies.length === 0 ? 150 : waveScaling.spawnIntervalMs * worldModifierEffects.spawnIntervalMultiplier);

    return () => window.clearTimeout(timeoutId);
  }, [run?.phase, spawnQueue.length, activeEnemies.length]);

  useEffect(() => {
    if (activeEnemies.length === 0 || run?.phase === RUN_PHASES.ENDED) return undefined;

    const durationMs = waveScaling.travelDurationMs * wallTravelMultiplier;

    const tick = (now) => {
      setActiveEnemies((current) => current
        .map((enemy) => {
          const effectiveSpeed =
            getEnemyEffectiveSpeed(enemy, now) *
            0.48 *
            blessingModifiers.enemyMoveSpeedMultiplier *
            worldModifierEffects.enemyMoveSpeedMultiplier;
          const naturalProgress = Math.min(
            1,
            ((now - enemy.spawnedAt) / durationMs) * effectiveSpeed
          );

          if (enemy.airborne || activeWallIds.length === 0) {
            return { ...enemy, progress: naturalProgress };
          }

          const blockingWall = Object.entries(WALL_PROGRESS_BY_ID)
            .filter(([wallId, progress]) => activeWallIds.includes(wallId) && naturalProgress >= progress)
            .sort((a, b) => a[1] - b[1])[0];

          if (!blockingWall) {
            return { ...enemy, progress: naturalProgress };
          }

          const [wallId, wallProgress] = blockingWall;
          const rebasedSpawnedAt = effectiveSpeed > 0
            ? now - ((wallProgress * durationMs) / effectiveSpeed)
            : enemy.spawnedAt;

          return {
            ...enemy,
            progress: wallProgress,
            spawnedAt: rebasedSpawnedAt,
            blockedByWallId: wallId
          };
        }));

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeEnemies.length, run?.phase, activeWallIds.join('|')]);

  useEffect(() => {
    if (run?.phase === RUN_PHASES.ENDED || activeEnemies.length === 0) return;
    const escapedEnemies = activeEnemies.filter((enemy) => Number(enemy?.progress ?? 0) >= 1);
    if (escapedEnemies.length === 0) return;

    setActiveEnemies((current) => current.filter((enemy) => Number(enemy?.progress ?? 0) < 1));
    onDamageBastion(escapedEnemies.length * waveScaling.bastionDamage);
  }, [activeEnemies, run?.phase, waveScaling.bastionDamage, onDamageBastion]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || placedDefenses.length === 0 || activeEnemies.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      const now = performance.now();

      setActiveEnemies((currentEnemies) => {
        let working = currentEnemies.map((enemy) => ({
          ...enemy,
          position: getPathPosition(getEnemyPath(enemy), enemy.progress)
        }));

        for (const placed of placedDefenses) {
          const baseDefinition = defenseDefinitions[placed.defenseId];
          if (!baseDefinition) continue;
          const definition = applyBlessingTowerIdentity(
            applyTowerSynergy(
              getRuntimeTowerDefinition(baseDefinition, placed),
              towerSynergyState
            ),
            run?.blessings ?? []
          );

          const attackInterval = getEffectiveTowerAttackInterval(definition, placed, placedDefenses, defenseDefinitions);
          const lastAttackAt = Number(towerAttackTimesRef.current[placed.id] ?? 0);
          if (now - lastAttackAt < attackInterval) continue;

          const candidates = getTowerTargets(definition, placed, working.filter((enemy) => enemy.hp > 0));
          const primary = candidates[0];
          if (!primary) continue;

          towerAttackTimesRef.current[placed.id] = now;

          const primaryIndex = working.findIndex((enemy) => enemy.id === primary.id);
          if (primaryIndex < 0) continue;

          const slot = SINGLE_GATE_MAP.buildSlots.slots.find((entry) => entry.id === placed.slotId);
          if (slot && primary.position) {
            const duration = Math.max(140, Math.min(360, Math.hypot(primary.position.x - slot.x, primary.position.y - slot.y) / Math.max(1, definition.projectileSpeed ?? 700) * 1000));
            projectileQueueRef.current.push({
              id: ++projectileIdRef.current,
              x: slot.x, y: slot.y - 24,
              dx: primary.position.x - slot.x,
              dy: primary.position.y - (slot.y - 24),
              faction: definition.faction ?? baseDefinition.faction ?? 'neutral',
              duration,
              expiresAt: now + duration + 80
            });
          }

          const hitEnemyAtIndex = (enemyIndex, damageScale = 1) => {
            const enemy = working[enemyIndex];
            if (!enemy || enemy.hp <= 0) return;

            let target = enemy;
            if (definition.armorShred) {
              target = applyStrongestArmorShred(
                target,
                definition.armorShred,
                now + Number(definition.armorShredDurationMs ?? 0)
              );
            }

            const damage = getTowerHitDamage(definition, placed, target, placedDefenses, defenseDefinitions) * damageScale;
            let damaged = applyEnemyDamage(target, damage, definition.damageType);

            let statusEffects = { ...(damaged.statusEffects ?? {}) };
            if (definition.slowPercent) {
              statusEffects = applyStrongestTimedEffect(statusEffects, {
                valueKey: 'slowPercent',
                untilKey: 'slowUntilMs',
                incomingValue: definition.slowPercent,
                incomingUntilMs: now + Number(definition.slowDurationMs ?? 0)
              });
            }
            if (definition.vulnerabilityPercent) {
              statusEffects = applyStrongestTimedEffect(statusEffects, {
                valueKey: 'vulnerabilityPercent',
                untilKey: 'vulnerabilityUntilMs',
                incomingValue: definition.vulnerabilityPercent,
                incomingUntilMs: now + Number(definition.vulnerabilityDurationMs ?? 0)
              });
            }
            if (definition.poisonDamagePerSecond) {
              statusEffects = applyStrongestTimedEffect(statusEffects, {
                valueKey: 'poisonDamagePerSecond',
                untilKey: 'poisonUntilMs',
                incomingValue: definition.poisonDamagePerSecond,
                incomingUntilMs: now + Number(definition.poisonDurationMs ?? 0)
              });
            }

            damaged = { ...damaged, statusEffects };
            working[enemyIndex] = damaged;
          };

          hitEnemyAtIndex(primaryIndex, 1);

          if (definition.splashRadius) {
            working.forEach((enemy, index) => {
              if (enemy.id === primary.id || enemy.hp <= 0) return;
              const dx = Number(enemy.position?.x ?? 0) - Number(primary.position?.x ?? 0);
              const dy = Number(enemy.position?.y ?? 0) - Number(primary.position?.y ?? 0);
              if (Math.hypot(dx, dy) <= definition.splashRadius) hitEnemyAtIndex(index, 0.72);
            });
          }

          if (definition.chainTargets && definition.chainTargets > 1) {
            const chained = working
              .filter((enemy) => enemy.id !== primary.id && enemy.hp > 0)
              .sort((a, b) => {
                const da = Math.hypot(Number(a.position?.x ?? 0) - Number(primary.position?.x ?? 0), Number(a.position?.y ?? 0) - Number(primary.position?.y ?? 0));
                const db = Math.hypot(Number(b.position?.x ?? 0) - Number(primary.position?.x ?? 0), Number(b.position?.y ?? 0) - Number(primary.position?.y ?? 0));
                return da - db;
              })
              .slice(0, definition.chainTargets - 1);

            chained.forEach((enemy, chainIndex) => {
              const index = working.findIndex((entry) => entry.id === enemy.id);
              if (index >= 0) hitEnemyAtIndex(index, Math.pow(definition.chainFalloff ?? 0.65, chainIndex + 1));
            });
          }
        }

        return removeAndCountDefeatedEnemies(working).map(({ position, ...enemy }) => enemy);
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, placedDefenses, activeEnemies.length]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE) {
      projectileQueueRef.current = [];
      setProjectiles([]);
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      const queued = projectileQueueRef.current.splice(0);
      const now = performance.now();
      setProjectiles((current) => {
        const alive = current.filter((shot) => shot.expiresAt > now);
        return queued.length || alive.length !== current.length ? [...alive, ...queued].slice(-100) : current;
      });
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [run?.phase]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || activeEnemies.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      setActiveEnemies((current) => removeAndCountDefeatedEnemies(current
        .map((enemy) => {
          const status = { ...(enemy.statusEffects ?? {}) };
          let next = enemy;

          if (Number(status.poisonUntilMs ?? 0) > now && Number(status.poisonDamagePerSecond ?? 0) > 0) {
            next = applyEnemyDamage(next, Number(status.poisonDamagePerSecond) * 0.25, 'physical');
          }

          if (Number(status.vulnerabilityUntilMs ?? 0) <= now) {
            status.vulnerabilityPercent = 0;
            status.vulnerabilityUntilMs = 0;
          }
          if (Number(status.armorShredUntilMs ?? 0) <= now && Number(status.armorShred ?? 0) > 0) {
            next = { ...next, armor: Number(next.armor ?? 0) + Number(status.armorShred) };
            status.armorShred = 0;
            status.armorShredUntilMs = 0;
          }
          if (Number(status.poisonUntilMs ?? 0) <= now) {
            status.poisonDamagePerSecond = 0;
            status.poisonUntilMs = 0;
          }

          return { ...next, statusEffects: status };
        })));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, activeEnemies.length]);

  useEffect(() => {
    const queueInitialized = queuedWaveRef.current === waveScaling.waveNumber;
    const waveActuallySpawned = spawnedWaveRef.current === waveScaling.waveNumber;

    if (
      run?.phase === RUN_PHASES.ACTIVE &&
      queueInitialized &&
      waveActuallySpawned &&
      spawnQueue.length === 0 &&
      activeEnemies.length === 0
    ) {
      onPhaseChange(RUN_PHASES.RESOLVING);
    }
  }, [run?.phase, run?.wave, waveScaling.waveNumber, spawnQueue.length, activeEnemies.length]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.RESOLVING) return undefined;
    if (blessingChoiceVisible && !selectedBlessingPreviewId) return undefined;

    const timeoutId = window.setTimeout(() => {
      const blessingId = selectedBlessingPreviewId;
      const completedRiskRewardTier = riskRewardTier;
      const objectiveCompleted = evaluateMiniObjective(miniObjective, {
        coreHp: run?.coreHp,
        waveStartCoreHp: run?.waveStartCoreHp,
        placedTowerCount: placedDefenses.length
      });
      const objectiveGold = objectiveCompleted ? miniObjectiveReward : 0;
      setMiniObjectiveFeedback(objectiveCompleted ? `OBJECTIVE COMPLETE · +${objectiveGold}G` : 'OBJECTIVE MISSED');
      window.setTimeout(() => setMiniObjectiveFeedback(''), 1800);
      setSelectedBlessingPreviewId(null);
      setBlessingRerollCount(0);
      setRiskRewardTier('safe');
      onPhaseChange(RUN_PHASES.PREPARATION, {
        advanceWave: true,
        blessingId,
        riskRewardTier: completedRiskRewardTier,
        miniObjectiveGold: objectiveGold
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [run?.phase, run?.wave, blessingChoiceVisible, selectedBlessingPreviewId, riskRewardTier]);

  const positionedEnemies = activeEnemies.map((enemy) => ({
    ...enemy,
    position: getPathPosition(getEnemyPath(enemy), enemy.progress)
  }));

  const handleWallPurchase = (wallId) => {
    if (!run || run.phase !== RUN_PHASES.PREPARATION) {
      if (run?.mode === MODES.TFT_SHOP) setTftFeedback('WALLS CAN ONLY BE BOUGHT DURING PREPARATION');
      return;
    }
    if (!SINGLE_GATE_MAP.compatibleModes.includes(run.mode)) return;

    const currentGold = Number(run.gold ?? availableGoldRef.current ?? 0);
    const attempt = purchaseWall({
      wallId,
      gold: currentGold,
      activeWallIds
    });

    if (!attempt.ok) {
      if (run?.mode === MODES.TFT_SHOP) {
        setTftFeedback(
          attempt.reason === 'insufficient-gold'
            ? `NEED ${WALL_SYSTEM.cost}G FOR WALL`
            : attempt.reason === 'already-built'
              ? 'WALL ALREADY BUILT'
              : 'WALL CANNOT BE BUILT'
        );
      }
      return;
    }

    availableGoldRef.current = attempt.goldAfter;
    setActiveWallIds([...attempt.activeWallIds]);
    setWallHpById((current) => ({ ...current, [wallId]: WALL_SYSTEM.maxHp }));
    onSpendGold(WALL_SYSTEM.cost);
    if (run?.mode === MODES.TFT_SHOP) setTftFeedback(`WALL BUILT · -${WALL_SYSTEM.cost}G`);
  };

  const handleDefenseSelection = (defenseId) => {
    setSelectedDefenseId(defenseId);
    setSelectedPlacedDefenseId(null);
    setMovingPlacedDefenseId(null);
  };

  const handleUpgradeSelectedTower = () => {
    if (!selectedPlacedDefense || selectedPlacedDefense.level >= UPGRADE_CURVE.maxLevel) return;
    const baseDefinition = defenseDefinitions[selectedPlacedDefense.defenseId];
    if (!baseDefinition) return;
    const targetLevel = selectedPlacedDefense.level + 1;
    const cost = getUpgradeCost(baseDefinition, targetLevel);
    if (availableGoldRef.current < cost) return;

    availableGoldRef.current -= cost;
    setPlacedDefenses((current) => current.map((tower) =>
      tower.id === selectedPlacedDefense.id
        ? { ...tower, level: targetLevel, investedGold: Number(tower.investedGold ?? 0) + cost }
        : tower
    ));
    onSpendGold(cost);
  };

  const handleEvolutionChoice = (evolutionId) => {
    if (!selectedPlacedDefense || !canChooseEvolution(selectedPlacedDefense)) return;
    if (run?.mode === MODES.TFT_SHOP && Number(selectedPlacedDefense.copyProgress ?? 1) < TFT_COPY_PROGRESSION.maxCopies) return;
    setPlacedDefenses((current) => current.map((tower) =>
      tower.id === selectedPlacedDefense.id ? chooseTowerEvolution(tower, evolutionId) : tower
    ));
    emitGameFeedback(GAME_FEEDBACK_EVENTS.TOWER_EVOLVED, {
      towerId: selectedPlacedDefense.defenseId,
      evolutionId
    });
  };

  const handleMergeTftCopy = (benchIndex, targetTowerId = selectedPlacedDefense?.id, skipConfirm = false) => {
    if (run?.mode !== MODES.TFT_SHOP || !targetTowerId) return;
    const targetTower = placedDefenses.find((tower) => tower.id === targetTowerId);
    const copy = tftBench[benchIndex];
    if (!targetTower || !copy) return;

    const validation = canMergeTftCopy(targetTower, copy);
    if (!validation.ok) {
      setTftFeedback(validation.error === 'wrong_tower_type' ? 'WRONG TOWER TYPE' : 'COPY PROGRESS MAXED');
      return;
    }

    const nextProgress = Number(targetTower.copyProgress ?? 1) + 1;
    if (!skipConfirm) {
      const confirmed = window.confirm(
        `Merge this ${copy.name ?? copy.towerId} copy into the selected tower? Progress ${targetTower.copyProgress ?? 1}/${TFT_COPY_PROGRESSION.maxCopies} → ${nextProgress}/${TFT_COPY_PROGRESSION.maxCopies}. Cost: 0 Gold.`
      );
      if (!confirmed) return;
    }

    setPlacedDefenses((current) => current.map((tower) => {
      if (tower.id !== targetTower.id) return tower;
      const merged = mergeTftCopyProgress(tower, copy).tower;
      return {
        ...merged,
        investedGold: Number(tower.investedGold ?? 0) + Number(copy.cost ?? TFT_SHOP.copyCost)
      };
    }));
    setSelectedPlacedDefenseId(targetTower.id);
    setTftBench((current) => removeCopyFromBench(current, benchIndex).bench);
    setSelectedTftBenchIndex(null);
    setTftFeedback(nextProgress === TFT_COPY_PROGRESSION.maxCopies ? '7/7 — CHOOSE EVOLUTION A OR B' : `MERGED — ${nextProgress}/7`);
  };

  const handleSellSelectedTower = () => {
    if (!selectedPlacedDefense || !run || run.phase === RUN_PHASES.ENDED) return;
    const refund = selectedSellPreview.refund;
    setPlacedDefenses((current) => current.filter((tower) => tower.id !== selectedPlacedDefense.id));
    setSelectedPlacedDefenseId(null);
    setMovingPlacedDefenseId(null);
    towerAttackTimesRef.current[selectedPlacedDefense.id] = 0;
    if (refund > 0) onGainGold(refund);
    if (run.mode === MODES.TFT_SHOP) setTftFeedback(`TOWER SOLD · +${refund}G`);
  };

  const handleToggleMoveSelectedTower = () => {
    if (!selectedPlacedDefense || !run || run.phase === RUN_PHASES.ENDED) return;
    setMovingPlacedDefenseId((current) => current === selectedPlacedDefense.id ? null : selectedPlacedDefense.id);
  };

  const handleBuildSlot = (slotId) => {
    const occupied = placedDefenses.find((entry) => entry.slotId === slotId);

    if (movingPlacedDefenseId) {
      if (!run || run.phase === RUN_PHASES.ENDED) {
        setMovingPlacedDefenseId(null);
        return;
      }
      if (occupied) {
        setSelectedPlacedDefenseId(occupied.id);
        setMovingPlacedDefenseId(occupied.id);
        return;
      }
      setPlacedDefenses((current) => current.map((tower) =>
        tower.id === movingPlacedDefenseId ? { ...tower, slotId } : tower
      ));
      setSelectedPlacedDefenseId(movingPlacedDefenseId);
      setMovingPlacedDefenseId(null);
      if (run.mode === MODES.TFT_SHOP) setTftFeedback('TOWER MOVED · 0G');
      return;
    }

    if (occupied) {
      if (run?.mode === MODES.TFT_SHOP && selectedTftBenchIndex != null) {
        const copy = tftBench[selectedTftBenchIndex];
        const validation = canMergeTftCopy(occupied, copy);
        if (validation.ok) {
          handleMergeTftCopy(selectedTftBenchIndex, occupied.id, true);
          return;
        }
        if (copy) {
          setTftFeedback(validation.error === 'wrong_tower_type' ? 'WRONG TOWER TYPE' : 'COPY PROGRESS MAXED');
        }
      }
      setSelectedPlacedDefenseId(occupied.id);
      setMovingPlacedDefenseId(occupied.id);
      return;
    }

    if (!run || run.phase === RUN_PHASES.ENDED) return;

    if (run.mode === MODES.TFT_SHOP) {
      if (selectedTftBenchIndex == null) return;
      const copy = tftBench[selectedTftBenchIndex];
      if (!copy) return;
      const defense = defenseDefinitions[copy.towerId];
      if (!defense) return;

      const attempt = tryPurchaseDefenseOnSlot({
        slotId,
        defense: { ...defense, cost: 0 },
        gold: availableGoldRef.current,
        placedStructures: placedDefenses
      });
      if (!attempt.ok) return;

      const placedTower = {
        ...attempt.structure,
        defenseId: copy.towerId,
        level: 1,
        copyProgress: 1,
        investedGold: Number(copy.cost ?? TFT_SHOP.copyCost),
        sourceCopyId: copy.copyId
      };
      setPlacedDefenses((current) => [...current, placedTower]);
      setSelectedPlacedDefenseId(placedTower.id);
      setTftBench((current) => removeCopyFromBench(current, selectedTftBenchIndex).bench);
      setSelectedTftBenchIndex(null);
      setTftFeedback('');
      emitGameFeedback(GAME_FEEDBACK_EVENTS.TOWER_BUILT, {
        towerId: copy.towerId,
        slotId,
        mode: run.mode
      });
      return;
    }

    const attempt = tryPurchaseDefenseOnSlot({
      slotId,
      defense: selectedDefense,
      gold: availableGoldRef.current,
      placedStructures: placedDefenses
    });

    if (!attempt.ok) return;

    availableGoldRef.current = attempt.goldAfter;
    setPlacedDefenses((current) => [...current, attempt.structure]);
    setSelectedPlacedDefenseId(attempt.structure.id);
    onSpendGold(selectedDefense.cost);
    emitGameFeedback(GAME_FEEDBACK_EVENTS.TOWER_BUILT, {
      towerId: selectedDefense.id,
      slotId,
      mode: run.mode
    });
  };


  return (
    <main className="run-screen" id="main-content">
      <section className="run-layout">
        <div className="battlefield">
          <header className="run-hud" aria-label="Run status">
            <div>
              <span className="run-hud__label">MODE</span>
              <strong>{
                run?.mode === MODES.SINGLE_GATE
                  ? 'SINGLE GATE'
                  : run?.mode === MODES.TFT_SHOP
                    ? 'TFT SHOP'
                    : run?.mode === MODES.LAST_BASTION
                      ? 'LAST BASTION'
                      : run?.mode === MODES.TRI_GATE
                        ? 'TRI-GATE'
                        : 'UNKNOWN'
              }</strong>
            </div>
            <div>
              <span className="run-hud__label">WAVE</span>
              <strong>{run?.wave ?? 0}</strong>
            </div>
            <div>
              <span className="run-hud__label">GOLD</span>
              <strong>{run?.gold ?? RUN_DEFAULTS.startingGold}</strong>
            </div>
            <div>
              <span className="run-hud__label">CORE</span>
              <strong>{run?.coreHp ?? RUN_DEFAULTS.coreHp} / {run?.coreMaxHp ?? RUN_DEFAULTS.coreHp}</strong>
            </div>
            <div>
              <span className="run-hud__label">SURVIVAL</span>
              <strong>{formatSurvivalTime(run?.elapsedMs ?? 0)}</strong>
            </div>
            <div>
              <span className="run-hud__label">SCORE</span>
              <strong>{runScore.totalScore.toLocaleString()}</strong>
            </div>
            <button className="run-exit" onClick={onExit} aria-label="Exit current run">EXIT RUN</button>
          </header>

          {run?.mode === MODES.LAST_BASTION && (
            <section
              className="last-bastion-status"
              aria-label="Last Bastion participant status"
              aria-live="polite"
              aria-atomic="false"
            >
              <div className="last-bastion-status__header">
                <span>{isLastBastionFinished ? 'MATCH COMPLETE' : isLastBastionSpectating ? 'SPECTATING' : 'LIVE MATCH'}</span>
                <strong>
                  {lastBastionFairness?.desynced ? `DESYNC +${lastBastionFairness.waveSpread}` : 'SYNC'} · {lastBastionAliveCount}/{lastBastionParticipants.length || 0} ALIVE
                </strong>
              </div>
              <div className="last-bastion-status__players">
                {lastBastionParticipants.map((participant) => (
                  <div
                    key={participant.slot}
                    className={[
                      'last-bastion-status__player',
                      participant.self ? 'last-bastion-status__player--self' : '',
                      !participant.alive ? 'last-bastion-status__player--dead' : '',
                      !participant.connected ? 'last-bastion-status__player--offline' : ''
                    ].filter(Boolean).join(' ')}
                  >
                    <span>P{participant.slot}{participant.self ? ' · YOU' : ''}</span>
                    <strong>{participant.alive ? `W${participant.wave}` : 'ELIMINATED'}</strong>
                    <small>{participant.connected ? `${participant.coreHp} HP` : 'DISCONNECTED'}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(isLastBastionSpectating || isLastBastionFinished) && (
            <div className="last-bastion-spectate-banner" role="status" aria-live="assertive">
              <span>{isLastBastionFinished ? 'LAST BASTION COMPLETE' : 'BASTION FALLEN — SPECTATOR MODE'}</span>
              <strong>
                {isLastBastionFinished
                  ? run?.lastBastionWinnerSlot
                    ? `PLAYER ${run.lastBastionWinnerSlot} WINS`
                    : 'MATCH DRAW'
                  : 'WATCH THE REMAINING DEFENDERS'}
              </strong>
              <small>
                {isLastBastionFinished
                  ? 'Final results processing follows.'
                  : 'You are eliminated. Match status remains live until one defender remains.'}
              </small>
            </div>
          )}

          {selectedPlacedDefense && (
            <div className="battlefield-tower-actions">
              <strong>{inspectedDefense.name}</strong>
              <button
                type="button"
                className={movingPlacedDefenseId === selectedPlacedDefense.id ? 'is-active' : ''}
                onClick={handleToggleMoveSelectedTower}
              >
                {movingPlacedDefenseId === selectedPlacedDefense.id ? 'CANCEL MOVE' : 'MOVE · 0G'}
              </button>
              <button type="button" onClick={handleSellSelectedTower}>
                SELL · +{selectedSellPreview.refund}G
              </button>
              {movingPlacedDefenseId === selectedPlacedDefense.id && <span>CLICK AN EMPTY PAD</span>}
            </div>
          )}

          <svg
            className="battlefield-map"
            viewBox={`0 0 ${SINGLE_GATE_MAP.size.width} ${SINGLE_GATE_MAP.size.height}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby="battlefield-title battlefield-desc"
          >
            <title id="battlefield-title">Bastionfall battlefield</title>
            <desc id="battlefield-desc">Tower defense battlefield with build slots, enemy path, Bastion and live combat state.</desc>
            <defs>
              <linearGradient id="bf-river" x2="0" y2="1"><stop stopColor="#d2faff"/><stop offset=".5" stopColor="#42b9da"/><stop offset="1" stopColor="#177dbe"/></linearGradient>
              <linearGradient id="bf-cliff" x2="0" y2="1"><stop stopColor="#e7d7af"/><stop offset=".22" stopColor="#a2a793"/><stop offset="1" stopColor="#4c7377"/></linearGradient>
              <linearGradient id="bf-path" x2="0" y2="1"><stop stopColor="#e5d5aa"/><stop offset="1" stopColor="#b6a37d"/></linearGradient>
              <radialGradient id="bf-meadow"><stop stopColor="#a9ce66"/><stop offset=".7" stopColor="#70a451"/><stop offset="1" stopColor="#416d49"/></radialGradient>
              <pattern id="bf-grass-texture" width="112" height="94" patternUnits="userSpaceOnUse"><path d="M12 25l4-5m2 5 3-6M77 67l3-5m3 5 4-7M51 12l3-4M100 36l4-6" stroke="#d9e5a1" strokeWidth="2" opacity=".43"/><circle cx="38" cy="61" r="2" fill="#f2eac8"/><circle cx="94" cy="14" r="2" fill="#e8d9a0"/></pattern>
            </defs>
            <image className="battlefield-map__art" href="/assets/maps/bastionfall-field-v2.webp" x="0" y="0" width="1600" height="900" preserveAspectRatio="none" aria-hidden="true" />
            <g className="battlefield-map__road" aria-hidden="true">
              {renderedPaths.map((path, pathIndex) => (
                <g key={pathIndex}>
                  <polyline className="battlefield-map__road-edge" points={path.map((point) => `${point.x},${point.y}`).join(' ')} />
                  <polyline className="battlefield-map__road-sand" points={path.map((point) => `${point.x},${point.y}`).join(' ')} />
                  <polyline className="battlefield-map__road-wear" points={path.map((point) => `${point.x},${point.y}`).join(' ')} />
                </g>
              ))}
            </g>
            <g className="battlefield-map__build-slots">
              {SINGLE_GATE_MAP.buildSlots.slots.map((slot) => {
                const placed = placedDefenses.find((entry) => entry.slotId === slot.id) ?? null;
                const benchCopy = selectedTftBenchIndex == null ? null : tftBench[selectedTftBenchIndex];
                const movingTower = movingPlacedDefenseId
                  ? placedDefenses.find((entry) => entry.id === movingPlacedDefenseId) ?? null
                  : null;
                const previewDefense = movingTower
                  ? defenseDefinitions[movingTower.defenseId] ?? selectedDefense
                  : run?.mode === MODES.TFT_SHOP && benchCopy
                    ? defenseDefinitions[benchCopy.towerId] ?? selectedDefense
                    : selectedDefense;
                const affordable = movingTower
                  ? true
                  : run?.mode === MODES.TFT_SHOP
                    ? Boolean(benchCopy)
                    : (run?.gold ?? 0) >= selectedDefense.cost;
                const hovered = hoveredSlotId === slot.id;
                const selectedPlaced = placed?.id === selectedPlacedDefenseId;
                const slotClass = [
                  'battlefield-map__tower-slot',
                  placed ? 'battlefield-map__tower-slot--occupied' : 'battlefield-map__tower-slot--available',
                  !placed && !affordable ? 'battlefield-map__tower-slot--unaffordable' : '',
                  hovered ? 'battlefield-map__tower-slot--hovered' : '',
                  selectedPlaced ? 'battlefield-map__tower-slot--selected' : '',
                  movingTower && !placed ? 'battlefield-map__tower-slot--move-target' : '',
                  run?.mode === MODES.TFT_SHOP && placed && benchCopy && canMergeTftCopy(placed, benchCopy).ok
                    ? 'battlefield-map__tower-slot--merge-target'
                    : ''
                ].filter(Boolean).join(' ');

                return (
                  <g
                    key={slot.id}
                    className={slotClass}
                    transform={`translate(${slot.x} ${slot.y})`}
                    role="button"
                    tabIndex="0"
                    aria-label={placed
                      ? `Select ${defenseDefinitions[placed.defenseId]?.name || 'tower'} on ${slot.id}`
                      : `Build ${previewDefense.name} on ${slot.id}`}
                    aria-disabled={!placed && !affordable ? 'true' : 'false'}
                    data-slot-id={slot.id}
                    data-occupied={Boolean(placed)}
                    data-defense-id={placed?.defenseId ?? ''}
                    onMouseEnter={() => setHoveredSlotId(slot.id)}
                    onMouseLeave={() => setHoveredSlotId((current) => current === slot.id ? null : current)}
                    onDragOver={(event) => {
                      if (run?.mode === MODES.TFT_SHOP && placed) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDrop={(event) => {
                      if (run?.mode !== MODES.TFT_SHOP || !placed) return;
                      event.preventDefault();
                      const benchIndex = Number(event.dataTransfer.getData('text/plain'));
                      if (!Number.isInteger(benchIndex)) return;
                      handleMergeTftCopy(benchIndex, placed.id, true);
                    }}
                    onClick={() => handleBuildSlot(slot.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleBuildSlot(slot.id);
                      }
                    }}
                  >
                    <rect className="tower-slot__shadow" x="-39" y="-25" width="78" height="58" rx="14" />
                    <rect className="tower-slot__stone" x="-36" y="-30" width="72" height="56" rx="12" />
                    <path className="tower-slot__grass" d="M-29 14Q-12 6 0 12T29 9V22H-29Z" />
                    <path className="tower-slot__accent" d="M-25-19H25M-25 18H25" />

                    {!placed && affordable && (
                      <g className={`tower-visual tower-visual--ghost tower-visual--${previewDefense.id}`}>
                        <ellipse className="tower-visual__shadow" cx="0" cy="20" rx="30" ry="10" />
                        <foreignObject x="-42" y="-54" width="84" height="84" pointerEvents="none">
                          <div
                            className="tower-art-sprite"
                            style={getTowerArtStyleForTower(previewDefense.id)}
                            aria-hidden="true"
                          />
                        </foreignObject>
                      </g>
                    )}

                    {placed && (
                      <g className={`tower-visual tower-visual--${placed.defenseId}`} data-evolution={placed.evolution ?? ''}>
                        <ellipse className="tower-visual__shadow" cx="0" cy="20" rx="30" ry="10" />
                        <foreignObject x="-42" y="-54" width="84" height="84" pointerEvents="none">
                          <div
                            className="tower-art-sprite"
                            style={getTowerArtStyleForTower(placed.defenseId, placed.evolution)}
                            aria-hidden="true"
                          />
                        </foreignObject>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            <g className="battlefield-map__wall-slots" aria-label="Purchasable wall sockets" style={{ display: run?.mode === MODES.TRI_GATE ? 'none' : undefined }}>
              {SINGLE_GATE_MAP.wallSlots.sockets.map((wall) => {
                const built = activeWallIds.includes(wall.id);
                const wallHp = built ? Math.max(0, Number(wallHpById[wall.id] ?? WALL_SYSTEM.maxHp)) : 0;
                const wallHpRatio = built ? Math.max(0, Math.min(1, wallHp / WALL_SYSTEM.maxHp)) : 0;
                const affordable = (run?.gold ?? 0) >= WALL_SYSTEM.cost;
                const canBuildNow = run?.phase === RUN_PHASES.PREPARATION && !built && affordable;
                return (
                  <g
                    key={wall.id}
                    className={`battlefield-map__wall-slot ${built ? 'battlefield-map__wall-slot--built' : 'battlefield-map__wall-slot--empty'} ${canBuildNow ? 'battlefield-map__wall-slot--ready' : ''}`}
                    transform={`translate(${wall.x} ${wall.y})`}
                    role="button"
                    tabIndex={built ? -1 : 0}
                    aria-label={built ? 'Wall built' : `Build wall for ${WALL_SYSTEM.cost} gold`}
                    data-wall-id={wall.id}
                    data-built={built}
                    onClick={() => handleWallPurchase(wall.id)}
                    onKeyDown={(event) => {
                      if (!built && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        handleWallPurchase(wall.id);
                      }
                    }}
                  >
                    <rect
                      className="wall-slot__hitbox"
                      x="-48"
                      y="-44"
                      width="96"
                      height="82"
                      rx="12"
                      fill="transparent"
                      pointerEvents="none"
                    />
                    <rect className="wall-slot__base" x="-34" y="-18" width="68" height="36" rx="8" />
                    {built ? (
                      <>
                        <rect className="wall-slot__wall" x="-28" y="-30" width="56" height="42" rx="5" />
                        <path className="wall-slot__battlement" d="M-28-30h12v10h10v-10H6v10h10v-10h12" />
                        <rect className="wall-slot__hp-bg" x="-32" y="18" width="64" height="7" rx="3.5" />
                        <rect className="wall-slot__hp-fill" x="-32" y="18" width={64 * wallHpRatio} height="7" rx="3.5" />
                        <text className="wall-slot__hp-text" x="0" y="38" textAnchor="middle">{Math.ceil(wallHp)} / {WALL_SYSTEM.maxHp}</text>
                      </>
                    ) : (
                      <>
                        <path className="wall-slot__socket" d="M-24 0H24M-18-8V8M18-8V8" />
                        <text className="wall-slot__cost" x="0" y="-25" textAnchor="middle">{WALL_SYSTEM.cost}G WALL</text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
            {spawnAnchors.map((spawn) => (
              <circle
                key={spawn.id}
                className="battlefield-map__spawn"
                cx={spawn.x}
                cy={spawn.y}
                r="42"
              />
            ))}
            {positionedEnemies.map((enemy) => {
              const hpRatio = enemy.maxHp > 0 ? Math.max(0, Math.min(1, enemy.hp / enemy.maxHp)) : 0;
              const shieldRatio = enemy.maxShield > 0 ? Math.max(0, Math.min(1, enemy.shield / enemy.maxShield)) : 0;
              const slowActive = (enemy.statusEffects?.slowUntilMs ?? 0) > performance.now();
              const enemyArtHref = ENEMY_ROSTER.byId[enemy.archetype]
                ? `/assets/enemies/${enemy.archetype}.png`
                : null;

              return (
                <g
                  key={enemy.id}
                  className={`battlefield-map__enemy battlefield-map__enemy--${enemy.archetype}`}
                  transform={`translate(${enemy.position.x} ${enemy.position.y})`}
                  aria-label={`${enemy.archetype} enemy`}
                  data-airborne={enemy.airborne}
                  data-armored={enemy.armor > 0}
                  data-shielded={enemy.maxShield > 0}
                  data-slowed={slowActive}
                >
                  {enemyArtHref ? (
                    <>
                      <g className="battlefield-map__enemy-fallback" opacity="0">
                        <circle r="24" />
                        <path d="M -10 -5 L 0 -18 L 10 -5 L 8 14 L -8 14 Z" />
                      </g>
                      <image
                        className="battlefield-map__enemy-art"
                        href={enemyArtHref}
                        x="-36"
                        y="-36"
                        width="72"
                        height="72"
                        preserveAspectRatio="xMidYMid meet"
                        onError={(event) => {
                          event.currentTarget.setAttribute('visibility', 'hidden');
                          event.currentTarget.previousElementSibling?.setAttribute('opacity', '1');
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <circle r="24" />
                      <path d="M -10 -5 L 0 -18 L 10 -5 L 8 14 L -8 14 Z" />
                    </>
                  )}

                  <g className="enemy-status">
                    <rect className="enemy-status__hp-bg" x="-28" y="-42" width="56" height="6" rx="3" />
                    <rect className="enemy-status__hp-fill" x="-28" y="-42" width={56 * hpRatio} height="6" rx="3" />
                    {enemy.maxShield > 0 && (
                      <>
                        <rect className="enemy-status__shield-bg" x="-28" y="-50" width="56" height="5" rx="2.5" />
                        <rect className="enemy-status__shield-fill" x="-28" y="-50" width={56 * shieldRatio} height="5" rx="2.5" />
                      </>
                    )}
                    <text className="enemy-status__name" x="0" y="-56" textAnchor="middle">
                      {enemy.archetype.toUpperCase()}
                    </text>
                    {enemy.armor > 0 && <text className="enemy-status__badge enemy-status__badge--armor" x="-24" y="39">ARM</text>}
                    {enemy.airborne && <text className="enemy-status__badge enemy-status__badge--air" x="0" y="39" textAnchor="middle">AIR</text>}
                    {slowActive && <text className="enemy-status__badge enemy-status__badge--slow" x="24" y="39" textAnchor="end">SLOW</text>}
                  </g>
                </g>
              );
            })}
            <g className="battlefield-map__projectiles" aria-hidden="true">
              {projectiles.map((shot) => (
                <circle
                  key={shot.id}
                  className={`battlefield-map__projectile battlefield-map__projectile--${shot.faction}`}
                  cx={shot.x}
                  cy={shot.y}
                  r="6"
                  style={{ '--shot-x': `${shot.dx}px`, '--shot-y': `${shot.dy}px`, animationDuration: `${shot.duration}ms` }}
                />
              ))}
            </g>
            <g
              className={`battlefield-map__bastion ${bastionStateClass}`}
              transform={`translate(${bastionAnchor.x} ${bastionAnchor.y})`}
              aria-label="Bastion structure"
              data-hit-id={run?.bastionHitId ?? 0}
            >
              <ellipse className="battlefield-map__bastion-shadow" cx="0" cy="42" rx="88" ry="26" />
              <rect className="battlefield-map__bastion-base" x="-74" y="-30" width="148" height="78" rx="14" />
              <rect className="battlefield-map__bastion-keep" x="-42" y="-78" width="84" height="84" rx="10" />
              <rect className="battlefield-map__bastion-tower" x="-78" y="-70" width="34" height="70" rx="7" />
              <rect className="battlefield-map__bastion-tower" x="44" y="-70" width="34" height="70" rx="7" />
              <path className="battlefield-map__bastion-roof" d="M -48 -80 L 0 -116 L 48 -80 Z" />
              <circle className="battlefield-map__bastion-core" cx="0" cy="-20" r="18" />
              <rect className="battlefield-map__bastion-hp-bg" x="-84" y="-142" width="168" height="14" rx="7" />
              <rect
                className="battlefield-map__bastion-hp-fill"
                x="-84"
                y="-142"
                width={168 * coreRatio}
                height="14"
                rx="7"
              />
              <text className="battlefield-map__bastion-hp-text" x="0" y="-152" textAnchor="middle">
                {run?.coreHp ?? 0} / {run?.coreMaxHp ?? 0}
              </text>
              <path className="battlefield-map__bastion-gate" d="M -18 48 V 18 Q 0 2 18 18 V 48 Z" />
            </g>
            {spawnAnchors.map((spawn) => (
              <text
                key={`${spawn.id}-label`}
                className="battlefield-map__label"
                x={spawn.x}
                y={spawn.y + 8}
                textAnchor="middle"
              >
                {run?.mode === MODES.TRI_GATE ? 'GATE' : 'SPAWN'}
              </text>
            ))}
            <text
              className="battlefield-map__label battlefield-map__label--bastion"
              x={bastionAnchor.x}
              y={bastionAnchor.y + 102}
              textAnchor="middle"
            >
              BASTION
            </text>
          </svg>

          <aside
            className={`run-sidebar ${run?.mode === MODES.TFT_SHOP ? 'run-sidebar--tft' : ''}`}
            aria-label="Tower management"
            data-balance-version={COMBAT_BALANCE_MODEL.version}
            data-performance-telemetry-pass={PERFORMANCE_TELEMETRY_PASS}
            data-performance-telemetry-checks={Object.keys(PERFORMANCE_TELEMETRY_QA).length}
            data-end-to-end-regression-pass={END_TO_END_REGRESSION_PASS}
            data-end-to-end-regression-checks={Object.keys(END_TO_END_REGRESSION_QA).length}
            data-end-to-end-regression-pairs={END_TO_END_REGRESSION_QA.full576PairMatrix ? 576 : 0}
            data-archer-power={COMBAT_BALANCE_BY_ID.archer?.powerIndex}
            data-cannon-power={COMBAT_BALANCE_BY_ID.cannon?.powerIndex}
            data-frost-power={COMBAT_BALANCE_BY_ID.frost?.powerIndex}
            data-mage-power={COMBAT_BALANCE_BY_ID.mage?.powerIndex}
            data-ballista-power={COMBAT_BALANCE_BY_ID.ballista?.powerIndex}
            data-barracks-power={COMBAT_BALANCE_BY_ID.barracks?.powerIndex}
            data-placement-validations={PLACEMENT_VALIDATION_SNAPSHOT.length}
            data-placement-validation-pass={PLACEMENT_VALIDATION_SNAPSHOT.every((entry) => entry.expected === entry.actual)}
            data-targeting-validations={TARGETING_VALIDATION_SNAPSHOT.length}
            data-targeting-validation-pass={TARGETING_VALIDATION_SNAPSHOT.every((entry) => entry.expected === entry.actual)}
            data-attack-feedback-version={ATTACK_FEEDBACK.version}
            data-attack-feedback-pass={ATTACK_FEEDBACK_FIXTURE.travelMsExpected === ATTACK_FEEDBACK_FIXTURE.travelMsActual && ATTACK_FEEDBACK_FIXTURE.dpsExpected === ATTACK_FEEDBACK_FIXTURE.dpsActual}
            data-counterplay-version={COUNTERPLAY_MATRIX.version}
            data-faction-counter-version={FACTION_COUNTER_ENGINE.version}
            data-faction-counter-pass={FACTION_COUNTER_FIXTURE.humanVsInsectExpected === FACTION_COUNTER_FIXTURE.humanVsInsectActual && FACTION_COUNTER_FIXTURE.insectVsAlienExpected === FACTION_COUNTER_FIXTURE.insectVsAlienActual && FACTION_COUNTER_FIXTURE.alienVsHumanExpected === FACTION_COUNTER_FIXTURE.alienVsHumanActual && FACTION_COUNTER_FIXTURE.sameFactionExpected === FACTION_COUNTER_FIXTURE.sameFactionActual && FACTION_COUNTER_FIXTURE.neutralExpected === FACTION_COUNTER_FIXTURE.neutralActual && FACTION_COUNTER_FIXTURE.correctTypeExpected === FACTION_COUNTER_FIXTURE.correctTypeActual && FACTION_COUNTER_FIXTURE.wrongTypeExpected === FACTION_COUNTER_FIXTURE.wrongTypeActual && FACTION_COUNTER_FIXTURE.perfectExpected === FACTION_COUNTER_FIXTURE.perfectActual && FACTION_COUNTER_FIXTURE.fullyBadExpected === FACTION_COUNTER_FIXTURE.fullyBadActual}
            data-counterplay-pass={COUNTERPLAY_FIXTURE.physicalVsArmor.hpDamage === 60 && COUNTERPLAY_FIXTURE.piercingVsArmor.hpDamage === 86 && COUNTERPLAY_FIXTURE.arcaneVsShield.shieldDamage === 100 && COUNTERPLAY_FIXTURE.archerVsFlying === true && COUNTERPLAY_FIXTURE.cannonVsFlying === false && COUNTERPLAY_FIXTURE.barracksVsFlying === false}
            data-enemy-tag-migration-pass={ENEMY_TAG_FIXTURE.allTemplatesTagged === true && ENEMY_TAG_FIXTURE.runtimeTagsPersist === true && ENEMY_TAG_FIXTURE.bossTagsPresent === true}
            data-threat-model-version={WAVE_THREAT_MODEL.version}
            data-threat-model-pass={THREAT_MODEL_FIXTURE.wave1BudgetExpected === THREAT_MODEL_FIXTURE.wave1BudgetActual && THREAT_MODEL_FIXTURE.wave1OnlyNormal === true && THREAT_MODEL_FIXTURE.wave5HasTank === true && THREAT_MODEL_FIXTURE.wave11HasFlying === true && THREAT_MODEL_FIXTURE.wave11WithinBudget === true}
            data-difficulty-bands={DIFFICULTY_BANDS.length}
            data-difficulty-band={waveScaling.bandId}
            data-difficulty-pass={DIFFICULTY_BAND_FIXTURE.wave1BandExpected === DIFFICULTY_BAND_FIXTURE.wave1BandActual && DIFFICULTY_BAND_FIXTURE.wave6BandExpected === DIFFICULTY_BAND_FIXTURE.wave6BandActual && DIFFICULTY_BAND_FIXTURE.wave13BandExpected === DIFFICULTY_BAND_FIXTURE.wave13BandActual && DIFFICULTY_BAND_FIXTURE.wave21BandExpected === DIFFICULTY_BAND_FIXTURE.wave21BandActual && DIFFICULTY_BAND_FIXTURE.monotonicTravel === true && DIFFICULTY_BAND_FIXTURE.monotonicSpawn === true}
            data-run-timer-version={RUN_TIMER.version}
            data-run-timer-pass={RUN_TIMER_FIXTURE.tenSecondsExpected === RUN_TIMER_FIXTURE.tenSecondsActual && RUN_TIMER_FIXTURE.minuteFormatExpected === RUN_TIMER_FIXTURE.minuteFormatActual && RUN_TIMER_FIXTURE.hourFormatExpected === RUN_TIMER_FIXTURE.hourFormatActual && RUN_TIMER_FIXTURE.frozenExpected === RUN_TIMER_FIXTURE.frozenActual}
            data-run-elapsed-ms={run?.elapsedMs ?? 0}
            data-run-score-version={RUN_SCORE.version}
            data-run-score={runScore.totalScore}
            data-run-score-wave={runScore.waveScore}
            data-run-score-survival={runScore.survivalScore}
            data-run-score-kills={runScore.killScore}
            data-run-score-core={runScore.coreScore}
            data-run-score-pass={RUN_SCORE_FIXTURE.baselineExpected === RUN_SCORE_FIXTURE.baselineActual && RUN_SCORE_FIXTURE.flawlessExpected === RUN_SCORE_FIXTURE.flawlessActual && RUN_SCORE_FIXTURE.baselineNotFlawless === true && RUN_SCORE_FIXTURE.flawlessDetected === true}
            data-run-end-pass={RUN_END_FIXTURE.reasonExpected === RUN_END_FIXTURE.reasonActual && RUN_END_FIXTURE.modeExpected === RUN_END_FIXTURE.modeActual && RUN_END_FIXTURE.waveExpected === RUN_END_FIXTURE.waveActual && RUN_END_FIXTURE.elapsedExpected === RUN_END_FIXTURE.elapsedActual && RUN_END_FIXTURE.scorePositive === true && RUN_END_FIXTURE.frozen === true}
            data-run-end-reason={run?.endSnapshot?.reason ?? ''}
            data-run-end-score={run?.endSnapshot?.score ?? ''}
            data-results-screen-ready={Boolean(run?.endSnapshot)}
            data-personal-best-version={PERSONAL_BEST.version}
            data-personal-best-pass={PERSONAL_BEST_FIXTURE.firstRecord === true && PERSONAL_BEST_FIXTURE.higherWave === true && PERSONAL_BEST_FIXTURE.longerSameWave === true && PERSONAL_BEST_FIXTURE.higherScoreSameWaveTime === true && PERSONAL_BEST_FIXTURE.worseRejected === true}
            data-wave-threat-budget={threatWave.budget}
            data-wave-threat-spent={threatWave.spentThreat}
            data-wave-threat-unused={threatWave.unusedThreat}
            data-economy-version={ECONOMY_BASELINE.version}
            data-economy-pass={ECONOMY_BASELINE_FIXTURE.startingGoldExpected === ECONOMY_BASELINE_FIXTURE.startingGoldActual && ECONOMY_BASELINE_FIXTURE.archerCopiesExpected === ECONOMY_BASELINE_FIXTURE.archerCopiesActual && ECONOMY_BASELINE_FIXTURE.cannonCopiesExpected === ECONOMY_BASELINE_FIXTURE.cannonCopiesActual && ECONOMY_BASELINE_FIXTURE.wave1RewardExpected === ECONOMY_BASELINE_FIXTURE.wave1RewardActual && ECONOMY_BASELINE_FIXTURE.wave6RewardExpected === ECONOMY_BASELINE_FIXTURE.wave6RewardActual}
            data-wave-clear-reward={getWaveClearReward(waveScaling.waveNumber)}
            data-gold-mine-cost={GOLD_MINE.cost}
            data-gold-mine-income={GOLD_MINE.incomePerWave}
            data-gold-mine-break-even={getGoldMineBreakEvenWave()}
            data-gold-mine-opportunity-count={GOLD_MINE_OPPORTUNITY.affordableAlternatives.length}
            data-gold-mine-pass={GOLD_MINE_FIXTURE.breakEvenWaveExpected === GOLD_MINE_FIXTURE.breakEvenWaveActual && GOLD_MINE_FIXTURE.beforeBreakEvenNegative === true && GOLD_MINE_FIXTURE.atBreakEvenNonNegative === true && GOLD_MINE_FIXTURE.includesArcherAlternative === true && GOLD_MINE_FIXTURE.includesFrostAlternative === true && GOLD_MINE_FIXTURE.excludesCannonAlternative === true}
            data-war-forge-cost={WAR_FORGE.cost}
            data-war-forge-radius={WAR_FORGE.auraRadius}
            data-war-forge-damage-multiplier={WAR_FORGE.damageMultiplier}
            data-war-forge-speed-multiplier={WAR_FORGE.attackSpeedMultiplier}
            data-war-forge-archer-dps={WAR_FORGE_ARCHER_PREVIEW.modifiedDps}
            data-war-forge-pass={WAR_FORGE_FIXTURE.activeExpected === WAR_FORGE_FIXTURE.activeActual && WAR_FORGE_FIXTURE.inactiveExpected === WAR_FORGE_FIXTURE.inactiveActual && WAR_FORGE_FIXTURE.damageBoosted === true && WAR_FORGE_FIXTURE.intervalReduced === true}
            data-guardian-shrine-cost={GUARDIAN_SHRINE.cost}
            data-guardian-shrine-radius={GUARDIAN_SHRINE.auraRadius}
            data-guardian-shrine-damage-reduction={GUARDIAN_SHRINE.bastionDamageReduction}
            data-guardian-shrine-range-multiplier={GUARDIAN_SHRINE.nearbyDefenseRangeMultiplier}
            data-guardian-shrine-preview-damage={GUARDIAN_SHRINE_DAMAGE_PREVIEW.finalDamage}
            data-guardian-shrine-preview-range={GUARDIAN_SHRINE_RANGE_PREVIEW.modifiedRange}
            data-guardian-shrine-pass={GUARDIAN_SHRINE_FIXTURE.activeExpected === GUARDIAN_SHRINE_FIXTURE.activeActual && GUARDIAN_SHRINE_FIXTURE.mitigatedExpected === GUARDIAN_SHRINE_FIXTURE.mitigatedActual && GUARDIAN_SHRINE_FIXTURE.outOfRangeExpected === GUARDIAN_SHRINE_FIXTURE.outOfRangeActual && GUARDIAN_SHRINE_FIXTURE.rangeIncreased === true}
            data-spend-curve-version={ECONOMY_SPEND_CURVE.version}
            data-spend-curve-opening-reserve={OPENING_ECONOMY_RISK.reserve}
            data-spend-curve-opening-mine-share={OPENING_ECONOMY_RISK.mineShare}
            data-spend-curve-forge-share={OPENING_STRATEGIC_SPEND.forgeShare}
            data-spend-curve-shrine-share={OPENING_STRATEGIC_SPEND.shrineShare}
            data-spend-curve-pass={SPEND_CURVE_FIXTURE.openingMineLeavesReserve === true && SPEND_CURVE_FIXTURE.openingMineUnderSoftCap === true && SPEND_CURVE_FIXTURE.doubleMineBelowReserve === true && SPEND_CURVE_FIXTURE.doubleMineOverSoftCap === true && SPEND_CURVE_FIXTURE.forgeOpeningShareExpected === SPEND_CURVE_FIXTURE.forgeOpeningShareActual && SPEND_CURVE_FIXTURE.shrineOpeningShareExpected === SPEND_CURVE_FIXTURE.shrineOpeningShareActual}
            data-enemy-base-version={ENEMY_BASE_MODEL.version}
            data-enemy-base-pass={ENEMY_BASE_FIXTURE.shieldExpected === ENEMY_BASE_FIXTURE.shieldActual && ENEMY_BASE_FIXTURE.hpExpected === ENEMY_BASE_FIXTURE.hpActual && ENEMY_BASE_FIXTURE.slowedSpeedExpected === ENEMY_BASE_FIXTURE.slowedSpeedActual && ENEMY_BASE_FIXTURE.expiredSlowSpeedExpected === ENEMY_BASE_FIXTURE.expiredSlowSpeedActual}
            data-normal-enemy={NORMAL_ENEMY.name}
            data-normal-enemy-threat={NORMAL_ENEMY.threatValue}
            data-normal-enemy-hp-per-threat={NORMAL_ENEMY_BUDGET.hpPerThreat}
            data-runner-enemy={RUNNER_ENEMY.name}
            data-runner-enemy-threat={RUNNER_ENEMY.threatValue}
            data-runner-enemy-hp-per-threat={RUNNER_ENEMY_BUDGET.hpPerThreat}
            data-runner-enemy-speed={RUNNER_ENEMY_BUDGET.speedIndex}
            data-tank-enemy={TANK_ENEMY.name}
            data-tank-enemy-threat={TANK_ENEMY.threatValue}
            data-tank-enemy-hp-per-threat={TANK_ENEMY_BUDGET.hpPerThreat}
            data-tank-enemy-speed={TANK_ENEMY_BUDGET.speedIndex}
            data-armored-enemy={ARMORED_ENEMY.name}
            data-armored-enemy-threat={ARMORED_ENEMY.threatValue}
            data-armored-enemy-effective-hp={ARMORED_ENEMY_BUDGET.effectiveHp}
            data-armored-enemy-effective-hp-per-threat={ARMORED_ENEMY_BUDGET.effectiveHpPerThreat}
            data-shielded-enemy={SHIELDED_ENEMY.name}
            data-shielded-enemy-threat={SHIELDED_ENEMY.threatValue}
            data-shielded-enemy-durability={SHIELDED_ENEMY_BUDGET.totalDurability}
            data-shielded-enemy-durability-per-threat={SHIELDED_ENEMY_BUDGET.durabilityPerThreat}
            data-flying-enemy={FLYING_ENEMY.name}
            data-flying-enemy-threat={FLYING_ENEMY.threatValue}
            data-flying-enemy-speed={FLYING_ENEMY_BUDGET.speedIndex}
            data-flying-enemy-airborne={FLYING_ENEMY_BUDGET.airborne}
            data-tower-slot-count={SINGLE_GATE_MAP.buildSlots.slots.length}
            data-gauntlet-map-version={SINGLE_GATE_MAP.version}
            data-gauntlet-wall-count={SINGLE_GATE_MAP.wallSlots.sockets.length}
            data-late-game-soak-pass={LATE_GAME_SOAK_PASS}
            data-late-game-wave100-mix={LATE_GAME_SOAK_QA.wave100HasBroadThreatMix}
            data-late-game-wave250-mix={LATE_GAME_SOAK_QA.wave250HasBroadThreatMix}
            data-tower-evolution-integrity-pass={TOWER_EVOLUTION_INTEGRITY_PASS}
            data-final-tower-count={TOWER_EVOLUTION_INTEGRITY_QA.towerCountIs12 ? 12 : 0}
            data-final-evolution-count={TOWER_EVOLUTION_INTEGRITY_QA.evolutionCountIs24 ? 24 : 0}
            data-normal-mode-evolution-flow-pass={NORMAL_MODE_EVOLUTION_FLOW_PASS}
            data-normal-mode-evolution-towers-checked={NORMAL_MODE_EVOLUTION_FLOW_QA.towerCountChecked}
            data-tft-evolution-flow-pass={TFT_EVOLUTION_FLOW_PASS}
            data-tft-evolution-towers-checked={TFT_EVOLUTION_FLOW_QA.towerCountChecked}
            data-evolution-persistence-sell-reconnect-pass={EVOLUTION_PERSISTENCE_SELL_RECONNECT_PASS}
            data-evolution-restore-investment-pass={EVOLUTION_PERSISTENCE_SELL_RECONNECT_QA.restoreKeepsInvestment}
            data-evolution-power-budget-pass={EVOLUTION_POWER_BUDGET_PASS}
            data-evolution-power-budget-count={EVOLUTION_POWER_BUDGET_QA.evolutionCountChecked}
            data-gauntlet-wall-pass={WALL_SYSTEM_FIXTURE.socketCount === 4 && WALL_SYSTEM_FIXTURE.maximumActive === 4 && WALL_SYSTEM_FIXTURE.allSocketIdsUnique === true && WALL_SYSTEM_FIXTURE.allWallsKeepPathOpen === true && WALL_SYSTEM_FIXTURE.compatibleWithSingleGate === true && WALL_SYSTEM_FIXTURE.compatibleWithTftShop === true}
            data-tower-roster-version={TOWER_ROSTER.version}
            data-normal-build-roster-pass={NORMAL_BUILD_ROSTER_FIXTURE.countExpected === NORMAL_BUILD_ROSTER_FIXTURE.countActual && NORMAL_BUILD_ROSTER_FIXTURE.allHaveCost === true && NORMAL_BUILD_ROSTER_FIXTURE.allHaveRole === true && NORMAL_BUILD_ROSTER_FIXTURE.allHaveFaction === true && NORMAL_BUILD_ROSTER_FIXTURE.allHaveCounterType === true && NORMAL_BUILD_ROSTER_FIXTURE.allHaveCombatStats === true && NORMAL_BUILD_ROSTER_FIXTURE.uniqueIds === true && NORMAL_BUILD_PURCHASE_FIXTURE.every((entry) => entry.actual === entry.expected && entry.deductedCorrectly)}
            data-base-tower-gameplay-pass={BASE_TOWER_GAMEPLAY_FIXTURE.towerCount === 12 && BASE_TOWER_GAMEPLAY_FIXTURE.offensiveCount === 9 && BASE_TOWER_GAMEPLAY_FIXTURE.slowWorks === true && BASE_TOWER_GAMEPLAY_FIXTURE.debuffWorks === true && BASE_TOWER_GAMEPLAY_FIXTURE.buffWorks === true && BASE_TOWER_GAMEPLAY_FIXTURE.utilityBelowBurst === true && BASE_TOWER_COMBAT_FIXTURE.perfectCounterDamageExpected === BASE_TOWER_COMBAT_FIXTURE.perfectCounterDamageActual && BASE_TOWER_COMBAT_FIXTURE.buffRaisesDamage === true && BASE_TOWER_COMBAT_FIXTURE.buffRaisesAttackSpeed === true && BASE_TOWER_COMBAT_FIXTURE.targetInRange === true}
            data-tft-bench-version={TFT_BENCH.version}
            data-tft-copy-progression-version={TFT_COPY_PROGRESSION.version}
            data-tft-copy-progression-pass={TFT_COPY_PROGRESSION_FIXTURE.oneCopyLevelOne === true && TFT_COPY_PROGRESSION_FIXTURE.twoAndThreeLevelTwo === true && TFT_COPY_PROGRESSION_FIXTURE.fourToSixLevelThree === true && TFT_COPY_PROGRESSION_FIXTURE.sevenLevelFour === true && TFT_COPY_PROGRESSION_FIXTURE.wrongTypeBlocked === true && TFT_COPY_PROGRESSION_FIXTURE.independentProgress === true && TFT_COPY_PROGRESSION_FIXTURE.reachesSevenExactly === true && TFT_COPY_PROGRESSION_FIXTURE.maxBlocksExtra === true}
            data-tft-persistence-version={TFT_PERSISTENCE.version}
            data-tft-persistence-pass={TFT_PERSISTENCE_FIXTURE.validSnapshotCreated === true && TFT_PERSISTENCE_FIXTURE.runFieldsPersist === true && TFT_PERSISTENCE_FIXTURE.towerProgressPersists === true && TFT_PERSISTENCE_FIXTURE.evolutionPersists === true && TFT_PERSISTENCE_FIXTURE.benchPersists === true && TFT_PERSISTENCE_FIXTURE.wallsPersist === true && TFT_PERSISTENCE_FIXTURE.rollLockPersist === true && TFT_PERSISTENCE_FIXTURE.invalidVersionRejected === true}
            data-tft-bench-selected={selectedTftBenchIndex ?? ''}
            data-tft-bench-pass={TFT_BENCH_FIXTURE.slotCountExpected === TFT_BENCH_FIXTURE.slotCountActual && TFT_BENCH_FIXTURE.buyToBenchWorks === true && TFT_BENCH_FIXTURE.fullBlocksPurchase === true && TFT_BENCH_FIXTURE.sellRemovesCopy === true && TFT_BENCH_FIXTURE.noAutoMerge === true}
            data-tft-shop-version={TFT_SHOP.version}
            data-tft-shop-mode={run?.mode === MODES.TFT_SHOP}
            data-tft-shop-pass={TFT_SHOP_FIXTURE.slotCountExpected === TFT_SHOP_FIXTURE.slotCountActual && TFT_SHOP_FIXTURE.humanExpected === TFT_SHOP_FIXTURE.humanActual && TFT_SHOP_FIXTURE.insectExpected === TFT_SHOP_FIXTURE.insectActual && TFT_SHOP_FIXTURE.alienExpected === TFT_SHOP_FIXTURE.alienActual && TFT_SHOP_FIXTURE.neutralExpected === TFT_SHOP_FIXTURE.neutralActual && TFT_SHOP_FIXTURE.everyCopyCostsTwo === true && TFT_SHOP_FIXTURE.rerollCostExpected === TFT_SHOP_FIXTURE.rerollCostActual && TFT_SHOP_FIXTURE.deterministic === true && TFT_SHOP_FIXTURE.rerollChangesSeededOffer === true}
            data-tower-art-version={TOWER_ART_SYSTEM.version}
            data-tower-art-pass={TOWER_ART_FIXTURE.expectedEvolutionCount === TOWER_ART_FIXTURE.actualEvolutionCount && TOWER_ART_FIXTURE.everyEvolutionMapped === true && TOWER_ART_FIXTURE.uniqueFrames === true && TOWER_ART_FIXTURE.humanPaletteDistinct === true && TOWER_ART_FIXTURE.alienNeutralDistinct === true && TOWER_ART_FIXTURE.everyBaseTowerHasRepresentativeArt === true}
            data-evolution-count={TOWER_EVOLUTIONS.length}
            data-evolution-pass={EVOLUTION_FIXTURE.evolutionCountExpected === EVOLUTION_FIXTURE.evolutionCountActual && EVOLUTION_FIXTURE.everyTowerHasTwoChoices === true && EVOLUTION_FIXTURE.levelGateBlocksEarly === true && EVOLUTION_FIXTURE.levelFourAllowsChoice === true && EVOLUTION_FIXTURE.choiceIsPerTower === true && EVOLUTION_FIXTURE.counterFactionPreserved === true && EVOLUTION_FIXTURE.counterTypePreserved === true}
            data-support-stacking-version={SUPPORT_STACKING.version}
            data-support-stacking-pass={SUPPORT_STACKING_FIXTURE.weakerSlowDoesNotStack === true && SUPPORT_STACKING_FIXTURE.strongerSlowWins === true && SUPPORT_STACKING_FIXTURE.durationRefreshes === true && SUPPORT_STACKING_FIXTURE.identicalDebuffDoesNotStack === true && SUPPORT_STACKING_FIXTURE.duplicateShredDoesNotStack === true && SUPPORT_STACKING_FIXTURE.duplicateShredValueStable === true}
            data-tower-roster-count={TOWER_ROSTER.towers.length}
            data-tower-roster-pass={TOWER_ROSTER_FIXTURE.towerCountExpected === TOWER_ROSTER_FIXTURE.towerCountActual && TOWER_ROSTER_FIXTURE.humanCount === 3 && TOWER_ROSTER_FIXTURE.insectCount === 3 && TOWER_ROSTER_FIXTURE.alienCount === 3 && TOWER_ROSTER_FIXTURE.neutralCount === 3 && TOWER_ROSTER_FIXTURE.airCounterCount === 3 && TOWER_ROSTER_FIXTURE.armoredCounterCount === 3 && TOWER_ROSTER_FIXTURE.infantryCounterCount === 3 && TOWER_ROSTER_FIXTURE.supportCounterCount === 3 && TOWER_ROSTER_FIXTURE.neutralFlagsValid === true && TOWER_ROSTER_FIXTURE.legacyArcherResolves === true && TOWER_ROSTER_FIXTURE.legacySaveNormalizes === true}
            data-tri-gate-map-version={TRI_GATE_MAP.version}
            data-tri-gate-spawn-version={TRI_GATE_SPAWN.version}
            data-tri-gate-pacing-version={TRI_GATE_PACING.version}
            data-tri-gate-balance-pass={TRI_GATE_BALANCE_SMOKE.checks.openingCanCoverThreeFronts === true && TRI_GATE_BALANCE_SMOKE.checks.openingStillRequiresChoices === true && TRI_GATE_BALANCE_SMOKE.checks.threatActuallyHigherThanSingle === true && TRI_GATE_BALANCE_SMOKE.checks.rewardCurveIncreases === true && TRI_GATE_BALANCE_SMOKE.checks.laneThreatReasonable === true && TRI_GATE_BALANCE_SMOKE.checks.pacingMonotonic === true}
            data-boss-schedule-version={BOSS_SCHEDULE.version}
            data-boss-summon-adds-version={BOSS_SUMMON_ADDS.version}
            data-boss-armor-enrage-version={BOSS_ARMOR_ENRAGE.version}
            data-boss-tuning-version={BOSS_TUNING.version}
            data-blessing-system-version={BLESSING_SYSTEM.version}
            data-blessing-engine-version={BLESSING_ENGINE.version}
            data-blessing-reroll-version={BLESSING_REROLL.version}
            data-blessing-power-budget-version={BLESSING_POWER_BUDGET.version}
            data-elite-modifier-version={ELITE_MODIFIER_SYSTEM.version}
            data-world-modifier-version={WORLD_MODIFIER_SYSTEM.version}
            data-world-modifier-count={activeWorldModifiers.length}
            data-world-modifier-pass={WORLD_MODIFIER_FIXTURE.inactiveBeforeMinWave === true && WORLD_MODIFIER_FIXTURE.activeAtMinWave === true && WORLD_MODIFIER_FIXTURE.inactiveBetweenCadence === true && WORLD_MODIFIER_FIXTURE.activeAtNextCadence === true && WORLD_MODIFIER_FIXTURE.maxActiveRespected === true && WORLD_MODIFIER_FIXTURE.deterministicSelection === true && WORLD_MODIFIER_FIXTURE.definitionsHaveLiveEffects === true && WORLD_MODIFIER_FIXTURE.pressureRaisesThreat === true && WORLD_MODIFIER_FIXTURE.scarcityCutsGold === true && WORLD_MODIFIER_FIXTURE.unstableGroundAcceleratesPressure === true}
            data-elite-modifier-pass={ELITE_MODIFIER_FIXTURE.belowMinWaveNeverElite === true && ELITE_MODIFIER_FIXTURE.bossNeverElite === true && ELITE_MODIFIER_FIXTURE.normalEligible === true && ELITE_MODIFIER_FIXTURE.baseChanceExpected === ELITE_MODIFIER_FIXTURE.baseChanceActual && ELITE_MODIFIER_FIXTURE.chanceScales === true && ELITE_MODIFIER_FIXTURE.chanceCapped === true && ELITE_MODIFIER_FIXTURE.deterministicAssignment === true && ELITE_MODIFIER_FIXTURE.concreteModifierAssigned === true && ELITE_MODIFIER_FIXTURE.modifierSetCountExpected === ELITE_MODIFIER_FIXTURE.modifierSetCountActual && ELITE_MODIFIER_FIXTURE.brutalIncreasesHp === true && ELITE_MODIFIER_FIXTURE.swiftIncreasesSpeed === true && ELITE_MODIFIER_FIXTURE.fortifiedAddsArmor === true}
            data-blessing-power-budget-pass={BLESSING_EXPLOIT_FIXTURE.definitionsStayWithinDeclaredStacks === true && BLESSING_EXPLOIT_FIXTURE.damageCapRespected === true && BLESSING_EXPLOIT_FIXTURE.economyMultiplierCapRespected === true && BLESSING_EXPLOIT_FIXTURE.economyBonusCapRespected === true && BLESSING_EXPLOIT_FIXTURE.defenseFloorRespected === true && BLESSING_EXPLOIT_FIXTURE.maxHpCapRespected === true && BLESSING_EXPLOIT_FIXTURE.controlSlowCapRespected === true && BLESSING_EXPLOIT_FIXTURE.enemySpeedFloorRespected === true && BLESSING_EXPLOIT_FIXTURE.rerollSpendToCapExpected === BLESSING_EXPLOIT_FIXTURE.rerollSpendToCapActual && BLESSING_EXPLOIT_FIXTURE.rerollCannotBeFree === true && BLESSING_EXPLOIT_FIXTURE.economyDoesNotExplode === true}
            data-blessing-reroll-pass={BLESSING_REROLL_FIXTURE.baseCostExpected === BLESSING_REROLL_FIXTURE.baseCostActual && BLESSING_REROLL_FIXTURE.secondCostExpected === BLESSING_REROLL_FIXTURE.secondCostActual && BLESSING_REROLL_FIXTURE.affordableAtExactCost === true && BLESSING_REROLL_FIXTURE.blockedBelowCost === true && BLESSING_REROLL_FIXTURE.blockedAtCap === true && BLESSING_REROLL_FIXTURE.firstRerollChangesOffer === true && BLESSING_REROLL_FIXTURE.rerollsAdvanceDeterministically === true}
            data-blessing-engine-pass={BLESSING_ENGINE_FIXTURE.stackedDamageAboveBase === true && BLESSING_ENGINE_FIXTURE.mixedGoldExpected === BLESSING_ENGINE_FIXTURE.mixedGoldActual && BLESSING_ENGINE_FIXTURE.emergencyDamageExpected === BLESSING_ENGINE_FIXTURE.emergencyDamageActual && BLESSING_ENGINE_FIXTURE.boostedHpExpected === BLESSING_ENGINE_FIXTURE.boostedHpActual && BLESSING_ENGINE_FIXTURE.timeLockSlows === true && BLESSING_ENGINE_FIXTURE.frostboundAddsControl === true}
            data-blessing-count={(run?.blessings ?? []).length}
            data-blessing-tower-damage={blessingModifiers.towerDamageMultiplier}
            data-blessing-attack-speed={blessingModifiers.attackSpeedMultiplier}
            data-blessing-boss-damage={blessingModifiers.bossDamageMultiplier}
            data-blessing-choice-count={OPENING_BLESSING_OFFER.length}
            data-blessing-system-pass={BLESSING_SYSTEM_FIXTURE.choiceCountExpected === BLESSING_SYSTEM_FIXTURE.choiceCountActual && BLESSING_SYSTEM_FIXTURE.deterministicOffer === true && BLESSING_SYSTEM_FIXTURE.uniqueChoices === true && BLESSING_SYSTEM_FIXTURE.validDefinitions === true && BLESSING_SYSTEM_FIXTURE.setSizeExpected === BLESSING_SYSTEM_FIXTURE.setSizeActual && BLESSING_SYSTEM_FIXTURE.categoryCoverage === true && BLESSING_SYSTEM_FIXTURE.rarityCoverage === true && BLESSING_SYSTEM_FIXTURE.hasTradeoffBlessing === true && BLESSING_SYSTEM_FIXTURE.maxStackRespected === true && BLESSING_SYSTEM_FIXTURE.stackAddedWhenAllowed === true}
            data-boss-tuning-pass={BOSS_TUNING_FIXTURE.nonBossNull === true && BOSS_TUNING_FIXTURE.wave10HpExpected === BOSS_TUNING_FIXTURE.wave10HpActual && BOSS_TUNING_FIXTURE.hpScalesUp === true && BOSS_TUNING_FIXTURE.armorScalesUp === true && BOSS_TUNING_FIXTURE.moveSpeedCapped === true && BOSS_TUNING_FIXTURE.rewardScalesUp === true && BOSS_TUNING_FIXTURE.summonsIncluded === true}
            data-boss-enrage-preview={bossEnragePreview.enraged}
            data-boss-armor-enrage-pass={BOSS_ARMOR_ENRAGE_FIXTURE.armorBoss1Expected === BOSS_ARMOR_ENRAGE_FIXTURE.armorBoss1Actual && BOSS_ARMOR_ENRAGE_FIXTURE.armorBoss3Expected === BOSS_ARMOR_ENRAGE_FIXTURE.armorBoss3Actual && BOSS_ARMOR_ENRAGE_FIXTURE.armorCaps === true && BOSS_ARMOR_ENRAGE_FIXTURE.aboveThresholdNotEnraged === true && BOSS_ARMOR_ENRAGE_FIXTURE.atThresholdEnraged === true && BOSS_ARMOR_ENRAGE_FIXTURE.enrageBoostsMovement === true && BOSS_ARMOR_ENRAGE_FIXTURE.nonBossUnaffected === true}
            data-boss-summon-adds-pass={BOSS_SUMMON_ADDS_FIXTURE.normalWaveInactive === true && BOSS_SUMMON_ADDS_FIXTURE.firstBossActive === true && BOSS_SUMMON_ADDS_FIXTURE.firstBossPulseCountExpected === BOSS_SUMMON_ADDS_FIXTURE.firstBossPulseCountActual && BOSS_SUMMON_ADDS_FIXTURE.firstBossAddsPerPulseExpected === BOSS_SUMMON_ADDS_FIXTURE.firstBossAddsPerPulseActual && BOSS_SUMMON_ADDS_FIXTURE.laterBossScalesAdds === true && BOSS_SUMMON_ADDS_FIXTURE.idsUnique === true && BOSS_SUMMON_ADDS_FIXTURE.sourceTagged === true}
            data-boss-schedule-pass={BOSS_SCHEDULE_FIXTURE.wave9NotBoss === true && BOSS_SCHEDULE_FIXTURE.wave10BossIndexExpected === BOSS_SCHEDULE_FIXTURE.wave10BossIndexActual && BOSS_SCHEDULE_FIXTURE.wave20BossIndexExpected === BOSS_SCHEDULE_FIXTURE.wave20BossIndexActual && BOSS_SCHEDULE_FIXTURE.wave30BossIndexExpected === BOSS_SCHEDULE_FIXTURE.wave30BossIndexActual && BOSS_SCHEDULE_FIXTURE.wave40BossIndexExpected === BOSS_SCHEDULE_FIXTURE.wave40BossIndexActual && BOSS_SCHEDULE_FIXTURE.cadenceStable === true && BOSS_SCHEDULE_FIXTURE.cyclesProfiles === true && BOSS_SCHEDULE_FIXTURE.upcomingBossFrom11 === true && BOSS_SCHEDULE_FIXTURE.upcomingBossFrom20 === true}
            data-tri-gate-economy-pass={TRI_GATE_ECONOMY_FIXTURE.startingGoldExpected === TRI_GATE_ECONOMY_FIXTURE.startingGoldActual && TRI_GATE_ECONOMY_FIXTURE.startingGoldAboveSingleGate === true && TRI_GATE_ECONOMY_FIXTURE.preparationExpected === TRI_GATE_ECONOMY_FIXTURE.preparationActual && TRI_GATE_ECONOMY_FIXTURE.wave1RewardExpected === TRI_GATE_ECONOMY_FIXTURE.wave1RewardActual && TRI_GATE_ECONOMY_FIXTURE.wave6RewardExpected === TRI_GATE_ECONOMY_FIXTURE.wave6RewardActual && TRI_GATE_ECONOMY_FIXTURE.wave1ThreatMultiplierExpected === TRI_GATE_ECONOMY_FIXTURE.wave1ThreatMultiplierActual && TRI_GATE_ECONOMY_FIXTURE.wave1SpawnSlowerThanSingle === true && TRI_GATE_ECONOMY_FIXTURE.wave6TravelSlowerThanSingle === true && TRI_GATE_ECONOMY_FIXTURE.bastionDamageUnchanged === true}
            data-tri-gate-spawn-pass={TRI_GATE_SPAWN_FIXTURE.laneCountExpected === TRI_GATE_SPAWN_FIXTURE.laneCountActual && TRI_GATE_SPAWN_FIXTURE.allEnemiesAssigned === true && TRI_GATE_SPAWN_FIXTURE.noDuplicateAssignments === true && TRI_GATE_SPAWN_FIXTURE.originalOrderRecoverable === true && TRI_GATE_SPAWN_FIXTURE.countSpreadAtMostOne === true && TRI_GATE_SPAWN_FIXTURE.wave1RotationExpected === TRI_GATE_SPAWN_FIXTURE.wave1RotationActual && TRI_GATE_SPAWN_FIXTURE.wave2RotationExpected === TRI_GATE_SPAWN_FIXTURE.wave2RotationActual && TRI_GATE_SPAWN_FIXTURE.wave3RotationExpected === TRI_GATE_SPAWN_FIXTURE.wave3RotationActual && TRI_GATE_SPAWN_FIXTURE.rotatesOpeningLane === true}
            data-tri-gate-map-pass={TRI_GATE_MAP_FIXTURE.modeExpected === TRI_GATE_MAP_FIXTURE.modeActual && TRI_GATE_MAP_FIXTURE.entranceCountExpected === TRI_GATE_MAP_FIXTURE.entranceCountActual && TRI_GATE_MAP_FIXTURE.laneCountExpected === TRI_GATE_MAP_FIXTURE.laneCountActual && TRI_GATE_MAP_FIXTURE.uniqueEntrances === true && TRI_GATE_MAP_FIXTURE.uniqueLanes === true && TRI_GATE_MAP_FIXTURE.lanesResolve === true && TRI_GATE_MAP_FIXTURE.pathsStartAtEntrance === true && TRI_GATE_MAP_FIXTURE.pathsEndAtBastion === true && TRI_GATE_MAP_FIXTURE.pathsHaveShape === true && TRI_GATE_MAP_FIXTURE.uniqueInteriorWaypoints === true && TRI_GATE_MAP_FIXTURE.bastionCentered === true && TRI_GATE_MAP_FIXTURE.individualSlotPolicy === true}
            data-tower-slot-purchase-pass={NORMAL_BUILD_PURCHASE_FIXTURE.every((entry) => entry.actual === entry.expected && entry.deductedCorrectly)}
            data-placed-defense-count={placedDefenses.length}
            data-run-gold={run?.gold ?? 0}
          >
          {run?.mode === MODES.TFT_SHOP ? (
          <>
            <div className="tft-shop-layout">
            <p className="main-menu__kicker">SHOP</p>
            <h3>TFT SHOP</h3>
            <div className="tft-shop-grid" data-shop-slots={tftShopOffers.length}>
              {tftShopOffers.map((offer) => (
                <button
                  key={offer.slotId}
                  type="button"
                  className={`tft-shop-card tft-shop-card--${offer.faction} ${selectedTftShopSlotId === offer.slotId ? 'tft-shop-card--selected' : ''}`}
                  data-shop-slot={offer.slotId}
                  data-shop-faction={offer.faction}
                  data-shop-tower-id={offer.towerId}
                  onClick={() => {
                    setSelectedTftShopSlotId(offer.slotId);
                    setSelectedDefenseId(offer.towerId);
                    setSelectedPlacedDefenseId(null);
                    setTftFeedback('');
                  }}
                >
                  <div
                    className="tft-shop-card__art"
                    style={getTowerArtStyleForTower(offer.towerId)}
                    aria-hidden="true"
                  />
                  <div className="tft-shop-card__copy">
                    <strong>{offer.name}</strong>
                    <small>{offer.faction.toUpperCase()} · {offer.role.replaceAll('-', ' ').toUpperCase()}</small>
                  </div>
                  <span className="tft-shop-card__cost">{offer.cost}G</span>
                </button>
              ))}
            </div>
            <div className="tft-shop-economy">
              <div className="tft-shop-gold" aria-label={`${run?.gold ?? 0} gold available`}>
                <span>GOLD</span>
                <strong>{run?.gold ?? 0}</strong>
              </div>
              <div className="tft-shop-actions">
                <button
                  type="button"
                  className="tft-shop-buy"
                  disabled={!selectedTftShopOffer || (run?.gold ?? 0) < (selectedTftShopOffer?.cost ?? 0) || tftBench.every(Boolean)}
                  onClick={() => {
                    if (!selectedTftShopOffer) return;
                    if ((run?.gold ?? 0) < selectedTftShopOffer.cost) return;
                    const result = addCopyToBench(tftBench, {
                      copyId: `${run?.seed ?? 'run'}:${tftRollIndex}:${selectedTftShopOffer.slotId}:${Date.now()}`,
                      towerId: selectedTftShopOffer.towerId,
                      name: selectedTftShopOffer.name,
                      faction: selectedTftShopOffer.faction,
                      role: selectedTftShopOffer.role,
                      cost: selectedTftShopOffer.cost
                    });
                    if (!result.ok) {
                      setTftFeedback('BENCH FULL');
                      return;
                    }
                    setTftBench(result.bench);
                    setTftPurchasedSlotIds((current) => (
                      current.includes(selectedTftShopOffer.slotId)
                        ? current
                        : [...current, selectedTftShopOffer.slotId]
                    ));
                    onSpendGold(selectedTftShopOffer.cost);
                    setSelectedTftShopSlotId(null);
                    setTftFeedback('');
                  }}
                >
                  <span>BUY</span>
                  <small>{selectedTftShopOffer ? `${selectedTftShopOffer.cost}G` : 'SELECT'}</small>
                </button>
              <button
                type="button"
                className="tft-shop-roll"
                disabled={(run?.gold ?? 0) < TFT_SHOP.rerollCost}
                onClick={() => {
                  if ((run?.gold ?? 0) < TFT_SHOP.rerollCost) return;
                  onSpendGold(TFT_SHOP.rerollCost);
                  setTftPurchasedSlotIds([]);
                  setSelectedTftShopSlotId(null);
                  setTftRollIndex((value) => value + 1);
                }}
              >
                <span>ROLL</span>
                <small>{TFT_SHOP.rerollCost}G</small>
              </button>
              </div>
            </div>
            <button
              type="button"
              className="tft-shop-lock"
              disabled={!selectedPlacedDefense || run?.phase === RUN_PHASES.ENDED}
              onClick={handleSellSelectedTower}
            >
              {selectedPlacedDefense ? `VENDI · +${selectedSellPreview.refund}G` : 'VENDI · SELEZIONA TORRE'}
            </button>
            <div className="tft-bench">
              <div className="tft-bench__header">
                <span>BENCH</span>
                <strong>{tftBench.filter(Boolean).length}/{TFT_BENCH.slotCount}</strong>
              </div>
              <div className="tft-bench__grid" data-bench-slots={TFT_BENCH.slotCount}>
                {tftBench.map((copy, index) => (
                  <div
                    key={index}
                    className={`tft-bench-slot ${copy ? 'tft-bench-slot--occupied' : ''} ${selectedTftBenchIndex === index ? 'tft-bench-slot--selected' : ''}`}
                    onClick={() => copy && setSelectedTftBenchIndex(index)}
                    data-bench-slot={index + 1}
                    data-bench-tower-id={copy?.towerId ?? ''}
                    draggable={Boolean(copy)}
                    onDragStart={(event) => {
                      if (!copy) return;
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(index));
                      setSelectedTftBenchIndex(index);
                      setTftFeedback('DROP ON A MATCHING TOWER TO MERGE');
                    }}
                    onDragEnd={() => setTftFeedback((current) => current === 'DROP ON A MATCHING TOWER TO MERGE' ? '' : current)}
                  >
                    {copy ? (
                      <>
                        <div
                          className="tft-bench-slot__art"
                          style={getTowerArtStyleForTower(copy.towerId)}
                          aria-hidden="true"
                        />
                        <div className="tft-bench-slot__copy">
                          <strong>{copy.name}</strong>
                          <small>{copy.faction.toUpperCase()}</small>
                        </div>
                        {selectedPlacedDefense && (
                          <button
                            type="button"
                            disabled={!canMergeTftCopy(selectedPlacedDefense, copy).ok}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMergeTftCopy(index);
                            }}
                          >
                            {selectedPlacedDefense.defenseId === copy.towerId ? 'MERGE · 0G' : 'WRONG TYPE'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            const result = removeCopyFromBench(tftBench, index);
                            if (!result.ok) return;
                            setTftBench(result.bench);
                            if (selectedTftBenchIndex === index) setSelectedTftBenchIndex(null);
                            onGainGold(TFT_BENCH.copySellRefund);
                            setTftFeedback('');
                          }}
                        >
                          SELL {TFT_BENCH.copySellRefund}G
                        </button>
                      </>
                    ) : (
                      <span>EMPTY</span>
                    )}
                  </div>
                ))}
              </div>
              {tftFeedback && <div className="tft-bench-feedback">{tftFeedback}</div>}
              <div className="tft-wave-controls" aria-label="Wave controls">
                <button
                  type="button"
                  className={`tft-confirm-setup ${tftSetupConfirmed ? 'tft-confirm-setup--active' : ''}`}
                  disabled={!run || run.phase !== RUN_PHASES.PREPARATION}
                  onClick={() => setConfirmedTftSetupKey(tftSetupKey)}
                >
                  <span>{tftSetupConfirmed ? 'CONFIGURATION CONFIRMED' : 'CONFIRM SETUP'}</span>
                  <small>{tftSetupConfirmed ? 'Current setup locked in' : 'Confirm towers and bench'}</small>
                </button>
                <button
                  type="button"
                  className="tft-start-wave"
                  disabled={!run || run.phase !== RUN_PHASES.PREPARATION || !tftSetupConfirmed}
                  onClick={() => onPhaseChange(RUN_PHASES.ACTIVE)}
                >
                  <span>START WAVE</span>
                  <small>{tftSetupConfirmed ? 'Launch immediately' : 'Confirm setup first'}</small>
                </button>
              </div>
            </div>
            </div>
          </>
        ) : (
          <>
            <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <div className="normal-build-roster" data-normal-build-count={NORMAL_MODE_TOWERS.length}>
            {['human', 'insect', 'alien', 'neutral'].map((faction) => (
              <section className={`normal-build-group normal-build-group--${faction}`} key={faction}>
                <span className="normal-build-group__title">{faction.toUpperCase()}</span>
                <div className="normal-build-group__grid">
                  {NORMAL_MODE_TOWERS.filter((tower) => tower.faction === faction).map((tower) => (
                    <button
                      key={tower.id}
                      className={`tower-card tower-card--compact tower-card--${tower.faction} ${selectedDefenseId === tower.id ? 'tower-card--selected' : ''}`}
                      onClick={() => handleDefenseSelection(tower.id)}
                      data-tower-id={tower.id}
                      data-faction={tower.faction}
                      data-counter-type={tower.counterType}
                    >
                      <div
                        className="tower-card__art"
                        style={getTowerArtStyleForTower(tower.id)}
                        aria-hidden="true"
                      />
                      <div className="tower-card__copy">
                        <strong>{tower.name}</strong>
                        <span>{tower.cost}g</span>
                        <small>{tower.faction.toUpperCase()} · {tower.role.replaceAll('-', ' ').toUpperCase()}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          
          </>
        )}

          <section className="defense-inspector" aria-label="Selected defense inspection">
            <div className="defense-inspector__header">
              <span>{selectedPlacedDefense ? 'PLACED DEFENSE' : 'SELECTED DEFENSE'}</span>
              <strong>{inspectedDefense.name}</strong>
            </div>
            <div className="defense-inspector__grid">
              <div><span>ROLE</span><strong>{inspectedDefense.role}</strong></div>
              <div><span>COST</span><strong>{inspectedDefense.cost}g</strong></div>
              {'damage' in inspectedDefense && <div><span>DAMAGE</span><strong>{inspectedDefense.damage}</strong></div>}
              {'range' in inspectedDefense && <div><span>RANGE</span><strong>{inspectedDefense.range}</strong></div>}
              {'attackIntervalMs' in inspectedDefense && <div><span>RATE</span><strong>{(1000 / inspectedDefense.attackIntervalMs).toFixed(1)}/s</strong></div>}
              {'damageType' in inspectedDefense && <div><span>TYPE</span><strong>{inspectedDefense.damageType}</strong></div>}
              {'splashRadius' in inspectedDefense && <div><span>SPLASH</span><strong>{inspectedDefense.splashRadius}</strong></div>}
              {'slowPercent' in inspectedDefense && <div><span>SLOW</span><strong>{inspectedDefense.slowPercent}%</strong></div>}
              {'squadSize' in inspectedDefense && <div><span>SQUAD</span><strong>{inspectedDefense.squadSize}</strong></div>}
              {'unitHp' in inspectedDefense && <div><span>UNIT HP</span><strong>{inspectedDefense.unitHp}</strong></div>}
            </div>
            <p>{inspectedDefense.description}</p>
            <div className="defense-inspector__sell">
              <span>SELL REFUND</span>
              <strong>{selectedSellPreview.refund}g</strong>
              <small>{Math.round(SELL_ECONOMY.baseRefundRate * 100)}% of total invested gold</small>
              {selectedPlacedDefense && (
                <div className="defense-inspector__tower-actions">
                  <button
                    type="button"
                    className={movingPlacedDefenseId === selectedPlacedDefense.id ? 'is-active' : ''}
                    onClick={handleToggleMoveSelectedTower}
                  >
                    {movingPlacedDefenseId === selectedPlacedDefense.id ? 'CANCEL MOVE' : 'MOVE · 0G'}
                  </button>
                  <button type="button" onClick={handleSellSelectedTower}>
                    SELL · +{selectedSellPreview.refund}G
                  </button>
                </div>
              )}
              {movingPlacedDefenseId === selectedPlacedDefense?.id && (
                <small>Choose any empty tower pad to move this tower.</small>
              )}
            </div>
            <div className="defense-inspector__upgrade">
              <span>{selectedPlacedDefense ? `LEVEL ${selectedPlacedDefense.level}` : 'NEXT UPGRADE'}</span>
              {!selectedPlacedDefense && !selectedUpgradePreview.maxed && (
                <strong>LV.{selectedUpgradePreview.nextLevel} · {selectedUpgradePreview.upgradeCost}g</strong>
              )}
              {selectedPlacedDefense && run?.mode === MODES.TFT_SHOP && (
                <strong>COPIES {selectedPlacedDefense.copyProgress ?? 1}/{TFT_COPY_PROGRESSION.maxCopies}</strong>
              )}
              {selectedPlacedDefense && run?.mode !== MODES.TFT_SHOP && selectedPlacedDefense.level < UPGRADE_CURVE.maxLevel && (
                <button type="button" onClick={handleUpgradeSelectedTower}>
                  UPGRADE TO LV.{selectedPlacedDefense.level + 1} · {getUpgradeCost(inspectedDefenseBase, selectedPlacedDefense.level + 1)}g
                </button>
              )}
              {selectedPlacedDefense && selectedPlacedDefense.level >= 4 && (!run || run.mode !== MODES.TFT_SHOP || Number(selectedPlacedDefense.copyProgress ?? 1) >= TFT_COPY_PROGRESSION.maxCopies) && !selectedPlacedDefense.evolution && (
                <div className="tower-evolution-choice">
                  <div className="tower-evolution-choice__title">CHOOSE EVOLUTION</div>
                  {selectedEvolutionChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      className="tower-evolution-card"
                      onClick={() => handleEvolutionChoice(choice.id)}
                    >
                      <div
                        className="tower-evolution-card__art"
                        style={getTowerArtStyle(choice.id)}
                        aria-hidden="true"
                      />
                      <div className="tower-evolution-card__copy">
                        <strong>{choice.branch} · {choice.name}</strong>
                        <small>{choice.description}</small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPlacedDefense?.evolution && (
                <strong>{TOWER_EVOLUTIONS.find((entry) => entry.id === selectedPlacedDefense.evolution)?.name ?? selectedPlacedDefense.evolution}</strong>
              )}
              <small>{run?.mode === MODES.TFT_SHOP ? 'TFT progression: 1/7 Lv.1 · 2–3/7 Lv.2 · 4–6/7 Lv.3 · 7/7 Lv.4 + evolution' : `Max level ${UPGRADE_CURVE.maxLevel} · evolution at Lv.4`}</small>
            </div>
            <div className="defense-inspector__targeting">
              <span>TARGETING</span>
              <strong>{selectedTargetingValue.rule}</strong>
              <small>Targeting value ×{selectedTargetingValue.multiplier.toFixed(2)}</small>
            </div>
            <div className="defense-inspector__instrumentation">
              <span>ATTACK TELEMETRY</span>
              <strong>{selectedAttackInstrumentation.sustainedDps} DPS</strong>
              <small>
                {selectedAttackInstrumentation.attacksPerSecond}/s · {selectedAttackInstrumentation.projectileTravelMs}ms travel @ {selectedAttackInstrumentation.sampleDistance} range
              </small>
            </div>
          </section>

          <div className="tower-synergy-panel" aria-label="Tower synergies">
            <div className="tower-synergy-panel__title">TOWER SYNERGIES</div>
            <div className="tower-synergy-panel__grid">
              {towerSynergyState.entries.map((entry) => (
                <div
                  key={entry.faction}
                  className={entry.active ? 'tower-synergy tower-synergy--active' : 'tower-synergy'}
                >
                  <span>{entry.name}</span>
                  <strong>{entry.count}/{entry.threshold}</strong>
                  <small>{entry.description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className={bossWaveIncoming ? 'boss-schedule boss-schedule--incoming' : 'boss-schedule'}>
            <span>{bossWaveIncoming ? 'BOSS WAVE' : 'NEXT BOSS'}</span>
            <strong>Wave {upcomingBossWave}</strong>
            {bossWaveIncoming && bossTuning && <small>{bossTuning.name} · {bossTuning.maxHp} HP · {bossArmor} armor · {bossSummonPlan.totalAdds} adds · enrage ≤ {Math.round(BOSS_ARMOR_ENRAGE.enrageThreshold * 100)}% HP</small>}
          </div>

          {bossWaveIncoming && bossTuning && (
            <div className="boss-milestone" aria-label="Boss milestone">
              <span>BOSS MILESTONE</span>
              <strong>{bossTuning.name}</strong>
              <small>HP {bossTuning.maxHp} · ARMOR {bossTuning.armor} · CORE DMG {bossTuning.bastionDamage} · REWARD +{bossTuning.goldReward}G</small>
            </div>
          )}

          {activeWorldModifiers.length > 0 && (
            <div className="world-modifier" aria-label="World modifier">
              <span>WORLD MODIFIER</span>
              <strong>{activeWorldModifiers[0].name}</strong>
              <small>{activeWorldModifiers[0].description} · Threat ×{worldModifierEffects.threatMultiplier.toFixed(2)} · Gold ×{worldModifierEffects.waveGoldMultiplier.toFixed(2)} · Speed ×{worldModifierEffects.enemyMoveSpeedMultiplier.toFixed(2)}</small>
            </div>
          )}

          <div className="risk-reward-panel" aria-label="Risk reward choice">
            <div className="risk-reward-panel__header">
              <span>RISK / REWARD</span>
              <strong>{riskRewardTier === 'pressure' ? 'PRESSURE ACTIVE' : 'SAFE'}</strong>
            </div>
            <div className="risk-reward-panel__choices">
              <button
                type="button"
                className={riskRewardTier === 'safe' ? 'is-active' : ''}
                disabled={run?.phase !== RUN_PHASES.PREPARATION}
                onClick={() => setRiskRewardTier('safe')}
              >
                SAFE
                <small>Normal threat · normal reward</small>
              </button>
              <button
                type="button"
                className={riskRewardTier === 'pressure' ? 'is-active' : ''}
                disabled={run?.phase !== RUN_PHASES.PREPARATION}
                onClick={() => setRiskRewardTier('pressure')}
              >
                PRESSURE
                <small>
                  +{Math.round((pressureRiskRewardConfig.threatMultiplier - 1) * 100)}% threat · 
                  {pressureRiskRewardConfig.flatGoldBonus > 0
                    ? `+${pressureRiskRewardConfig.flatGoldBonus}G clear`
                    : `+${Math.round((pressureRiskRewardConfig.rewardMultiplier - 1) * 100)}% clear gold`}
                </small>
              </button>
            </div>
          </div>

          <div className="mini-objective-panel" aria-label="Mini objective">
            <div>
              <span>MINI OBJECTIVE</span>
              <strong>{miniObjective.name}</strong>
            </div>
            <b>+{miniObjectiveReward}G</b>
            <small>{miniObjective.description}</small>
            {miniObjectiveFeedback && <em>{miniObjectiveFeedback}</em>}
          </div>

          <div className="run-sidebar__status">
            <span>{(run?.phase || RUN_PHASES.PREPARATION).toUpperCase()}</span>
            <strong>
              {run?.phase === RUN_PHASES.PREPARATION && `Wave ${(run?.wave ?? 0) + 1} starts in ${preparationRemaining}s`}
              {run?.phase === RUN_PHASES.ACTIVE && `Wave in progress · ${spawnQueue.length + activeEnemies.length} remaining`}
              {run?.phase === RUN_PHASES.RESOLVING && 'Resolving wave outcome'}
              {run?.phase === RUN_PHASES.ENDED && 'Bastion fallen'}
            </strong>
          </div>
          <div className="run-wave-preview" aria-label="Next wave preview">
            <div className="run-wave-preview__title">
              <span>NEXT WAVE</span>
              <strong>WAVE {waveScaling.waveNumber}</strong>
            </div>
            <div className="run-wave-preview__grid">
              <div><span>ENEMIES</span><strong>{threatWave.enemyCount}</strong></div>
              <div><span>DIFFICULTY</span><strong>{waveScaling.bandId.toUpperCase()}</strong></div>
              <div><span>TRAVEL</span><strong>{(waveScaling.travelDurationMs / 1000).toFixed(1)}s</strong></div>
              <div><span>SPAWN</span><strong>{(waveScaling.spawnIntervalMs / 1000).toFixed(2)}s</strong></div>
              <div><span>CORE DMG</span><strong>{waveScaling.bastionDamage}</strong></div>
              <div><span>CLEAR GOLD</span><strong>+{
                run?.mode === MODES.TRI_GATE
                  ? getTriGateWaveClearReward(waveScaling.waveNumber)
                  : run?.mode === MODES.TFT_SHOP
                    ? TFT_SHOP.waveClearGold
                    : getWaveClearReward(waveScaling.waveNumber)
              }</strong></div>
              {run?.mode === MODES.TFT_SHOP && (
                <div><span>BONUSES</span><strong>+1 PERFECT · +3 BOSS · +2 / 5 WAVES</strong></div>
              )}
            </div>
          </div>


          {blessingChoiceVisible && (
            <section
              className="blessing-choice"
              aria-label="Choose a blessing"
              data-blessing-choice-ui="ready"
              data-blessing-choice-selected={selectedBlessingPreviewId ?? ''}
            >
              <div className="blessing-choice__header">
                <span>BOSS DEFEATED</span>
                <strong>CHOOSE A BLESSING</strong>
                <small>Pick one reward for the next stage of the run. The selected effect applies immediately.</small>
              </div>
              <div className="blessing-choice__actions">
                <button
                  type="button"
                  className="blessing-reroll"
                  disabled={!blessingCanReroll}
                  onClick={() => {
                    if (!blessingCanReroll) return;
                    onSpendGold(blessingRerollCost);
                    setSelectedBlessingPreviewId(null);
                    setBlessingRerollCount((count) => count + 1);
                  }}
                >
                  REROLL · {blessingRerollCost}G
                  <small>{blessingRerollCount}/{BLESSING_REROLL.maxRerollsPerOffer} used</small>
                </button>
              </div>
              <div className="blessing-choice__grid">
                {blessingOffer.map((blessing) => {
                  const selected = selectedBlessingPreviewId === blessing.id;
                  const effectLabel = Object.entries(blessing.effect)
                    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()} ${typeof value === 'number' && value < 2 ? `×${value}` : `+${value}`}`)
                    .join(' · ');
                  return (
                    <button
                      key={blessing.id}
                      type="button"
                      className={`blessing-card blessing-card--${blessing.rarity}${selected ? ' blessing-card--selected' : ''}`}
                      onClick={() => setSelectedBlessingPreviewId(blessing.id)}
                    >
                      <span>{blessing.rarity.toUpperCase()} · {blessing.category.toUpperCase()}</span>
                      <strong>{blessing.name}</strong>
                      <small>{blessing.description}</small>
                      <em>{selected ? 'SELECTED' : 'CHOOSE'}</em>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {run?.mode !== MODES.TFT_SHOP && (
            <button
              className="run-prep-start"
              onClick={() => onPhaseChange(RUN_PHASES.ACTIVE)}
              disabled={!run || run.phase !== RUN_PHASES.PREPARATION}
            >
              START WAVE
              <small>Skip the preparation countdown</small>
            </button>
          )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function ResultsScreen({ snapshot, personalBestResult, onRetry, onBack }) {
  if (!snapshot) return null;

  const isLastBastion = snapshot.mode === MODES.LAST_BASTION;
  const lastBastionWon = isLastBastion && snapshot.won === true;

  return (
    <Shell
      onBack={onBack}
      kicker={isLastBastion ? 'LAST BASTION RESULT' : 'RUN COMPLETE'}
      title={lastBastionWon ? 'LAST BASTION STANDING' : isLastBastion ? 'ELIMINATED' : 'BASTION FALLEN'}
      subtitle={isLastBastion
        ? lastBastionWon
          ? 'You outlasted every other defender.'
          : 'Your final competitive result is locked.'
        : 'Your run has ended. Review the final snapshot before trying again.'}
    >
      <div className="results-hero">
        <span>{personalBestResult?.isPersonalBest ? 'NEW PERSONAL BEST' : 'FINAL SCORE'}</span>
        <strong>{snapshot.score.toLocaleString()}</strong>
        <small>
          {personalBestResult?.isPersonalBest
            ? `Improved by ${personalBestResult.reason}`
            : snapshot.reason === 'last-bastion-win'
              ? 'Last defender standing'
              : snapshot.reason === RUN_END_REASONS.BASTION_DESTROYED
                ? 'Bastion destroyed'
                : snapshot.reason}
        </small>
      </div>

      <div className="results-grid">
        {isLastBastion && (
          <div className="stat-card">
            <span>PLACEMENT</span>
            <strong>#{snapshot.placement}</strong>
            <small>{snapshot.won ? 'Winner' : `of ${snapshot.participantCount || '?'} defenders`}</small>
          </div>
        )}
        <div className="stat-card"><span>WAVE</span><strong>{snapshot.wave}</strong><small>Completed progression</small></div>
        <div className="stat-card"><span>SURVIVAL</span><strong>{formatSurvivalTime(snapshot.elapsedMs)}</strong><small>Official survival time</small></div>
        <div className="stat-card"><span>KILLS</span><strong>{snapshot.kills}</strong><small>Enemies defeated</small></div>
        <div className="stat-card"><span>GOLD</span><strong>{snapshot.gold}</strong><small>Gold remaining</small></div>
        <div className="stat-card"><span>BASTION</span><strong>{snapshot.coreHp} / {snapshot.coreMaxHp}</strong><small>Final core state</small></div>
        <div className="stat-card"><span>MODE</span><strong>{snapshot.mode === MODES.SINGLE_GATE ? 'SINGLE GATE' : snapshot.mode}</strong><small>Run format</small></div>
      </div>

      <div className="results-actions">
        <button className="pre-run-start" onClick={onRetry}>RETRY RUN</button>
        <button className="run-exit" onClick={onBack}>BACK TO MODE</button>
      </div>
    </Shell>
  );
}

function Leaderboard({ session, onBack }) {
  const [mode, setMode] = useState(MODES.SINGLE_GATE);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setLeaderboardStatus('loading');

    fetchLeaderboardData(session, mode).then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setLeaderboardData(null);
        setLeaderboardStatus(result.error);
        return;
      }

      setLeaderboardData(result.payload);
      setLeaderboardStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, mode]);

  const entries = leaderboardData?.entries ?? [];

  return (
    <Shell
      onBack={onBack}
      kicker="GLOBAL RECORDS"
      title="LEADERBOARD"
      subtitle="Verified records only. Ranked by wave, survival, score, kills, then oldest verified record."
    >
      <div className="leaderboard-tabs">
        <button
          className={mode === MODES.SINGLE_GATE ? 'leaderboard-tab leaderboard-tab--active' : 'leaderboard-tab'}
          onClick={() => setMode(MODES.SINGLE_GATE)}
        >
          SINGLE GATE
        </button>
        <button
          className={mode === MODES.TRI_GATE ? 'leaderboard-tab leaderboard-tab--active' : 'leaderboard-tab'}
          onClick={() => setMode(MODES.TRI_GATE)}
        >
          TRI-GATE
        </button>
      </div>

      <div className="table-card leaderboard-table">
        <div className="table-row table-row--head leaderboard-row">
          <span>#</span>
          <span>DEFENDER</span>
          <span>WAVE</span>
          <span>SURVIVAL</span>
          <span>SCORE</span>
          <span>KILLS</span>
        </div>

        {leaderboardStatus === 'loading' && (
          <div className="empty-state">Loading verified records…</div>
        )}

        {leaderboardStatus !== 'loading' && leaderboardStatus !== 'ready' && (
          <div className="empty-state">Leaderboard unavailable: {leaderboardStatus}</div>
        )}

        {leaderboardStatus === 'ready' && entries.length === 0 && (
          <div className="empty-state">No verified runs recorded for this mode yet.</div>
        )}

        {leaderboardStatus === 'ready' && entries.map((entry, index) => (
          <div className="table-row leaderboard-row" key={`${entry.displayName}-${entry.updatedAt}-${index}`}>
            <span>{index + 1}</span>
            <span>{entry.displayName}</span>
            <span>{entry.bestWave}</span>
            <span>{formatSurvivalTime(entry.bestSurvivalMs)}</span>
            <span>{Number(entry.bestScore || 0).toLocaleString()}</span>
            <span>{Number(entry.bestKills || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Profile({ session, onBack }) {
  const [profileData, setProfileData] = useState(null);
  const [profileStatus, setProfileStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    fetchProfileData(session).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setProfileStatus(result.error);
        return;
      }

      setProfileData(result.payload);
      setProfileStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const single = profileData?.modes?.['single-gate'] ?? null;
  const tri = profileData?.modes?.['tri-gate'] ?? null;
  const last = profileData?.lastBastion ?? null;
  const totalRuns = Number(profileData?.profile?.runs || 0);
  const totalSurvivalMs = Number(last?.total_survival_ms || 0);

  return (
    <Shell
      onBack={onBack}
      kicker="DEFENDER RECORD"
      title={profileData?.profile?.display_name || 'PROFILE'}
      subtitle="Verified account and mode statistics from the live Bastionfall database."
    >
      {profileStatus !== 'ready' ? (
        <div className="profile-state">
          <strong>{profileStatus === 'loading' ? 'LOADING PROFILE…' : 'PROFILE UNAVAILABLE'}</strong>
          <small>{profileStatus === 'loading' ? 'Fetching verified stats.' : profileStatus}</small>
        </div>
      ) : (
        <>
          <div className="profile-grid">
            <div className="stat-card"><span>FORTRESS LEVEL</span><strong>{profileData.profile.fortress_level}</strong><small>Account prestige progression</small></div>
            <div className="stat-card"><span>TOTAL RUNS</span><strong>{totalRuns}</strong><small>Verified completed runs</small></div>
            <div className="stat-card"><span>LIFETIME KILLS</span><strong>{Number(profileData.profile.lifetime_kills || 0).toLocaleString()}</strong><small>Across verified runs</small></div>
            <div className="stat-card"><span>SHARDS</span><strong>{profileData.profile.shards}</strong><small>Account progression currency</small></div>
          </div>

          <div className="profile-mode-grid">
            <section className="profile-mode-card">
              <span>SINGLE GATE</span>
              <strong>Wave {single?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(single?.best_survival_ms ?? 0)} · Score {(single?.best_score ?? 0).toLocaleString()} · Kills {(single?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>TRI-GATE</span>
              <strong>Wave {tri?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(tri?.best_survival_ms ?? 0)} · Score {(tri?.best_score ?? 0).toLocaleString()} · Kills {(tri?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>LAST BASTION</span>
              <strong>{last?.runs ?? 0} Runs</strong>
              <small>Best Wave {last?.best_wave ?? 0} · Best Survival {formatSurvivalTime(last?.best_survival_ms ?? 0)} · Best Score {(last?.best_score ?? 0).toLocaleString()}</small>
              <small>Lifetime Kills {(last?.lifetime_kills ?? 0).toLocaleString()} · Total Survival {formatSurvivalTime(totalSurvivalMs)}</small>
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}

function Settings({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker="GAME OPTIONS"
      title="SETTINGS"
      subtitle="Basic client preferences."
    >
      <div className="settings-card">
        <label><span>Master Volume</span><input type="range" min="0" max="100" defaultValue="80" /></label>
        <label><span>Music Volume</span><input type="range" min="0" max="100" defaultValue="65" /></label>
        <label><span>Effects Volume</span><input type="range" min="0" max="100" defaultValue="90" /></label>
        <div className="setting-line"><span>Language</span><strong>English</strong></div>
      </div>
    </Shell>
  );
}

function HowToPlay({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker="FIELD MANUAL"
      title="HOW TO PLAY"
      subtitle="Build a defense, survive endless waves, and push your record as far as possible."
    >
      <div className="how-to-grid">
        <section className="how-to-card">
          <span>1</span>
          <strong>CHOOSE A MODE</strong>
          <small>Single Gate, Tri-Gate, and Last Bastion each test survival in a different format.</small>
        </section>
        <section className="how-to-card">
          <span>2</span>
          <strong>BUILD YOUR DEFENSE</strong>
          <small>Spend run gold on towers and support structures. Every run starts from equal combat power.</small>
        </section>
        <section className="how-to-card">
          <span>3</span>
          <strong>HOLD THE BASTION</strong>
          <small>Enemies follow their lanes toward your bastion. Survive wave after wave without losing the core.</small>
        </section>
        <section className="how-to-card">
          <span>4</span>
          <strong>ADAPT AS WAVES SCALE</strong>
          <small>Enemy types, elites, bosses, blessings, and later modifiers increase the pressure over time.</small>
        </section>
        <section className="how-to-card">
          <span>5</span>
          <strong>CHASE RECORDS</strong>
          <small>Single Gate and Tri-Gate keep separate records. Last Bastion also contributes to the matching survival record.</small>
        </section>
        <section className="how-to-card">
          <span>6</span>
          <strong>NO PAY-TO-WIN POWER</strong>
          <small>Permanent account progress is prestige, cosmetic, and statistical only. Combat power resets every run.</small>
        </section>
      </div>
    </Shell>
  );
}

function AuthModal({ mode, onClose, onSuccess }) {
  const [authMode, setAuthMode] = useState(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!supabase) {
      setError('Online authentication is not configured.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (authMode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (resetError) throw resetError;
        setNotice('If an account exists for this email, a password reset link has been sent.');
        return;
      }

      if (authMode === 'reset-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setNotice('Password updated. You can continue with your account.');
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 700);
        return;
      }

      if (authMode === 'register') {
        const { data, error: registerError } = await supabase.functions.invoke('register-player', {
          body: { email, password, displayName: name }
        });
        if (registerError || data?.error) throw new Error(data?.error || registerError?.message || 'signup_failed');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      onSuccess();
      onClose();
    } catch (err) {
      const code = String(err?.message || 'auth_failed');
      const friendly = {
        email_in_use: 'This email is already registered.',
        password_length: 'Password must be 8–72 characters.',
        invalid_email: 'Enter a valid email address.',
        invalid_display_name: 'Defender name must be 1–40 valid characters.',
        rate_limited: 'Too many attempts. Please try again later.',
        signup_temporarily_unavailable: 'Account creation is temporarily unavailable.',
        'Invalid login credentials': 'Email or password is incorrect.'
      };
      setError(friendly[code] || code);
    } finally {
      setBusy(false);
    }
  }

  const title =
    authMode === 'register' ? 'CREATE DEFENDER' :
    authMode === 'forgot' ? 'RESET PASSWORD' :
    authMode === 'reset-password' ? 'CHOOSE NEW PASSWORD' :
    'SIGN IN';

  return (
    <div className="auth-backdrop" onMouseDown={() => !busy && onClose()} role="presentation">
      <form className="auth-modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <p className="main-menu__kicker">BASTIONFALL ACCOUNT</p>
        <h3 id="auth-title">{title}</h3>
        <p className="auth-modal__copy">
          {authMode === 'register'
            ? 'Your account is active immediately. No email confirmation.'
            : authMode === 'forgot'
              ? 'Enter your account email and we will send a secure reset link.'
              : authMode === 'reset-password'
                ? 'Set a new password for your Bastionfall account.'
                : 'Continue your records from any device.'}
        </p>

        {authMode === 'register' && (
          <label>
            <span>Defender name</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength="40" required placeholder="Joker" />
          </label>
        )}

        {authMode !== 'reset-password' && (
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
        )}

        {authMode !== 'forgot' && (
          <label>
            <span>{authMode === 'reset-password' ? 'New password' : 'Password'}</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength="8"
              maxLength="72"
              required
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}
        {notice && <div className="auth-notice" role="status">{notice}</div>}

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy
            ? 'CONNECTING...'
            : authMode === 'register'
              ? 'CREATE ACCOUNT'
              : authMode === 'forgot'
                ? 'SEND RESET LINK'
                : authMode === 'reset-password'
                  ? 'SAVE NEW PASSWORD'
                  : 'SIGN IN'}
        </button>

        {authMode === 'login' && (
          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setAuthMode('forgot');
              setError('');
              setNotice('');
            }}
          >
            Forgot password?
          </button>
        )}

        {authMode !== 'reset-password' && (
          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'register' ? 'login' : authMode === 'login' ? 'register' : 'login');
              setError('');
              setNotice('');
            }}
          >
            {authMode === 'register' ? 'Already registered? Sign in' : authMode === 'login' ? 'New here? Create account' : 'Back to sign in'}
          </button>
        )}
      </form>
    </div>
  );
}

function App() {
  const restoredTftRun = loadTftRunSnapshot();
  const towerPlacementQa = (
    ['127.0.0.1', 'localhost'].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get('qa') === 'tower-placement'
  );
  const [screen, setScreen] = useState(towerPlacementQa ? SCREENS.SINGLE_GATE_RUN : restoredTftRun ? SCREENS.SINGLE_GATE_RUN : SCREENS.MENU);
  const [selectedMode, setSelectedMode] = useState(towerPlacementQa ? MODES.SINGLE_GATE : restoredTftRun ? MODES.TFT_SHOP : null);
  const [runState, setRunState] = useState(
    towerPlacementQa ? createInitialRunState(MODES.SINGLE_GATE, 'tower-placement-qa') : restoredTftRun?.run ?? null
  );
  const [personalBestByMode, setPersonalBestByMode] = useState({});
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const lastStandardProgressRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset-password');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase?.auth.signOut();
  }

  useEffect(() => {
    if (
      screen !== SCREENS.SINGLE_GATE_RUN ||
      ![MODES.SINGLE_GATE, MODES.TRI_GATE].includes(runState?.mode) ||
      !runState?.matchId ||
      !runState?.matchToken
    ) return;

    const checkpointKey = `${runState.matchId}:${runState.wave}`;
    if (lastStandardProgressRef.current === checkpointKey) return;
    lastStandardProgressRef.current = checkpointKey;

    reportStandardRunProgress(session, runState).then((result) => {
      if (!result.ok) {
        console.warn('Standard run progress checkpoint failed:', result.error);
      }
    });
  }, [screen, session, runState?.mode, runState?.matchId, runState?.matchToken, runState?.wave]);

  useEffect(() => {
    if (
      screen !== SCREENS.SINGLE_GATE_RUN ||
      runState?.mode !== MODES.LAST_BASTION ||
      runState?.phase !== RUN_PHASES.ENDED ||
      !runState?.matchToken ||
      runState?.lastBastionEliminationSent
    ) return;

    let cancelled = false;

    lastBastionEliminate(session, runState).then((result) => {
      if (cancelled || !result.ok) return;
      setRunState((current) => {
        if (!current || current.matchId !== runState.matchId) return current;
        if (!current.lastBastionEliminationSent) {
          emitGameFeedback(GAME_FEEDBACK_EVENTS.PLAYER_ELIMINATED, {
            wave: current.wave,
            placement: result.payload?.match?.selfPlacement ?? null
          });
          emitGameFeedback(GAME_FEEDBACK_EVENTS.SPECTATE_START, {
            aliveCount: (result.payload?.match?.participants ?? []).filter((participant) => participant.alive).length
          });
        }
        return {
          ...current,
          lastBastionEliminationSent: true,
          lastBastionParticipants: result.payload?.match?.participants ?? current.lastBastionParticipants ?? [],
          lastBastionWinnerSlot: result.payload?.match?.winnerSlot ?? null,
          lastBastionMatchStatus: result.payload?.match?.status ?? current.lastBastionMatchStatus ?? 'active'
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    screen,
    session,
    runState?.mode,
    runState?.phase,
    runState?.matchToken,
    runState?.matchId,
    runState?.lastBastionEliminationSent
  ]);

  useEffect(() => {
    if (
      screen === SCREENS.SINGLE_GATE_RUN &&
      runState?.phase === RUN_PHASES.ENDED &&
      runState?.endSnapshot
    ) {
      if (
        runState.mode === MODES.LAST_BASTION &&
        (runState.lastBastionMatchStatus !== 'finished' || !Number.isInteger(runState.endSnapshot?.placement))
      ) return;
      const mode = runState.endSnapshot.mode ?? MODES.SINGLE_GATE;
      const previous = personalBestByMode[mode] ?? null;
      const personalBestResult = comparePersonalBest(runState.endSnapshot, previous);

      setRunState((current) => {
        if (!current || current.personalBestResult) return current;
        return { ...current, personalBestResult };
      });

      if (personalBestResult.isPersonalBest) {
        emitGameFeedback(GAME_FEEDBACK_EVENTS.PERSONAL_BEST, {
          mode,
          wave: runState.endSnapshot.wave,
          score: runState.endSnapshot.score
        });
        setPersonalBestByMode((current) => ({
          ...current,
          [mode]: personalBestResult.candidate
        }));
      }

      setScreen(SCREENS.RESULTS);
    }
  }, [screen, runState?.phase, runState?.endSnapshot, personalBestByMode]);

  useEffect(() => {
    if (
      screen !== SCREENS.SINGLE_GATE_RUN ||
      runState?.mode !== MODES.LAST_BASTION ||
      !runState?.matchToken ||
      runState?.phase === RUN_PHASES.ENDED
    ) return undefined;

    let cancelled = false;

    const sendHeartbeat = async () => {
      const result = await lastBastionMatchHeartbeat(session, runState);
      if (cancelled || !result.ok || !result.payload?.match) return;

      setRunState((current) => {
        if (!current || current.matchId !== result.payload.match.id) return current;
        return {
          ...current,
          lastBastionParticipants: result.payload.match.participants ?? current.lastBastionParticipants ?? [],
          lastBastionFairness: result.payload.match.fairness ?? current.lastBastionFairness ?? null
        };
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    screen,
    session,
    runState?.mode,
    runState?.matchId,
    runState?.matchToken,
    runState?.phase,
    runState?.wave,
    runState?.coreHp
  ]);

  useEffect(() => {
    if (
      screen !== SCREENS.SINGLE_GATE_RUN ||
      runState?.mode !== MODES.LAST_BASTION ||
      !runState?.matchToken
    ) return undefined;

    let cancelled = false;

    const refreshMatchStatus = async () => {
      const result = await lastBastionMatchStatus(session, runState);
      if (cancelled || !result.ok || !result.payload?.match) return;

      setRunState((current) => {
        if (!current || current.matchId !== result.payload.match.id) return current;

        const nextStatus = result.payload.match.status ?? current.lastBastionMatchStatus ?? 'active';
        const placement = Number(result.payload.match.selfPlacement);
        const won = result.payload.match.selfWon === true;
        const matchFinished =
          nextStatus === 'finished' &&
          Number.isInteger(placement) &&
          placement >= 1;

        if (matchFinished) {
          if (won && current.lastBastionMatchStatus !== 'finished') {
            emitGameFeedback(GAME_FEEDBACK_EVENTS.LAST_BASTION_WIN, {
              placement,
              wave: current.wave
            });
          }
          const endedAtMs = current.endedAtMs ?? Date.now();
          const reason = won ? 'last-bastion-win' : RUN_END_REASONS.BASTION_DESTROYED;
          const endedRun = {
            ...current,
            phase: RUN_PHASES.ENDED,
            elapsedMs: current.elapsedMs || getElapsedRunMs(current.startedAtMs, endedAtMs),
            endedAtMs,
            result: reason,
            lastBastionParticipants:
              result.payload.match.participants ?? current.lastBastionParticipants ?? [],
            lastBastionFairness:
              result.payload.match.fairness ?? current.lastBastionFairness ?? null,
            lastBastionWinnerSlot:
              result.payload.match.winnerSlot ?? current.lastBastionWinnerSlot ?? null,
            lastBastionMatchStatus: nextStatus,
            lastBastionPlacement: placement,
            lastBastionWon: won
          };

          const baseSnapshot = current.endSnapshot ??
            createRunEndSnapshot(endedRun, reason);

          return {
            ...endedRun,
            endSnapshot: Object.freeze({
              ...baseSnapshot,
              reason,
              placement,
              won,
              participantCount: result.payload.match.participantCount ?? 0
            })
          };
        }

        return {
          ...current,
          lastBastionParticipants:
            result.payload.match.participants ?? current.lastBastionParticipants ?? [],
          lastBastionFairness:
            result.payload.match.fairness ?? current.lastBastionFairness ?? null,
          lastBastionWinnerSlot:
            result.payload.match.winnerSlot ?? current.lastBastionWinnerSlot ?? null,
          lastBastionMatchStatus: nextStatus
        };
      });
    };

    refreshMatchStatus();
    const intervalId = window.setInterval(refreshMatchStatus, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    screen,
    session,
    runState?.mode,
    runState?.matchId,
    runState?.matchToken
  ]);

  useEffect(() => {
    if (
      screen !== SCREENS.RESULTS ||
      !runState?.endSnapshot ||
      !runState?.matchToken ||
      completedMatchId === runState?.matchId
    ) return;

    let cancelled = false;

    completeServerRun(session, runState).then((result) => {
      if (cancelled || !result.ok) return;
      setCompletedMatchId(runState.matchId);
    });

    return () => {
      cancelled = true;
    };
  }, [screen, runState?.endSnapshot, runState?.matchToken, runState?.matchId, session, completedMatchId]);

  if (screen === SCREENS.PLAY) {
    return (
      <ModeSelect
        onBack={() => setScreen(SCREENS.MENU)}
        onSelect={(mode) => {
          setSelectedMode(mode);
          setScreen(SCREENS.MODE_PREP);
        }}
      />
    );
  }
  if (screen === SCREENS.MODE_PREP) {
    return (
      <ModePreRun
        mode={selectedMode}
        session={session}
        onBack={() => setScreen(SCREENS.PLAY)}
        onStart={async (mode, preparedMatch = null) => {
          if (mode !== MODES.SINGLE_GATE && mode !== MODES.TFT_SHOP && mode !== MODES.LAST_BASTION) return;
          const started = preparedMatch
            ? { ok: true, match: preparedMatch }
            : mode === MODES.TFT_SHOP
              ? { ok: true, match: { id: null, token: null, startedAt: null, seed: `${MODES.TFT_SHOP}:${Date.now()}` } }
              : await startServerMatch(session, mode);
          if (!started.ok) return;
          const nextRun = createInitialRunState(mode, started.match.seed, started.match);
          if (!nextRun) return;
          if (mode === MODES.TFT_SHOP) clearTftRunSnapshot();
          setRunState(nextRun);
          setScreen(SCREENS.SINGLE_GATE_RUN);
        }}
      />
    );
  }
  if (screen === SCREENS.SINGLE_GATE_RUN) {
    return (
      <SoloRun
        run={runState}
        onTimerTick={(elapsedMs) => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            return { ...current, elapsedMs };
          });
        }}
        onSpendGold={(amount) => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            const spend = Math.max(0, Number(amount) || 0);
            if (current.gold < spend) return current;
            return { ...current, gold: current.gold - spend };
          });
        }}
        onGainGold={(amount) => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            const gain = Math.max(0, Number(amount) || 0);
            return { ...current, gold: current.gold + gain };
          });
        }}
        onEnemyKilled={() => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            return { ...current, kills: Math.max(0, Number(current.kills) || 0) + 1 };
          });
        }}
        onDamageBastion={(damage) => {
          setRunState((current) => {
            if (!current) return current;
            const adjustedDamage = applyBlessingBastionDamage(damage, current.coreHp, current.coreMaxHp, current.blessings ?? []);
            const nextHp = Math.max(0, current.coreHp - adjustedDamage);
            emitGameFeedback(GAME_FEEDBACK_EVENTS.BASTION_HIT, {
              damage: adjustedDamage,
              coreHp: nextHp,
              coreMaxHp: current.coreMaxHp
            });
            if (
              nextHp > 0 &&
              nextHp / Math.max(1, current.coreMaxHp) <= 0.25 &&
              current.coreHp / Math.max(1, current.coreMaxHp) > 0.25
            ) {
              emitGameFeedback(GAME_FEEDBACK_EVENTS.BASTION_LOW_HP, {
                coreHp: nextHp,
                coreMaxHp: current.coreMaxHp
              });
            }
            if (nextHp !== 0) {
              return {
                ...current,
                coreHp: nextHp,
                bastionHitId: current.bastionHitId + 1
              };
            }

            const endedAtMs = Date.now();
            const endedRun = {
              ...current,
              coreHp: 0,
              bastionHitId: current.bastionHitId + 1,
              phase: RUN_PHASES.ENDED,
              elapsedMs: getElapsedRunMs(current.startedAtMs, endedAtMs),
              endedAtMs,
              result: RUN_END_REASONS.BASTION_DESTROYED
            };

            return {
              ...endedRun,
              endSnapshot: createRunEndSnapshot(endedRun, RUN_END_REASONS.BASTION_DESTROYED)
            };
          });
        }}
        onPhaseChange={(nextPhase, options = {}) => {
          setRunState((current) => {
            if (!current || !canTransitionWavePhase(current.phase, nextPhase)) return current;
            const advancingWave = Boolean(options.advanceWave);
            const completedWaveNumber = Math.max(1, current.wave + 1);
            if (nextPhase === RUN_PHASES.ACTIVE) {
              emitGameFeedback(GAME_FEEDBACK_EVENTS.WAVE_START, {
                wave: completedWaveNumber,
                mode: current.mode
              });
              if (isBossWave(completedWaveNumber)) {
                emitGameFeedback(GAME_FEEDBACK_EVENTS.BOSS_WAVE, {
                  wave: completedWaveNumber,
                  mode: current.mode
                });
              }
            }
            const baseWaveClearGold = advancingWave
              ? current.mode === MODES.TRI_GATE
                ? getTriGateWaveClearReward(completedWaveNumber)
                : current.mode === MODES.TFT_SHOP
                  ? TFT_SHOP.waveClearGold
                  : getWaveClearReward(completedWaveNumber)
              : 0;
            const tftPerfectWave =
              current.mode === MODES.TFT_SHOP &&
              advancingWave &&
              Number(current.coreHp ?? 0) >= Number(current.waveStartCoreHp ?? current.coreHp ?? 0);
            const tftBossWave =
              current.mode === MODES.TFT_SHOP &&
              advancingWave &&
              isBossWave(completedWaveNumber);
            const tftMilestoneWave =
              current.mode === MODES.TFT_SHOP &&
              advancingWave &&
              completedWaveNumber % TFT_SHOP.milestoneInterval === 0;
            const tftWaveBonus =
              current.mode === MODES.TFT_SHOP && advancingWave
                ? (tftPerfectWave ? TFT_SHOP.perfectWaveBonus : 0) +
                  (tftBossWave ? TFT_SHOP.bossWaveBonus : 0) +
                  (tftMilestoneWave ? TFT_SHOP.milestoneWaveBonus : 0)
                : 0;
            const nextBlessings = options.blessingId
              ? addBlessingToLoadout(current.blessings ?? [], options.blessingId)
              : current.blessings ?? [];
            const activeModifiersForClear = getActiveWorldModifiers(current.seed ?? 'run', completedWaveNumber);
            const worldEffectsForClear = getWorldModifierEffects(activeModifiersForClear);
            const modeAdjustedWaveClearGold = advancingWave
              ? current.mode === MODES.TFT_SHOP
                ? baseWaveClearGold + tftWaveBonus
                : Math.max(0, Math.round(applyBlessingWaveGold(baseWaveClearGold, nextBlessings) * worldEffectsForClear.waveGoldMultiplier))
              : 0;
            const waveClearGold = advancingWave
              ? applyRiskRewardGold(modeAdjustedWaveClearGold, current.mode, options.riskRewardTier ?? 'safe')
              : 0;
            const nextMaxHp = getBlessingAdjustedMaxHp(RUN_DEFAULTS.coreHp, nextBlessings);
            const maxHpGain = Math.max(0, nextMaxHp - current.coreMaxHp);

            return {
              ...current,
              phase: nextPhase,
              wave: advancingWave ? current.wave + 1 : current.wave,
              gold: current.gold + waveClearGold + Math.max(0, Number(options.miniObjectiveGold) || 0),
              waveStartCoreHp: nextPhase === RUN_PHASES.ACTIVE ? current.coreHp : current.waveStartCoreHp,
              blessings: nextBlessings,
              coreMaxHp: nextMaxHp,
              coreHp: Math.min(nextMaxHp, current.coreHp + maxHpGain)
            };
          });
        }}
        onExit={() => {
          if (runState?.mode === MODES.TFT_SHOP) clearTftRunSnapshot();
          setRunState(null);
          setScreen(SCREENS.MODE_PREP);
        }}
      />
    );
  }
  if (screen === SCREENS.RESULTS) {
    return (
      <ResultsScreen
        snapshot={runState?.endSnapshot}
        personalBestResult={runState?.personalBestResult ?? null}
        onRetry={async () => {
          const mode = runState?.mode ?? selectedMode;
          if (mode !== MODES.SINGLE_GATE) return;
          const started = await startServerMatch(session, mode);
          if (!started.ok) return;
          const nextRun = createInitialRunState(mode, started.match.seed, started.match);
          if (!nextRun) return;
          setRunState(nextRun);
          setScreen(SCREENS.SINGLE_GATE_RUN);
        }}
        onBack={() => {
          setRunState(null);
          setScreen(SCREENS.MODE_PREP);
        }}
      />
    );
  }
  if (screen === SCREENS.LEADERBOARD) return <Leaderboard session={session} onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.PROFILE) return <Profile session={session} onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.SETTINGS) return <Settings onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.HOW_TO_PLAY) return <HowToPlay onBack={() => setScreen(SCREENS.MENU)} />;

  return (
    <main className="main-menu">
      <div className="menu-creature menu-creature--left" aria-hidden="true"><img src="/assets/enemies/gryphon-knight.png" alt="" /></div>
      <div className="menu-creature menu-creature--right" aria-hidden="true"><img src="/assets/enemies/rift-juggernaut.png" alt="" /></div>
      <section className="main-menu__content" aria-label="Bastionfall main menu">
        <p className="main-menu__kicker">ENDLESS TOWER DEFENSE</p>
        <h1>BASTIONFALL</h1>
        <p className="main-menu__tagline">Build. Hold. Survive.</p>

        <div className="account-strip">
          {session ? (
            <>
              <span>ONLINE · {session.user.email}</span>
              <button onClick={logout}>SIGN OUT</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')}>SIGN IN</button>
              <button onClick={() => setAuthMode('register')}>CREATE ACCOUNT</button>
            </>
          )}
        </div>

        <nav className="main-menu__actions" aria-label="Primary navigation">
          <button
            className="main-menu__button main-menu__button--primary"
            onClick={() => setScreen(SCREENS.PLAY)}
          >
            PLAY
          </button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.PROFILE)}>PROFILE</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.LEADERBOARD)}>LEADERBOARDS</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.HOW_TO_PLAY)}>HOW TO PLAY</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.SETTINGS)}>SETTINGS</button>
        </nav>

        <p className="main-menu__version">Prototype v0.1.0</p>
      </section>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={() => {}}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
