import React, { useState } from 'react';
import { FaTruck, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const SAMPLE_SUPPLIERS = [
  { name: 'GrowMaster Nutrients', category: 'Nutrients', certifications: ['OMRI Listed'], states_supplied: ['CA', 'OR'], spend_pct: 45, recent_quality_complaints: 0 },
  { name: 'Pacific Seed Co', category: 'Seeds', certifications: [], states_supplied: ['CA'], spend_pct: 35, recent_quality_complaints: 2 },
  { name: 'CleanRoom Packaging', category: 'Packaging', certifications: ['ISO 9001'], states_supplied: ['Nationwide'], spend_pct: 20, recent_quality_complaints: 0 },
];

function SupplyChainAudit() {
  const [suppliers, setSuppliers] = useState(JSON.stringify(SAMPLE_SUPPLIERS, null, 2));
  const [recentChanges, setRecentChanges] = useState('Pacific Seed Co changed genetics supplier in Q1 without notification');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    let parsed;
    try {
      parsed = JSON.parse(suppliers);
    } catch {
      toast.error('Suppliers must be valid JSON');
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error('Suppliers must be a non-empty array');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/supply-chain-audit', {
        suppliers: parsed,
        recent_changes: recentChanges,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Supply chain audit complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to run supply chain audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Supply Chain Auditor</h1>
          <p className="page-subtitle">Verify supplier certifications, flag compliance-critical changes, and rank risk</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setSuppliers(JSON.stringify(SAMPLE_SUPPLIERS, null, 2))}>Load Sample</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Suppliers (JSON array)</label>
          <textarea className="form-input" rows="10" style={{ fontFamily: 'monospace' }} value={suppliers} onChange={(e) => setSuppliers(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Recent Supply Changes</label>
          <textarea className="form-input" rows="2" value={recentChanges} onChange={(e) => setRecentChanges(e.target.value)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Auditing...' : 'Run Supply Chain Audit'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaTruck /></div>
          <div className="empty-state-text">Provide suppliers above to receive a risk-ranked audit and recommendations.</div>
        </div>
      )}

      {loading && <div className="empty-state"><div className="empty-state-text">Evaluating supplier risk...</div></div>}

      {analysis && <AIJsonRenderer data={analysis} title="Supply Chain Audit" />}
    </div>
  );
}

export default SupplyChainAudit;
