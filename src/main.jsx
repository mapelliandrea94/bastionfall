import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './menu.css';

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

function ModeSelect({ onBack }) {
  return (
    <Shell
      onBack={onBack}
      kicker="CHOOSE YOUR DEFENSE"
      title="ENDLESS MODES"
      subtitle="Everyone starts equal. Every run begins from zero."
    >
      <div className="mode-grid">
        <button className="mode-card mode-card--ready">
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
      subtitle="Account progress is prestige only. Power resets every run."
    >
      <div className="profile-grid">
        <div className="stat-card"><span>ACCOUNT LEVEL</span><strong>1</strong><small>Prestige only</small></div>
        <div className="stat-card"><span>BEST SOLO WAVE</span><strong>—</strong><small>No run recorded</small></div>
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

function App() {
  const [screen, setScreen] = useState('menu');

  if (screen === 'play') return <ModeSelect onBack={() => setScreen('menu')} />;
  if (screen === 'leaderboard') return <Leaderboard onBack={() => setScreen('menu')} />;
  if (screen === 'profile') return <Profile onBack={() => setScreen('menu')} />;
  if (screen === 'settings') return <Settings onBack={() => setScreen('menu')} />;

  return (
    <main className="main-menu">
      <section className="main-menu__content" aria-label="Bastionfall main menu">
        <p className="main-menu__kicker">ENDLESS TOWER DEFENSE</p>
        <h1>BASTIONFALL</h1>
        <p className="main-menu__tagline">Build. Hold. Survive.</p>

        <nav className="main-menu__actions" aria-label="Primary navigation">
          <button
            className="main-menu__button main-menu__button--primary"
            onClick={() => setScreen('play')}
          >
            PLAY
          </button>
          <button className="main-menu__button" onClick={() => setScreen('leaderboard')}>LEADERBOARD</button>
          <button className="main-menu__button" onClick={() => setScreen('profile')}>PROFILE</button>
          <button className="main-menu__button" onClick={() => setScreen('settings')}>SETTINGS</button>
        </nav>

        <p className="main-menu__version">Prototype v0.1.0</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
