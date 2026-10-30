import { useState } from 'react';
import './CropRecommendation.css';

// Keep the existing Crop Recommendation API contract unchanged.
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

const initialForm = {
  N: '90',
  P: '42',
  K: '43',
  temperature: '24.5',
  humidity: '78',
  ph: '6.5',
  rainfall: '180',
};

const nutrients = [
  { name: 'N', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0, max: 140, step: 1, low: 'Low', mid: 'Balanced', high: 'High' },
  { name: 'P', label: 'Phosphorus (P)', unit: 'kg/ha', min: 0, max: 145, step: 1, low: 'Low', mid: 'Balanced', high: 'High' },
  { name: 'K', label: 'Potassium (K)', unit: 'kg/ha', min: 0, max: 205, step: 1, low: 'Low', mid: 'Balanced', high: 'High' },
  { name: 'ph', label: 'Soil reaction (pH)', unit: 'pH', min: 0, max: 14, step: 0.1, low: 'Acidic', mid: 'Neutral (7)', high: 'Alkaline' },
];

const climate = [
  { name: 'temperature', label: 'Temperature', unit: '°C', min: -10, max: 60, step: 0.1, icon: '♨' },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 1, icon: '◌' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 3000, step: 1, icon: '☂' },
];

const presets = [
  { name: 'Alluvial Soil', region: 'Punjab / Haryana', description: 'Fertile plains and irrigated fields', values: { N: '90', P: '42', K: '43', ph: '6.5', temperature: '24.5', humidity: '78', rainfall: '180' } },
  { name: 'Black Soil', region: 'Maharashtra / MP', description: 'Moisture-retaining soil profile', values: { N: '120', P: '35', K: '180', ph: '7.2', temperature: '29', humidity: '70', rainfall: '650' } },
  { name: 'Red Loamy Soil', region: 'South India', description: 'Light-textured soil conditions', values: { N: '45', P: '18', K: '75', ph: '5.8', temperature: '27', humidity: '72', rainfall: '420' } },
  { name: 'Sandy Loam', region: 'Rajasthan / Gujarat', description: 'Warmer, lower-rainfall conditions', values: { N: '35', P: '12', K: '65', ph: '7.8', temperature: '32', humidity: '35', rainfall: '90' } },
];

