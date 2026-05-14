import React, { useState } from 'react';
import { FaIdCard, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const STATES = ['Colorado', 'California', 'Oregon', 'Washington', 'Nevada', 'Massachusetts', 'Illinois', 'Michigan', 'New York', 'Florida', 'Arizona', 'New Jersey'];

function LicenseRenewal() {
  const [state, setState] = useState('California');
  const [licenseData, setLicenseData] = useState({
    license_number: 'CCL-2023-001234',
    license_type: 'Cultivation',
    issue_date: '2023-08-01',
    expiry_date: '2026-08-01',
    licensee_name: 'Green Valley Cultivation LLC',
    facility_address: '1234 Grower Way, Sacramento CA',
    canopy_sq_ft: 22000,
    last_inspection_passed: true,
    open_violations: 0,
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const updateField = (key, value) => setLicenseData({ ...licenseData, [key]: value });

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/license-renewal', {
        state,
        license_data: licenseData,
        current_date: new Date().toISOString().split('T')[0],
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('License renewal analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze license renewal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">License Renewal Automator</h1>
          <p className="page-subtitle">Track expiry, surface required documents, and auto-generate renewal application</p>
        </div>
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
            <input className="form-input" value={licenseData.license_type} onChange={(e) => updateField('license_type', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">License Number</label>
            <input className="form-input" value={licenseData.license_number} onChange={(e) => updateField('license_number', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input type="date" className="form-input" value={licenseData.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Licensee Name</label>
            <input className="form-input" value={licenseData.licensee_name} onChange={(e) => updateField('licensee_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Open Violations</label>
            <input type="number" className="form-input" value={licenseData.open_violations} onChange={(e) => updateField('open_violations', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Analyzing...' : 'Run Renewal Analysis'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaIdCard /></div>
          <div className="empty-state-text">Provide license details to receive a renewal roadmap and auto-generated application.</div>
        </div>
      )}

      {loading && <div className="empty-state"><div className="empty-state-text">Reviewing license requirements...</div></div>}

      {analysis && <AIJsonRenderer data={analysis} title="License Renewal Roadmap" />}
    </div>
  );
}

export default LicenseRenewal;
