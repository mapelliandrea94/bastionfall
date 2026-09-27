import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import { normalizeRunSeed } from './lib/runSeed.js';
import { SINGLE_GATE_MAP, getSingleGatePathForWalls } from './game/maps/singleGate.js';
import { TRI_GATE_MAP, getTriGateMapFixtures } from './game/maps/triGate.js';
import { TRI_GATE_SPAWN, getTriGateSpawnFixtures } from './game/spawning/triGateSpawn.js';
import { ARCHER_TOWER } from './game/towers/archer.js';
import { CANNON_TOWER } from './game/towers/cannon.js';
import { FROST_TOWER } from './game/towers/frost.js';
import { TOWER_ROSTER, getTowerRosterFixtures } from './game/towers/towerRoster.js';
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
import { WALL_SYSTEM, purchaseWall } from './game/structures/walls.js';
import { ECONOMY_SPEND_CURVE, getEconomyRiskProfile, getSpendCurveFixtures, getStrategicSpendProfile } from './game/balance/economySpendCurve.js';
import { UPGRADE_CURVE, getNextUpgradePreview } from './game/balance/upgradeCurves.js';
import { getTargetingFixtures, getTargetingValue, resolveTarget } from './game/combat/targeting.js';
import { ATTACK_FEEDBACK, getAttackFeedbackFixtures, getAttackInstrumentation } from './game/combat/attackFeedback.js';
import { COUNTERPLAY_MATRIX, getCounterplayFixtures } from './game/combat/counterplay.js';
import { FACTION_COUNTER_ENGINE, getFactionCounterFixtures } from './game/combat/factionCounters.js';
import { WAVE_THREAT_MODEL, composeWaveByThreatBudget, getThreatModelFixtures } from './game/balance/waveThreat.js';
import { DIFFICULTY_BANDS, getBandWaveScaling, getDifficultyBandFixtures } from './game/balance/difficultyBands.js';
import { TRI_GATE_PACING, getTriGateEconomyFixtures, getTriGateWaveClearReward, getTriGateWaveScaling } from './game/balance/triGatePacing.js';
import { getTriGateBalanceSmokeTest } from './game/balance/triGateBalanceSmoke.js';
import { BOSS_SCHEDULE, getBossScheduleFixtures, getUpcomingBossWave, isBossWave } from './game/boss/bossSchedule.js';
import { BOSS_ARMOR_ENRAGE, applyBossEnrageStats, getBossArmorEnrageFixtures, getBossArmorForIndex } from './game/boss/bossArmorEnrage.js';
import { BOSS_TUNING, getBossTuningFixtures, getBossTuningForWave } from './game/boss/bossTuning.js';
import { BLESSING_SYSTEM, addBlessingToLoadout, getBlessingOffer, getBlessingSystemFixtures } from './game/blessings/blessings.js';
import { BLESSING_ENGINE, applyBlessingBastionDamage, applyBlessingWaveGold, getBlessingAdjustedMaxHp, getBlessingEngineFixtures, getBlessingModifiers } from './game/blessings/blessingEngine.js';
import { BLESSING_REROLL, canRerollBlessings, getBlessingRerollCost, getBlessingRerollFixtures, getRerolledBlessingOffer } from './game/blessings/blessingReroll.js';
import { BLESSING_POWER_BUDGET, getBlessingExploitChecks } from './game/blessings/blessingPowerBudget.js';
import { BOSS_SUMMON_ADDS, getBossSummonAddsFixtures, getBossSummonAddsPlan } from './game/boss/bossSummonAdds.js';
import { RUN_TIMER, formatSurvivalTime, getElapsedRunMs, getRunTimerFixtures } from './game/run/runTimer.js';
import { RUN_SCORE, calculateRunScore, getRunScoreFixtures } from './game/run/runScore.js';
import { RUN_END_REASONS, createRunEndSnapshot, getRunEndFixtures } from './game/run/runEndSnapshot.js';
import { PERSONAL_BEST, comparePersonalBest, getPersonalBestFixtures } from './game/run/personalBest.js';
import { ENEMY_BASE_MODEL, getEnemyBaseFixtures } from './game/enemies/enemyBase.js';
import { NORMAL_ENEMY, createNormalEnemyState, getNormalEnemyBudget } from './game/enemies/normal.js';
import { RUNNER_ENEMY, createRunnerEnemyState, getRunnerEnemyBudget } from './game/enemies/runner.js';
import { TANK_ENEMY, createTankEnemyState, getTankEnemyBudget } from './game/enemies/tank.js';
import { ARMORED_ENEMY, createArmoredEnemyState, getArmoredEnemyBudget } from './game/enemies/armored.js';
import { SHIELDED_ENEMY, createShieldedEnemyState, getShieldedEnemyBudget } from './game/enemies/shielded.js';
import { FLYING_ENEMY, createFlyingEnemyState, getFlyingEnemyBudget } from './game/enemies/flying.js';
import { ELITE_MODIFIER_SYSTEM, applyEliteModifiers, attachEliteModifierFoundation, getEliteModifierFoundationFixtures } from './game/elites/eliteModifiers.js';
import { WORLD_MODIFIER_SYSTEM, getActiveWorldModifiers, getWorldModifierEffects, getWorldModifierFoundationFixtures } from './game/world/worldModifiers.js';
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
  LAST_BASTION: 'last-bastion'
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

