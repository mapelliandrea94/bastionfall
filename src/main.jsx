import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
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
import { applyTowerSynergy, getNewlyActivatedTowerSynergies, getTowerSynergyState, getTowerSynergyVisualCue } from './game/towers/towerSynergies.js';
import { getActiveTowerCombos, getTowerComboDamageMultiplier } from './game/towers/towerCombos.js';
import { NORMAL_MODE_TOWERS, NORMAL_MODE_TOWERS_BY_ID, getNormalBuildRosterFixtures } from './game/towers/normalBuildRoster.js';
import { BASE_TOWER_GAMEPLAY_BY_ID, getBaseTowerGameplayFixtures } from './game/towers/baseTowerGameplay.js';
import { getTowerAttackVisual } from './game/towers/attackVisuals.js';
import { TOWER_EVOLUTIONS, canChooseEvolution, chooseTowerEvolution, getEvolutionChoices, getEvolutionFixtures, getEvolutionVisualCue, getRuntimeTowerDefinition } from './game/towers/evolutions.js';
import { TOWER_ART_SYSTEM, getTowerArtFixtures, getTowerArtStyle, getTowerArtStyleForTower } from './game/towers/towerArt.js';
import { getEffectiveTowerRange, getTowerRangeKind } from './game/towers/towerRange.js';
import { getTowerEvolutionIntegrityPass, getTowerEvolutionIntegrityQa } from './game/towers/towerEvolutionIntegrityQa.js';
import { getLeaderboardPresentation } from './game/records/leaderboardPresentation.js';
import { getNormalModeEvolutionFlowPass, getNormalModeEvolutionFlowQa } from './game/towers/normalModeEvolutionFlowQa.js';
import { TFT_SHOP, createTftShopOffers, getTftShopFixtures } from './game/tft/tftShop.js';
import { TFT_BENCH, addCopyToBench, createEmptyBench, getTftBenchFixtures, removeCopyFromBench } from './game/tft/tftBench.js';
import { TFT_COPY_PROGRESSION, canMergeTftCopy, getTftAscensionTier, getTftCopyProgressionFixtures, getTftFieldMergeOutcome, getTftLevelForCopyProgress, getTftProgressDenominator, mergeTftCopyProgress } from './game/tft/tftCopyProgression.js';
import { TFT_PERSISTENCE, clearTftRunSnapshot, createTftRunSnapshot, getTftPersistenceFixtures, loadTftRunSnapshot, saveTftRunSnapshot } from './game/tft/tftPersistence.js';
import { getTftEvolutionFlowPass, getTftEvolutionFlowQa } from './game/tft/tftEvolutionFlowQa.js';
import { getEvolutionPersistenceSellReconnectPass, getEvolutionPersistenceSellReconnectQa } from './game/tft/evolutionPersistenceSellReconnectQa.js';
import { MAGE_TOWER } from './game/towers/mage.js';
import { BALLISTA_TOWER } from './game/towers/ballista.js';
import { BARRACKS } from './game/structures/barracks.js';
import { COMBAT_BALANCE_MODEL, COMBAT_BALANCE_SNAPSHOT } from './game/balance/combatBalance.js';
import { getPlacementValidationFixtures, getTowerSlotPurchaseFixtures, tryPurchaseDefenseOnSlot, validateSingleGatePlacement } from './game/placement/singleGatePlacement.js';
import { SELL_ECONOMY, getSellPreview } from './game/economy/sellEconomy.js';
import { ECONOMY_BASELINE, getEconomyBaselineFixtures, getEnemyKillReward, getWaveClearReward } from './game/economy/economyBaseline.js';
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
import { SUDDEN_SIEGE, applySuddenSiegeEnemyScaling, getSuddenSiegeBattlefieldVisual, getSuddenSiegeStageTransition, getSuddenSiegeTelemetry, getSuddenSiegeWaveReward, getSuddenSiegeWaveScaling } from './game/balance/suddenSiege.js';
import { applyRiskRewardGold, getRiskRewardConfig, getRiskRewardVisualState } from './game/balance/riskReward.js';
import { evaluateMiniObjective, getMiniObjectiveForWave, getMiniObjectiveLiveState, getMiniObjectiveReward } from './game/objectives/miniObjectives.js';
import { applyWaveAffix, getWaveAffix } from './game/waves/waveAffixes.js';
import { applyRareWaveEvent, getRareWaveEvent } from './game/waves/rareWaveEvents.js';
import { BOSS_SCHEDULE, getBossScheduleFixtures, getUpcomingBossWave, isBossWave } from './game/boss/bossSchedule.js';
import { BOSS_ARMOR_ENRAGE, applyBossEnrageStats, getBossArmorEnrageFixtures, getBossArmorForIndex } from './game/boss/bossArmorEnrage.js';
import { BOSS_TUNING, getBossTuningFixtures, getBossTuningForWave } from './game/boss/bossTuning.js';
import { BLESSINGS, BLESSING_SYSTEM, addBlessingToLoadout, getBlessingOffer, getBlessingSystemFixtures } from './game/blessings/blessings.js';
import { BLESSING_ENGINE, applyBlessingBastionDamage, applyBlessingTowerIdentity, applyBlessingWaveGold, getBlessingAdjustedMaxHp, getBlessingEngineFixtures, getBlessingIdentityVisualCue, getBlessingModifiers } from './game/blessings/blessingEngine.js';
import { BLESSING_REROLL, canRerollBlessings, getBlessingRerollCost, getBlessingRerollFixtures, getRerolledBlessingOffer } from './game/blessings/blessingReroll.js';
import { BLESSING_POWER_BUDGET, getBlessingExploitChecks } from './game/blessings/blessingPowerBudget.js';
import { BOSS_SUMMON_ADDS, getBossSummonAddsFixtures, getBossSummonAddsPlan } from './game/boss/bossSummonAdds.js';
import { RUN_TIMER, formatSurvivalTime, getElapsedRunMs, getRunTimerFixtures } from './game/run/runTimer.js';
import { RUN_SCORE, calculateRunScore, getRunScoreFixtures } from './game/run/runScore.js';
import { RUN_END_REASONS, createRunEndSnapshot, getRunEndFixtures } from './game/run/runEndSnapshot.js';
import { getEndlessMilestone } from './game/run/endlessMilestones.js';
import { ACCOUNT_PROGRESSION, getAccountProgress } from './game/profile/accountProgression.js';
import { PERSONAL_BEST, comparePersonalBest, getPersonalBestFixtures } from './game/run/personalBest.js';
import { ENEMY_BASE_MODEL, applyEnemyDamage, getEnemyBaseFixtures, getEnemyEffectiveSpeed } from './game/enemies/enemyBase.js';
import { ENEMY_ROSTER, createRosterEnemyState, getEnemyRosterFixtures } from './game/enemies/enemyRoster.js';
import { getCleanEnemyArt } from './game/enemies/cleanEnemyArt.js';

// Older waves and boss summons still use these archetypes instead of roster IDs.
const LEGACY_ENEMY_ART = Object.freeze({
  normal: 'footman', runner: 'skitterling', tank: 'carapace-beast',
  armored: 'ironclad', shielded: 'null-guardian', flying: 'stinger'
});
import { NORMAL_ENEMY, createNormalEnemyState, getNormalEnemyBudget } from './game/enemies/normal.js';
import { RUNNER_ENEMY, createRunnerEnemyState, getRunnerEnemyBudget } from './game/enemies/runner.js';
import { TANK_ENEMY, createTankEnemyState, getTankEnemyBudget } from './game/enemies/tank.js';
import { ARMORED_ENEMY, createArmoredEnemyState, getArmoredEnemyBudget } from './game/enemies/armored.js';
import { SHIELDED_ENEMY, createShieldedEnemyState, getShieldedEnemyBudget } from './game/enemies/shielded.js';
import { FLYING_ENEMY, createFlyingEnemyState, getFlyingEnemyBudget } from './game/enemies/flying.js';
import { ELITE_MODIFIER_SYSTEM, applyEliteModifiers, attachEliteModifierFoundation, getEliteModifierFoundationFixtures } from './game/elites/eliteModifiers.js';
import { WORLD_MODIFIER_SYSTEM, getActiveWorldModifiers, getWorldModifierEffects, getWorldModifierFoundationFixtures } from './game/world/worldModifiers.js';
import { GAME_FEEDBACK_EVENTS, emitGameFeedback, getGameFeedbackFixtures } from './game/feedback/gameFeedback.js';
import { SUPPORTED_LANGUAGES, gameText, getLanguage, setLanguage, t } from './i18n/localization.js';
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
  TFT_SHOP: 'tft-shop',
  SUDDEN_SIEGE: 'sudden-siege'
});

const isShopMode = (mode) => mode === MODES.TFT_SHOP || mode === MODES.SUDDEN_SIEGE;

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
    status: 'READY TO INITIALIZE'
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
  [MODES.SUDDEN_SIEGE]: Object.freeze({
    kicker: 'SUDDEN SIEGE',
    title: 'ROLL FAST. DIE LATE.',
    description: 'TFT Shop rules with harder scaling, faster pressure and shorter preparation.',
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
  if (mode === MODES.TRI_GATE) return getTriGateWaveScaling(waveNumber);
  if (mode === MODES.SUDDEN_SIEGE) return getSuddenSiegeWaveScaling(waveNumber);
  return getBandWaveScaling(waveNumber);
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
    preparationSeconds:
      mode === MODES.TRI_GATE
        ? TRI_GATE_PACING.preparationSeconds
        : mode === MODES.SUDDEN_SIEGE
          ? SUDDEN_SIEGE.preparationSeconds
          : RUN_DEFAULTS.preparationSeconds,
    wave: 0,
    gold:
      mode === MODES.TRI_GATE
        ? TRI_GATE_PACING.startingGold
        : isShopMode(mode)
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
    towerMilestones: Object.freeze({ seven: 0, fourteen: 0 }),
    deathRecap: Object.freeze({ nexusDamage: 0, escapedEnemies: 0, byUnitType: Object.freeze({}), byFaction: Object.freeze({}), lastThreat: null }),
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
      towerMilestones: snapshot.towerMilestones ?? { seven: 0, fourteen: 0 },
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
    cache: 'no-store',
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

  const response = await fetch(`/api/leaderboards/${encodeURIComponent(mode)}?limit=10`, {
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
      <section className="mode-screen" aria-labelledby="screen-title">
        <button className="mode-screen__back" onClick={onBack} aria-label={`${t('back')} · ${title}`}>← {t('back')}</button>
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
      kicker={t('chooseDefense')}
      title={t('selectMode')}
      subtitle={t('selectModeSubtitle')}
    >
      <div className="mode-grid" role="group" aria-label="Game modes">
        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.SINGLE_GATE)}>
          <span className="mode-card__players">{t('oneFront')}</span>
          <strong>SINGLE GATE</strong>
          <small>{t('singleGateDesc')}</small>
          <em>{t('selectMode')}</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.TRI_GATE)}>
          <span className="mode-card__players">{t('threeFronts')}</span>
          <strong>TRI-GATE</strong>
          <small>{t('triGateDesc')}</small>
          <em>{t('selectMode')}</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.TFT_SHOP)}>
          <span className="mode-card__players">{t('shopSurvival')}</span>
          <strong>TFT SHOP</strong>
          <small>{t('tftShopDesc')}</small>
          <em>{t('selectMode')}</em>
        </button>

        <button className="mode-card mode-card--ready mode-card--sudden" onClick={() => onSelect(MODES.SUDDEN_SIEGE)}>
          <span className="mode-card__players">{t('fastShopSurvival')}</span>
          <strong>SUDDEN SIEGE</strong>
          <small>{t('suddenSiegeDesc')}</small>
          <b className="mode-card__danger-badge">{t('escalatingThreat')}</b>
          <em>{t('selectMode')}</em>
        </button>

        <button className="mode-card mode-card--ready" onClick={() => onSelect(MODES.LAST_BASTION)}>
          <span className="mode-card__players">{t('competitiveSurvival')}</span>
          <strong>LAST BASTION</strong>
          <small>{t('lastBastionDesc')}</small>
          <em>{t('selectMode')}</em>
        </button>
      </div>
    </Shell>
  );
}


function TriGateBattlefieldPreview() {
  return (
    <section
      className="tri-gate-preview"
      aria-label="Tri-Gate battlefield preview"
      data-tri-gate-rendered-lanes={TRI_GATE_MAP.pathPlan.lanes.length}
      data-tri-gate-rendered-entrances={TRI_GATE_MAP.anchors.entrances.length}
    >
      <div className="tri-gate-preview__header">
        <span>{t('threeFronts')}</span>
        <strong>{TRI_GATE_MAP.name}</strong>
        <small>Three entrances, one Nexus, 19 tower pads.</small>
      </div>
      <img
        className="tri-gate-preview__map"
        src="/assets/maps/tri-gate.webp"
        width="1600"
        height="900"
        alt="Three roads converge from the west, north and south toward the central Nexus, with 19 tower pads"
      />
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
      subtitle={t('lastBastionSubtitle')}
    >
      <div className="pre-run-grid">
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('queue')}</span>
          <strong>{state.queued ? `#${state.ticket?.position ?? '-'}` : 'NOT QUEUED'}</strong>
          <small>{state.queuedPlayers} defender{state.queuedPlayers === 1 ? '' : 's'} queued</small>
        </section>
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('status').toUpperCase()}</span>
          <strong>{state.ticket?.ready ? t('ready') : state.queued ? t('waiting') : t('idle')}</strong>
          <small>{state.ticket?.ready ? 'Ready for matchmaking.' : 'Ready status can be changed any time before match start.'}</small>
        </section>
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('match')}</span>
          <strong>
            {state.matched
              ? t('matchFound')
              : state.readyPlayers >= 2 && Number.isFinite(Number(state.fillWindowRemainingMs))
                ? `FILLING ${Math.max(0, Math.ceil(Number(state.fillWindowRemainingMs) / 1000))}s`
                : t('sharedSiege')}
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
          <button className="pre-run-start" onClick={join} disabled={state.loading}>{t('joinQueue')}<small>{t('enterMatchmaking')}</small></button>
        ) : (
          <div className="last-bastion-lobby-actions">
            <button className="pre-run-start" onClick={() => setReady(!state.ticket?.ready)}>
              {state.ticket?.ready ? t('notReady') : t('ready')}
              <small>{state.ticket?.ready ? t('returnWaiting') : t('lockMatch')}</small>
            </button>
            <button className="mode-screen__back" onClick={leave}>{t('leaveQueue')}</button>
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
      title={gameText(contract.title)}
      subtitle={gameText(contract.description)}
    >
      <div className="pre-run-grid">
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('format')}</span>
          <strong>{gameText(contract.fronts)}</strong>
          <small>{mode === MODES.TRI_GATE ? 'Three rendered fronts converge on one central Bastion.' : 'Single-front battlefield.'}</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('objective')}</span>
          <strong>{gameText(contract.objective)}</strong>
          <small>{t('equalCombatPower')}</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">{t('record')}</span>
          <strong>{gameText(contract.record)}</strong>
          <small>{t('modePersistence')}</small>
        </section>
      </div>

      {mode === MODES.TRI_GATE && <TriGateBattlefieldPreview />}

      <div className="pre-run-footer">
        <p>{t('status')}: <strong>{getLanguage() === SUPPORTED_LANGUAGES.IT_IT ? t('readyToInitialize') : contract.status}</strong></p>
        <button
          className="pre-run-start"
          disabled={mode === MODES.LAST_BASTION}
          onClick={() => mode !== MODES.LAST_BASTION && onStart(mode)}
        >
          {t('startRun')}
          <small>{mode !== MODES.LAST_BASTION ? t('initializeRun') : contract.status}</small>
        </button>
      </div>
    </Shell>
  );
}


