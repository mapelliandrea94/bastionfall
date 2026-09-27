import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import { normalizeRunSeed } from './lib/runSeed.js';
import { SINGLE_GATE_MAP } from './game/maps/singleGate.js';
import { ARCHER_TOWER } from './game/towers/archer.js';
import { CANNON_TOWER } from './game/towers/cannon.js';
import { FROST_TOWER } from './game/towers/frost.js';
import { MAGE_TOWER } from './game/towers/mage.js';
import { BALLISTA_TOWER } from './game/towers/ballista.js';
import { BARRACKS } from './game/structures/barracks.js';
import { COMBAT_BALANCE_MODEL, COMBAT_BALANCE_SNAPSHOT } from './game/balance/combatBalance.js';
import { getPlacementValidationFixtures, validateSingleGatePlacement } from './game/placement/singleGatePlacement.js';
import { SELL_ECONOMY, getSellPreview } from './game/economy/sellEconomy.js';
import { ECONOMY_BASELINE, getEconomyBaselineFixtures, getWaveClearReward } from './game/economy/economyBaseline.js';
import { GOLD_MINE, getGoldMineBreakEvenWave, getGoldMineFixtures, getGoldMineOpportunityCost } from './game/structures/goldMine.js';
import { WAR_FORGE, applyWarForgePreview, getWarForgeFixtures } from './game/structures/warForge.js';
import { GUARDIAN_SHRINE, applyGuardianShrineRangePreview, applyGuardianShrineToBastionDamage, getGuardianShrineFixtures } from './game/structures/guardianShrine.js';
import { ECONOMY_SPEND_CURVE, getEconomyRiskProfile, getSpendCurveFixtures, getStrategicSpendProfile } from './game/balance/economySpendCurve.js';
import { UPGRADE_CURVE, getNextUpgradePreview } from './game/balance/upgradeCurves.js';
import { getTargetingFixtures, getTargetingValue, resolveTarget } from './game/combat/targeting.js';
import { ATTACK_FEEDBACK, getAttackFeedbackFixtures, getAttackInstrumentation } from './game/combat/attackFeedback.js';
import { COUNTERPLAY_MATRIX, getCounterplayFixtures } from './game/combat/counterplay.js';
import { WAVE_THREAT_MODEL, composeWaveByThreatBudget, getThreatModelFixtures } from './game/balance/waveThreat.js';
import { DIFFICULTY_BANDS, getBandWaveScaling, getDifficultyBandFixtures } from './game/balance/difficultyBands.js';
import { ENEMY_BASE_MODEL, getEnemyBaseFixtures } from './game/enemies/enemyBase.js';
import { NORMAL_ENEMY, createNormalEnemyState, getNormalEnemyBudget } from './game/enemies/normal.js';
import { RUNNER_ENEMY, createRunnerEnemyState, getRunnerEnemyBudget } from './game/enemies/runner.js';
import { TANK_ENEMY, createTankEnemyState, getTankEnemyBudget } from './game/enemies/tank.js';
import { ARMORED_ENEMY, createArmoredEnemyState, getArmoredEnemyBudget } from './game/enemies/armored.js';
import { SHIELDED_ENEMY, createShieldedEnemyState, getShieldedEnemyBudget } from './game/enemies/shielded.js';
import { FLYING_ENEMY, createFlyingEnemyState, getFlyingEnemyBudget } from './game/enemies/flying.js';
import './menu.css';