const DIFFICULTY_BAND_FIXTURE = Object.freeze(getDifficultyBandFixtures());

const RUN_TIMER_FIXTURE = Object.freeze(getRunTimerFixtures());

const RUN_SCORE_FIXTURE = Object.freeze(getRunScoreFixtures());

const RUN_END_FIXTURE = Object.freeze(getRunEndFixtures());

const PERSONAL_BEST_FIXTURE = Object.freeze(getPersonalBestFixtures());

const ENEMY_BASE_FIXTURE = Object.freeze(getEnemyBaseFixtures());

const NORMAL_ENEMY_BUDGET = Object.freeze(getNormalEnemyBudget());

const RUNNER_ENEMY_BUDGET = Object.freeze(getRunnerEnemyBudget());

const TANK_ENEMY_BUDGET = Object.freeze(getTankEnemyBudget());

const ARMORED_ENEMY_BUDGET = Object.freeze(getArmoredEnemyBudget());

const SHIELDED_ENEMY_BUDGET = Object.freeze(getShieldedEnemyBudget());

const FLYING_ENEMY_BUDGET = Object.freeze(getFlyingEnemyBudget());
const TOWER_ROSTER_FIXTURE = Object.freeze(getTowerRosterFixtures());
const ELITE_MODIFIER_FIXTURE = Object.freeze(getEliteModifierFoundationFixtures());
const WORLD_MODIFIER_FIXTURE = Object.freeze(getWorldModifierFoundationFixtures());

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
const BOSS_SCHEDULE_FIXTURE = Object.freeze(getBossScheduleFixtures());
const BOSS_SUMMON_ADDS_FIXTURE = Object.freeze(getBossSummonAddsFixtures());
const BOSS_ARMOR_ENRAGE_FIXTURE = Object.freeze(getBossArmorEnrageFixtures());
const BOSS_TUNING_FIXTURE = Object.freeze(getBossTuningFixtures());
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
    gold: mode === MODES.TRI_GATE ? TRI_GATE_PACING.startingGold : RUN_DEFAULTS.startingGold,
    coreHp: RUN_DEFAULTS.coreHp,
    coreMaxHp: RUN_DEFAULTS.coreHp,
    bastionHitId: 0,
    kills: 0,
    startedAtMs: Date.now(),
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

