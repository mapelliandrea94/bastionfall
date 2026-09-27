import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './menu.css';

function ModeSelect({ onBack }) {
  return (
    <main className="main-menu">
      <section className="mode-screen" aria-label="Game mode selection">
        <button className="mode-screen__back" onClick={onBack}>← BACK</button>

        <p className="main-menu__kicker">CHOOSE YOUR DEFENSE</p>
        <h2>ENDLESS MODES</h2>
        <p className="mode-screen__subtitle">
          Everyone starts equal. Every run begins from zero.
        </p>

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
      </section>
    </main>
  );
}

function App() {
  const [screen, setScreen] = useState('menu');

  if (screen === 'play') {
    return <ModeSelect onBack={() => setScreen('menu')} />;
  }

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
          <button className="main-menu__button">LEADERBOARD</button>
          <button className="main-menu__button">PROFILE</button>
          <button className="main-menu__button">SETTINGS</button>
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
