import React, { useState } from 'react';
import { FaBalanceScale, FaPlay, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const STATES = ['Colorado', 'California', 'Oregon', 'Washington', 'Nevada', 'Massachusetts', 'Illinois', 'Michigan', 'New York', 'Florida', 'Arizona', 'New Jersey'];
const LICENSE_TYPES = ['Cultivation', 'Manufacturing', 'Retail/Dispensary', 'Distribution', 'Testing Lab', 'Microbusiness'];

function RegulatoryTracker() {
  const [state, setState] = useState('Colorado');
  const [licenseType, setLicenseType] = useState('Cultivation');
  const [changes, setChanges] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const updateChange = (i, val) => {
    const next = [...changes];
    next[i] = val;
    setChanges(next);
  };

  const addChange = () => setChanges([...changes, '']);
  const removeChange = (i) => setChanges(changes.filter((_, idx) => idx !== i));

  const runAnalysis = async () => {
    const cleanChanges = changes.map((c) => c.trim()).filter(Boolean);
    if (cleanChanges.length === 0) {
      toast.error('Add at least one regulatory change to analyze');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/regulatory-tracker', {
        state, license_type: licenseType, changes: cleanChanges,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Regulatory analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to run regulatory analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setState('California');
    setLicenseType('Cultivation');
    setChanges([
      'New track-and-trace reporting deadline moved from monthly to bi-weekly',
      'Updated pesticide list now restricts myclobutanil use across all license types',
      'Cultivation tax suspended through 2026 with new gross receipts tax',
    ]);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory Change Tracker</h1>
          <p className="page-subtitle">Monitor state rule changes and surface compliance adjustments</p>
        </div>
        <button className="btn btn-secondary" onClick={loadSample}>Load Sample</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">State</label>
            <select className="form-select" value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">License Type</label>
            <select className="form-select" value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
              {LICENSE_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Regulatory Changes</label>
          {changes.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-input"
                value={c}
                onChange={(e) => updateChange(i, e.target.value)}
                placeholder={`Change #${i + 1} — e.g. "New METRC reporting deadline"`}
              />
              {changes.length > 1 && (
                <button className="btn btn-secondary" onClick={() => removeChange(i)}><FaTrash /></button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addChange}><FaPlus /> Add another change</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Analyzing...' : 'Run Regulatory Analysis'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBalanceScale /></div>
          <div className="empty-state-text">Enter regulatory changes above to receive an AI compliance roadmap.</div>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <div className="empty-state-text">Analyzing regulatory impact...</div>
        </div>
      )}

      {analysis && <AIJsonRenderer data={analysis} title="Regulatory Impact Analysis" />}
    </div>
  );
}

export default RegulatoryTracker;