async function completeServerRun(session, run) {
  if (!session?.access_token || !run?.matchToken || !run?.endSnapshot) {
    return { ok: false, error: 'completion_not_ready' };
  }

  const snapshot = run.endSnapshot;
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
  return waypoints.slice(1).reduce((total, point, index) => {
    const previous = waypoints[index];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
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
    <main className="main-menu">
      <section className="mode-screen" aria-label={title}>
        <button className="mode-screen__back" onClick={onBack}>← BACK</button>
        <p className="main-menu__kicker">{kicker}</p>
        <h2>{title}</h2>
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
      <div className="mode-grid">
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

function ModePreRun({ mode, onBack, onStart }) {
  const contract = MODE_PRE_RUN[mode];

  if (!contract) return null;

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
          disabled={mode !== MODES.SINGLE_GATE}
          onClick={() => mode === MODES.SINGLE_GATE && onStart(mode)}
        >
          START RUN
          <small>{mode === MODES.SINGLE_GATE ? 'Initialize Single Gate run' : contract.status}</small>
        </button>
      </div>
    </Shell>
  );
}


function SoloRun({ run, onExit, onDamageBastion, onPhaseChange, onTimerTick, onSpendGold }) {
  const [spawnQueue, setSpawnQueue] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [preparationRemaining, setPreparationRemaining] = useState(run?.preparationSeconds ?? RUN_DEFAULTS.preparationSeconds);
  const [selectedDefenseId, setSelectedDefenseId] = useState('archer');
  const [placedDefenses, setPlacedDefenses] = useState([]);
  const [activeWallIds, setActiveWallIds] = useState([]);
  const [hoveredSlotId, setHoveredSlotId] = useState(null);
  const [selectedPlacedDefenseId, setSelectedPlacedDefenseId] = useState(null);
  const [selectedBlessingPreviewId, setSelectedBlessingPreviewId] = useState(null);
  const [blessingRerollCount, setBlessingRerollCount] = useState(0);
  const availableGoldRef = useRef(run?.gold ?? RUN_DEFAULTS.startingGold);
  const animationFrameRef = useRef(null);
  const queuedWaveRef = useRef(null);
  const bossSummonTimeoutsRef = useRef([]);
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
  const worldModifierEffects = getWorldModifierEffects(activeWorldModifiers);
  const threatWave = composeWaveByThreatBudget(
    waveScaling.waveNumber,
    (run?.mode === MODES.TRI_GATE ? TRI_GATE_PACING.threatMultiplier : 1) * worldModifierEffects.threatMultiplier
  );
  const runScore = calculateRunScore(run ?? {});
  const activePath = getSingleGatePathForWalls(activeWallIds);
  const basePathLength = getPathLength(SINGLE_GATE_MAP.path.waypoints);
  const activePathLength = getPathLength(activePath);
  const wallTravelMultiplier = basePathLength > 0 ? activePathLength / basePathLength : 1;
  const defenseDefinitions = Object.freeze({
    archer: ARCHER_TOWER,
    cannon: CANNON_TOWER,
    frost: FROST_TOWER,
    mage: MAGE_TOWER,
    ballista: BALLISTA_TOWER,
    barracks: BARRACKS
  });
  const selectedDefense = defenseDefinitions[selectedDefenseId] ?? ARCHER_TOWER;
  const selectedPlacedDefense = placedDefenses.find((entry) => entry.id === selectedPlacedDefenseId) ?? null;
  const inspectedDefense = selectedPlacedDefense
    ? defenseDefinitions[selectedPlacedDefense.defenseId] ?? selectedDefense
    : selectedDefense;
  const selectedSellPreview = getSellPreview(inspectedDefense);
  const selectedUpgradePreview = getNextUpgradePreview(inspectedDefense, 1);
  const selectedTargetingValue = getTargetingValue(inspectedDefense);
  const selectedAttackInstrumentation = getAttackInstrumentation(inspectedDefense);
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
  }, [run?.phase, run?.wave]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || queuedWaveRef.current === run?.wave) return;

    queuedWaveRef.current = run?.wave;
    setSpawnQueue(
      threatWave.composition.map((enemy, index) => attachEliteModifierFoundation({
        id: `wave-${waveScaling.waveNumber}-enemy-${index + 1}`,
        archetype: enemy.archetype,
        threatValue: enemy.threatValue
      }, {
        seed: run?.seed ?? 'run',
        waveNumber: waveScaling.waveNumber,
        enemyIndex: index
      }))
    );
  }, [run?.phase, run?.wave]);

  useEffect(() => {
    bossSummonTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    bossSummonTimeoutsRef.current = [];

    if (run?.phase !== RUN_PHASES.ACTIVE || !bossSummonPlan.active) return undefined;

    bossSummonTimeoutsRef.current = bossSummonPlan.pulses.map((pulse) =>
      window.setTimeout(() => {
        setSpawnQueue((current) => [...current, ...pulse.adds]);
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
        const baseEnemyState = nextEnemy.archetype === FLYING_ENEMY.archetype
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
      let reachedBastion = 0;

      setActiveEnemies((current) => current
        .map((enemy) => ({
          ...enemy,
          progress: Math.min(1, ((now - enemy.spawnedAt) / durationMs) * (enemy.moveSpeed || 1) * blessingModifiers.enemyMoveSpeedMultiplier * worldModifierEffects.enemyMoveSpeedMultiplier)
        }))
        .filter((enemy) => {
          if (enemy.progress >= 1) {
            reachedBastion += 1;
            return false;
          }
          return true;
        }));

      if (reachedBastion > 0) {
        onDamageBastion(reachedBastion * waveScaling.bastionDamage);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeEnemies.length, run?.phase]);

  useEffect(() => {
    const queueInitialized = queuedWaveRef.current === run?.wave;

    if (
      run?.phase === RUN_PHASES.ACTIVE &&
      queueInitialized &&
      spawnQueue.length === 0 &&
      activeEnemies.length === 0
    ) {
      onPhaseChange(RUN_PHASES.RESOLVING);
    }
  }, [run?.phase, run?.wave, spawnQueue.length, activeEnemies.length]);

  const positionedEnemies = activeEnemies.map((enemy) => ({
    ...enemy,
    position: getPathPosition(activePath, enemy.progress)
  }));

  const handleWallPurchase = (wallId) => {
    if (!run || run.phase !== RUN_PHASES.PREPARATION) return;

    const attempt = purchaseWall({
      wallId,
      gold: availableGoldRef.current,
      activeWallIds
    });

    if (!attempt.ok) return;

    availableGoldRef.current = attempt.goldAfter;
    setActiveWallIds([...attempt.activeWallIds]);
    onSpendGold(WALL_SYSTEM.cost);
  };

  const handleDefenseSelection = (defenseId) => {
    setSelectedDefenseId(defenseId);
    setSelectedPlacedDefenseId(null);
  };

  const handleBuildSlot = (slotId) => {
    const occupied = placedDefenses.find((entry) => entry.slotId === slotId);
    if (occupied) {
      setSelectedPlacedDefenseId(occupied.id);
      return;
    }

    if (!run || run.phase === RUN_PHASES.ENDED) return;

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
  };


  return (
    <main className="run-screen">
      <section className="run-layout">
        <div className="battlefield">
          <header className="run-hud">
            <div>
              <span className="run-hud__label">MODE</span>
              <strong>{run?.mode === MODES.SINGLE_GATE ? 'SINGLE GATE' : 'UNKNOWN'}</strong>
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
            <button className="run-exit" onClick={onExit}>EXIT RUN</button>
          </header>
          <svg
            className="battlefield-map"
            viewBox={`0 0 ${SINGLE_GATE_MAP.size.width} ${SINGLE_GATE_MAP.size.height}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="Single Gate battlefield"
          >
            <defs>
              <linearGradient id="bf-river" x2="0" y2="1"><stop stopColor="#d2faff"/><stop offset=".5" stopColor="#42b9da"/><stop offset="1" stopColor="#177dbe"/></linearGradient>
              <linearGradient id="bf-cliff" x2="0" y2="1"><stop stopColor="#e7d7af"/><stop offset=".22" stopColor="#a2a793"/><stop offset="1" stopColor="#4c7377"/></linearGradient>
              <linearGradient id="bf-path" x2="0" y2="1"><stop stopColor="#e5d5aa"/><stop offset="1" stopColor="#b6a37d"/></linearGradient>
            </defs>
            <g className="battlefield-map__scenery" aria-hidden="true">
              <path className="battlefield-map__cliff" d="M0 0H1600V92Q1410 135 1280 84T940 104Q780 154 630 100T280 115Q110 80 0 132Z M0 805Q170 764 310 815T680 795Q820 747 1000 813T1350 792Q1500 760 1600 812V900H0Z" />
              <path className="battlefield-map__river" d="M390 0Q510 76 470 142T500 275M1070 900Q1020 820 1060 740T1030 660" />
              <path className="battlefield-map__waterfall" d="M407 3Q440 82 435 142M1080 898Q1043 832 1078 770" />
              {[ [95,150],[730,85],[1280,130],[145,740],[695,805],[1390,750] ].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path className="battlefield-map__pine-shadow" d="M-33 19H34L0-72Z"/><path className="battlefield-map__pine" d="M0-82L-20-35H-12L-30 5H-21L-38 25H38L21 5H30L12-35H20Z"/><path className="battlefield-map__pine-light" d="M0-82L-20-35H-12L-30 5H-21L-38 25H0Z"/></g>)}
              {[ [270,125],[905,116],[400,755],[1230,796] ].map(([x,y]) => <path key={`${x}-${y}`} className="battlefield-map__crystal" d={`M${x} ${y-35}l18 27-18 25-18-25Z`}/>)}
            </g>
            <g className="battlefield-map__build-slots">
              {SINGLE_GATE_MAP.buildSlots.slots.map((slot) => {
                const placed = placedDefenses.find((entry) => entry.slotId === slot.id) ?? null;
                const affordable = (run?.gold ?? 0) >= selectedDefense.cost;
                const hovered = hoveredSlotId === slot.id;
                const selectedPlaced = placed?.id === selectedPlacedDefenseId;
                const slotClass = [
                  'battlefield-map__tower-slot',
                  placed ? 'battlefield-map__tower-slot--occupied' : 'battlefield-map__tower-slot--available',
                  !placed && !affordable ? 'battlefield-map__tower-slot--unaffordable' : '',
                  hovered ? 'battlefield-map__tower-slot--hovered' : '',
                  selectedPlaced ? 'battlefield-map__tower-slot--selected' : ''
                ].filter(Boolean).join(' ');

                return (
                  <g
                    key={slot.id}
                    className={slotClass}
                    transform={`translate(${slot.x} ${slot.y})`}
                    role="button"
                    tabIndex="0"
                    aria-label={placed ? `Select ${defenseDefinitions[placed.defenseId]?.name || 'tower'}` : `Build ${selectedDefense.name}`}
                    data-slot-id={slot.id}
                    data-occupied={Boolean(placed)}
                    data-defense-id={placed?.defenseId ?? ''}
                    onMouseEnter={() => setHoveredSlotId(slot.id)}
                    onMouseLeave={() => setHoveredSlotId((current) => current === slot.id ? null : current)}
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
                      <g className={`tower-visual tower-visual--ghost tower-visual--${selectedDefense.id}`}>
                        <circle className="tower-visual__base" r="23" />
                        <rect className="tower-visual__body" x="-12" y="-25" width="24" height="32" rx="5" />
                        <path className="tower-visual__crest" d="M-16-24L0-38L16-24Z" />
                        <text className="tower-visual__label" x="0" y="5" textAnchor="middle">{selectedDefense.name.slice(0, 1)}</text>
                      </g>
                    )}

                    {placed && (
                      <g className={`tower-visual tower-visual--${placed.defenseId}`}>
                        <circle className="tower-visual__base" r="23" />
                        <rect className="tower-visual__body" x="-12" y="-25" width="24" height="32" rx="5" />
                        <path className="tower-visual__crest" d="M-16-24L0-38L16-24Z" />
                        <text className="tower-visual__label" x="0" y="5" textAnchor="middle">
                          {(defenseDefinitions[placed.defenseId]?.name || '?').slice(0, 1)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            <polyline
              className="battlefield-map__path"
              points={activePath.map((point) => `${point.x},${point.y}`).join(' ')}
              strokeWidth={SINGLE_GATE_MAP.path.width}
            />
            <g className="battlefield-map__wall-slots" aria-label="Purchasable wall sockets">
              {SINGLE_GATE_MAP.wallSlots.sockets.map((wall) => {
                const built = activeWallIds.includes(wall.id);
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
                    <rect className="wall-slot__base" x="-34" y="-18" width="68" height="36" rx="8" />
                    {built ? (
                      <>
                        <rect className="wall-slot__wall" x="-28" y="-30" width="56" height="42" rx="5" />
                        <path className="wall-slot__battlement" d="M-28-30h12v10h10v-10H6v10h10v-10h12" />
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
            <circle
              className="battlefield-map__spawn"
              cx={SINGLE_GATE_MAP.anchors.enemySpawn.x}
              cy={SINGLE_GATE_MAP.anchors.enemySpawn.y}
              r="42"
            />
            {positionedEnemies.map((enemy) => {
              const hpRatio = enemy.maxHp > 0 ? Math.max(0, Math.min(1, enemy.hp / enemy.maxHp)) : 0;
              const shieldRatio = enemy.maxShield > 0 ? Math.max(0, Math.min(1, enemy.shield / enemy.maxShield)) : 0;
              const slowActive = (enemy.statusEffects?.slowUntilMs ?? 0) > performance.now();

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
                  <circle r="24" />
                  <path d="M -10 -5 L 0 -18 L 10 -5 L 8 14 L -8 14 Z" />

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
            <g
              className={`battlefield-map__bastion ${bastionStateClass}`}
              transform={`translate(${SINGLE_GATE_MAP.anchors.bastion.x} ${SINGLE_GATE_MAP.anchors.bastion.y})`}
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
            <text
              className="battlefield-map__label"
              x={SINGLE_GATE_MAP.anchors.enemySpawn.x}
              y={SINGLE_GATE_MAP.anchors.enemySpawn.y + 8}
              textAnchor="middle"
            >
              SPAWN
            </text>
            <text
              className="battlefield-map__label battlefield-map__label--bastion"
              x={SINGLE_GATE_MAP.anchors.bastion.x}
              y={SINGLE_GATE_MAP.anchors.bastion.y + 102}
              textAnchor="middle"
            >
              BASTION
            </text>
          </svg>

          <aside
            className="run-sidebar"
            data-balance-version={COMBAT_BALANCE_MODEL.version}
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
            data-tower-roster-version={TOWER_ROSTER.version}
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
            data-tower-slot-purchase-pass={TOWER_SLOT_PURCHASE_FIXTURE.every((entry) => entry.actual === entry.expected && entry.deductedCorrectly)}
            data-placed-defense-count={placedDefenses.length}
            data-run-gold={run?.gold ?? 0}
          >
          <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <button className={`tower-card tower-card--archer ${selectedDefenseId === 'archer' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('archer')}>
            <strong>{ARCHER_TOWER.name}</strong>
            <span>{ARCHER_TOWER.cost}g</span>
            <small>{ARCHER_TOWER.damage} DMG · {ARCHER_TOWER.range} RANGE · {(1000 / ARCHER_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button className={`tower-card tower-card--cannon ${selectedDefenseId === 'cannon' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('cannon')}>
            <strong>{CANNON_TOWER.name}</strong>
            <span>{CANNON_TOWER.cost}g</span>
            <small>{CANNON_TOWER.damage} DMG · {CANNON_TOWER.splashRadius} SPLASH · {(1000 / CANNON_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button className={`tower-card tower-card--frost ${selectedDefenseId === 'frost' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('frost')}>
            <strong>{FROST_TOWER.name}</strong>
            <span>{FROST_TOWER.cost}g</span>
            <small>{FROST_TOWER.damage} DMG · {FROST_TOWER.slowPercent}% SLOW · {(FROST_TOWER.slowDurationMs / 1000).toFixed(1)}s</small>
          </button>
          <button className={`tower-card tower-card--mage ${selectedDefenseId === 'mage' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('mage')}>
            <strong>{MAGE_TOWER.name}</strong>
            <span>{MAGE_TOWER.cost}g</span>
            <small>{MAGE_TOWER.damage} DMG · {MAGE_TOWER.range} RANGE · {MAGE_TOWER.damageType.toUpperCase()}</small>
          </button>
          <button className={`tower-card tower-card--ballista ${selectedDefenseId === 'ballista' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('ballista')}>
            <strong>{BALLISTA_TOWER.name}</strong>
            <span>{BALLISTA_TOWER.cost}g</span>
            <small>{BALLISTA_TOWER.damage} DMG · {BALLISTA_TOWER.range} RANGE · {BALLISTA_TOWER.damageType.toUpperCase()}</small>
          </button>
          <button className={`tower-card tower-card--barracks ${selectedDefenseId === 'barracks' ? 'tower-card--selected' : ''}`} onClick={() => handleDefenseSelection('barracks')}>
            <strong>{BARRACKS.name}</strong>
            <span>{BARRACKS.cost}g</span>
            <small>{BARRACKS.squadSize} UNITS · {BARRACKS.engageRadius} ENGAGE · {(BARRACKS.respawnIntervalMs / 1000).toFixed(1)}s RESPAWN</small>
          </button>

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
              <small>{Math.round(SELL_ECONOMY.baseRefundRate * 100)}% of invested gold · preview only until a placed defense is selected</small>
            </div>
            <div className="defense-inspector__upgrade">
              <span>NEXT UPGRADE</span>
              <strong>LV.{selectedUpgradePreview.nextLevel} · {selectedUpgradePreview.upgradeCost}g</strong>
              <small>
                {selectedUpgradePreview.efficiency.dpsPer100Gold} DPS/100g · max level {UPGRADE_CURVE.maxLevel}
              </small>
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
              <div><span>CLEAR GOLD</span><strong>+{run?.mode === MODES.TRI_GATE ? getTriGateWaveClearReward(waveScaling.waveNumber) : getWaveClearReward(waveScaling.waveNumber)}</strong></div>
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

          <button
            className="run-prep-start"
            onClick={() => onPhaseChange(RUN_PHASES.ACTIVE)}
            disabled={!run || run.phase !== RUN_PHASES.PREPARATION}
          >
            START NOW
            <small>Skip the preparation countdown</small>
          </button>

          <div className="run-queue-status">
            <span>QUEUE</span>
            <strong>{spawnQueue.length} pending · {activeEnemies.length} active</strong>
          </div>

          <button
            className="run-phase-test"
            onClick={() => {
              setSelectedBlessingPreviewId(null);
              setBlessingRerollCount(0);
              onPhaseChange(RUN_PHASES.PREPARATION, { advanceWave: true, blessingId: selectedBlessingPreviewId });
            }}
            disabled={!run || run.phase !== RUN_PHASES.RESOLVING || (blessingChoiceVisible && !selectedBlessingPreviewId)}
          >
            FINISH RESOLUTION
            <small>{blessingChoiceVisible && !selectedBlessingPreviewId ? 'Choose a blessing first' : 'Resolving → Preparation'}</small>
          </button>

          <button
            className="run-damage-test"
            onClick={() => onDamageBastion(5)}
            disabled={!run || run.coreHp <= 0}
          >
            TEST BASTION HIT
            <small>−5 HP · temporary QA control</small>
          </button>

          <button className="run-wave" disabled>
            AUTO COMPLETION ACTIVE
            <small>Resolves when queue and battlefield are empty</small>
          </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ResultsScreen({ snapshot, personalBestResult, onRetry, onBack }) {
  if (!snapshot) return null;

  return (
    <Shell
      onBack={onBack}
      kicker="RUN COMPLETE"
      title="BASTION FALLEN"
      subtitle="Your run has ended. Review the final snapshot before trying again."
    >
      <div className="results-hero">
        <span>{personalBestResult?.isPersonalBest ? 'NEW PERSONAL BEST' : 'FINAL SCORE'}</span>
        <strong>{snapshot.score.toLocaleString()}</strong>
        <small>
          {personalBestResult?.isPersonalBest
            ? `Improved by ${personalBestResult.reason}`
            : snapshot.reason === RUN_END_REASONS.BASTION_DESTROYED
              ? 'Bastion destroyed'
              : snapshot.reason}
        </small>
      </div>

      <div className="results-grid">
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

  async function submit(e) {
    e.preventDefault();
    if (!supabase) {
      setError('Online authentication is not configured.');
      return;
    }

    setBusy(true);
    setError('');
    try {
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
        'Invalid login credentials': 'Email or password is incorrect.'
      };
      setError(friendly[code] || code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-backdrop" onMouseDown={() => !busy && onClose()}>
      <form className="auth-modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
        <p className="main-menu__kicker">BASTIONFALL ACCOUNT</p>
        <h3>{authMode === 'register' ? 'CREATE DEFENDER' : 'SIGN IN'}</h3>
        <p className="auth-modal__copy">
          {authMode === 'register'
            ? 'Your account is active immediately. No email confirmation.'
            : 'Continue your records from any device.'}
        </p>

        {authMode === 'register' && (
          <label>
            <span>Defender name</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength="40" required placeholder="Joker" />
          </label>
        )}

        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </label>

        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength="8" maxLength="72" required autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'CONNECTING...' : authMode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
        </button>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {authMode === 'login' ? 'New here? Create account' : 'Already registered? Sign in'}
        </button>
      </form>
    </div>
  );
}

function App() {
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

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase?.auth.signOut();
  }

  useEffect(() => {
    if (
      screen === SCREENS.SINGLE_GATE_RUN &&
      runState?.phase === RUN_PHASES.ENDED &&
      runState?.endSnapshot
    ) {
      const mode = runState.endSnapshot.mode ?? MODES.SINGLE_GATE;
      const previous = personalBestByMode[mode] ?? null;
      const personalBestResult = comparePersonalBest(runState.endSnapshot, previous);

      setRunState((current) => {
        if (!current || current.personalBestResult) return current;
        return { ...current, personalBestResult };
      });

      if (personalBestResult.isPersonalBest) {
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
        onBack={() => setScreen(SCREENS.PLAY)}
        onStart={async (mode) => {
          if (mode !== MODES.SINGLE_GATE) return;
          const started = await startServerMatch(session, mode);
          if (!started.ok) return;
          const nextRun = createInitialRunState(mode, started.match.seed, started.match);
          if (!nextRun) return;
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
        onDamageBastion={(damage) => {
          setRunState((current) => {
            if (!current) return current;
            const adjustedDamage = applyBlessingBastionDamage(damage, current.coreHp, current.coreMaxHp, current.blessings ?? []);
            const nextHp = Math.max(0, current.coreHp - adjustedDamage);
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
            const baseWaveClearGold = advancingWave
              ? current.mode === MODES.TRI_GATE
                ? getTriGateWaveClearReward(completedWaveNumber)
                : getWaveClearReward(completedWaveNumber)
              : 0;
            const nextBlessings = options.blessingId
              ? addBlessingToLoadout(current.blessings ?? [], options.blessingId)
              : current.blessings ?? [];
            const activeModifiersForClear = getActiveWorldModifiers(current.seed ?? 'run', completedWaveNumber);
            const worldEffectsForClear = getWorldModifierEffects(activeModifiersForClear);
            const waveClearGold = advancingWave
              ? Math.max(0, Math.round(applyBlessingWaveGold(baseWaveClearGold, nextBlessings) * worldEffectsForClear.waveGoldMultiplier))
              : 0;
            const nextMaxHp = getBlessingAdjustedMaxHp(RUN_DEFAULTS.coreHp, nextBlessings);
            const maxHpGain = Math.max(0, nextMaxHp - current.coreMaxHp);

            return {
              ...current,
              phase: nextPhase,
              wave: advancingWave ? current.wave + 1 : current.wave,
              gold: current.gold + waveClearGold,
              blessings: nextBlessings,
              coreMaxHp: nextMaxHp,
              coreHp: Math.min(nextMaxHp, current.coreHp + maxHpGain)
            };
          });
        }}
        onExit={() => {
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
