import React, { useState } from 'react';
import { FaBug, FaPlay, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

function PestDetection() {
  const [symptoms, setSymptoms] = useState([
    'Yellowing leaves with curling edges on lower canopy',
    'White powdery residue on leaf surface',
    'Slow growth in flowering stage',
  ]);
  const [envReadings, setEnvReadings] = useState({
    avg_temp_f: 79,
    avg_humidity_pct: 65,
    co2_ppm: 950,
    light_intensity_ppfd: 850,
    leaf_temp_f: 76,
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const updateSymptom = (i, val) => {
    const next = [...symptoms];
    next[i] = val;
    setSymptoms(next);
  };
  const addSymptom = () => setSymptoms([...symptoms, '']);
  const removeSymptom = (i) => setSymptoms(symptoms.filter((_, idx) => idx !== i));

  const runAnalysis = async () => {
    const clean = symptoms.map((s) => s.trim()).filter(Boolean);
    if (clean.length === 0) {
      toast.error('Add at least one observed symptom');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/pest-detection', {
        symptoms: clean,
        environmental_readings: envReadings,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Pest detection complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to run pest detection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pest & Disease Detection</h1>
          <p className="page-subtitle">Identify pathogens from symptoms and environmental conditions</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Observed Symptoms</label>
          {symptoms.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="form-input" value={s} onChange={(e) => updateSymptom(i, e.target.value)} placeholder={`Symptom #${i + 1}`} />
              {symptoms.length > 1 && (
                <button className="btn btn-secondary" onClick={() => removeSymptom(i)}><FaTrash /></button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addSymptom}><FaPlus /> Add another symptom</button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Avg Temp (F)</label>
            <input type="number" className="form-input" value={envReadings.avg_temp_f} onChange={(e) => setEnvReadings({ ...envReadings, avg_temp_f: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Avg Humidity (%)</label>
            <input type="number" className="form-input" value={envReadings.avg_humidity_pct} onChange={(e) => setEnvReadings({ ...envReadings, avg_humidity_pct: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">CO2 (ppm)</label>
            <input type="number" className="form-input" value={envReadings.co2_ppm} onChange={(e) => setEnvReadings({ ...envReadings, co2_ppm: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Diagnosing...' : 'Run Pest Detection'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBug /></div>
          <div className="empty-state-text">Describe symptoms and environment to receive a diagnosis and treatment plan.</div>
        </div>
      )}

      {loading && <div className="empty-state"><div className="empty-state-text">Identifying pathogens...</div></div>}

      {analysis && <AIJsonRenderer data={analysis} title="Pest & Disease Diagnosis" />}
    </div>
  );
}

export default PestDetection;
