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
    <div className="dashboard-page dashboard-premium">
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <span className="dash-pill"><span className="dash-pill-dot" /> AI-POWERED AGRICULTURE PLATFORM</span>
          <h2>Smarter decisions<br />for a <em>brighter harvest.</em></h2>
          <p>Get AI-assisted crop recommendations and fertilizer guidance based on your soil and climate inputs — all in one place.</p>
          <div className="dash-hero-actions">
            <button className="dash-primary" onClick={() => navigate('crop')}>Explore recommendations <span>↗</span></button>
            <button className="dash-secondary" onClick={() => navigate('fertilizer')}>Fertilizer tool <span>→</span></button>
          </div>
          <div className="dash-trust-row"><span>✓ Soil-aware inputs</span><span>✓ Simple workflow</span><span>✓ AI-assisted guidance</span></div>
        </div>
        <div className="dash-hero-photo" role="img" aria-label="Sunrise over green agricultural fields">
          <div className="dash-photo-note"><span className="dash-note-icon">✦</span><div><strong>Grow with confidence</strong><small>Data-informed farming decisions</small></div></div>
        </div>
      </section>

      <section className="dash-metrics" aria-label="Platform overview">
        <article className="dash-metric"><span className="dash-metric-icon mint">♧</span><div><small>AI RECOMMENDATION TOOLS</small><strong>02</strong><p>Crop and fertilizer guidance</p></div></article>
        <article className="dash-metric"><span className="dash-metric-icon sky">⌁</span><div><small>INPUTS YOU CONTROL</small><strong>Soil + Climate</strong><p>Use your field's measured values</p></div></article>
        <article className="dash-metric"><span className="dash-metric-icon amber">✳</span><div><small>BUILT FOR CLARITY</small><strong>Simple steps</strong><p>Enter details, then request a prediction</p></div></article>
      </section>

      <div className="dash-section-head">
        <div><span className="dash-eyebrow">YOUR FARMING WORKSPACE</span><h2>Explore your AI tools</h2><p>Choose a tool to get started with your field inputs.</p></div>
        <span className="dash-section-sprout">🌿 Make every input count</span>
      </div>

      <section className="dash-tool-grid">
        <article className="dash-tool-card">
          <div className="dash-tool-image crop-photo"><span className="dash-image-chip">CROP PLANNING</span></div>
          <div className="dash-tool-body"><span className="dash-tool-icon crop-color">♧</span><h3>Crop Recommendation</h3><p>Explore a crop suggestion based on soil nutrients and environmental conditions.</p><button onClick={() => navigate('crop')}>Open crop tool <span>→</span></button></div>
        </article>
        <article className="dash-tool-card">
          <div className="dash-tool-image fertilizer-photo"><span className="dash-image-chip">SOIL NUTRITION</span></div>
          <div className="dash-tool-body"><span className="dash-tool-icon fertilizer-color">✳</span><h3>Fertilizer Recommendation</h3><p>Enter your crop and soil details to view the fertilizer model's prediction.</p><button onClick={() => navigate('fertilizer')}>Open fertilizer tool <span>→</span></button></div>
        </article>
        <article className="dash-tool-card dash-info-card">
          <div className="dash-tool-image market-photo"><span className="dash-image-chip">FARM SMARTER</span></div>
          <div className="dash-tool-body"><span className="dash-tool-icon market-color">✦</span><h3>Better-informed choices</h3><p>Use field-specific inputs and treat model results as decision support, not a substitute for local agronomy advice.</p><button onClick={() => navigate('crop')}>Start with soil data <span>→</span></button></div>
        </article>
      </section>

      <section className="dash-how-panel">
        <div className="dash-how-title"><div><span className="dash-eyebrow">A CLEAR WORKFLOW</span><h2>From soil data to a smarter next step</h2></div><div className="dash-how-leaf">🌱</div></div>
        <div className="dash-steps">
          <div className="dash-step"><span>01</span><div><strong>Enter your data</strong><p>Add soil nutrients and climate values.</p></div></div>
          <i>→</i>
          <div className="dash-step"><span>02</span><div><strong>Run the model</strong><p>Send the inputs to the connected prediction service.</p></div></div>
          <i>→</i>
          <div className="dash-step"><span>03</span><div><strong>Review the result</strong><p>Use the recommendation as a starting point.</p></div></div>
        </div>
      </section>
      <div className="dash-footer-note"><span>✦</span><p><strong>Healthy soil, informed choices.</strong> For best results, use accurate measurements and verify recommendations with local agricultural guidance.</p></div>
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
              <span className="theme-toggle-icon" aria-hidden="true">{darkMode ? '☀' : '☾'}</span><span className="theme-toggle-text">{darkMode ? 'Light' : 'Dark'}</span>
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