function TowerAttackEffect({ shot, speed = 1 }) {
  const { x, y, dx, dy, visual, duration, faction } = shot;
  const targetX = x + dx;
  const targetY = y + dy;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const isBeam = ['beam', 'chain', 'mark'].includes(visual);
  const isAura = visual === 'aura';
  const blast = ['shell', 'flak', 'plasma', 'venom', 'acid', 'frost', 'pulse', 'swarm'].includes(visual);
  const flightStyle = { '--shot-x': `${dx}px`, '--shot-y': `${dy}px`, animationDuration: `${duration / speed}ms` };

  return (
    <g className={`tower-attack tower-attack--${visual} tower-attack--${faction}`}>
      {isBeam ? (
        <g className="tower-attack__beam" style={{ animationDuration: `${Math.min(duration + 100, 320) / speed}ms` }}>
          <path className="tower-attack__beam-glow" d={visual === 'chain'
            ? `M ${x} ${y} Q ${(x + targetX) / 2 + 12} ${(y + targetY) / 2 - 9} ${targetX} ${targetY}`
            : `M ${x} ${y} L ${targetX} ${targetY}`} />
          <path className="tower-attack__beam-core" d={visual === 'chain'
            ? `M ${x} ${y} Q ${(x + targetX) / 2 + 12} ${(y + targetY) / 2 - 9} ${targetX} ${targetY}`
            : `M ${x} ${y} L ${targetX} ${targetY}`} />
        </g>
      ) : isAura ? (
        <circle className="tower-attack__aura" cx={x} cy={y} r="14" />
      ) : (
        <g transform={`translate(${x} ${y})`}>
          <g className="tower-attack__travel" style={flightStyle}>
            <g transform={`rotate(${angle})`}>
              {visual === 'arrow' || visual === 'spike' ? (
                <>
                  <path className="tower-attack__trail" d="M -22 0 L -3 0" />
                  <path className="tower-attack__arrow" d={visual === 'spike' ? 'M 12 0 L -9 -5 L -5 0 L -9 5 Z' : 'M 12 0 L 3 -5 L 5 -1 L -9 -1 L -9 1 L 5 1 L 3 5 Z'} />
                </>
              ) : visual === 'bullet' || visual === 'flak' ? (
                <><path className="tower-attack__trail" d="M -19 0 L -3 0" /><ellipse className="tower-attack__body" cx="4" cy="0" rx={visual === 'flak' ? 5 : 7} ry={visual === 'flak' ? 4 : 2.5} /></>
              ) : visual === 'shell' ? (
                <><path className="tower-attack__trail" d="M -22 0 L -5 0" /><path className="tower-attack__body" d="M -7 -5 L 5 -5 Q 13 0 5 5 L -7 5 Z" /></>
              ) : visual === 'swarm' ? (
                <><circle className="tower-attack__body" cx="6" cy="0" r="3" /><circle className="tower-attack__body" cx="-2" cy="-5" r="2.5" /><circle className="tower-attack__body" cx="-4" cy="5" r="2.5" /></>
              ) : visual === 'frost' ? (
                <><path className="tower-attack__crystal" d="M 10 0 L 0 7 L -8 0 L 0 -7 Z" /><path className="tower-attack__trail" d="M -18 0 L -9 0" /></>
              ) : (
                <><path className="tower-attack__trail" d="M -19 0 L -5 0" /><circle className="tower-attack__body" cx="3" cy="0" r={visual === 'plasma' ? 7 : 5} /></>
              )}
            </g>
          </g>
        </g>
      )}
      {blast && <circle className="tower-attack__impact" cx={targetX} cy={targetY} r={visual === 'shell' || visual === 'plasma' ? 15 : 10} style={{ animationDelay: `${duration / speed}ms` }} />}
    </g>
  );
}

