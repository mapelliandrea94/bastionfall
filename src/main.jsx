import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import { normalizeRunSeed } from './lib/runSeed.js';
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
  ENDED: 'ended'
});

const RUN_DEFAULTS = Object.freeze({
  startingGold: 240,
  coreHp: 20
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
    kills: 0,
    elapsedMs: 0,
    result: null
  };
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


function SoloRun({ run, onExit }) {
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
          <div className="battlefield__lane battlefield__lane--a" />
          <div className="battlefield__lane battlefield__lane--b" />
          <div className="battlefield__spawn">SPAWN</div>
          <div className="battlefield__core">BASTION CORE</div>

          <div className="build-slot build-slot--1">+</div>
          <div className="build-slot build-slot--2">+</div>
          <div className="build-slot build-slot--3">+</div>
          <div className="build-slot build-slot--4">+</div>
          <div className="build-slot build-slot--5">+</div>
          <div className="build-slot build-slot--6">+</div>

          <aside className="run-sidebar">
          <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <button disabled>ARCHER <span>70g</span></button>
          <button disabled>CANNON <span>110g</span></button>
          <button disabled>FROST <span>90g</span></button>

          <div className="run-sidebar__status">
            <span>PREPARATION</span>
            <strong>{run?.phase === RUN_PHASES.PREPARATION ? 'Ready for Wave 1' : run?.phase || 'Run unavailable'}</strong>
          </div>

          <button className="run-wave" disabled>
            START WAVE 1
            <small>Wave system comes next</small>
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