export default function CropRecommendation() {
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
    setResult(null);
  }

  function applyPreset(preset) {
    setForm((previous) => ({ ...previous, ...preset.values }));
    setError('');
    setResult(null);
  }

  function resetForm() {
    setForm({ ...initialForm });
    setError('');
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    for (const field of [...nutrients, ...climate]) {
      const value = form[field.name];
      if (String(value).trim() === '' || !Number.isFinite(Number(value))) {
        setError(`Please enter a valid number for ${field.label}.`);
        return;
      }
      if (Number(value) < field.min || Number(value) > field.max) {
        setError(`${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`);
        return;
      }
    }

    // Preserve the existing crop model's request field names.
    const payload = {
      N: Number(form.N),
      P: Number(form.P),
      K: Number(form.K),
      temperature: Number(form.temperature),
      humidity: Number(form.humidity),
      ph: Number(form.ph),
      rainfall: Number(form.rainfall),
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/crop-recommendation/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data.detail;
        throw new Error(typeof detail === 'string' ? detail : `Request failed with status ${response.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Backend se connection nahi ho raha. Check karo ki FastAPI server port 8000 par running hai.'
        : err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const recommendedCrop = result?.label ?? result?.recommended_crop ?? result?.crop ?? result?.prediction ?? result?.recommendedCrop;
  const confidence = result?.confidence;

  return (
    <main className="crop-advisor-page">
      <header className="crop-advisor-topline">
        <span className="crop-advisor-script">Smart Farming · Soil Intelligence</span>
        <h2>AI Crop <span>Recommendation</span></h2>
        <div className="crop-advisor-underline" />
        <p>Use your soil nutrients and local climate conditions to discover a crop recommendation from your existing AI model.</p>
      </header>

      <section className="crop-regional-presets" aria-label="Quick regional soil presets">
        <div className="crop-presets-heading">
          <strong><span aria-hidden="true">◇</span> QUICK REGIONAL SOIL PRESETS</strong>
          <span>Choose a profile to autofill example values</span>
        </div>
        <div className="crop-presets-grid">
          {presets.map((preset) => (
            <button className="crop-preset-card" type="button" key={preset.name} onClick={() => applyPreset(preset)}>
              <strong>{preset.name} <span>({preset.region})</span></strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>

      <form className="crop-advisor-layout" onSubmit={handleSubmit}>
        <section className="crop-soil-metrics-card">
          <div className="crop-metrics-card-heading">
            <div>
              <span className="crop-section-eyebrow">FIELD INPUTS</span>
              <h3>Soil &amp; Climate Metrics</h3>
            </div>
            <button type="button" className="crop-reset-button" onClick={resetForm}>↻ &nbsp;Reset</button>
          </div>

          <div className="crop-nutrient-grid">
            {nutrients.map((field) => {
              const numberValue = Number(form[field.name] || 0);
              const sliderValue = Math.min(field.max, Math.max(field.min, numberValue));
              return (
                <div className="crop-metric-control" key={field.name}>
                  <div className="crop-metric-label-row">
                    <label htmlFor={`crop-${field.name}-range`}>{field.label}</label>
                    <div className="crop-metric-value">
                      <input aria-label={`${field.label} exact value`} type="number" name={field.name} min={field.min} max={field.max} step={field.step} value={form[field.name]} onChange={handleChange} required />
                      <span>{field.unit}</span>
                    </div>
                  </div>
                  <input className="crop-soil-range" id={`crop-${field.name}-range`} type="range" name={field.name} min={field.min} max={field.max} step={field.step} value={sliderValue} onChange={handleChange} aria-label={`${field.label} slider`} />
                  <div className="crop-range-hints"><span>{field.low}</span><span>{field.mid}</span><span>{field.high}</span></div>
                </div>
              );
            })}
          </div>

          <div className="crop-climate-heading">
            <div><span className="crop-section-eyebrow">LOCAL CONDITIONS</span><h3>Climate Details</h3></div>
            <span>Enter values for your field</span>
          </div>
          <div className="crop-climate-grid">
            {climate.map((field) => (
              <div className="crop-environment-field" key={field.name}>
                <label htmlFor={`crop-${field.name}`}><span aria-hidden="true">{field.icon}</span> {field.label} ({field.unit})</label>
                <input id={`crop-${field.name}`} type="number" name={field.name} value={form[field.name]} onChange={handleChange} min={field.min} max={field.max} step={field.step} required />
              </div>
            ))}
          </div>

          {error && <div className="crop-error-message" role="alert">⚠ {error}</div>}
          <div className="crop-submit-row">
            <p>◇ &nbsp;Recommendations are based on the values you enter.</p>
            <button type="submit" className="crop-submit-btn" disabled={loading}>{loading ? 'Analysing soil…' : '✦  Recommend a Crop'}</button>
          </div>
        </section>

        <aside className="crop-result-panel" aria-live="polite">
          <div className="crop-result-icon" aria-hidden="true">✳</div>
          <span className="crop-result-eyebrow">YOUR FIELD INSIGHT</span>
          <h3>{result ? 'Your Crop Recommendation' : 'Ready to grow smarter?'}</h3>
          {result ? (
            <div className="crop-result-content">
              <p className="crop-result-intro">Based on the soil and climate values provided, your model recommends:</p>
              <div className="crop-result-crop">{String(recommendedCrop ?? 'Recommendation received')}</div>
              {confidence !== undefined && confidence !== null && Number.isFinite(Number(confidence)) && <div className="crop-confidence">Model confidence: {(Number(confidence) <= 1 ? Number(confidence) * 100 : Number(confidence)).toFixed(1)}%</div>}
              <p className="crop-result-note">Use this result as a starting point and confirm local conditions with an agricultural expert.</p>
            </div>
          ) : (
            <>
              <p className="crop-result-description">Fill in your soil nutrients and climate details. Your crop prediction will appear here.</p>
              <div className="crop-result-steps"><div><span>01</span><p><strong>Enter soil values</strong><small>Nitrogen, phosphorus, potassium &amp; pH</small></p></div><div><span>02</span><p><strong>Add climate details</strong><small>Temperature, humidity &amp; rainfall</small></p></div><div><span>03</span><p><strong>Get your insight</strong><small>Receive the model's crop prediction</small></p></div></div>
            </>
          )}
          <div className="crop-result-footer"><span aria-hidden="true">♧</span><p><strong>Grow with better insights</strong><small>AI-assisted planning for your farm</small></p></div>
        </aside>
      </form>
      <p className="crop-advisor-disclaimer">Note: Regional presets are illustrative examples, not a substitute for a laboratory soil test or local agronomic advice.</p>
    </main>
  );
}
