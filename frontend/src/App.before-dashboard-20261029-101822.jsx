import { useState } from 'react';
import './App.css';
import CropRecommendation from './CropRecommendation';
import FertilizerRecommendation from './FertilizerRecommendation';

export default function App() {
  const [activeModule, setActiveModule] = useState('crop');

  return (
    <div className="agro-app">
      <header className="app-header">
        <a className="brand" href="#home" aria-label="AgroGenius AI home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span className="brand-copy">
            <strong>AgroGenius<span> AI</span></strong>
            <small>SMARTER FARMING DECISIONS</small>
          </span>
        </a>
        <span className="header-status">
          <span className="status-dot" />
          ML Recommendation Platform
        </span>
      </header>

      <main className="app-main" id="home">
        <section className="welcome-panel">
          <div className="welcome-copy">
            <span className="welcome-kicker">AGRICULTURE · DATA · TECHNOLOGY</span>
            <h1>Grow smarter.<br /><span>Plan with data.</span></h1>
            <p>
              Explore crop and fertilizer predictions using soil and
              environmental inputs in one simple workspace.
            </p>
          </div>
          <div className="welcome-visual" aria-hidden="true">
            <span className="visual-sun" />
            <span className="visual-hill hill-back" />
            <span className="visual-hill hill-front" />
            <span className="visual-stem" />
            <span className="visual-leaf leaf-left" />
            <span className="visual-leaf leaf-right" />
          </div>
        </section>

        <nav className="module-switcher" aria-label="Recommendation modules">
          <button
            type="button"
            className={`module-tab ${activeModule === 'crop' ? 'active' : ''}`}
            onClick={() => setActiveModule('crop')}
            aria-pressed={activeModule === 'crop'}
          >
            <span className="tab-icon">🌱</span>
            <span><strong>Crop Recommendation</strong><small>Find a suitable crop</small></span>
            <span className="tab-arrow">→</span>
          </button>
          <button
            type="button"
            className={`module-tab ${activeModule === 'fertilizer' ? 'active' : ''}`}
            onClick={() => setActiveModule('fertilizer')}
            aria-pressed={activeModule === 'fertilizer'}
          >
            <span className="tab-icon">🧪</span>
            <span><strong>Fertilizer Recommendation</strong><small>Explore fertilizer predictions</small></span>
            <span className="tab-arrow">→</span>
          </button>
        </nav>

        <div className="module-content" key={activeModule}>
          {activeModule === 'crop'
            ? <CropRecommendation />
            : <FertilizerRecommendation />}
        </div>
      </main>

      <footer className="app-footer">
        <span>AgroGenius AI</span>
        <span>Prototype for learning and demonstration · Verify advice before farm use</span>
      </footer>
    </div>
  );
}
