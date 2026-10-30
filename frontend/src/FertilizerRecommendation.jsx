import { useState } from 'react';
import './FertilizerRecommendation.css';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

const initialForm = {
  temperature_c: '24.5',
  humidity_percent: '78',
  moisture_percent: '40',
  soil_type: 'Loamy',
  crop_type: 'Wheat',
  season: 'Rabi',
  nitrogen_N_kg_ha_proxy: '90',
  phosphorus_P_kg_ha_proxy: '42',
  potassium_K_kg_ha_proxy: '43',
  soil_ph: '6.5',
  rainfall_mm_proxy: '180',
};

const metrics = [
  { name: 'nitrogen_N_kg_ha_proxy', label: 'Nitrogen (N in Soil)', unit: 'kg/ha', min: 0, max: 560, step: 1, low: 'Low (<280)', mid: 'Medium', high: 'High (>560)' },
  { name: 'phosphorus_P_kg_ha_proxy', label: 'Phosphorus (P in Soil)', unit: 'kg/ha', min: 0, max: 100, step: 1, low: 'Low (<10)', mid: 'Medium (10–25)', high: 'High (>25)' },
  { name: 'potassium_K_kg_ha_proxy', label: 'Potassium (K in Soil)', unit: 'kg/ha', min: 0, max: 280, step: 1, low: 'Low (<110)', mid: 'Medium (110–280)', high: 'High (>280)' },
  { name: 'soil_ph', label: 'Soil Reaction (pH Level)', unit: 'pH', min: 4, max: 9.5, step: 0.1, low: '4.0 (Acidic)', mid: '7.0 (Neutral)', high: '9.5 (Alkaline)' },
];

const environment = [
  { name: 'temperature_c', label: 'Temperature', unit: '°C', min: -10, max: 70, icon: '♨' },
  { name: 'humidity_percent', label: 'Humidity', unit: '%', min: 0, max: 100, icon: '◌' },
  { name: 'rainfall_mm_proxy', label: 'Rainfall', unit: 'mm', min: 0, icon: '☂' },
];

const presets = [
  { name: 'Alluvial Soil', region: 'Punjab / Haryana', description: 'Canal irrigated, high nitrogen demand', values: { soil_type: 'Loamy', crop_type: 'Wheat', season: 'Rabi', nitrogen_N_kg_ha_proxy: '90', phosphorus_P_kg_ha_proxy: '42', potassium_K_kg_ha_proxy: '43', soil_ph: '6.5', temperature_c: '24.5', humidity_percent: '78', rainfall_mm_proxy: '180', moisture_percent: '40' } },
  { name: 'Black Soil', region: 'Maharashtra / MP', description: 'Clay rich, high moisture retention', values: { soil_type: 'Black', crop_type: 'Cotton', season: 'Kharif', nitrogen_N_kg_ha_proxy: '120', phosphorus_P_kg_ha_proxy: '35', potassium_K_kg_ha_proxy: '180', soil_ph: '7.2', temperature_c: '29', humidity_percent: '70', rainfall_mm_proxy: '650', moisture_percent: '65' } },
  { name: 'Red Loamy Soil', region: 'South India', description: 'Light texture, low natural N & P', values: { soil_type: 'Red', crop_type: 'Rice', season: 'Kharif', nitrogen_N_kg_ha_proxy: '45', phosphorus_P_kg_ha_proxy: '18', potassium_K_kg_ha_proxy: '75', soil_ph: '5.8', temperature_c: '27', humidity_percent: '72', rainfall_mm_proxy: '420', moisture_percent: '45' } },
  { name: 'Sandy Loam', region: 'Rajasthan / Gujarat', description: 'Arid to semi-arid, low rainfall', values: { soil_type: 'Sandy', crop_type: 'Millet', season: 'Kharif', nitrogen_N_kg_ha_proxy: '35', phosphorus_P_kg_ha_proxy: '12', potassium_K_kg_ha_proxy: '65', soil_ph: '7.8', temperature_c: '32', humidity_percent: '35', rainfall_mm_proxy: '90', moisture_percent: '20' } },
];

