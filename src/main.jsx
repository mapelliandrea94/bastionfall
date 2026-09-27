import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import { normalizeRunSeed } from './lib/runSeed.js';
import { SINGLE_GATE_MAP } from './game/maps/singleGate.js';
import { ARCHER_TOWER } from './game/towers/archer.js';
import { CANNON_TOWER } from './game/towers/cannon.js';
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
  const waveNumber = Math.max(1, completedWaves + 1);
  const enemyCount = 3 + Math.floor((waveNumber - 1) * 0.75);
  const travelDurationMs = Math.max(3000, 7000 - (waveNumber - 1) * 140);
  const spawnIntervalMs = Math.max(350, 900 - (waveNumber - 1) * 20);
  const bastionDamage = 1 + Math.floor((waveNumber - 1) / 10);

  return {
    waveNumber,
    enemyCount,
    travelDurationMs,
    spawnIntervalMs,
    bastionDamage
  };
}

const RUN_DEFAULTS = Object.freeze({
  startingGold: 240,
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
  const animationFrameRef = useRef(null);
  const queuedWaveRef = useRef(null);
  const waveScaling = getWaveScaling(run?.wave ?? 0);
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
      Array.from({ length: waveScaling.enemyCount }, (_, index) => ({
        id: `wave-${waveScaling.waveNumber}-enemy-${index + 1}`
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
          { ...nextEnemy, progress: 0, spawnedAt: performance.now() }
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
          progress: Math.min(1, (now - enemy.spawnedAt) / durationMs)
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
            {positionedEnemies.map((enemy) => (
              <g
                key={enemy.id}
                className="battlefield-map__enemy"
                transform={`translate(${enemy.position.x} ${enemy.position.y})`}
                aria-label="Queued enemy"
              >
                <circle r="24" />
                <path d="M -10 -5 L 0 -18 L 10 -5 L 8 14 L -8 14 Z" />
              </g>
            ))}
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

          <aside className="run-sidebar">
          <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <button className="tower-card tower-card--archer" disabled>
            <strong>{ARCHER_TOWER.name}</strong>
            <span>{ARCHER_TOWER.cost}g</span>
            <small>{ARCHER_TOWER.damage} DMG · {ARCHER_TOWER.range} RANGE · {(1000 / ARCHER_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button className="tower-card tower-card--cannon" disabled>
            <strong>{CANNON_TOWER.name}</strong>
            <span>{CANNON_TOWER.cost}g</span>
            <small>{CANNON_TOWER.damage} DMG · {CANNON_TOWER.splashRadius} SPLASH · {(1000 / CANNON_TOWER.attackIntervalMs).toFixed(1)}/s</small>
          </button>
          <button disabled>FROST <span>90g</span></button>

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
              <div><span>ENEMIES</span><strong>{waveScaling.enemyCount}</strong></div>
              <div><span>TRAVEL</span><strong>{(waveScaling.travelDurationMs / 1000).toFixed(1)}s</strong></div>
              <div><span>SPAWN</span><strong>{(waveScaling.spawnIntervalMs / 1000).toFixed(2)}s</strong></div>
              <div><span>CORE DMG</span><strong>{waveScaling.bastionDamage}</strong></div>
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
            return {
              ...current,
              phase: nextPhase,
              wave: options.advanceWave ? current.wave + 1 : current.wave
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
