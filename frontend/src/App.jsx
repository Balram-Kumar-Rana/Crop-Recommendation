import { useEffect, useState } from 'react';
import './DashboardPremium.css';
import CropRecommendation from './CropRecommendation';
import FertilizerRecommendation from './FertilizerRecommendation';

const navigation = [
  { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { id: 'crop', icon: '♧', label: 'Crop Recommendation' },
  { id: 'fertilizer', icon: '✳', label: 'Fertilizer Recommendation' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

function Dashboard({ navigate }) {
  return (
    <div className="dashboard-page">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-kicker">YOUR INTELLIGENT FARMING COMPANION</span>
          <h1>Grow smarter.<br /><span>Farm better.</span></h1>
          <p>
            Make informed farming decisions using soil parameters,
            crop recommendations and fertilizer guidance.
          </p>
          <button className="primary-button" onClick={() => navigate('crop')}>
            Explore crop recommendations <span>→</span>
          </button>
        </div>
        <div className="welcome-visual" aria-hidden="true">
          <div className="visual-sun" />
          <div className="visual-hill hill-back" />
          <div className="visual-hill hill-front" />
          <div className="visual-stem" />
          <div className="visual-leaf leaf-left" />
          <div className="visual-leaf leaf-right" />
        </div>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h2>Your farming workspace</h2>
          <p>Quick access to your AI-assisted farming tools.</p>
        </div>
        <span className="demo-badge">● Demo dashboard</span>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon green">♧</span>
          <span className="stat-label">AI TOOLS</span>
          <strong>02</strong>
          <small>Crop and fertilizer recommendations</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon blue">⌁</span>
          <span className="stat-label">INPUT DATA</span>
          <strong>Soil +</strong>
          <small>Soil and environmental parameters</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon amber">✳</span>
          <span className="stat-label">WORKFLOW</span>
          <strong>Simple</strong>
          <small>Enter values and request a prediction</small>
        </article>
      </section>

      <div className="section-heading tools-heading">
        <div>
          <span className="eyebrow">RECOMMENDATION CENTER</span>
          <h2>Choose your tool</h2>
          <p>Select a module to get started.</p>
        </div>
      </div>

      <section className="tools-grid">
        <button className="tool-card" onClick={() => navigate('crop')}>
          <span className="tool-icon crop-icon">🌱</span>
          <span className="tool-tag">MACHINE LEARNING</span>
          <strong>Crop Recommendation</strong>
          <span className="tool-description">
            Explore a crop recommendation based on soil nutrients and environmental conditions.
          </span>
          <span className="tool-link">Open crop tool <b>→</b></span>
        </button>
        <button className="tool-card" onClick={() => navigate('fertilizer')}>
          <span className="tool-icon fertilizer-icon">🧪</span>
          <span className="tool-tag">MACHINE LEARNING</span>
          <strong>Fertilizer Recommendation</strong>
          <span className="tool-description">
            Enter the required crop and soil details to obtain a fertilizer prediction.
          </span>
          <span className="tool-link">Open fertilizer tool <b>→</b></span>
        </button>
      </section>

      <section className="info-panel">
        <div className="info-symbol">✦</div>
        <div>
          <strong>How it works</strong>
          <p>Choose a recommendation tool, enter the requested inputs, and submit them to your connected prediction API.</p>
        </div>
        <span className="info-number">01 — 03</span>
      </section>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('agrosphere-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try {
      localStorage.setItem('agrosphere-theme', darkMode ? 'dark' : 'light');
    } catch {
      // The theme still works when local storage is unavailable.
    }
  }, [darkMode]);

  function navigate(id) {
    setActiveModule(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const pageTitles = {
    dashboard: ['Dashboard', 'Your farming intelligence at a glance'],
    crop: ['Crop Recommendation', 'Find a crop suited to your input conditions'],
    fertilizer: ['Fertilizer Recommendation', 'Explore a fertilizer prediction for your crop'],
    settings: ['Settings', 'Personalize your AgroSphere experience'],
  };

  return (
    <div className={`agro-app ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      {sidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#home" onClick={() => navigate('dashboard')}>
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>AgroSphere<span> AI</span></strong>
            <small>SMART FARMING PLATFORM</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={activeModule === item.id ? 'page' : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activeModule === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>🌿</span>
            <strong>Better decisions start with better data.</strong>
            <p>Enter accurate soil and crop details for more useful predictions.</p>
          </div>
          <div className="sidebar-version">
            <span className="status-dot" /> AgroSphere AI
            <small>Recommendation workspace</small>
          </div>
        </div>
      </aside>

      <div className="app-shell">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="breadcrumb">
            <span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{pageTitles[activeModule][0]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="platform-status"><span className="status-dot" /> AI tools available</span>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀' : '☾'}
            </button>
            <div className="user-avatar" title="AgroSphere user">A</div>
          </div>
        </header>

        <main className="app-main" id="home">
          <div className="page-intro">
            <div>
              <span className="eyebrow">AGROSPHERE AI / WORKSPACE</span>
              <h1>{pageTitles[activeModule][0]}</h1>
              <p>{pageTitles[activeModule][1]}</p>
            </div>
            <span className="page-date">🌱 &nbsp; Grow with knowledge</span>
          </div>

          {activeModule === 'dashboard' && <Dashboard navigate={navigate} />}

          {activeModule === 'crop' && (
            <section className="recommendation-page">
              <CropRecommendation />
            </section>
          )}

          {activeModule === 'fertilizer' && (
            <section className="recommendation-page">
              <FertilizerRecommendation />
            </section>
          )}

          {activeModule === 'settings' && (
            <section className="settings-card">
              <div className="settings-heading">
                <span className="settings-icon">⚙</span>
                <div>
                  <h2>Appearance</h2>
                  <p>Choose the dashboard appearance that works best for you.</p>
                </div>
              </div>
              <div className="settings-row">
                <div><strong>Dark mode</strong><p>Use a darker interface in low-light environments.</p></div>
                <button className={`switch ${darkMode ? 'switch-on' : ''}`} role="switch" aria-checked={darkMode} onClick={() => setDarkMode((value) => !value)}>
                  <span />
                </button>
              </div>
              <div className="settings-row">
                <div><strong>Recommendation tools</strong><p>Crop and fertilizer modules use your existing configured API.</p></div>
                <span className="settings-value">Connected in app</span>
              </div>
              <div className="settings-note">Prediction results depend on your model, input data and API availability. Always verify recommendations before making real farming decisions.</div>
            </section>
          )}

          <footer className="app-footer">
            <span>© AgroSphere AI</span>
            <span>AI-assisted farming · Verify recommendations before farm use</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
