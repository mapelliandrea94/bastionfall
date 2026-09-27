import React from 'react';
import { createRoot } from 'react-dom/client';
import './menu.css';

function MainMenu() {
  return (
    <main className="main-menu">
      <section className="main-menu__content" aria-label="Bastionfall main menu">
        <p className="main-menu__kicker">ENDLESS TOWER DEFENSE</p>
        <h1>BASTIONFALL</h1>
        <p className="main-menu__tagline">Build. Hold. Survive.</p>

        <nav className="main-menu__actions" aria-label="Primary navigation">
          <button className="main-menu__button main-menu__button--primary">PLAY</button>
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
    <MainMenu />
  </React.StrictMode>
);
