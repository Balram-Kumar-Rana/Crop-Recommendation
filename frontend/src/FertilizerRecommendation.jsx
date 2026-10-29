import { useState } from 'react';
import './FertilizerRecommendation.css';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

const initialForm = {
  temperature_c: '27',
  humidity_percent: '65',
  moisture_percent: '40',
  soil_type: 'Loamy',
  crop_type: 'Wheat',
  season: 'Rabi',
  nitrogen_N_kg_ha_proxy: '50',
  phosphorus_P_kg_ha_proxy: '30',
  potassium_K_kg_ha_proxy: '25',
  soil_ph: '6.5',
  rainfall_mm_proxy: '100',
};

const fields = [
  { name: 'temperature_c', label: 'Temperature', unit: '°C', min: -10, max: 70 },
  { name: 'humidity_percent', label: 'Humidity', unit: '%', min: 0, max: 100 },
  { name: 'moisture_percent', label: 'Soil moisture', unit: '%', min: 0, max: 100 },
  { name: 'nitrogen_N_kg_ha_proxy', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0 },
  { name: 'phosphorus_P_kg_ha_proxy', label: 'Phosphorus (P)', unit: 'kg/ha', min: 0 },
  { name: 'potassium_K_kg_ha_proxy', label: 'Potassium (K)', unit: 'kg/ha', min: 0 },
  { name: 'soil_ph', label: 'Soil pH', unit: 'pH', min: 0, max: 14 },
  { name: 'rainfall_mm_proxy', label: 'Rainfall', unit: 'mm', min: 0 },
];

export default function FertilizerRecommendation() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError('');
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    const numericFields = fields.map((field) => field.name);

    for (const name of numericFields) {
      const value = form[name];

      if (value.trim() === '' || !Number.isFinite(Number(value))) {
        setError(`Please enter a valid number for ${name.replaceAll('_', ' ')}.`);
        return;
      }
    }

    if (!form.soil_type || !form.crop_type || !form.season) {
      setError('Please complete all categorical fields.');
      return;
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

    for (const field of fields) {
      const value = payload[field.name];

      if (field.min !== undefined && value < field.min) {
        setError(`${field.label} must be at least ${field.min}.`);
        return;
      }

      if (field.max !== undefined && value > field.max) {
        setError(`${field.label} must not exceed ${field.max}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/fertilizer-recommendation/predict`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data.detail;
        throw new Error(
          typeof detail === 'string'
            ? detail
            : `Request failed with status ${response.status}`,
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Backend se connection nahi ho raha. Check karo ki FastAPI server port 8000 par running hai.'
          : err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="fertilizer-page">
      <div className="module-heading">
        <span className="eyebrow">PRECISION AGRICULTURE</span>
        <h2>Fertilizer Recommendation</h2>
        <p>
          Soil conditions, nutrient values aur crop details enter karke
          prototype ML prediction dekho.
        </p>
      </div>

      <div className="fertilizer-notice" role="note">
        <span className="notice-icon">!</span>
        <div>
          <strong>Prototype model — not validated for farm decisions</strong>
          <p>
            Model synthetic data par trained hai aur test accuracy 46.67% hai.
            Fertilizer selection aur dosage ke liye soil test aur qualified
            agricultural expert ki advice zaroor lo.
          </p>
        </div>
      </div>

      <form className="fertilizer-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h3>Crop & soil profile</h3>
              <p>Apni crop aur soil ki details select karo.</p>
            </div>
          </div>

          <div className="fertilizer-grid">
            <div className="fertilizer-field">
              <label htmlFor="fert-soil">Soil type</label>
              <input
                id="fert-soil"
                name="soil_type"
                value={form.soil_type}
                onChange={handleChange}
                placeholder="Dataset ka exact soil type"
                required
              />
            </div>

            <div className="fertilizer-field">
              <label htmlFor="fert-crop">Crop type</label>
              <input
                id="fert-crop"
                name="crop_type"
                value={form.crop_type}
                onChange={handleChange}
                placeholder="Dataset ka exact crop type"
                required
              />
            </div>

            <div className="fertilizer-field">
              <label htmlFor="fert-season">Season</label>
              <select
                id="fert-season"
                name="season"
                value={form.season}
                onChange={handleChange}
                required
              >
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-heading">
            <span className="section-number">02</span>
            <div>
              <h3>Soil nutrients & environment</h3>
              <p>Available measurements fill karo. Values dataset ke units ke according honi chahiye.</p>
            </div>
          </div>

          <div className="fertilizer-grid">
            {fields.map((field) => (
              <div className="fertilizer-field" key={field.name}>
                <label htmlFor={`fert-${field.name}`}>
                  {field.label}
                  <span>{field.unit}</span>
                </label>
                <input
                  id={`fert-${field.name}`}
                  type="number"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  min={field.min}
                  max={field.max}
                  step="any"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="fertilizer-error" role="alert">
            <strong>Unable to get recommendation</strong>
            <p>{error}</p>
          </div>
        )}

        <button className="fertilizer-submit" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="button-spinner" />
              Analyzing inputs...
            </>
          ) : (
            <>Get Fertilizer Prediction <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      {result && (
        <div className="fertilizer-result" aria-live="polite">
          <div className="result-topline">MODEL OUTPUT · PROTOTYPE</div>
          <div className="result-icon" aria-hidden="true">✳</div>
          <h3>Predicted fertilizer</h3>
          <p className="fertilizer-result-name">{result.recommended_fertilizer}</p>

          {typeof result.model_confidence === 'number' && (
            <p className="fertilizer-confidence">
              Model confidence: {(result.model_confidence * 100).toFixed(1)}%
              <span> · Not a measure of real-world reliability</span>
            </p>
          )}

          <p className="result-warning">
            {result.prototype_warning ||
              'Prototype prediction only. Confirm with a soil test and agricultural expert.'}
          </p>
        </div>
      )}
    </section>
  );
}