const selectOptions = {
  soil_type: ['Loamy', 'Black', 'Red', 'Sandy', 'Clayey'],
  crop_type: ['Wheat', 'Rice', 'Maize', 'Cotton', 'Millet', 'Sugarcane', 'Pulses'],
  season: ['Kharif', 'Rabi', 'Zaid'],
};

export default function FertilizerRecommendation() {
  const [form, setForm] = useState(initialForm);
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

    const requiredNumbers = [
      ...metrics.map((item) => item.name),
      ...environment.map((item) => item.name),
      'moisture_percent',
    ];
    for (const name of requiredNumbers) {
      if (String(form[name]).trim() === '' || !Number.isFinite(Number(form[name]))) {
        setError(`Please enter a valid number for ${name.replaceAll('_', ' ')}.`);
        return;
      }
    }

    const payload = {
      temperature_c: Number(form.temperature_c),
      humidity_percent: Number(form.humidity_percent),
      moisture_percent: Number(form.moisture_percent),
      soil_type: form.soil_type.trim(),
      crop_type: form.crop_type.trim(),
      season: form.season,
      nitrogen_N_kg_ha_proxy: Number(form.nitrogen_N_kg_ha_proxy),
      phosphorus_P_kg_ha_proxy: Number(form.phosphorus_P_kg_ha_proxy),
      potassium_K_kg_ha_proxy: Number(form.potassium_K_kg_ha_proxy),
      soil_ph: Number(form.soil_ph),
      rainfall_mm_proxy: Number(form.rainfall_mm_proxy),
    };

    if (payload.humidity_percent < 0 || payload.humidity_percent > 100 ||
        payload.moisture_percent < 0 || payload.moisture_percent > 100 ||
        payload.soil_ph < 0 || payload.soil_ph > 14 ||
        payload.temperature_c < -10 || payload.temperature_c > 70 ||
        payload.rainfall_mm_proxy < 0 ||
        payload.nitrogen_N_kg_ha_proxy < 0 ||
        payload.phosphorus_P_kg_ha_proxy < 0 ||
        payload.potassium_K_kg_ha_proxy < 0) {
      setError('Please check the entered values and make sure they are within a valid range.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fertilizer-recommendation/predict`, {
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

  return (
    <section className="advisor-page">
      <div className="advisor-topline">
        <span className="advisor-script">Agronomic Soil Health &amp; Crop Planning</span>
        <h2>AI Crop &amp; <span>Fertilizer Advisor</span></h2>
        <div className="advisor-underline" />
        <p>Enter your soil testing metrics (N-P-K &amp; pH) and regional climate conditions to explore crop suitability and a fertilizer prediction.</p>
      </div>

      <section className="regional-presets" aria-label="Quick regional soil presets">
        <div className="presets-heading">
          <strong><span aria-hidden="true">◇</span> QUICK REGIONAL SOIL PRESETS</strong>
          <span>Click a card to autofill typical example values</span>
        </div>
        <div className="presets-grid">
          {presets.map((preset) => (
            <button className="preset-card" type="button" key={preset.name} onClick={() => applyPreset(preset)}>
              <strong>{preset.name} <span>({preset.region})</span></strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </section>

      <form className="advisor-layout" onSubmit={handleSubmit}>
        <section className="soil-metrics-card">
          <div className="metrics-card-heading">
            <h3>Soil &amp; Climate Metrics</h3>
            <button type="button" className="reset-button" onClick={resetForm}>↻ &nbsp;Reset</button>
          </div>

          {metrics.map((metric) => {
            const numericValue = Number(form[metric.name] || 0);
            const sliderValue = Math.min(metric.max, Math.max(metric.min, numericValue));
            return (
              <div className="metric-control" key={metric.name}>
                <div className="metric-label-row">
                  <label htmlFor={`${metric.name}-range`}>{metric.label}</label>
                  <div className="metric-value">
                    <input
                      aria-label={`${metric.label} exact value`}
                      type="number"
                      min={metric.min}
                      max={metric.max}
                      step={metric.step}
                      value={form[metric.name]}
                      onChange={handleChange}
                      name={metric.name}
                    />
                    <span>{metric.unit}</span>
                  </div>
                </div>
                <input
                  className="soil-range"
                  id={`${metric.name}-range`}
                  type="range"
                  name={metric.name}
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  value={sliderValue}
                  onChange={handleChange}
                  aria-label={`${metric.label} slider`}
                />
                <div className="range-hints"><span>{metric.low}</span><span>{metric.mid}</span><span>{metric.high}</span></div>
              </div>
            );
          })}

          <div className="environment-grid">
            {environment.map((field) => (
              <div className="environment-field" key={field.name}>
                <label htmlFor={field.name}><span aria-hidden="true">{field.icon}</span> {field.label} ({field.unit})</label>
                <input id={field.name} type="number" name={field.name} value={form[field.name]} onChange={handleChange} min={field.min} max={field.max} step="any" required />
              </div>
            ))}
          </div>

          <div className="profile-grid">
            <div className="environment-field">
              <label htmlFor="soil_type">Soil type</label>
              <select id="soil_type" name="soil_type" value={form.soil_type} onChange={handleChange}>
                {selectOptions.soil_type.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="environment-field">
              <label htmlFor="crop_type">Crop type</label>
              <select id="crop_type" name="crop_type" value={form.crop_type} onChange={handleChange}>
                {selectOptions.crop_type.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="environment-field">
              <label htmlFor="season">Season</label>
              <select id="season" name="season" value={form.season} onChange={handleChange}>
                {selectOptions.season.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="environment-field">
              <label htmlFor="moisture_percent">Soil moisture (%)</label>
              <input id="moisture_percent" type="number" name="moisture_percent" value={form.moisture_percent} onChange={handleChange} min="0" max="100" step="any" required />
            </div>
          </div>

          {error && <div className="advisor-error" role="alert">{error}</div>}
          <button className="advisor-submit" type="submit" disabled={loading}>
            {loading ? <><span className="advisor-spinner" /> Evaluating inputs...</> : <><span aria-hidden="true">✧</span> Evaluate Crop &amp; Fertilizer</>}
          </button>
          <p className="advisor-note">Prototype prediction only. Verify fertilizer decisions with a soil test and qualified agricultural expert.</p>
        </section>

        <aside className={`advisor-results ${result ? 'has-result' : ''}`} aria-live="polite">
          {!result && !loading && (
            <div className="advisor-empty">
              <div className="sprout-circle" aria-hidden="true">♧</div>
              <h3>Awaiting Soil Parameters</h3>
              <p>Adjust soil N-P-K, pH, and rainfall metrics on the left, or select a regional preset to receive a fertilizer prediction.</p>
            </div>
          )}
          {loading && (
            <div className="advisor-empty">
              <div className="sprout-circle advisor-loading-icon" aria-hidden="true">✳</div>
              <h3>Evaluating your inputs</h3>
              <p>Sending the current soil and climate values to your configured recommendation API...</p>
            </div>
          )}
          {result && (
            <div className="advisor-result-content">
              <div className="sprout-circle" aria-hidden="true">♧</div>
              <span className="result-kicker">MODEL OUTPUT · PROTOTYPE</span>
              <h3>Fertilizer Prediction</h3>
              <p className="advisor-result-name">{result.recommended_fertilizer || 'No fertilizer label returned'}</p>
              {typeof result.model_confidence === 'number' && <p className="advisor-confidence">Model probability: {(result.model_confidence * 100).toFixed(1)}% <small>· Not real-world reliability</small></p>}
              {result.prototype_warning && <p className="advisor-warning">{result.prototype_warning}</p>}
              <p className="advisor-warning">This prototype uses synthetic training data. Confirm any fertilizer decision with a soil test and local agricultural expert.</p>
              <button type="button" className="reset-result-button" onClick={() => setResult(null)}>Adjust parameters</button>
            </div>
          )}
        </aside>
      </form>
    </section>
  );
}