function SoloRun({ run, onExit, onDamageBastion, onPhaseChange, onTimerTick, onSpendGold, onGainGold, onEnemyKilled, onTowerMilestone }) {
  const [cleanEnemyArt, setCleanEnemyArt] = useState({});
  useEffect(() => {
    let active = true;
    ENEMY_ROSTER.enemies.forEach(({ id }) => {
      getCleanEnemyArt(id).then((url) => {
        if (active) setCleanEnemyArt((current) => ({ ...current, [id]: url }));
      });
    });
    return () => { active = false; };
  }, []);
  const restoredTftSnapshot = useRef(isShopMode(run?.mode) ? loadTftRunSnapshot() : null);
  const matchingTftSnapshot = restoredTftSnapshot.current?.run?.seed === run?.seed ? restoredTftSnapshot.current : null;
  const towerMilestoneAwardsRef = useRef(new Set());
  const reportTowerMilestones = (towerId, previousProgress, nextProgress) => {
    if (!towerId || typeof onTowerMilestone !== 'function') return;
    [TFT_COPY_PROGRESSION.evolutionCopies, TFT_COPY_PROGRESSION.goldAscensionCopies].forEach((threshold) => {
      if (previousProgress >= threshold || nextProgress < threshold) return;
      const key = `${towerId}:${threshold}`;
      if (towerMilestoneAwardsRef.current.has(key)) return;
      towerMilestoneAwardsRef.current.add(key);
      onTowerMilestone(threshold);
    });
  };
  const [spawnQueue, setSpawnQueue] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [preparationRemaining, setPreparationRemaining] = useState(run?.preparationSeconds ?? RUN_DEFAULTS.preparationSeconds);
  const [selectedDefenseId, setSelectedDefenseId] = useState('human-aa');
  const [placedDefenses, setPlacedDefenses] = useState(() => {
    const restored = matchingTftSnapshot?.placedDefenses ?? [];
    if (!isShopMode(run?.mode)) return restored;
    return restored.map((tower, index) => ({
      ...tower,
      id: tower.sourceCopyId
        ? `field:${tower.sourceCopyId}`
        : `field-restored:${tower.id ?? tower.defenseId ?? 'tower'}:${index}`
    }));
  });
  const [activeWallIds, setActiveWallIds] = useState(() => matchingTftSnapshot?.activeWallIds ?? []);
  const [wallHpById, setWallHpById] = useState(() => matchingTftSnapshot?.wallHpById ?? {});
  const [hoveredSlotId, setHoveredSlotId] = useState(null);
  const [selectedPlacedDefenseId, setSelectedPlacedDefenseId] = useState(null);
  const [movingPlacedDefenseId, setMovingPlacedDefenseId] = useState(null);
  const [swappingPlacedDefenseId, setSwappingPlacedDefenseId] = useState(null);
  const [mergingPlacedDefenseId, setMergingPlacedDefenseId] = useState(null);
  const [riskRewardTier, setRiskRewardTier] = useState('safe');
  const [miniObjectiveFeedback, setMiniObjectiveFeedback] = useState('');
  const [synergyFeedback, setSynergyFeedback] = useState(null);
  const [suddenStageTransition, setSuddenStageTransition] = useState(null);
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
  const [tftAutoStartEnabled, setTftAutoStartEnabled] = useState(false);
  const [waveSpeed, setWaveSpeed] = useState(1);
  const waveClockRef = useRef({ real: performance.now(), virtual: performance.now(), speed: 1 });
  const getWaveNow = () => {
    const clock = waveClockRef.current;
    const real = performance.now();
    clock.virtual += Math.max(0, real - clock.real) * clock.speed;
    clock.real = real;
    return clock.virtual;
  };
  const toggleWaveSpeed = () => {
    getWaveNow(); // Settle elapsed time at the old speed before switching.
    const next = waveSpeed === 2 ? 1 : 2;
    waveClockRef.current.speed = next;
    setWaveSpeed(next);
  };
  const availableGoldRef = useRef(run?.gold ?? RUN_DEFAULTS.startingGold);
  const activeEnemiesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const queuedWaveRef = useRef(null);
  const spawnedWaveRef = useRef(null);
  const towerAttackTimesRef = useRef({});
  const previousSynergyActiveRef = useRef({ human: false, insect: false, alien: false, neutral: false });
  const previousSuddenStageRef = useRef(null);
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
        onEnemyKilled?.(enemy);
      }
    }
    return survivors;
  };
  const waveScaling = getWaveScaling(run?.wave ?? 0, run?.mode);
  const suddenTelemetry = run?.mode === MODES.SUDDEN_SIEGE
    ? getSuddenSiegeTelemetry(waveScaling.waveNumber)
    : null;
  const suddenBattlefieldVisual = run?.mode === MODES.SUDDEN_SIEGE
    ? getSuddenSiegeBattlefieldVisual(waveScaling.waveNumber)
    : null;

  useEffect(() => {
    if (run?.mode !== MODES.SUDDEN_SIEGE || !suddenTelemetry?.stage) {
      previousSuddenStageRef.current = null;
      setSuddenStageTransition(null);
      return undefined;
    }

    const previousStage = previousSuddenStageRef.current;
    const nextStage = suddenTelemetry.stage;
    previousSuddenStageRef.current = nextStage;
    if (!previousStage || previousStage === nextStage) return undefined;

    const transition = getSuddenSiegeStageTransition(previousStage, nextStage);
    if (!transition) return undefined;

    setSuddenStageTransition(transition);
    const timeoutId = window.setTimeout(() => setSuddenStageTransition(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [run?.mode, suddenTelemetry?.stage]);

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
  const riskRewardVisual = getRiskRewardVisualState(
    run?.mode ?? MODES.SINGLE_GATE,
    riskRewardTier,
    run?.phase ?? RUN_PHASES.PREPARATION
  );
  const miniObjective = getMiniObjectiveForWave(waveScaling.waveNumber);
  const miniObjectiveReward = getMiniObjectiveReward(run?.mode ?? MODES.SINGLE_GATE);
  const placedFactionCount = new Set(
    placedDefenses
      .map((tower) => NORMAL_MODE_TOWERS_BY_ID[tower.defenseId]?.faction)
      .filter(Boolean)
  ).size;
  const evolvedTowerCount = placedDefenses.filter((tower) => Boolean(tower.evolution)).length;
  const miniObjectiveContext = {
    coreHp: run?.coreHp,
    waveStartCoreHp: run?.waveStartCoreHp,
    placedTowerCount: placedDefenses.length,
    factionCount: placedFactionCount,
    riskRewardTier,
    gold: run?.gold ?? 0,
    evolvedTowerCount
  };
  const miniObjectiveLive = getMiniObjectiveLiveState(miniObjective, miniObjectiveContext);
  const rareWaveEvent = getRareWaveEvent(run?.seed ?? 'run', waveScaling.waveNumber, {
    bossWave: bossWaveIncoming
  });
  const waveAffix = rareWaveEvent
    ? null
    : getWaveAffix(run?.seed ?? 'run', waveScaling.waveNumber, { bossWave: bossWaveIncoming });
  const threatWave = generateWavePlan({
    seed: run?.seed ?? 'run',
    waveNumber: waveScaling.waveNumber,
    mode: run?.mode ?? MODES.SINGLE_GATE,
    budgetMultiplier:
      (run?.mode === MODES.TRI_GATE
        ? TRI_GATE_PACING.threatMultiplier
        : run?.mode === MODES.SUDDEN_SIEGE
          ? (waveScaling.suddenThreatMultiplier ?? 1)
          : 1) *
      worldModifierEffects.threatMultiplier *
      riskRewardConfig.threatMultiplier *
      (rareWaveEvent?.threatMultiplier ?? 1)
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
  const buildSlots = run?.mode === MODES.TRI_GATE
    ? TRI_GATE_MAP.buildSlotPolicy.slots
    : SINGLE_GATE_MAP.buildSlots.slots;
  const wallTravelMultiplier = 1;
  const defenseDefinitions = NORMAL_MODE_TOWERS_BY_ID;
  const towerSynergyState = getTowerSynergyState(placedDefenses, defenseDefinitions);
  const activeTowerCombos = getActiveTowerCombos(placedDefenses);

  useEffect(() => {
    const newlyActivated = getNewlyActivatedTowerSynergies(previousSynergyActiveRef.current, towerSynergyState);
    previousSynergyActiveRef.current = Object.freeze(
      Object.fromEntries(towerSynergyState.entries.map((entry) => [entry.faction, entry.active]))
    );
    if (newlyActivated.length === 0) return undefined;

    const activated = newlyActivated.at(-1);
    setSynergyFeedback(activated);
    const timeoutId = window.setTimeout(() => setSynergyFeedback(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [towerSynergyState.entries.map((entry) => `${entry.faction}:${entry.active ? 1 : 0}`).join('|')]);

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
  const tftSetupKey = isShopMode(run?.mode)
    ? JSON.stringify({
        wave: run?.wave ?? 0,
        bench: tftBench.map((copy) => copy?.copyId ?? null),
        placed: placedDefenses
          .map((tower) => [tower.id, tower.defenseId, tower.slotId ?? null, tower.level ?? 1, tower.copyProgress ?? 1, tower.evolution ?? null])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      })
    : '';
  const tftSetupConfirmed = isShopMode(run?.mode) && confirmedTftSetupKey === tftSetupKey;

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
          if (isShopMode(run?.mode)) {
            setTftFeedback(`WALL DESTROYED · ${destroyed.join(', ').toUpperCase()}`);
          }
        }

        return next;
      });
    }, WALL_SYSTEM.damageTickMs / waveSpeed);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, run?.mode, activeWallIds.join('|'), waveSpeed]);

  useEffect(() => {
    if (!isShopMode(run?.mode) || run?.phase === RUN_PHASES.ENDED) return;
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
    if (!run || run.phase !== RUN_PHASES.ACTIVE) return undefined;

    const activeStartedAtMs = Date.now();
    const elapsedBeforeAttackMs = Math.max(0, Number(run.elapsedMs) || 0);

    const tick = () => {
      onTimerTick(elapsedBeforeAttackMs + (Date.now() - activeStartedAtMs));
    };

    tick();
    const intervalId = window.setInterval(tick, RUN_TIMER.tickIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [run?.phase]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.PREPARATION) return undefined;

    if (isShopMode(run?.mode)) {
      const shopPreparationSeconds = tftAutoStartEnabled ? 20 : 40;
      setPreparationRemaining(shopPreparationSeconds);
      const shopIntervalId = window.setInterval(() => {
        setPreparationRemaining((current) => {
          if (current <= 1) {
            window.clearInterval(shopIntervalId);
            onPhaseChange(RUN_PHASES.ACTIVE);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
      return () => window.clearInterval(shopIntervalId);
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
  }, [run?.phase, run?.wave, run?.mode, run?.syncWaveStartsAtMs, tftSetupConfirmed, tftAutoStartEnabled]);

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
    if (run?.phase !== RUN_PHASES.ACTIVE || !bossSummonPlan.active) return undefined;
    const startedAt = getWaveNow();
    const fired = new Set();
    const intervalId = window.setInterval(() => {
      const elapsed = getWaveNow() - startedAt;
      bossSummonPlan.pulses.forEach((pulse) => {
        if (fired.has(pulse.pulseIndex) || elapsed < pulse.offsetMs) return;
        fired.add(pulse.pulseIndex);
        const adds = run?.mode === MODES.TRI_GATE
          ? pulse.adds.map((enemy, index) => ({
              ...enemy,
              laneId: TRI_GATE_MAP.pathPlan.lanes[index % TRI_GATE_MAP.pathPlan.lanes.length].id
            }))
          : pulse.adds;
        setSpawnQueue((current) => [...current, ...adds]);
      });
    }, 50);
    return () => window.clearInterval(intervalId);
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
              spawnedAt: getWaveNow()
            })
          : nextEnemy.archetype === FLYING_ENEMY.archetype
            ? createFlyingEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() })
            : nextEnemy.archetype === SHIELDED_ENEMY.archetype
              ? createShieldedEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() })
              : nextEnemy.archetype === ARMORED_ENEMY.archetype
                ? createArmoredEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() })
                : nextEnemy.archetype === TANK_ENEMY.archetype
                  ? createTankEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() })
                  : nextEnemy.archetype === RUNNER_ENEMY.archetype
                    ? createRunnerEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() })
                    : createNormalEnemyState({ ...nextEnemy, progress: 0, spawnedAt: getWaveNow() });

        const modeScaledEnemy = run?.mode === MODES.SUDDEN_SIEGE
          ? applySuddenSiegeEnemyScaling(baseEnemyState, waveScaling.waveNumber)
          : baseEnemyState;
        const affixScaledEnemy = applyWaveAffix(modeScaledEnemy, waveAffix);
        const eventScaledEnemy = applyRareWaveEvent(affixScaledEnemy, rareWaveEvent);
        spawnedWaveRef.current = waveScaling.waveNumber;
        setActiveEnemies((active) => [...active, applyEliteModifiers(eventScaledEnemy)]);
        return remaining;
      });
    }, activeEnemies.length === 0
      ? 150 / waveSpeed
      : waveScaling.spawnIntervalMs *
        worldModifierEffects.spawnIntervalMultiplier *
        (waveAffix?.spawnIntervalMultiplier ?? 1) *
        (rareWaveEvent?.spawnIntervalMultiplier ?? 1) *
        0.5 / waveSpeed);

    return () => window.clearTimeout(timeoutId);
  }, [run?.phase, spawnQueue.length, activeEnemies.length, waveSpeed]);

  useEffect(() => {
    if (activeEnemies.length === 0 || run?.phase === RUN_PHASES.ENDED) return undefined;

    const durationMs = waveScaling.travelDurationMs * wallTravelMultiplier;

    const tick = () => {
      const now = getWaveNow();
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
    onDamageBastion(escapedEnemies.length * waveScaling.bastionDamage, escapedEnemies);
  }, [activeEnemies, run?.phase, waveScaling.bastionDamage, onDamageBastion]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || placedDefenses.length === 0 || activeEnemies.length === 0) return undefined;

    const intervalId = window.setInterval(() => {
      const now = getWaveNow();

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

          const slot = buildSlots.find((entry) => entry.id === placed.slotId);
          if (slot && primary.position) {
            const visual = getTowerAttackVisual(definition, placed.evolution);
            const duration = ['beam', 'chain', 'mark', 'aura'].includes(visual)
              ? 190
              : Math.max(160, Math.min(430, Math.hypot(primary.position.x - slot.x, primary.position.y - slot.y) / Math.max(1, definition.projectileSpeed ?? 700) * 1000));
            projectileQueueRef.current.push({
              id: ++projectileIdRef.current,
              x: slot.x, y: slot.y - 24,
              dx: primary.position.x - slot.x,
              dy: primary.position.y - (slot.y - 24),
              faction: definition.faction ?? baseDefinition.faction ?? 'neutral',
              visual,
              duration,
              expiresAt: now + duration + 330
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

            const comboMultiplier = getTowerComboDamageMultiplier(placed.defenseId, target);
            const damage = getTowerHitDamage(definition, placed, target, placedDefenses, defenseDefinitions) * damageScale * comboMultiplier;
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
              const previous = chainIndex === 0 ? primary : chained[chainIndex - 1];
              if (index >= 0 && previous.position && enemy.position) {
                projectileQueueRef.current.push({
                  id: ++projectileIdRef.current,
                  x: previous.position.x,
                  y: previous.position.y,
                  dx: enemy.position.x - previous.position.x,
                  dy: enemy.position.y - previous.position.y,
                  faction: definition.faction ?? 'alien',
                  visual: 'chain',
                  duration: 170,
                  expiresAt: now + 430
                });
              }
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
      const now = getWaveNow();
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
      const now = getWaveNow();
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
    }, 250 / waveSpeed);

    return () => window.clearInterval(intervalId);
  }, [run?.phase, activeEnemies.length, waveSpeed]);

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
        ...miniObjectiveContext,
        riskRewardTier: completedRiskRewardTier,
        gold: run?.gold ?? 0
      });
      const objectiveGold = objectiveCompleted ? miniObjectiveReward : 0;
      const rareEventGold = rareWaveEvent?.bonusGold ?? 0;
      setMiniObjectiveFeedback(objectiveCompleted ? `OBJECTIVE COMPLETE · +${objectiveGold}G` : 'OBJECTIVE MISSED');
      window.setTimeout(() => setMiniObjectiveFeedback(''), 1800);
      setSelectedBlessingPreviewId(null);
      setBlessingRerollCount(0);
      setRiskRewardTier('safe');
      onPhaseChange(RUN_PHASES.PREPARATION, {
        advanceWave: true,
        blessingId,
        riskRewardTier: completedRiskRewardTier,
        miniObjectiveGold: objectiveGold,
        rareEventGold
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
      if (isShopMode(run?.mode)) setTftFeedback(gameText('WALLS CAN ONLY BE BOUGHT DURING PREPARATION'));
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
      if (isShopMode(run?.mode)) {
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
    if (isShopMode(run?.mode)) setTftFeedback(`WALL BUILT · -${WALL_SYSTEM.cost}G`);
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
    if (isShopMode(run?.mode) && Number(selectedPlacedDefense.copyProgress ?? 1) < TFT_COPY_PROGRESSION.evolutionCopies) return;
    setPlacedDefenses((current) => current.map((tower) =>
      tower.id === selectedPlacedDefense.id ? chooseTowerEvolution(tower, evolutionId) : tower
    ));
    emitGameFeedback(GAME_FEEDBACK_EVENTS.TOWER_EVOLVED, {
      towerId: selectedPlacedDefense.defenseId,
      evolutionId
    });
  };

  const handleMergeTftCopy = (benchIndex, targetTowerId = selectedPlacedDefense?.id, skipConfirm = false) => {
    if (!isShopMode(run?.mode) || !targetTowerId) return;
    const targetTower = placedDefenses.find((tower) => tower.id === targetTowerId);
    const copy = tftBench[benchIndex];
    if (!targetTower || !copy) return;

    const validation = canMergeTftCopy(targetTower, copy);
    if (!validation.ok) {
      setTftFeedback(validation.error === 'wrong_tower_type' ? 'WRONG TOWER TYPE' : 'COPY PROGRESS MAXED');
      return;
    }

    const previousProgress = Number(targetTower.copyProgress ?? 1);
    const nextProgress = previousProgress + 1;
    if (!skipConfirm) {
      const confirmed = window.confirm(
        `Merge this ${copy.name ?? copy.towerId} copy into the selected tower? Progress ${targetTower.copyProgress ?? 1}/${getTftProgressDenominator(targetTower.copyProgress)} → ${nextProgress}/${getTftProgressDenominator(nextProgress)}. Cost: 0 Gold.`
      );
      if (!confirmed) return;
    }

    reportTowerMilestones(targetTower.id, previousProgress, nextProgress);
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
    setTftFeedback(
      nextProgress === TFT_COPY_PROGRESSION.evolutionCopies
        ? '7/7 — EVOLUTION UNLOCKED · CHOOSE A OR B'
        : nextProgress === TFT_COPY_PROGRESSION.redAscensionCopies
          ? '10/14 — RED 4★ ASCENSION · +15%'
          : nextProgress === TFT_COPY_PROGRESSION.goldAscensionCopies
            ? '14/14 — GOLD 4★ ASCENSION · +30%'
            : `MERGED — ${nextProgress}/${getTftProgressDenominator(nextProgress)}`
    );
  };

  const handleStartFieldMerge = () => {
    if (!isShopMode(run?.mode) || !selectedPlacedDefense || run?.phase === RUN_PHASES.ENDED) return;
    if (Number(selectedPlacedDefense.copyProgress ?? 1) >= TFT_COPY_PROGRESSION.maxCopies) {
      setTftFeedback(gameText('TOWER ALREADY 14/14'));
      return;
    }
    setMovingPlacedDefenseId(null);
    setSwappingPlacedDefenseId(null);
    setMergingPlacedDefenseId((current) => current === selectedPlacedDefense.id ? null : selectedPlacedDefense.id);
    setTftFeedback((current) => current === 'SELECT A MATCHING FIELD TOWER' ? '' : 'SELECT A MATCHING FIELD TOWER');
  };

  const handleMergePlacedTowers = (sourceTowerId, targetTowerId) => {
    if (!isShopMode(run?.mode) || !sourceTowerId || !targetTowerId || sourceTowerId === targetTowerId) return false;
    const sourceTower = placedDefenses.find((tower) => tower.id === sourceTowerId);
    const targetTower = placedDefenses.find((tower) => tower.id === targetTowerId);
    if (!sourceTower || !targetTower) return false;
    if (sourceTower.defenseId !== targetTower.defenseId) {
      setTftFeedback(gameText('WRONG TOWER TYPE'));
      return false;
    }

    const sourceProgress = Number(sourceTower.copyProgress ?? 1);
    const targetProgress = Number(targetTower.copyProgress ?? 1);
    const mergeOutcome = getTftFieldMergeOutcome(sourceProgress, targetProgress);
    const mergedProgress = mergeOutcome.targetProgress;
    const residualProgress = mergeOutcome.sourceProgress;

    const towerName = defenseDefinitions[targetTower.defenseId]?.name ?? targetTower.defenseId;
    const outcomeLabel = residualProgress > 0
      ? `${mergedProgress}/14 + ${residualProgress}/${getTftProgressDenominator(residualProgress)} · 1 COPY LOST`
      : `${mergedProgress}/${getTftProgressDenominator(mergedProgress)}`;
    const confirmed = window.confirm(
      `Merge these two ${towerName} towers? ${targetProgress}/${getTftProgressDenominator(targetProgress)} + ${sourceProgress}/${getTftProgressDenominator(sourceProgress)} → ${outcomeLabel}. Cost: 0 Gold.`
    );
    if (!confirmed) return false;

    reportTowerMilestones(targetTower.id, targetProgress, mergedProgress);
    const combinedInvestedGold = Number(targetTower.investedGold ?? 0) + Number(sourceTower.investedGold ?? 0);
    const survivingCopies = mergedProgress + residualProgress;
    const targetGoldShare = survivingCopies > 0
      ? Math.round((combinedInvestedGold * mergedProgress) / survivingCopies)
      : combinedInvestedGold;
    const sourceGoldShare = Math.max(0, combinedInvestedGold - targetGoldShare);

    setPlacedDefenses((current) => current
      .filter((tower) => tower.id !== sourceTower.id || residualProgress > 0)
      .map((tower) => {
        if (tower.id === targetTower.id) {
          return {
            ...tower,
            copyProgress: mergedProgress,
            level: getTftLevelForCopyProgress(mergedProgress),
            investedGold: targetGoldShare
          };
        }
        if (tower.id === sourceTower.id && residualProgress > 0) {
          return {
            ...tower,
            copyProgress: residualProgress,
            level: getTftLevelForCopyProgress(residualProgress),
            evolution: residualProgress >= TFT_COPY_PROGRESSION.evolutionCopies ? tower.evolution : null,
            evolutionChoice: residualProgress >= TFT_COPY_PROGRESSION.evolutionCopies ? tower.evolutionChoice : null,
            investedGold: sourceGoldShare
          };
        }
        return tower;
      }));
    if (residualProgress === 0) towerAttackTimesRef.current[sourceTower.id] = 0;
    setSelectedPlacedDefenseId(targetTower.id);
    setMergingPlacedDefenseId(null);
    setTftFeedback(
      residualProgress > 0
        ? `FIELD MERGE — 14/14 + ${residualProgress}/${getTftProgressDenominator(residualProgress)} · 1 COPY LOST`
        : mergedProgress === TFT_COPY_PROGRESSION.evolutionCopies
          ? '7/7 — EVOLUTION UNLOCKED · CHOOSE A OR B'
          : mergedProgress === TFT_COPY_PROGRESSION.redAscensionCopies
            ? '10/14 — RED 4★ ASCENSION · +15%'
            : mergedProgress === TFT_COPY_PROGRESSION.goldAscensionCopies
              ? '14/14 — GOLD 4★ ASCENSION · +30%'
              : `FIELD MERGE — ${mergedProgress}/${getTftProgressDenominator(mergedProgress)}`
    );
    return true;
  };

  const handleSellSelectedTower = () => {
    if (!selectedPlacedDefense || !run || run.phase === RUN_PHASES.ENDED) return;
    const refund = selectedSellPreview.refund;
    setPlacedDefenses((current) => current.filter((tower) => tower.id !== selectedPlacedDefense.id));
    setSelectedPlacedDefenseId(null);
    setMovingPlacedDefenseId(null);
    setSwappingPlacedDefenseId(null);
    setMergingPlacedDefenseId(null);
    towerAttackTimesRef.current[selectedPlacedDefense.id] = 0;
    if (refund > 0) onGainGold(refund);
    if (isShopMode(run.mode)) setTftFeedback(`TOWER SOLD · +${refund}G`);
  };

  const handleToggleMoveSelectedTower = () => {
    if (!selectedPlacedDefense || !run || run.phase === RUN_PHASES.ENDED) return;
    setMergingPlacedDefenseId(null);
    setSwappingPlacedDefenseId(null);
    setMovingPlacedDefenseId((current) => current === selectedPlacedDefense.id ? null : selectedPlacedDefense.id);
  };

  const handleToggleSwapSelectedTower = () => {
    if (!selectedPlacedDefense || !run || run.phase === RUN_PHASES.ENDED) return;
    setMovingPlacedDefenseId(null);
    setMergingPlacedDefenseId(null);
    setSwappingPlacedDefenseId((current) => current === selectedPlacedDefense.id ? null : selectedPlacedDefense.id);
    if (isShopMode(run.mode)) setTftFeedback(gameText('SELECT A TOWER TO SWAP'));
  };

  const placeTftBenchCopyOnSlot = (benchIndex, slotId) => {
    if (!run || run.phase === RUN_PHASES.ENDED || !isShopMode(run.mode)) return false;
    const copy = tftBench[benchIndex];
    if (!copy) return false;
    if (placedDefenses.some((entry) => entry.slotId === slotId)) return false;

    const defense = defenseDefinitions[copy.towerId];
    if (!defense) return false;

    const attempt = tryPurchaseDefenseOnSlot({
      slotId,
      defense: { ...defense, cost: 0 },
      gold: availableGoldRef.current,
      placedStructures: placedDefenses
    });
    if (!attempt.ok) return false;

    const placedTower = {
      ...attempt.structure,
      id: `field:${copy.copyId}`,
      defenseId: copy.towerId,
      level: 1,
      copyProgress: 1,
      investedGold: Number(copy.cost ?? TFT_SHOP.copyCost),
      sourceCopyId: copy.copyId
    };

    setPlacedDefenses((current) => [...current, placedTower]);
    setSelectedPlacedDefenseId(placedTower.id);
    setTftBench((current) => removeCopyFromBench(current, benchIndex).bench);
    setSelectedTftBenchIndex(null);
    setMovingPlacedDefenseId(null);
    setTftFeedback(gameText('TOWER PLACED · 1/7'));
    emitGameFeedback(GAME_FEEDBACK_EVENTS.TOWER_BUILT, {
      towerId: copy.towerId,
      slotId,
      mode: run.mode
    });
    return true;
  };

  const handleBuildSlot = (slotId) => {
    const occupied = placedDefenses.find((entry) => entry.slotId === slotId);

    if (mergingPlacedDefenseId) {
      if (!occupied) {
        setTftFeedback('SELECT A MATCHING FIELD TOWER');
        return;
      }
      if (occupied.id === mergingPlacedDefenseId) {
        setMergingPlacedDefenseId(null);
        setTftFeedback('');
        return;
      }
      handleMergePlacedTowers(mergingPlacedDefenseId, occupied.id);
      return;
    }

    if (swappingPlacedDefenseId) {
      if (!run || run.phase === RUN_PHASES.ENDED) {
        setSwappingPlacedDefenseId(null);
        return;
      }
      if (!occupied) {
        if (isShopMode(run.mode)) setTftFeedback(gameText('SELECT AN OCCUPIED TOWER TO SWAP'));
        return;
      }
      if (occupied.id === swappingPlacedDefenseId) {
        setSwappingPlacedDefenseId(null);
        if (isShopMode(run.mode)) setTftFeedback('');
        return;
      }
      const sourceTower = placedDefenses.find((tower) => tower.id === swappingPlacedDefenseId);
      if (!sourceTower) {
        setSwappingPlacedDefenseId(null);
        return;
      }
      const sourceSlotId = sourceTower.slotId;
      const targetTowerId = occupied.id;
      setPlacedDefenses((current) => current.map((tower) => {
        if (tower.id === swappingPlacedDefenseId) return { ...tower, slotId };
        if (tower.id === targetTowerId) return { ...tower, slotId: sourceSlotId };
        return tower;
      }));
      setSelectedPlacedDefenseId(swappingPlacedDefenseId);
      setSwappingPlacedDefenseId(null);
      if (isShopMode(run.mode)) setTftFeedback(gameText('TOWERS SWAPPED · 0G'));
      return;
    }

    if (movingPlacedDefenseId) {
      if (!run || run.phase === RUN_PHASES.ENDED) {
        setMovingPlacedDefenseId(null);
        return;
      }
      if (occupied) {
        if (occupied.id === movingPlacedDefenseId) {
          setMovingPlacedDefenseId(null);
          return;
        }
        setSelectedPlacedDefenseId(occupied.id);
        return;
      }
      setPlacedDefenses((current) => current.map((tower) =>
        tower.id === movingPlacedDefenseId ? { ...tower, slotId } : tower
      ));
      setSelectedPlacedDefenseId(movingPlacedDefenseId);
      setMovingPlacedDefenseId(null);
      if (isShopMode(run.mode)) setTftFeedback(gameText('TOWER MOVED · 0G'));
      return;
    }

    if (occupied) {
      if (isShopMode(run?.mode) && selectedTftBenchIndex != null) {
        const copy = tftBench[selectedTftBenchIndex];
        const validation = canMergeTftCopy(occupied, copy);
        if (validation.ok) {
          handleMergeTftCopy(selectedTftBenchIndex, occupied.id, true);
          return;
        }
        if (copy) {
          setTftFeedback(
            validation.error === 'wrong_tower_type'
              ? 'WRONG TOWER TYPE'
              : 'TOWER 14/14 · PLACE THIS COPY ON AN EMPTY PAD'
          );
          return;
        }
      }
      setSelectedPlacedDefenseId(occupied.id);
      setMovingPlacedDefenseId(null);
      setSwappingPlacedDefenseId(null);
      setMergingPlacedDefenseId(null);
      return;
    }

    if (!run || run.phase === RUN_PHASES.ENDED) return;

    if (isShopMode(run.mode)) {
      if (selectedTftBenchIndex == null) return;
      placeTftBenchCopyOnSlot(selectedTftBenchIndex, slotId);
      return;
    }

    const attempt = tryPurchaseDefenseOnSlot({
      slotId,
      defense: selectedDefense,
      gold: availableGoldRef.current,
      placedStructures: placedDefenses,
      mode: run.mode
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
              <span className="run-hud__label">{t('mode')}</span>
              <strong>{
                run?.mode === MODES.SINGLE_GATE
                  ? 'SINGLE GATE'
                  : run?.mode === MODES.SUDDEN_SIEGE
                    ? 'SUDDEN SIEGE'
                    : isShopMode(run?.mode)
                      ? 'TFT SHOP'
                    : run?.mode === MODES.LAST_BASTION
                      ? 'LAST BASTION'
                      : run?.mode === MODES.TRI_GATE
                        ? 'TRI-GATE'
                        : 'UNKNOWN'
              }</strong>
            </div>
            <div>
              <span className="run-hud__label">{t('wave')}</span>
              <strong>{run?.wave ?? 0}</strong>
            </div>
            <div>
              <span className="run-hud__label">{t('gold')}</span>
              <strong>{run?.gold ?? RUN_DEFAULTS.startingGold}</strong>
            </div>
            <div className={`run-hud__nexus ${bastionStateClass}`} aria-label={`Nexus health ${run?.coreHp ?? RUN_DEFAULTS.coreHp} of ${run?.coreMaxHp ?? RUN_DEFAULTS.coreHp}`}>
              <span className="run-hud__label">{t('nexus')}</span>
              <strong>{run?.coreHp ?? RUN_DEFAULTS.coreHp}<small> / {run?.coreMaxHp ?? RUN_DEFAULTS.coreHp}</small></strong>
              <span className="run-hud__nexus-track" aria-hidden="true"><span style={{ width: `${coreRatio * 100}%` }} /></span>
            </div>
            <div>
              <span className="run-hud__label">{t('survival')}</span>
              <strong>{formatSurvivalTime(run?.elapsedMs ?? 0)}</strong>
            </div>
            <div>
              <span className="run-hud__label">{t('score')}</span>
              <strong>{runScore.totalScore.toLocaleString()}</strong>
            </div>
            <button className="run-exit" onClick={onExit} aria-label="Exit current run">{t('exitRun')}</button>
          </header>

          {run?.mode === MODES.LAST_BASTION && (
            <section
              className="last-bastion-status"
              aria-label="Last Bastion participant status"
              aria-live="polite"
              aria-atomic="false"
            >
              <div className="last-bastion-status__header">
                <span>{gameText(isLastBastionFinished ? 'MATCH COMPLETE' : isLastBastionSpectating ? 'SPECTATING' : 'LIVE MATCH')}</span>
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
                    <span>P{participant.slot}{participant.self ? ` · ${t('you')}` : ''}</span>
                    <strong>{participant.alive ? `${t('wave')} ${participant.wave}` : gameText('ELIMINATED')}</strong>
                    <small>{participant.connected ? `${participant.coreHp} HP` : gameText('DISCONNECTED')}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {suddenStageTransition && (
            <div
              className={`sudden-stage-transition sudden-stage-transition--${suddenStageTransition.to.toLowerCase()}`}
              role="status"
              aria-live="assertive"
            >
              <span>{suddenStageTransition.from} → {suddenStageTransition.to}</span>
              <strong>{suddenStageTransition.title}</strong>
              <small>{suddenStageTransition.subtitle}</small>
            </div>
          )}

          {(isLastBastionSpectating || isLastBastionFinished) && (
            <div className="last-bastion-spectate-banner" role="status" aria-live="assertive">
              <span>{gameText(isLastBastionFinished ? 'LAST BASTION COMPLETE' : 'BASTION FALLEN — SPECTATOR MODE')}</span>
              <strong>
                {isLastBastionFinished
                  ? run?.lastBastionWinnerSlot
                    ? `PLAYER ${run.lastBastionWinnerSlot} WINS`
                    : gameText('MATCH DRAW')
                  : gameText('WATCH THE REMAINING DEFENDERS')}
              </strong>
              <small>
                {isLastBastionFinished
                  ? gameText('Final results processing follows.')
                  : gameText('You are eliminated. Match status remains live until one defender remains.')}
              </small>
            </div>
          )}

          <svg
            className={[
              'battlefield-map',
              run?.mode === MODES.TRI_GATE ? 'battlefield-map--tri' : '',
              riskRewardVisual.active ? 'battlefield-map--pressure' : '',
              suddenBattlefieldVisual ? 'battlefield-map--sudden' : '',
              suddenBattlefieldVisual ? `battlefield-map--sudden-${suddenBattlefieldVisual.className}` : ''
            ].filter(Boolean).join(' ')}
            data-risk-reward-tier={riskRewardTier}
            data-pressure-active={riskRewardVisual.active ? 'true' : 'false'}
            data-sudden-stage={suddenBattlefieldVisual?.stage ?? ''}
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
            <image className="battlefield-map__art" href={run?.mode === MODES.TRI_GATE ? '/assets/maps/tri-gate.webp' : '/assets/maps/bastionfall-field-v2.webp'} x="0" y="0" width="1600" height="900" preserveAspectRatio="none" aria-hidden="true" />
            {suddenBattlefieldVisual && (
              <g
                className={`sudden-stage-overlay sudden-stage-overlay--${suddenBattlefieldVisual.className}`}
                style={{
                  '--sudden-intensity': suddenBattlefieldVisual.intensity,
                  '--sudden-pulse-ms': `${suddenBattlefieldVisual.pulseMs}ms`
                }}
                aria-hidden="true"
              >
                <rect className="sudden-stage-overlay__vignette" x="0" y="0" width="1600" height="900" />
                <rect className="sudden-stage-overlay__frame" x="16" y="16" width="1568" height="868" rx="32" />
                <g className="sudden-stage-overlay__badge" transform="translate(800 126)">
                  <rect x="-154" y="-24" width="308" height="48" rx="18" />
                  <text x="0" y="6" textAnchor="middle">
                    {gameText(suddenBattlefieldVisual.label)}
                  </text>
                </g>
              </g>
            )}
            {run?.phase === RUN_PHASES.ACTIVE && (
              <g
                className={`mini-objective-battlefield mini-objective-battlefield--${miniObjectiveLive.status}`}
                data-objective-status={miniObjectiveLive.status}
                aria-hidden="true"
              >
                <g className="mini-objective-battlefield__card" transform="translate(250 824)">
                  <rect x="-205" y="-34" width="410" height="68" rx="18" />
                  <text className="mini-objective-battlefield__title" x="0" y="-7" textAnchor="middle">
                    {t('waveQuest')} · +{miniObjectiveReward}G
                  </text>
                  <text className="mini-objective-battlefield__status" x="0" y="16" textAnchor="middle">
                    {gameText(miniObjective.name)} · {gameText(miniObjectiveLive.label)} · {miniObjectiveLive.progress}
                  </text>
                </g>
              </g>
            )}
            {riskRewardVisual.active && (
              <g className="pressure-wave-overlay" aria-hidden="true">
                <rect className="pressure-wave-overlay__frame" x="10" y="10" width="1580" height="880" rx="34" />
                <rect className="pressure-wave-overlay__vignette" x="0" y="0" width="1600" height="900" />
                <g className="pressure-wave-overlay__badge" transform="translate(800 64)">
                  <rect x="-152" y="-29" width="304" height="58" rx="22" />
                  <text x="0" y="7" textAnchor="middle">
                    {gameText(riskRewardVisual.label)} · {t('threat')} ×{riskRewardVisual.threatMultiplier.toFixed(2)}
                  </text>
                </g>
              </g>
            )}
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
              {buildSlots.map((slot) => {
                const placed = placedDefenses.find((entry) => entry.slotId === slot.id) ?? null;
                const benchCopy = selectedTftBenchIndex == null ? null : tftBench[selectedTftBenchIndex];
                const movingTower = movingPlacedDefenseId
                  ? placedDefenses.find((entry) => entry.id === movingPlacedDefenseId) ?? null
                  : null;
                const previewDefense = movingTower
                  ? defenseDefinitions[movingTower.defenseId] ?? selectedDefense
                  : isShopMode(run?.mode) && benchCopy
                    ? defenseDefinitions[benchCopy.towerId] ?? selectedDefense
                    : selectedDefense;
                const affordable = movingTower
                  ? true
                  : isShopMode(run?.mode)
                    ? Boolean(benchCopy)
                    : (run?.gold ?? 0) >= selectedDefense.cost;
                const hovered = hoveredSlotId === slot.id;
                const selectedPlaced = placed?.id === selectedPlacedDefenseId;
                const matchingBenchCopy = Boolean(placed && benchCopy?.towerId === placed.defenseId);
                const placedRuntimeDefense = placed
                  ? applyBlessingTowerIdentity(
                      applyTowerSynergy(
                        getRuntimeTowerDefinition(defenseDefinitions[placed.defenseId] ?? selectedDefense, placed),
                        towerSynergyState
                      ),
                      run?.blessings ?? []
                    )
                  : null;
                const previewRuntimeDefense = !placed
                  ? applyBlessingTowerIdentity(applyTowerSynergy(previewDefense, towerSynergyState), run?.blessings ?? [])
                  : null;
                const visibleRange = getEffectiveTowerRange(placedRuntimeDefense ?? previewRuntimeDefense);
                const visibleRangeKind = getTowerRangeKind(placedRuntimeDefense ?? previewRuntimeDefense);
                const synergyVisual = placedRuntimeDefense
                  ? getTowerSynergyVisualCue(placedRuntimeDefense, towerSynergyState)
                  : null;
                const blessingVisual = placedRuntimeDefense
                  ? getBlessingIdentityVisualCue(placedRuntimeDefense, run?.blessings ?? [])
                  : null;
                const evolutionVisual = placed ? getEvolutionVisualCue(placed) : null;
                const towerLevel = Math.max(1, Math.min(4, Number(placed?.level ?? 1)));
                const copyProgress = Math.max(1, Math.min(TFT_COPY_PROGRESSION.maxCopies, Number(placed?.copyProgress ?? 1)));
                const copyProgressDenominator = getTftProgressDenominator(copyProgress);
                const ascensionTier = getTftAscensionTier(copyProgress);
                const towerActionOffsetX = slot.x > SINGLE_GATE_MAP.size.width - 190 ? -160 : 54;
                const slotClass = [
                  'battlefield-map__tower-slot',
                  placed ? 'battlefield-map__tower-slot--occupied' : 'battlefield-map__tower-slot--available',
                  !placed && !affordable ? 'battlefield-map__tower-slot--unaffordable' : '',
                  hovered ? 'battlefield-map__tower-slot--hovered' : '',
                  selectedPlaced ? 'battlefield-map__tower-slot--selected' : '',
                  matchingBenchCopy ? 'battlefield-map__tower-slot--bench-match' : '',
                  movingTower && !placed ? 'battlefield-map__tower-slot--move-target' : '',
                  isShopMode(run?.mode) && placed && benchCopy && canMergeTftCopy(placed, benchCopy).ok
                    ? 'battlefield-map__tower-slot--merge-target'
                    : '',
                  mergingPlacedDefenseId && placed && placed.id !== mergingPlacedDefenseId && (() => {
                    const source = placedDefenses.find((tower) => tower.id === mergingPlacedDefenseId);
                    return source && source.defenseId === placed.defenseId;
                  })()
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
                    data-bench-match={matchingBenchCopy ? 'true' : 'false'}
                    data-occupied={Boolean(placed)}
                    data-defense-id={placed?.defenseId ?? ''}
                    onMouseEnter={() => setHoveredSlotId(slot.id)}
                    onMouseLeave={() => setHoveredSlotId((current) => current === slot.id ? null : current)}
                    onDragOver={(event) => {
                      if (!isShopMode(run?.mode)) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      if (!isShopMode(run?.mode)) return;
                      event.preventDefault();
                      const benchIndex = Number(event.dataTransfer.getData('text/plain'));
                      if (!Number.isInteger(benchIndex)) return;
                      const draggedCopy = tftBench[benchIndex];
                      if (!draggedCopy) return;

                      if (!placed) {
                        placeTftBenchCopyOnSlot(benchIndex, slot.id);
                        return;
                      }

                      const validation = canMergeTftCopy(placed, draggedCopy);
                      if (validation.ok) {
                        handleMergeTftCopy(benchIndex, placed.id, true);
                        return;
                      }

                      setTftFeedback(
                        validation.error === 'wrong_tower_type'
                          ? 'WRONG TOWER TYPE'
                          : 'TOWER 14/14 · DROP THIS COPY ON AN EMPTY PAD'
                      );
                    }}
                    onClick={() => handleBuildSlot(slot.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleBuildSlot(slot.id);
                      }
                    }}
                  >
                    {run?.mode === MODES.TRI_GATE && <circle className="tower-slot__hitbox" r="36" fill="transparent" />}
                    {selectedPlaced && visibleRange > 0 && (
                      <circle
                        className={`tower-range-indicator tower-range-indicator--selected tower-range-indicator--${visibleRangeKind}`}
                        cx="0"
                        cy="0"
                        r={visibleRange}
                        data-range={visibleRange}
                        data-range-kind={visibleRangeKind}
                        data-mode={run?.mode ?? ''}
                        aria-hidden="true"
                      />
                    )}
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
                      <>
                        {evolutionVisual?.active && (
                          <g
                            className={`tower-evolution-aura tower-evolution-aura--${evolutionVisual.branch.toLowerCase()}`}
                            data-evolution-active="true"
                            data-evolution-id={evolutionVisual.id ?? ''}
                            data-evolution-branch={evolutionVisual.branch ?? ''}
                            aria-hidden="true"
                          >
                            <circle className="tower-evolution-aura__outer" cx="0" cy="0" r="49" />
                            <circle className="tower-evolution-aura__inner" cx="0" cy="0" r="41" />
                            <circle className="tower-evolution-aura__badge" cx="0" cy="-55" r="13" />
                            <text className="tower-evolution-aura__letter" x="0" y="-50" textAnchor="middle">
                              {evolutionVisual.branch}
                            </text>
                          </g>
                        )}
                        {blessingVisual?.active && (
                          <g
                            className={`tower-blessing-aura tower-blessing-aura--${blessingVisual.faction}`}
                            data-identity-blessing={blessingVisual.blessingId ?? ''}
                            data-identity-faction={blessingVisual.faction ?? ''}
                            aria-hidden="true"
                          >
                            <circle className="tower-blessing-aura__ring" cx="0" cy="0" r="43" />
                            <path className="tower-blessing-aura__sigil" d="M0-48l5 9 10 2-7 7 2 10-10-5-10 5 2-10-7-7 10-2Z" />
                          </g>
                        )}
                        {synergyVisual?.active && (
                          <g
                            className={`tower-synergy-aura tower-synergy-aura--${synergyVisual.faction}`}
                            data-synergy-active="true"
                            data-synergy-faction={synergyVisual.faction}
                            data-synergy-name={synergyVisual.name ?? ''}
                            aria-hidden="true"
                          >
                            <circle className="tower-synergy-aura__outer" cx="0" cy="0" r="38" />
                            <circle className="tower-synergy-aura__inner" cx="0" cy="0" r="29" />
                          </g>
                        )}
                        <g
                          className={`tower-visual tower-visual--${placed.defenseId}${synergyVisual?.active ? ` tower-visual--synergy-active tower-visual--synergy-${synergyVisual.faction}` : ''}${blessingVisual?.active ? ` tower-visual--identity-blessing tower-visual--identity-${blessingVisual.faction}` : ''}${evolutionVisual?.active ? ` tower-visual--evolved tower-visual--evolution-${evolutionVisual.branch.toLowerCase()}` : ''}`}
                          data-evolution={placed.evolution ?? ''}
                          data-synergy-active={synergyVisual?.active ? 'true' : 'false'}
                          data-identity-blessing={blessingVisual?.blessingId ?? ''}
                        >
                          <ellipse className="tower-visual__shadow" cx="0" cy="20" rx="30" ry="10" />
                          <foreignObject x="-42" y="-54" width="84" height="84" pointerEvents="none">
                            <div
                              className="tower-art-sprite"
                              style={getTowerArtStyleForTower(placed.defenseId, placed.evolution)}
                              aria-hidden="true"
                            />
                          </foreignObject>
                        </g>
                        <g className={`tower-progress-badge tower-progress-badge--${ascensionTier}`} aria-hidden="true">
                          <rect x="-48" y="31" width="96" height="23" rx="10" />
                          <text x="0" y="47" textAnchor="middle">
                            <tspan className="tower-progress-stars">{'★'.repeat(towerLevel)}</tspan>
                            {isShopMode(run?.mode) && <tspan className="tower-progress-count">{` ${copyProgress}/${copyProgressDenominator}`}</tspan>}
                          </text>
                        </g>

                        {selectedPlaced && (
                          <g className="tower-context-actions"
                            transform={`translate(${towerActionOffsetX} -44)`}
                            onClick={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                            role="group" aria-label="Tower quick actions">
                            {[
                              ...(isShopMode(run?.mode) ? [{ label: mergingPlacedDefenseId === placed.id ? 'ANNULLA' : 'MERGE', action: handleStartFieldMerge, active: mergingPlacedDefenseId === placed.id }] : []),
                              { label: swappingPlacedDefenseId === placed.id ? 'ANNULLA' : 'INVERTI', action: handleToggleSwapSelectedTower, active: swappingPlacedDefenseId === placed.id },
                              { label: movingPlacedDefenseId === placed.id ? 'ANNULLA' : 'SPOSTA', action: handleToggleMoveSelectedTower, active: movingPlacedDefenseId === placed.id },
                              { label: `VENDI +${selectedSellPreview.refund}G`, action: handleSellSelectedTower, active: false }
                            ].map((action, index) => (
                              <g key={index} className={`tower-context-action${action.active ? ' is-active' : ''}`}
                                transform={`translate(${(index % 2) * 74} ${Math.floor(index / 2) * 36})`}
                                role="button" tabIndex="0" aria-label={action.label}
                                onClick={(event) => { event.stopPropagation(); action.action(); }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault(); event.stopPropagation(); action.action();
                                  }
                                }}>
                                <rect x="0" y="0" width="68" height="30" rx="7" />
                                <text x="34" y="19" textAnchor="middle">{action.label}</text>
                              </g>
                            ))}
                          </g>
                        )}
                      </>
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
            {run?.mode !== MODES.TRI_GATE && spawnAnchors.map((spawn) => (
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
              const slowActive = (enemy.statusEffects?.slowUntilMs ?? 0) > getWaveNow();
              const artId = ENEMY_ROSTER.byId[enemy.archetype]
                ? enemy.archetype : LEGACY_ENEMY_ART[enemy.archetype];
              const enemyArtHref = artId
                ? (cleanEnemyArt[artId] ?? `/assets/enemies/${artId}.png`)
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
                        style={{ animationDelay: `${-(Number(enemy.id?.length ?? 0) % 7) * 0.17}s` }}
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
                    {enemy.armor > 0 && <text className="enemy-status__badge enemy-status__badge--armor" x="-24" y="39">{t('arm')}</text>}
                    {enemy.airborne && <text className="enemy-status__badge enemy-status__badge--air" x="0" y="39" textAnchor="middle">{t('air')}</text>}
                    {slowActive && <text className="enemy-status__badge enemy-status__badge--slow" x="24" y="39" textAnchor="end">{t('slow')}</text>}
                  </g>
                </g>
              );
            })}
            <g className="battlefield-map__projectiles" aria-hidden="true">
              {projectiles.map((shot) => <TowerAttackEffect key={shot.id} shot={shot} speed={waveSpeed} />)}
            </g>
            {run?.mode !== MODES.TRI_GATE && <g
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
              <path className="battlefield-map__bastion-gate" d="M -18 48 V 18 Q 0 2 18 18 V 48 Z" />
            </g>}
            <g className={`battlefield-map__nexus-meter ${bastionStateClass}`} transform={`translate(${bastionAnchor.x} ${bastionAnchor.y})`} role="img" aria-label={`Nexus ${run?.coreHp ?? 0} of ${run?.coreMaxHp ?? 0} health`}>
                <path className="battlefield-map__nexus-frame" d="M -106 -180 H 92 L 106 -168 V -126 H -92 L -106 -138 Z" />
                <path className="battlefield-map__nexus-rim" d="M -103 -177 H 90 L 103 -167 M -103 -139 V -129 H 92 L 103 -139" />
                <path className="battlefield-map__nexus-gem" d="M -92 -169 L -86 -163 L -92 -157 L -98 -163 Z" />
                <text className="battlefield-map__nexus-label" x="-78" y="-158">{t('nexus')}</text>
                <text className="battlefield-map__bastion-hp-text" x="90" y="-158" textAnchor="end">
                  {run?.coreHp ?? 0} <tspan className="battlefield-map__nexus-max">/ {run?.coreMaxHp ?? 0}</tspan>
                </text>
                <rect className="battlefield-map__bastion-hp-bg" x="-92" y="-148" width="184" height="13" rx="6.5" />
              <rect
                className="battlefield-map__bastion-hp-fill"
                  x="-92"
                  y="-148"
                  width={184 * coreRatio}
                  height="13"
                  rx="6.5"
              />
                <path className="battlefield-map__nexus-bar-shine" d={`M -88 -146 H ${-88 + 176 * coreRatio}`} />
              </g>
            {run?.mode !== MODES.TRI_GATE && spawnAnchors.map((spawn) => (
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
            {run?.mode !== MODES.TRI_GATE && <text
              className="battlefield-map__label battlefield-map__label--bastion"
              x={bastionAnchor.x}
              y={bastionAnchor.y + 102}
              textAnchor="middle"
            >
              BASTION
            </text>}
          </svg>

          <button type="button" className={`wave-speed-toggle${waveSpeed === 2 ? ' is-active' : ''}`}
            aria-label={`Wave speed: ${waveSpeed}x. Switch to ${waveSpeed === 2 ? 'normal' : 'double'} speed`}
            aria-pressed={waveSpeed === 2} onClick={toggleWaveSpeed}>
            <strong>{waveSpeed}×</strong><span>{t('wave')}</span>
          </button>
          <aside
            className={`run-sidebar ${isShopMode(run?.mode) ? 'run-sidebar--tft' : ''}${run?.mode === MODES.SUDDEN_SIEGE ? ' run-sidebar--sudden' : ''}`}
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
            data-tower-slot-count={buildSlots.length}
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
            data-tft-shop-mode={isShopMode(run?.mode)}
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
          {isShopMode(run?.mode) ? (
          <>
            {run?.mode === MODES.SUDDEN_SIEGE && suddenTelemetry && (
              <section className="sudden-siege-hud" aria-label="Sudden Siege telemetry">
                <div className="sudden-siege-hud__header">
                  <span>SUDDEN SIEGE</span>
                  <strong>{suddenTelemetry.stage}</strong>
                </div>
                <div className="sudden-siege-hud__grid">
                  <div><span>{t('threat')}</span><strong>×{suddenTelemetry.threatMultiplier.toFixed(2)}</strong></div>
                  <div><span>{t('enemyHp')}</span><strong>×{suddenTelemetry.hpMultiplier.toFixed(2)}</strong></div>
                  <div><span>{t('spawn')}</span><strong>{(suddenTelemetry.spawnIntervalMs / 1000).toFixed(2)}s</strong></div>
                  <div><span>{t('prep')}</span><strong>{suddenTelemetry.preparationSeconds}s</strong></div>
                  <div><span>{t('clearGold')}</span><strong>{suddenTelemetry.waveReward}G</strong></div>
                  <div><span>{t('economy')}</span><strong>{t('tftParity')}</strong></div>
                </div>
                <small>Difficulty escalates by wave bracket. Base clear economy stays aligned with TFT Shop; PRESSURE adds a smaller Sudden-specific risk premium.</small>
              </section>
            )}
            <div className="tft-shop-layout">
            <p className="main-menu__kicker">{t('shop')}</p>
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
                    <small>{String(gameText(offer.faction)).toUpperCase()} · {String(gameText(offer.role)).toUpperCase()}</small>
                  </div>
                  <span className="tft-shop-card__cost">{offer.cost}G</span>
                </button>
              ))}
            </div>
            <div className="tft-shop-economy">
              <div className="tft-shop-gold" aria-label={`${run?.gold ?? 0} gold available`}>
                <span>{t('gold')}</span>
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
                      copyId: typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${run?.seed ?? 'run'}:${tftRollIndex}:${selectedTftShopOffer.slotId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
                      towerId: selectedTftShopOffer.towerId,
                      name: selectedTftShopOffer.name,
                      faction: selectedTftShopOffer.faction,
                      role: selectedTftShopOffer.role,
                      cost: selectedTftShopOffer.cost
                    });
                    if (!result.ok) {
                      setTftFeedback(gameText('BENCH FULL'));
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
                  <span>{t('buy')}</span>
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
                <span>{t('roll')}</span>
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
                <span>{t('bench')}</span>
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
                      setTftFeedback(gameText('DROP ON A MATCHING TOWER TO MERGE'));
                    }}
                    onDragEnd={() => setTftFeedback((current) => current === gameText('DROP ON A MATCHING TOWER TO MERGE') ? '' : current)}
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
                      <span>{t('empty')}</span>
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
                  <span>{gameText(tftSetupConfirmed ? 'CONFIGURATION CONFIRMED' : 'CONFIRM SETUP')}</span>
                  <small>{gameText(tftSetupConfirmed ? 'Current setup locked in' : 'Confirm towers and bench')}</small>
                </button>
                <button
                  type="button"
                  className="tft-start-wave"
                  disabled={!run || run.phase !== RUN_PHASES.PREPARATION || !tftSetupConfirmed}
                  onClick={() => onPhaseChange(RUN_PHASES.ACTIVE)}
                >
                  <span>{t('startWave')}</span>
                  <small>{gameText(tftSetupConfirmed ? 'Launch immediately' : 'Confirm setup first')}</small>
                </button>
                <button
                  type="button"
                  className={`tft-auto-start ${tftAutoStartEnabled ? 'tft-auto-start--active' : ''}`}
                  aria-pressed={tftAutoStartEnabled}
                  onClick={() => {
                    setTftAutoStartEnabled((current) => {
                      const next = !current;
                      setPreparationRemaining(next ? 20 : 40);
                      return next;
                    });
                  }}
                >
                  <span>{gameText(tftAutoStartEnabled ? 'AUTO START · 20S' : 'STANDARD · 40S')}</span>
                  <small>
                    {run?.phase === RUN_PHASES.PREPARATION
                      ? `Next wave in ${preparationRemaining}s`
                      : tftAutoStartEnabled
                        ? gameText('20s preparation between waves')
                        : gameText('40s preparation between waves')}
                  </small>
                </button>
              </div>
            </div>
            </div>
          </>
        ) : (
          <>
            <p className="main-menu__kicker">{t('defenses')}</p>
          <h3>{t('build')}</h3>
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
                        <small>{String(gameText(tower.faction)).toUpperCase()} · {String(gameText(tower.role)).toUpperCase()}</small>
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
              <span>{gameText(selectedPlacedDefense ? 'PLACED DEFENSE' : 'SELECTED DEFENSE')}</span>
              <strong>{inspectedDefense.name}</strong>
            </div>
            <div className="defense-inspector__grid">
              <div><span>{t('role')}</span><strong>{gameText(inspectedDefense.role)}</strong></div>
              <div><span>{t('cost')}</span><strong>{inspectedDefense.cost}g</strong></div>
              {'damage' in inspectedDefense && <div><span>{t('damage')}</span><strong>{inspectedDefense.damage}</strong></div>}
              {'range' in inspectedDefense && <div><span>{t('range')}</span><strong>{inspectedDefense.range}</strong></div>}
              {'attackIntervalMs' in inspectedDefense && <div><span>{t('rate')}</span><strong>{(1000 / inspectedDefense.attackIntervalMs).toFixed(1)}/s</strong></div>}
              {'damageType' in inspectedDefense && <div><span>{t('type')}</span><strong>{gameText(inspectedDefense.damageType)}</strong></div>}
              {'splashRadius' in inspectedDefense && <div><span>{t('splash')}</span><strong>{inspectedDefense.splashRadius}</strong></div>}
              {'slowPercent' in inspectedDefense && <div><span>{t('slow')}</span><strong>{inspectedDefense.slowPercent}%</strong></div>}
              {'squadSize' in inspectedDefense && <div><span>{t('squad')}</span><strong>{inspectedDefense.squadSize}</strong></div>}
              {'unitHp' in inspectedDefense && <div><span>{t('unitHp')}</span><strong>{inspectedDefense.unitHp}</strong></div>}
            </div>
            <p>{gameText(inspectedDefense.description)}</p>
            <div className="defense-inspector__sell">
              <span>{t('sellRefund')}</span>
              <strong>{selectedSellPreview.refund}g</strong>
              <small>{Math.round(SELL_ECONOMY.baseRefundRate * 100)}% of total invested gold</small>
              {selectedPlacedDefense && (
                <div className="defense-inspector__tower-actions">
                  <button
                    type="button"
                    className={movingPlacedDefenseId === selectedPlacedDefense.id ? 'is-active' : ''}
                    onClick={handleToggleMoveSelectedTower}
                  >
                    {gameText(movingPlacedDefenseId === selectedPlacedDefense.id ? 'CANCEL MOVE' : 'MOVE · 0G')}
                  </button>
                  <button type="button" onClick={handleSellSelectedTower}>
                    SELL · +{selectedSellPreview.refund}G
                  </button>
                </div>
              )}
              {movingPlacedDefenseId === selectedPlacedDefense?.id && (
                <small>Choose any empty tower pad to move this tower.</small>
              )}
              {swappingPlacedDefenseId === selectedPlacedDefense?.id && (
                <small>Choose any other occupied tower to invert their positions.</small>
              )}
              {mergingPlacedDefenseId === selectedPlacedDefense?.id && (
                <small>Choose a highlighted matching tower. Existing copy progress is combined.</small>
              )}
            </div>
            <div className="defense-inspector__upgrade">
              <span>{selectedPlacedDefense ? `LV. ${selectedPlacedDefense.level}` : gameText('NEXT UPGRADE')}</span>
              {!selectedPlacedDefense && !selectedUpgradePreview.maxed && (
                <strong>LV.{selectedUpgradePreview.nextLevel} · {selectedUpgradePreview.upgradeCost}g</strong>
              )}
              {selectedPlacedDefense && isShopMode(run?.mode) && (
                <strong>COPIES {selectedPlacedDefense.copyProgress ?? 1}/{TFT_COPY_PROGRESSION.maxCopies}</strong>
              )}
              {selectedPlacedDefense && !isShopMode(run?.mode) && selectedPlacedDefense.level < UPGRADE_CURVE.maxLevel && (
                <button type="button" onClick={handleUpgradeSelectedTower}>
                  UPGRADE TO LV.{selectedPlacedDefense.level + 1} · {getUpgradeCost(inspectedDefenseBase, selectedPlacedDefense.level + 1)}g
                </button>
              )}
              {selectedPlacedDefense && selectedPlacedDefense.level >= 4 && (!run || !isShopMode(run.mode) || Number(selectedPlacedDefense.copyProgress ?? 1) >= TFT_COPY_PROGRESSION.evolutionCopies) && !selectedPlacedDefense.evolution && (
                <div className="tower-evolution-choice">
                  <div className="tower-evolution-choice__title">{t('chooseEvolution')}</div>
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
                        <small>{gameText(choice.description)}</small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPlacedDefense?.evolution && (() => {
                const evolution = TOWER_EVOLUTIONS.find((entry) => entry.id === selectedPlacedDefense.evolution);
                return (
                  <div className="evolution-active-label">
                    <strong>EVOLUTION {evolution?.branch ?? selectedPlacedDefense.evolutionChoice ?? ''} · {evolution?.name ?? selectedPlacedDefense.evolution}</strong>
                    <small>{gameText(evolution?.description ?? 'Extreme evolution active.')}</small>
                  </div>
                );
              })()}
              <small>{isShopMode(run?.mode) ? 'TFT progression: 1/7 Lv.1 · 2–3/7 Lv.2 · 4–6/7 Lv.3 · 7/7 Lv.4 + evolution' : `Max level ${UPGRADE_CURVE.maxLevel} · evolution at Lv.4`}</small>
            </div>
            <div className="defense-inspector__targeting">
              <span>{t('targeting')}</span>
              <strong>{selectedTargetingValue.rule}</strong>
              <small>Targeting value ×{selectedTargetingValue.multiplier.toFixed(2)}</small>
            </div>
            <div className="defense-inspector__instrumentation">
              <span>{t('attackTelemetry')}</span>
              <strong>{selectedAttackInstrumentation.sustainedDps} DPS</strong>
              <small>
                {selectedAttackInstrumentation.attacksPerSecond}/s · {selectedAttackInstrumentation.projectileTravelMs}ms travel @ {selectedAttackInstrumentation.sampleDistance} range
              </small>
            </div>
          </section>

          {(run?.blessings ?? []).some((blessingId) => ['human-doctrine', 'brood-frenzy', 'alien-overmind', 'neutral-covenant'].includes(blessingId)) && (
            <div className="identity-blessing-panel" aria-label="Identity blessings">
              <div className="identity-blessing-panel__title">{t('identityBlessings')}</div>
              <div className="identity-blessing-panel__list">
                {['human-doctrine', 'brood-frenzy', 'alien-overmind', 'neutral-covenant']
                  .filter((blessingId) => (run?.blessings ?? []).includes(blessingId))
                  .map((blessingId) => {
                    const blessing = BLESSINGS.find((entry) => entry.id === blessingId);
                    return blessing ? (
                      <div key={blessing.id} className="identity-blessing-panel__entry">
                        <strong>{gameText(blessing.name)}</strong>
                        <small>{gameText(blessing.description)}</small>
                      </div>
                    ) : null;
                  })}
              </div>
            </div>
          )}

          <div
            className={synergyFeedback ? 'tower-synergy-panel tower-synergy-panel--flash' : 'tower-synergy-panel'}
            aria-label="Tower synergies"
          >
            <div className="tower-synergy-panel__title">
              TOWER SYNERGIES
              {synergyFeedback && <strong>SYNERGY ACTIVE · {synergyFeedback.name}</strong>}
            </div>
            <div className="tower-synergy-panel__grid">
              {towerSynergyState.entries.map((entry) => (
                <div
                  key={entry.faction}
                  className={entry.active ? 'tower-synergy tower-synergy--active' : 'tower-synergy'}
                >
                  <span>{gameText(entry.name)}</span>
                  <strong>{entry.count}/{entry.threshold}</strong>
                  <small>{gameText(entry.description)}</small>
                </div>
              ))}
            </div>
          </div>

          {activeTowerCombos.length > 0 && (
            <div className="tower-combo-panel" aria-label="Tower combos">
              <div className="tower-combo-panel__title">TOWER COMBOS</div>
              {activeTowerCombos.map((combo) => (
                <div key={combo.id} className="tower-combo-panel__entry"><strong>{combo.name}</strong><small>{combo.description}</small></div>
              ))}
            </div>
          )}

          {run?.mode === MODES.SINGLE_GATE && getEndlessMilestone(run?.wave) && run?.phase === RUN_PHASES.PREPARATION && (
            <div className="endless-milestone-banner" aria-live="polite">
              <span>ENDLESS MILESTONE</span><strong>WAVE {run.wave} · {getEndlessMilestone(run.wave).title}</strong><small>+{getEndlessMilestone(run.wave).goldReward} GOLD</small>
            </div>
          )}

          <div className={bossWaveIncoming ? 'boss-schedule boss-schedule--incoming' : 'boss-schedule'}>
            <span>{bossWaveIncoming ? 'BOSS WAVE' : 'NEXT BOSS'}</span>
            <strong>Wave {upcomingBossWave}</strong>
            {bossWaveIncoming && bossTuning && <small>{bossTuning.name} · {bossTuning.maxHp} HP · {bossArmor} armor · {bossSummonPlan.totalAdds} adds · enrage ≤ {Math.round(BOSS_ARMOR_ENRAGE.enrageThreshold * 100)}% HP</small>}
          </div>

          {bossWaveIncoming && bossTuning && (
            <div className="boss-milestone" aria-label="Boss milestone">
              <span>{t('bossMilestone')}</span>
              <strong>{bossTuning.name}</strong>
              <small>HP {bossTuning.maxHp} · ARMOR {bossTuning.armor} · CORE DMG {bossTuning.bastionDamage} · REWARD +{bossTuning.goldReward}G</small>
            </div>
          )}

          {rareWaveEvent && (
            <div className="rare-wave-event-panel" aria-label="Rare wave event">
              <span>{t('rareEvent')}</span>
              <strong>{gameText(rareWaveEvent.name)}</strong>
              <small>{gameText(rareWaveEvent.description)}</small>
            </div>
          )}

          {waveAffix && (
            <div className="wave-affix-panel" aria-label="Wave affix">
              <span>{t('waveAffix')}</span>
              <strong>{gameText(waveAffix.name)}</strong>
              <small>{gameText(waveAffix.description)}</small>
            </div>
          )}

          {activeWorldModifiers.length > 0 && (
            <div className="world-modifier" aria-label="World modifier">
              <span>{t('worldModifier')}</span>
              <strong>{activeWorldModifiers[0].name}</strong>
              <small>{activeWorldModifiers[0].description} · Threat ×{worldModifierEffects.threatMultiplier.toFixed(2)} · Gold ×{worldModifierEffects.waveGoldMultiplier.toFixed(2)} · Speed ×{worldModifierEffects.enemyMoveSpeedMultiplier.toFixed(2)}</small>
            </div>
          )}

          <div className="risk-reward-panel" aria-label="Risk reward choice">
            <div className="risk-reward-panel__header">
              <span>{t('riskReward')}</span>
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

          <div
            className={[
              'mini-objective-panel',
              miniObjectiveFeedback.startsWith('OBJECTIVE COMPLETE') ? 'mini-objective-panel--complete' : '',
              miniObjectiveFeedback === 'OBJECTIVE MISSED' ? 'mini-objective-panel--missed' : ''
            ].filter(Boolean).join(' ')}
            aria-label="Mini objective"
            data-objective-status={run?.phase === RUN_PHASES.ACTIVE ? miniObjectiveLive.status : ''}
          >
            <div>
              <span>{t('waveQuest')}</span>
              <strong>{gameText(miniObjective.name)}</strong>
            </div>
            <b>+{miniObjectiveReward}G</b>
            <small>{gameText(miniObjective.description)}</small>
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
              <span>{t('nextWave')}</span>
              <strong>WAVE {waveScaling.waveNumber}</strong>
            </div>
            <div className="run-wave-preview__grid">
              <div><span>{t('enemies')}</span><strong>{threatWave.enemyCount}</strong></div>
              <div><span>{t('difficulty')}</span><strong>{waveScaling.bandId.toUpperCase()}</strong></div>
              <div><span>{t('travel')}</span><strong>{(waveScaling.travelDurationMs / 1000).toFixed(1)}s</strong></div>
              <div><span>{t('spawn')}</span><strong>{(waveScaling.spawnIntervalMs / 1000).toFixed(2)}s</strong></div>
              <div><span>{t('coreDamage')}</span><strong>{waveScaling.bastionDamage}</strong></div>
              <div><span>{t('clearGold')}</span><strong>+{
                run?.mode === MODES.TRI_GATE
                  ? getTriGateWaveClearReward(waveScaling.waveNumber)
                  : run?.mode === MODES.SUDDEN_SIEGE
                    ? getSuddenSiegeWaveReward(waveScaling.waveNumber)
                    : run?.mode === MODES.TFT_SHOP
                      ? TFT_SHOP.waveClearGold
                      : getWaveClearReward(waveScaling.waveNumber)
              }</strong></div>
              {isShopMode(run?.mode) && (
                <div><span>{t('bonuses')}</span><strong>+1 PERFECT · +3 BOSS · +2 / 5 WAVES</strong></div>
              )}
              {waveAffix && (
                <div className="run-wave-preview__special">
                  <span>{t('affix')}</span><strong>{gameText(waveAffix.name)}</strong>
                </div>
              )}
              {rareWaveEvent && (
                <div className="run-wave-preview__special run-wave-preview__special--rare">
                  <span>{t('rareEvent')}</span><strong>{rareWaveEvent.name} · +{rareWaveEvent.bonusGold}G</strong>
                </div>
              )}
              {run?.mode === MODES.SUDDEN_SIEGE && suddenTelemetry && (
                <>
                  <div><span>{t('suddenStage')}</span><strong>{suddenTelemetry.stage}</strong></div>
                  <div><span>{t('hpPressure')}</span><strong>×{suddenTelemetry.hpMultiplier.toFixed(2)}</strong></div>
                </>
              )}
            </div>
          </div>


          {blessingChoiceVisible && createPortal(
            <div className="blessing-overlay" role="presentation">
              <section
              className="blessing-choice"
              aria-label="Choose a blessing"
              data-blessing-choice-ui="ready"
              data-blessing-choice-selected={selectedBlessingPreviewId ?? ''}
            >
              <div className="blessing-choice__header">
                <span>{t('bossDefeated')}</span>
                <strong>{t('chooseBlessing')}</strong>
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
                      <strong>{gameText(blessing.name)}</strong>
                      <small>{gameText(blessing.description)}</small>
                      <em>{selected ? 'SELECTED' : 'CHOOSE'}</em>
                    </button>
                  );
                })}
              </div>
              </section>
            </div>,
            document.body
          )}

          {!isShopMode(run?.mode) && (
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
      kicker={isLastBastion ? 'LAST BASTION' : t('runComplete')}
      title={lastBastionWon ? t('lastBastionStanding') : isLastBastion ? t('eliminated') : t('bastionFallen')}
      subtitle={isLastBastion
        ? lastBastionWon
          ? t('lastBastionWinSubtitle')
          : t('lastBastionLossSubtitle')
        : t('runEndedSubtitle')}
    >
      <div className="results-hero">
        <span>{personalBestResult?.isPersonalBest ? t('newPersonalBest') : t('finalScore')}</span>
        <strong>{snapshot.score.toLocaleString()}</strong>
        <small>
          {personalBestResult?.isPersonalBest
            ? `Improved by ${personalBestResult.reason}`
            : snapshot.reason === 'last-bastion-win'
              ? t('lastDefenderStanding')
              : snapshot.reason === RUN_END_REASONS.BASTION_DESTROYED
                ? t('bastionDestroyed')
                : snapshot.reason}
        </small>
      </div>

      <div className="results-grid">
        {isLastBastion && (
          <div className="stat-card">
            <span>{t('placement')}</span>
            <strong>#{snapshot.placement}</strong>
            <small>{snapshot.won ? t('winner') : `of ${snapshot.participantCount || '?'} defenders`}</small>
          </div>
        )}
        <div className="stat-card"><span>{t('wave')}</span><strong>{snapshot.wave}</strong><small>{t('completedProgression')}</small></div>
        <div className="stat-card"><span>{t('survival')}</span><strong>{formatSurvivalTime(snapshot.elapsedMs)}</strong><small>{t('officialSurvival')}</small></div>
        <div className="stat-card"><span>{t('kills')}</span><strong>{snapshot.kills}</strong><small>{t('enemiesDefeated')}</small></div>
        <div className="stat-card"><span>{t('gold')}</span><strong>{snapshot.gold}</strong><small>{t('goldRemaining')}</small></div>
        <div className="stat-card"><span>{t('bastion')}</span><strong>{snapshot.coreHp} / {snapshot.coreMaxHp}</strong><small>{t('finalCoreState')}</small></div>
        <div className="stat-card"><span>{t('mode')}</span><strong>{snapshot.mode === MODES.SINGLE_GATE ? 'SINGLE GATE' : snapshot.mode}</strong><small>{t('runFormat')}</small></div>
      </div>

      {snapshot.reason === RUN_END_REASONS.BASTION_DESTROYED && (
        <section className="death-recap" aria-label="Death recap">
          <span>DEATH RECAP</span>
          <strong>{Object.entries(snapshot.deathRecap?.byUnitType ?? {}).sort((a,b) => b[1]-a[1])[0]?.[0]?.toUpperCase() ?? 'UNKNOWN'} PRESSURE</strong>
          <small>{snapshot.deathRecap?.escapedEnemies ?? 0} enemies reached the Nexus · {snapshot.deathRecap?.nexusDamage ?? 0} total Nexus damage.{snapshot.deathRecap?.lastThreat?.name ? ' Final breach: ' + snapshot.deathRecap.lastThreat.name + '.' : ''}</small>
        </section>
      )}

      <div className="results-actions">
        <button className="pre-run-start" onClick={onRetry}>{t('retryRun')}</button>
        <button className="run-exit" onClick={onBack}>{t('backToMode')}</button>
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
  const leaderboardView = getLeaderboardPresentation(entries, leaderboardData?.personalRecord ?? null);
  const podiumOrder = [leaderboardView.podium[1], leaderboardView.podium[0], leaderboardView.podium[2]].filter(Boolean);

  return (
    <Shell
      onBack={onBack}
      kicker={t('globalRecords')}
      title={t('top10')}
      subtitle={t('leaderboardSubtitle')}
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

      {leaderboardStatus === 'ready' && leaderboardView.podium.length > 0 && (
        <div className="leaderboard-podium" aria-label="Global top three">
          {podiumOrder.map((entry) => (
            <div
              key={`podium-${entry.rank}-${entry.displayName}`}
              className={`leaderboard-podium__card leaderboard-podium__card--${entry.medal}${entry.isSelf ? ' leaderboard-podium__card--self' : ''}`}
            >
              <span className="leaderboard-podium__rank">#{entry.rank}</span>
              <strong>{entry.displayName}</strong>
              {entry.isSelf && <em>{t('you')}</em>}
              <small>WAVE {entry.bestWave} · {formatSurvivalTime(entry.bestSurvivalMs)}</small>
              <b>{Number(entry.bestScore || 0).toLocaleString()} SCORE</b>
            </div>
          ))}
        </div>
      )}

      {leaderboardStatus === 'ready' && leaderboardView.personal && (
        <div className="leaderboard-personal-record" aria-label="Your verified record">
          <div>
            <span>{t('yourVerifiedRecord')}</span>
            <strong>
              {leaderboardView.personal.isTopTen
                ? `${t('global')} #${leaderboardView.personal.rank}`
                : t('outsideTop10')}
            </strong>
          </div>
          <div>
            <b>WAVE {leaderboardView.personal.bestWave}</b>
            <small>{formatSurvivalTime(leaderboardView.personal.bestSurvivalMs)} · {Number(leaderboardView.personal.bestScore || 0).toLocaleString()} score · {Number(leaderboardView.personal.bestKills || 0).toLocaleString()} kills</small>
          </div>
        </div>
      )}

      <div className="table-card leaderboard-table">
        <div className="table-row table-row--head leaderboard-row">
          <span>#</span>
          <span>{t('defender')}</span>
          <span>{t('wave')}</span>
          <span>{t('survival')}</span>
          <span>{t('score')}</span>
          <span>{t('kills')}</span>
        </div>

        {leaderboardStatus === 'loading' && (
          <div className="empty-state">{t('loadingRecords')}</div>
        )}

        {leaderboardStatus !== 'loading' && leaderboardStatus !== 'ready' && (
          <div className="empty-state">{t('leaderboardUnavailable')}: {leaderboardStatus}</div>
        )}

        {leaderboardStatus === 'ready' && entries.length === 0 && (
          <div className="empty-state">{t('noVerifiedRuns')}</div>
        )}

        {leaderboardStatus === 'ready' && leaderboardView.rows.map((entry) => {
          const rankClass = entry.medal ? ` leaderboard-row--${entry.medal}` : '';
          const selfClass = entry.isSelf ? ' leaderboard-row--self' : '';

          return (
            <div className={`table-row leaderboard-row${rankClass}${selfClass}`} key={`${entry.displayName}-${entry.updatedAt}-${entry.rank}`}>
              <span className="leaderboard-rank">{entry.podium ? `#${entry.rank} ★` : `#${entry.rank}`}</span>
              <span className="leaderboard-defender">
                {entry.displayName}
                {entry.isSelf && <em>{t('you')}</em>}
              </span>
              <span>{entry.bestWave}</span>
              <span>{formatSurvivalTime(entry.bestSurvivalMs)}</span>
              <span>{Number(entry.bestScore || 0).toLocaleString()}</span>
              <span>{Number(entry.bestKills || 0).toLocaleString()}</span>
            </div>
          );
        })}
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
  const tft = profileData?.modes?.['tft-shop'] ?? null;
  const sudden = profileData?.modes?.['sudden-siege'] ?? null;
  const last = profileData?.lastBastion ?? null;
  const totalRuns = Number(profileData?.profile?.runs || 0);
  const totalSurvivalMs = Number(last?.total_survival_ms || 0);
  const accountProgress = getAccountProgress(profileData?.profile?.account_xp ?? 0);

  return (
    <Shell
      onBack={onBack}
      kicker={t('defenderRecord')}
      title={profileData?.profile?.display_name || t('profile')}
      subtitle={t('profileSubtitle')}
    >
      {profileStatus !== 'ready' ? (
        <div className="profile-state">
          <strong>{profileStatus === 'loading' ? t('loadingProfile') : t('profileUnavailable')}</strong>
          <small>{profileStatus === 'loading' ? t('fetchingStats') : profileStatus}</small>
        </div>
      ) : (
        <>
          <section className="profile-level-card" aria-label="Account level progression">
            <div className="profile-level-card__header">
              <div>
                <span>{t('accountLevel')}</span>
                <strong>LV. {accountProgress.level}</strong>
              </div>
              <small>{accountProgress.currentXp.toLocaleString()} / {accountProgress.requiredXp.toLocaleString()} XP</small>
            </div>
            <div className="profile-xp-track" role="progressbar" aria-valuemin="0" aria-valuemax={accountProgress.requiredXp} aria-valuenow={accountProgress.currentXp}>
              <div className="profile-xp-fill" style={{ width: `${Math.round(accountProgress.progress * 100)}%` }} />
            </div>
            <p>{t('runXp')}: +{ACCOUNT_PROGRESSION.runBaseXp} {t('base')} · +{ACCOUNT_PROGRESSION.xpPerWave}/{t('perWave')} · +{ACCOUNT_PROGRESSION.towerSevenBonusXp} @ 7/7 · +{ACCOUNT_PROGRESSION.towerFourteenBonusXp} @ 14/14.</p>
          </section>

          <div className="profile-grid">
            <div className="stat-card"><span>{t('accountXp')}</span><strong>{Number(profileData.profile.account_xp || 0).toLocaleString()}</strong><small>{t('profilePermanent')}</small></div>
            <div className="stat-card"><span>{t('totalRuns')}</span><strong>{totalRuns}</strong><small>{t('verifiedRuns')}</small></div>
            <div className="stat-card"><span>{t('lifetimeKillsUpper')}</span><strong>{Number(profileData.profile.lifetime_kills || 0).toLocaleString()}</strong><small>{t('acrossVerifiedRuns')}</small></div>
            <div className="stat-card"><span>{t('shards')}</span><strong>{profileData.profile.shards}</strong><small>{t('progressionCurrency')}</small></div>
          </div>

          <div className="profile-mode-grid">
            <section className="profile-mode-card">
              <span>SINGLE GATE</span>
              <strong>{t('wave')} {single?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(single?.best_survival_ms ?? 0)} · Score {(single?.best_score ?? 0).toLocaleString()} · Kills {(single?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>TRI-GATE</span>
              <strong>{t('wave')} {tri?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(tri?.best_survival_ms ?? 0)} · Score {(tri?.best_score ?? 0).toLocaleString()} · Kills {(tri?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>TFT SHOP</span>
              <strong>{t('wave')} {tft?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(tft?.best_survival_ms ?? 0)} · Score {(tft?.best_score ?? 0).toLocaleString()} · Kills {(tft?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>SUDDEN SIEGE</span>
              <strong>{t('wave')} {sudden?.best_wave ?? 0}</strong>
              <small>Survival {formatSurvivalTime(sudden?.best_survival_ms ?? 0)} · Score {(sudden?.best_score ?? 0).toLocaleString()} · Kills {(sudden?.best_kills ?? 0).toLocaleString()}</small>
            </section>
            <section className="profile-mode-card">
              <span>LAST BASTION</span>
              <strong>{last?.runs ?? 0} {t('runs')}</strong>
              <small>Best Wave {last?.best_wave ?? 0} · Best Survival {formatSurvivalTime(last?.best_survival_ms ?? 0)} · Best Score {(last?.best_score ?? 0).toLocaleString()}</small>
              <small>{t('lifetimeKills')} {(last?.lifetime_kills ?? 0).toLocaleString()} · {t('totalSurvival')} {formatSurvivalTime(totalSurvivalMs)}</small>
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}

function Settings({ onBack, language, onLanguageChange }) {
  return (
    <Shell
      onBack={onBack}
      kicker={t('gameOptions')}
      title={t('settings')}
      subtitle={t('settingsSubtitle')}
    >
      <div className="settings-card">
        <label><span>{t('masterVolume')}</span><input type="range" min="0" max="100" defaultValue="80" /></label>
        <label><span>{t('musicVolume')}</span><input type="range" min="0" max="100" defaultValue="65" /></label>
        <label><span>{t('effectsVolume')}</span><input type="range" min="0" max="100" defaultValue="90" /></label>
        <div className="setting-line setting-line--language">
          <span>{t('language')}</span>
          <div className="language-selector" role="group" aria-label={t('language')}>
            <button
              type="button"
              className={language === SUPPORTED_LANGUAGES.IT_IT ? 'language-selector__option language-selector__option--active' : 'language-selector__option'}
              onClick={() => onLanguageChange(SUPPORTED_LANGUAGES.IT_IT)}
            >
              🇮🇹 {t('languageItalian')}
            </button>
            <button
              type="button"
              className={language === SUPPORTED_LANGUAGES.EN_US ? 'language-selector__option language-selector__option--active' : 'language-selector__option'}
              onClick={() => onLanguageChange(SUPPORTED_LANGUAGES.EN_US)}
            >
              🇺🇸 {t('languageEnglish')}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function HowToPlay({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker={t('fieldManual')}
      title={t('howToPlay')}
      subtitle={t('howToSubtitle')}
    >
      <div className="how-to-grid">
        <section className="how-to-card"><span>1</span><strong>{t('chooseMode')}</strong><small>{t('chooseModeHelp')}</small></section>
        <section className="how-to-card"><span>2</span><strong>{t('buildDefense')}</strong><small>{t('buildDefenseHelp')}</small></section>
        <section className="how-to-card"><span>3</span><strong>{t('holdBastion')}</strong><small>{t('holdBastionHelp')}</small></section>
        <section className="how-to-card"><span>4</span><strong>{t('adaptWaves')}</strong><small>{t('adaptWavesHelp')}</small></section>
        <section className="how-to-card"><span>5</span><strong>{t('chaseRecords')}</strong><small>{t('chaseRecordsHelp')}</small></section>
        <section className="how-to-card"><span>6</span><strong>{t('noP2w')}</strong><small>{t('noP2wHelp')}</small></section>
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
      setError(t('authNotConfigured'));
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
        setNotice(t('authResetSent'));
        return;
      }

      if (authMode === 'reset-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setNotice(t('authPasswordUpdated'));
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
    authMode === 'register' ? t('createDefender') :
    authMode === 'forgot' ? t('resetPassword') :
    authMode === 'reset-password' ? t('chooseNewPassword') :
    t('signIn');

  return (
    <div className="auth-backdrop" onMouseDown={() => !busy && onClose()} role="presentation">
      <form className="auth-modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <p className="main-menu__kicker">{t('account')}</p>
        <h3 id="auth-title">{title}</h3>
        <p className="auth-modal__copy">
          {authMode === 'register'
            ? t('authRegisterCopy')
            : authMode === 'forgot'
              ? t('authForgotCopy')
              : authMode === 'reset-password'
                ? t('authResetCopy')
                : t('authLoginCopy')}
        </p>

        {authMode === 'register' && (
          <label>
            <span>{t('defenderName')}</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength="40" required placeholder="Joker" />
          </label>
        )}

        {authMode !== 'reset-password' && (
          <label>
            <span>{t('email')}</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
        )}

        {authMode !== 'forgot' && (
          <label>
            <span>{authMode === 'reset-password' ? t('newPassword') : t('password')}</span>
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
            ? t('connecting')
            : authMode === 'register'
              ? t('authRegister')
              : authMode === 'forgot'
                ? t('sendResetLink')
                : authMode === 'reset-password'
                  ? t('saveNewPassword')
                  : t('authLogin')}
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
            {t('forgotPassword')}
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
            {authMode === 'register' ? t('alreadyRegistered') : authMode === 'login' ? t('newHere') : t('backToSignIn')}
          </button>
        )}
      </form>
    </div>
  );
}

function App() {
  const [savedTftRun, setSavedTftRun] = useState(() => loadTftRunSnapshot());
  const towerPlacementQa = (
    ['127.0.0.1', 'localhost'].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get('qa') === 'tower-placement'
  );
  const [screen, setScreen] = useState(towerPlacementQa ? SCREENS.SINGLE_GATE_RUN : SCREENS.MENU);
  const [selectedMode, setSelectedMode] = useState(towerPlacementQa ? MODES.SINGLE_GATE : null);
  const [runState, setRunState] = useState(
    towerPlacementQa ? createInitialRunState(MODES.SINGLE_GATE, 'tower-placement-qa') : null
  );
  const [personalBestByMode, setPersonalBestByMode] = useState({});
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [language, setLanguageState] = useState(() => getLanguage());
  const lastStandardProgressRef = useRef(null);
  const hiddenAtRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (
        hiddenAt &&
        Date.now() - hiddenAt > TFT_PERSISTENCE.maxResumeAgeMs &&
        screen === SCREENS.SINGLE_GATE_RUN &&
        isShopMode(runState?.mode)
      ) {
        clearTftRunSnapshot();
        setRunState(null);
        setScreen(SCREENS.MODE_PREP);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen, runState?.mode]);

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
          if (mode !== MODES.SINGLE_GATE && mode !== MODES.TRI_GATE && !isShopMode(mode) && mode !== MODES.LAST_BASTION) return;
          const started = preparedMatch
            ? { ok: true, match: preparedMatch }
            : await startServerMatch(session, mode);
          if (!started.ok) return;
          const nextRun = createInitialRunState(mode, started.match.seed, started.match);
          if (!nextRun) return;
          if (isShopMode(mode)) clearTftRunSnapshot();
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
        onEnemyKilled={(enemy) => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            const killGold = current.mode === MODES.SINGLE_GATE ? getEnemyKillReward(enemy) : 0;
            return {
              ...current,
              kills: Math.max(0, Number(current.kills) || 0) + 1,
              gold: Math.max(0, Number(current.gold) || 0) + killGold
            };
          });
        }}
        onTowerMilestone={(threshold) => {
          setRunState((current) => {
            if (!current || current.phase === RUN_PHASES.ENDED) return current;
            const key = Number(threshold) >= TFT_COPY_PROGRESSION.goldAscensionCopies ? 'fourteen' : 'seven';
            return {
              ...current,
              towerMilestones: Object.freeze({
                seven: Number(current.towerMilestones?.seven ?? 0) + (key === 'seven' ? 1 : 0),
                fourteen: Number(current.towerMilestones?.fourteen ?? 0) + (key === 'fourteen' ? 1 : 0)
              })
            };
          });
        }}
        onDamageBastion={(damage, escapedEnemies = []) => {
          setRunState((current) => {
            if (!current) return current;
            const adjustedDamage = applyBlessingBastionDamage(damage, current.coreHp, current.coreMaxHp, current.blessings ?? []);
            const recap = current.deathRecap ?? { nexusDamage: 0, escapedEnemies: 0, byUnitType: {}, byFaction: {}, lastThreat: null };
            const byUnitType = { ...(recap.byUnitType ?? {}) };
            const byFaction = { ...(recap.byFaction ?? {}) };
            for (const enemy of escapedEnemies) {
              const unitType = String(enemy?.unitType ?? 'unknown');
              const faction = String(enemy?.faction ?? 'unknown');
              byUnitType[unitType] = Number(byUnitType[unitType] ?? 0) + 1;
              byFaction[faction] = Number(byFaction[faction] ?? 0) + 1;
            }
            const lastThreatEnemy = escapedEnemies.at(-1) ?? null;
            const nextDeathRecap = Object.freeze({
              nexusDamage: Math.max(0, Number(recap.nexusDamage ?? 0)) + adjustedDamage,
              escapedEnemies: Math.max(0, Number(recap.escapedEnemies ?? 0)) + escapedEnemies.length,
              byUnitType: Object.freeze(byUnitType),
              byFaction: Object.freeze(byFaction),
              lastThreat: lastThreatEnemy ? Object.freeze({ name: lastThreatEnemy.name ?? lastThreatEnemy.archetype ?? 'Enemy', unitType: lastThreatEnemy.unitType ?? 'unknown', faction: lastThreatEnemy.faction ?? 'unknown' }) : recap.lastThreat ?? null
            });
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
                deathRecap: nextDeathRecap,
                bastionHitId: current.bastionHitId + 1
              };
            }

            const endedAtMs = Date.now();
            const endedRun = {
              ...current,
              coreHp: 0,
              deathRecap: nextDeathRecap,
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
                : current.mode === MODES.SUDDEN_SIEGE
                  ? getSuddenSiegeWaveReward(completedWaveNumber)
                  : current.mode === MODES.TFT_SHOP
                    ? TFT_SHOP.waveClearGold
                    : getWaveClearReward(completedWaveNumber)
              : 0;
            const tftPerfectWave =
              isShopMode(current.mode) &&
              advancingWave &&
              Number(current.coreHp ?? 0) >= Number(current.waveStartCoreHp ?? current.coreHp ?? 0);
            const tftBossWave =
              isShopMode(current.mode) &&
              advancingWave &&
              isBossWave(completedWaveNumber);
            const shopRewardConfig = current.mode === MODES.SUDDEN_SIEGE ? SUDDEN_SIEGE : TFT_SHOP;
            const tftMilestoneWave =
              isShopMode(current.mode) &&
              advancingWave &&
              completedWaveNumber % shopRewardConfig.milestoneInterval === 0;
            const tftWaveBonus =
              isShopMode(current.mode) && advancingWave
                ? (tftPerfectWave ? shopRewardConfig.perfectWaveBonus : 0) +
                  (tftBossWave ? shopRewardConfig.bossWaveBonus : 0) +
                  (tftMilestoneWave ? shopRewardConfig.milestoneWaveBonus : 0)
                : 0;
            const nextBlessings = options.blessingId
              ? addBlessingToLoadout(current.blessings ?? [], options.blessingId)
              : current.blessings ?? [];
            const activeModifiersForClear = getActiveWorldModifiers(current.seed ?? 'run', completedWaveNumber);
            const worldEffectsForClear = getWorldModifierEffects(activeModifiersForClear);
            const modeAdjustedWaveClearGold = advancingWave
              ? isShopMode(current.mode)
                ? baseWaveClearGold + tftWaveBonus
                : Math.max(0, Math.round(applyBlessingWaveGold(baseWaveClearGold, nextBlessings) * worldEffectsForClear.waveGoldMultiplier))
              : 0;
            const waveClearGold = advancingWave
              ? applyRiskRewardGold(modeAdjustedWaveClearGold, current.mode, options.riskRewardTier ?? 'safe')
              : 0;
            const endlessMilestone = advancingWave && current.mode === MODES.SINGLE_GATE ? getEndlessMilestone(completedWaveNumber) : null;
            const nextMaxHp = getBlessingAdjustedMaxHp(RUN_DEFAULTS.coreHp, nextBlessings);
            const maxHpGain = Math.max(0, nextMaxHp - current.coreMaxHp);

            return {
              ...current,
              phase: nextPhase,
              wave: advancingWave ? current.wave + 1 : current.wave,
              gold:
                current.gold +
                waveClearGold +
                Math.max(0, Number(endlessMilestone?.goldReward) || 0) +
                Math.max(0, Number(options.miniObjectiveGold) || 0) +
                Math.max(0, Number(options.rareEventGold) || 0),
              waveStartCoreHp: nextPhase === RUN_PHASES.ACTIVE ? current.coreHp : current.waveStartCoreHp,
              blessings: nextBlessings,
              coreMaxHp: nextMaxHp,
              coreHp: Math.min(nextMaxHp, current.coreHp + maxHpGain)
            };
          });
        }}
        onExit={() => {
          if (isShopMode(runState?.mode)) clearTftRunSnapshot();
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
  if (screen === SCREENS.SETTINGS) return (
    <Settings
      language={language}
      onLanguageChange={(nextLanguage) => setLanguageState(setLanguage(nextLanguage))}
      onBack={() => setScreen(SCREENS.MENU)}
    />
  );
  if (screen === SCREENS.HOW_TO_PLAY) return <HowToPlay onBack={() => setScreen(SCREENS.MENU)} />;

  return (
    <main className="main-menu">
      <section className="main-menu__content" aria-label="Bastionfall main menu">
        <p className="main-menu__kicker">{t('endlessTowerDefense')}</p>
        <h1>BASTIONFALL</h1>
        <p className="main-menu__tagline">{t('tagline')}</p>

        <div className="account-strip">
          {session ? (
            <>
              <span>ONLINE · {session.user.email}</span>
              <button onClick={logout}>{t('signOut')}</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')}>{t('signIn')}</button>
              <button onClick={() => setAuthMode('register')}>{t('createAccount')}</button>
            </>
          )}
        </div>

        <nav className="main-menu__actions" aria-label="Primary navigation">
          <button
            className="main-menu__button main-menu__button--primary"
            onClick={() => setScreen(SCREENS.PLAY)}
          >{t('play')}</button>
          {savedTftRun && (
            <button
              className="main-menu__button"
              onClick={() => {
                const snapshot = loadTftRunSnapshot();
                setSavedTftRun(snapshot);
                if (!snapshot) return;
                setSelectedMode(snapshot.run.mode);
                setRunState(snapshot.run);
                setScreen(SCREENS.SINGLE_GATE_RUN);
              }}
            >{language === 'it' ? 'Riprendi partita TFT' : 'Resume TFT run'}</button>
          )}
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.PROFILE)}>{t('profile')}</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.LEADERBOARD)}>{t('leaderboards')}</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.HOW_TO_PLAY)}>{t('howToPlay')}</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.SETTINGS)}>{t('settings')}</button>
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