const SCREENS = Object.freeze({
  MENU: 'menu',
  PLAY: 'play',
  MODE_PREP: 'mode-prep',
  SINGLE_GATE_RUN: 'single-gate-run',
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

const THREAT_MODEL_FIXTURE = Object.freeze(getThreatModelFixtures());

const DIFFICULTY_BAND_FIXTURE = Object.freeze(getDifficultyBandFixtures());

const ENEMY_BASE_FIXTURE = Object.freeze(getEnemyBaseFixtures());

const NORMAL_ENEMY_BUDGET = Object.freeze(getNormalEnemyBudget());

const RUNNER_ENEMY_BUDGET = Object.freeze(getRunnerEnemyBudget());

const TANK_ENEMY_BUDGET = Object.freeze(getTankEnemyBudget());

const ARMORED_ENEMY_BUDGET = Object.freeze(getArmoredEnemyBudget());

const SHIELDED_ENEMY_BUDGET = Object.freeze(getShieldedEnemyBudget());

const FLYING_ENEMY_BUDGET = Object.freeze(getFlyingEnemyBudget());

const ECONOMY_BASELINE_FIXTURE = Object.freeze(getEconomyBaselineFixtures({
  archer: ARCHER_TOWER,
  cannon: CANNON_TOWER,
  frost: FROST_TOWER,
  mage: MAGE_TOWER,
  ballista: BALLISTA_TOWER,
  barracks: BARRACKS
}));

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

function getWaveScaling(completedWaves) {
  return getBandWaveScaling(Math.max(1, completedWaves + 1));
}

const RUN_DEFAULTS = Object.freeze({
  startingGold: ECONOMY_BASELINE.startingGold,
  coreHp: 20,
  preparationSeconds: 15
});

function createInitialRunState(mode, seedInput = `${mode}:prototype`) {
  if (!Object.values(MODES).includes(mode)) return null;

  return {
    mode,
    seed: normalizeRunSeed(seedInput),
    phase: RUN_PHASES.PREPARATION,
    wave: 0,
    gold: RUN_DEFAULTS.startingGold,
    coreHp: RUN_DEFAULTS.coreHp,
    coreMaxHp: RUN_DEFAULTS.coreHp,
    bastionHitId: 0,
    kills: 0,
    elapsedMs: 0,
    result: null
  };
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
          <small>The battlefield implementation is intentionally outside this batch.</small>
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


function SoloRun({ run, onExit, onDamageBastion, onPhaseChange }) {
  const [spawnQueue, setSpawnQueue] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [preparationRemaining, setPreparationRemaining] = useState(RUN_DEFAULTS.preparationSeconds);
  const [selectedDefenseId, setSelectedDefenseId] = useState('archer');
  const animationFrameRef = useRef(null);
  const queuedWaveRef = useRef(null);
  const waveScaling = getWaveScaling(run?.wave ?? 0);
  const threatWave = composeWaveByThreatBudget(waveScaling.waveNumber);
  const defenseDefinitions = Object.freeze({
    archer: ARCHER_TOWER,
    cannon: CANNON_TOWER,
    frost: FROST_TOWER,
    mage: MAGE_TOWER,
    ballista: BALLISTA_TOWER,
    barracks: BARRACKS
  });
  const selectedDefense = defenseDefinitions[selectedDefenseId] ?? ARCHER_TOWER;
  const selectedSellPreview = getSellPreview(selectedDefense);
  const selectedUpgradePreview = getNextUpgradePreview(selectedDefense, 1);
  const selectedTargetingValue = getTargetingValue(selectedDefense);
  const selectedAttackInstrumentation = getAttackInstrumentation(selectedDefense);
  const coreRatio = Math.max(0, Math.min(1, (run?.coreHp ?? 0) / (run?.coreMaxHp || 1)));
  const bastionStateClass = coreRatio <= 0.25
    ? 'battlefield-map__bastion--critical'
    : coreRatio <= 0.5
      ? 'battlefield-map__bastion--damaged'
      : '';

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.PREPARATION) return undefined;

    setPreparationRemaining(RUN_DEFAULTS.preparationSeconds);

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
      threatWave.composition.map((enemy, index) => ({
        id: `wave-${waveScaling.waveNumber}-enemy-${index + 1}`,
        archetype: enemy.archetype,
        threatValue: enemy.threatValue
      }))
    );
  }, [run?.phase, run?.wave]);

  useEffect(() => {
    if (run?.phase !== RUN_PHASES.ACTIVE || spawnQueue.length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSpawnQueue((current) => {
        if (current.length === 0) return current;
        const [nextEnemy, ...remaining] = current;
        setActiveEnemies((active) => [
          ...active,
          (nextEnemy.archetype === FLYING_ENEMY.archetype
          ? createFlyingEnemyState({
              ...nextEnemy,
              progress: 0,
              spawnedAt: performance.now()
            })
          : nextEnemy.archetype === SHIELDED_ENEMY.archetype
            ? createShieldedEnemyState({
                ...nextEnemy,
                progress: 0,
                spawnedAt: performance.now()
              })
            : nextEnemy.archetype === ARMORED_ENEMY.archetype
              ? createArmoredEnemyState({
                  ...nextEnemy,
                  progress: 0,
                  spawnedAt: performance.now()
                })
              : nextEnemy.archetype === TANK_ENEMY.archetype
                ? createTankEnemyState({
                    ...nextEnemy,
                    progress: 0,
                    spawnedAt: performance.now()
                  })
                : nextEnemy.archetype === RUNNER_ENEMY.archetype
                  ? createRunnerEnemyState({
                      ...nextEnemy,
                      progress: 0,
                      spawnedAt: performance.now()
                    })
                  : createNormalEnemyState({
                      ...nextEnemy,
                      progress: 0,
                      spawnedAt: performance.now()
                    }))
        ]);
        return remaining;
      });
    }, activeEnemies.length === 0 ? 150 : waveScaling.spawnIntervalMs);

    return () => window.clearTimeout(timeoutId);
  }, [run?.phase, spawnQueue.length, activeEnemies.length]);

  useEffect(() => {
    if (activeEnemies.length === 0 || run?.phase === RUN_PHASES.ENDED) return undefined;

    const durationMs = waveScaling.travelDurationMs;

    const tick = (now) => {
      let reachedBastion = 0;

      setActiveEnemies((current) => current
        .map((enemy) => ({
          ...enemy,
          progress: Math.min(1, ((now - enemy.spawnedAt) / durationMs) * (enemy.moveSpeed || 1))
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
    position: getPathPosition(SINGLE_GATE_MAP.path.waypoints, enemy.progress)
  }));


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
            <button className="run-exit" onClick={onExit}>EXIT RUN</button>
          </header>
          <svg
            className="battlefield-map"
            viewBox={`0 0 ${SINGLE_GATE_MAP.size.width} ${SINGLE_GATE_MAP.size.height}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="Single Gate battlefield"
          >
            {SINGLE_GATE_MAP.buildZones.zones.map((zone) => (
              <rect
                key={zone.id}
                className="battlefield-map__build-zone"
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx="20"
              />
            ))}
            <polyline
              className="battlefield-map__path"
              points={SINGLE_GATE_MAP.path.waypoints.map((point) => `${point.x},${point.y}`).join(' ')}
            />
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
            data-counterplay-pass={COUNTERPLAY_FIXTURE.physicalVsArmor.hpDamage === 60 && COUNTERPLAY_FIXTURE.piercingVsArmor.hpDamage === 86 && COUNTERPLAY_FIXTURE.arcaneVsShield.shieldDamage === 100 && COUNTERPLAY_FIXTURE.archerVsFlying === true && COUNTERPLAY_FIXTURE.cannonVsFlying === false && COUNTERPLAY_FIXTURE.barracksVsFlying === false}
            data-threat-model-version={WAVE_THREAT_MODEL.version}
            data-threat-model-pass={THREAT_MODEL_FIXTURE.wave1BudgetExpected === THREAT_MODEL_FIXTURE.wave1BudgetActual && THREAT_MODEL_FIXTURE.wave1OnlyNormal === true && THREAT_MODEL_FIXTURE.wave5HasTank === true && THREAT_MODEL_FIXTURE.wave11HasFlying === true && THREAT_MODEL_FIXTURE.wave11WithinBudget === true}
            data-difficulty-bands={DIFFICULTY_BANDS.length}
            data-difficulty-band={waveScaling.bandId}
            data-difficulty-pass={DIFFICULTY_BAND_FIXTURE.wave1BandExpected === DIFFICULTY_BAND_FIXTURE.wave1BandActual && DIFFICULTY_BAND_FIXTURE.wave6BandExpected === DIFFICULTY_BAND_FIXTURE.wave6BandActual && DIFFICULTY_BAND_FIXTURE.wave13BandExpected === DIFFICULTY_BAND_FIXTURE.wave13BandActual && DIFFICULTY_BAND_FIXTURE.wave21BandExpected === DIFFICULTY_BAND_FIXTURE.wave21BandActual && DIFFICULTY_BAND_FIXTURE.monotonicTravel === true && DIFFICULTY_BAND_FIXTURE.monotonicSpawn === true}
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
          >
          <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <button className={`tower-card tower-card--archer ${selectedDefenseId === 'archer' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('archer')}>
            <strong>{ARCHER_TOWER.name}</strong>
            <span>{ARCHER_TOWER.cost}g</span>
            <small>{ARCHER_TOWER.damage} DMG · {ARCHER_TOWER.range} RANGE · {(1000 / ARCHER_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button className={`tower-card tower-card--cannon ${selectedDefenseId === 'cannon' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('cannon')}>
            <strong>{CANNON_TOWER.name}</strong>
            <span>{CANNON_TOWER.cost}g</span>
            <small>{CANNON_TOWER.damage} DMG · {CANNON_TOWER.splashRadius} SPLASH · {(1000 / CANNON_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button className={`tower-card tower-card--frost ${selectedDefenseId === 'frost' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('frost')}>
            <strong>{FROST_TOWER.name}</strong>
            <span>{FROST_TOWER.cost}g</span>
            <small>{FROST_TOWER.damage} DMG · {FROST_TOWER.slowPercent}% SLOW · {(FROST_TOWER.slowDurationMs / 1000).toFixed(1)}s</small>
          </button>
          <button className={`tower-card tower-card--mage ${selectedDefenseId === 'mage' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('mage')}>
            <strong>{MAGE_TOWER.name}</strong>
            <span>{MAGE_TOWER.cost}g</span>
            <small>{MAGE_TOWER.damage} DMG · {MAGE_TOWER.range} RANGE · {MAGE_TOWER.damageType.toUpperCase()}</small>
          </button>
          <button className={`tower-card tower-card--ballista ${selectedDefenseId === 'ballista' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('ballista')}>
            <strong>{BALLISTA_TOWER.name}</strong>
            <span>{BALLISTA_TOWER.cost}g</span>
            <small>{BALLISTA_TOWER.damage} DMG · {BALLISTA_TOWER.range} RANGE · {BALLISTA_TOWER.damageType.toUpperCase()}</small>
          </button>
          <button className={`tower-card tower-card--barracks ${selectedDefenseId === 'barracks' ? 'tower-card--selected' : ''}`} onClick={() => setSelectedDefenseId('barracks')}>
            <strong>{BARRACKS.name}</strong>
            <span>{BARRACKS.cost}g</span>
            <small>{BARRACKS.squadSize} UNITS · {BARRACKS.engageRadius} ENGAGE · {(BARRACKS.respawnIntervalMs / 1000).toFixed(1)}s RESPAWN</small>
          </button>

          <section className="defense-inspector" aria-label="Selected defense inspection">
            <div className="defense-inspector__header">
              <span>SELECTED DEFENSE</span>
              <strong>{selectedDefense.name}</strong>
            </div>
            <div className="defense-inspector__grid">
              <div><span>ROLE</span><strong>{selectedDefense.role}</strong></div>
              <div><span>COST</span><strong>{selectedDefense.cost}g</strong></div>
              {'damage' in selectedDefense && <div><span>DAMAGE</span><strong>{selectedDefense.damage}</strong></div>}
              {'range' in selectedDefense && <div><span>RANGE</span><strong>{selectedDefense.range}</strong></div>}
              {'attackIntervalMs' in selectedDefense && <div><span>RATE</span><strong>{(1000 / selectedDefense.attackIntervalMs).toFixed(1)}/s</strong></div>}
              {'damageType' in selectedDefense && <div><span>TYPE</span><strong>{selectedDefense.damageType}</strong></div>}
              {'splashRadius' in selectedDefense && <div><span>SPLASH</span><strong>{selectedDefense.splashRadius}</strong></div>}
              {'slowPercent' in selectedDefense && <div><span>SLOW</span><strong>{selectedDefense.slowPercent}%</strong></div>}
              {'squadSize' in selectedDefense && <div><span>SQUAD</span><strong>{selectedDefense.squadSize}</strong></div>}
              {'unitHp' in selectedDefense && <div><span>UNIT HP</span><strong>{selectedDefense.unitHp}</strong></div>}
            </div>
            <p>{selectedDefense.description}</p>
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
              <div><span>TRAVEL</span><strong>{(waveScaling.travelDurationMs / 1000).toFixed(1)}s</strong></div>
              <div><span>SPAWN</span><strong>{(waveScaling.spawnIntervalMs / 1000).toFixed(2)}s</strong></div>
              <div><span>CORE DMG</span><strong>{waveScaling.bastionDamage}</strong></div>
              <div><span>CLEAR GOLD</span><strong>+{getWaveClearReward(waveScaling.waveNumber)}</strong></div>
            </div>
          </div>


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
            onClick={() => onPhaseChange(RUN_PHASES.PREPARATION, { advanceWave: true })}
            disabled={!run || run.phase !== RUN_PHASES.RESOLVING}
          >
            FINISH RESOLUTION
            <small>Resolving → Preparation</small>
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

function Leaderboard({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker="GLOBAL RECORDS"
      title="LEADERBOARD"
      subtitle="Fair runs only. No permanent power advantages."
    >
      <div className="table-card">
        <div className="table-row table-row--head">
          <span>#</span><span>DEFENDER</span><span>MODE</span><span>WAVE</span>
        </div>
        <div className="empty-state">No recorded runs yet.</div>
      </div>
    </Shell>
  );
}

function Profile({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker="DEFENDER RECORD"
      title="PROFILE"
      subtitle="Account progress tracks records, achievements and prestige. Every run starts equal."
    >
      <div className="profile-grid">
        <div className="stat-card"><span>DEFENDER PRESTIGE</span><strong>1</strong><small>Cosmetic/status progression only</small></div>
        <div className="stat-card"><span>BEST SURVIVAL WAVE</span><strong>—</strong><small>No verified run recorded</small></div>
        <div className="stat-card"><span>TOTAL RUNS</span><strong>0</strong><small>Across all modes</small></div>
        <div className="stat-card"><span>PLAYTIME</span><strong>0h</strong><small>Recorded online</small></div>
      </div>
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
  const [screen, setScreen] = useState(SCREENS.MENU);
  const [selectedMode, setSelectedMode] = useState(null);
  const [runState, setRunState] = useState(null);
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
        onStart={(mode) => {
          const nextRun = createInitialRunState(mode);
          if (!nextRun || mode !== MODES.SINGLE_GATE) return;
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
        onDamageBastion={(damage) => {
          setRunState((current) => {
            if (!current) return current;
            const nextHp = Math.max(0, current.coreHp - Math.max(0, damage));
            return {
              ...current,
              coreHp: nextHp,
              bastionHitId: current.bastionHitId + 1,
              phase: nextHp === 0 ? RUN_PHASES.ENDED : current.phase,
              result: nextHp === 0 ? 'bastion-destroyed' : current.result
            };
          });
        }}
        onPhaseChange={(nextPhase, options = {}) => {
          setRunState((current) => {
            if (!current || !canTransitionWavePhase(current.phase, nextPhase)) return current;
            const advancingWave = Boolean(options.advanceWave);
            const completedWaveNumber = Math.max(1, current.wave + 1);
            const waveClearGold = advancingWave ? getWaveClearReward(completedWaveNumber) : 0;

            return {
              ...current,
              phase: nextPhase,
              wave: advancingWave ? current.wave + 1 : current.wave,
              gold: current.gold + waveClearGold
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
  if (screen === SCREENS.LEADERBOARD) return <Leaderboard onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.PROFILE) return <Profile onBack={() => setScreen(SCREENS.MENU)} />;
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
