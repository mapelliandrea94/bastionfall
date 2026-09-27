import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase.js';
import './menu.css';

const SCREENS = Object.freeze({
  MENU: 'menu',
  PLAY: 'play',
  SINGLE_GATE_PREP: 'single-gate-prep',
  SINGLE_GATE_RUN: 'single-gate-run',
  LEADERBOARD: 'leaderboard',
  PROFILE: 'profile',
  SETTINGS: 'settings'
});

const MODES = Object.freeze({
  SINGLE_GATE: 'single-gate',
  TRI_GATE: 'tri-gate',
  LAST_BASTION: 'last-bastion'
});

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

function ModeSelect({ onBack, onSolo }) {
  return (
    <Shell
      onBack={onBack}
      kicker="CHOOSE YOUR DEFENSE"
      title="ENDLESS MODES"
      subtitle="Everyone starts equal. Every run begins from zero."
    >
      <div className="mode-grid">
        <button className="mode-card mode-card--ready" onClick={onSolo}>
          <span className="mode-card__players">1 PLAYER</span>
          <strong>SOLO</strong>
          <small>Pure endless survival.</small>
          <em>READY</em>
        </button>

        <button className="mode-card" disabled>
          <span className="mode-card__players">2 PLAYERS</span>
          <strong>DUO</strong>
          <small>Hold the line together.</small>
          <em>COMING SOON</em>
        </button>

        <button className="mode-card" disabled>
          <span className="mode-card__players">3 PLAYERS</span>
          <strong>TRIO</strong>
          <small>Three defenders, one bastion.</small>
          <em>COMING SOON</em>
        </button>

        <button className="mode-card" disabled>
          <span className="mode-card__players">4 PLAYERS</span>
          <strong>SQUAD</strong>
          <small>Maximum chaos. Maximum survival.</small>
          <em>COMING SOON</em>
        </button>
      </div>
    </Shell>
  );
}


function SoloPreRun({ onBack, onStart }) {
  return (
    <Shell
      onBack={onBack}
      kicker="SOLO ENDLESS"
      title="PREPARE THE BASTION"
      subtitle="No permanent power. No head start. Every defender begins equal."
    >
      <div className="pre-run-grid">
        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">MODE</span>
          <strong>SOLO</strong>
          <small>One defender. Endless waves.</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">STARTING RULES</span>
          <strong>STANDARD</strong>
          <small>Same gold, same towers, same conditions every run.</small>
        </section>

        <section className="pre-run-card">
          <span className="pre-run-card__eyebrow">OBJECTIVE</span>
          <strong>SURVIVE</strong>
          <small>Your record is the highest wave reached.</small>
        </section>
      </div>

      <div className="pre-run-footer">
        <p>Map: <strong>First Bastion</strong></p>
        <button className="pre-run-start" onClick={onStart}>
          START RUN
          <small>Enter First Bastion</small>
        </button>
      </div>
    </Shell>
  );
}


function SoloRun({ onExit }) {
  return (
    <main className="run-screen">
      <section className="run-layout">
        <div className="battlefield">
          <header className="run-hud">
            <div>
              <span className="run-hud__label">MODE</span>
              <strong>SOLO ENDLESS</strong>
            </div>
            <div>
              <span className="run-hud__label">WAVE</span>
              <strong>0</strong>
            </div>
            <div>
              <span className="run-hud__label">GOLD</span>
              <strong>240</strong>
            </div>
            <div>
              <span className="run-hud__label">CORE</span>
              <strong>20 / 20</strong>
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
        </div>

        <aside className="run-sidebar">
          <p className="main-menu__kicker">DEFENSES</p>
          <h3>BUILD</h3>
          <button disabled>ARCHER <span>70g</span></button>
          <button disabled>CANNON <span>110g</span></button>
          <button disabled>FROST <span>90g</span></button>

          <div className="run-sidebar__status">
            <span>PREPARATION</span>
            <strong>Ready for Wave 1</strong>
          </div>

          <button className="run-wave" disabled>
            START WAVE 1
            <small>Wave system comes next</small>
          </button>
        </aside>
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

  if (screen === SCREENS.PLAY) return <ModeSelect onBack={() => setScreen(SCREENS.MENU)} onSolo={() => setScreen(SCREENS.SINGLE_GATE_PREP)} />;
  if (screen === SCREENS.SINGLE_GATE_PREP) return <SoloPreRun onBack={() => setScreen(SCREENS.PLAY)} onStart={() => setScreen(SCREENS.SINGLE_GATE_RUN)} />;
  if (screen === SCREENS.SINGLE_GATE_RUN) return <SoloRun onExit={() => setScreen(SCREENS.SINGLE_GATE_PREP)} />;
  if (screen === SCREENS.LEADERBOARD) return <Leaderboard onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.PROFILE) return <Profile onBack={() => setScreen(SCREENS.MENU)} />;
  if (screen === SCREENS.SETTINGS) return <Settings onBack={() => setScreen(SCREENS.MENU)} />;

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
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.LEADERBOARD)}>LEADERBOARD</button>
          <button className="main-menu__button" onClick={() => setScreen(SCREENS.PROFILE)}>PROFILE</button>
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
