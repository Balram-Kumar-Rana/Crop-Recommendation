import React, { useState } from 'react';
import './CropRecommendation.css'; // optional styling file

// Helper to read the API base URL from Vite env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  N: '',
  P: '',
  K: '',
  temperature: '',
  humidity: '',
  ph: '',
  rainfall: ''
};

export default function CropRecommendation() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    // all fields required and numeric
    for (const [key, val] of Object.entries(form)) {
      if (val === '' || isNaN(Number(val))) {
        return `${key} must be a numeric value`;
      }
    }
    // specific ranges from schema
    if (Number(form.humidity) < 0 || Number(form.humidity) > 100) {
      return 'humidity must be between 0 and 100';
    }
    if (Number(form.ph) < 0 || Number(form.ph) > 14) {
      return 'ph must be between 0 and 14';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const validationMsg = validate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        N: Number(form.N),
        P: Number(form.P),
        K: Number(form.K),
        temperature: Number(form.temperature),
        humidity: Number(form.humidity),
        ph: Number(form.ph),
        rainfall: Number(form.rainfall)
      };
      const response = await fetch(`${API_BASE_URL}/crop-recommendation/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crop-recommendation-container">
      <h2>Crop Recommendation</h2>
      <form onSubmit={handleSubmit} className="crop-form">
        {[
          { name: 'N', label: 'Nitrogen (mg/kg)' },
          { name: 'P', label: 'Phosphorus (mg/kg)' },
          { name: 'K', label: 'Potassium (mg/kg)' },
          { name: 'temperature', label: 'Temperature (°C)' },
          { name: 'humidity', label: 'Humidity (%)' },
          { name: 'ph', label: 'Soil pH' },
          { name: 'rainfall', label: 'Rainfall (mm)' }
        ].map((field) => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              required
              step="any"
            />
          </div>
        ))}
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Predicting…' : 'Get Recommendation'}
        </button>
      </form>
      {result && (
        <div className="result-box">
          <h3>Recommended Crop</h3>
          <p className="crop-label">{result.label}</p>
          {'confidence' in result && result.confidence !== null && (
            <p className="crop-confidence">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
