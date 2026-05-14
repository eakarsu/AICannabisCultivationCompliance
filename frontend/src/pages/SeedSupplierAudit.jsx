import React, { useState } from 'react';
import { FaSeedling, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const SAMPLE_SUPPLIER = {
  name: 'Pacific Genetics',
  state: 'California',
  license_number: 'NUR-2024-0091',
  years_in_business: 6,
  strains_offered: 28,
  germination_rate_pct: 94,
  contamination_incidents_24mo: 1,
  third_party_testing: true,
  certifications: ['CDFA Nursery License'],
  pricing_tier: 'Mid',
};
const SAMPLE_RECORDS = [
  { date: '2024-11-12', issue: 'Genetic drift in OG Kush batch', resolution: 'Refund + replacement' },
];

function SeedSupplierAudit() {
  const [supplier, setSupplier] = useState(JSON.stringify(SAMPLE_SUPPLIER, null, 2));
  const [records, setRecords] = useState(JSON.stringify(SAMPLE_RECORDS, null, 2));
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    let s, r;
    try { s = JSON.parse(supplier); r = records.trim() ? JSON.parse(records) : null; }
    catch { toast.error('Inputs must be valid JSON'); return; }
    setLoading(true); setAnalysis(null);
    try {
      const res = await api.post('/ai/seed-supplier-audit', {
        supplier_data: s,
        compliance_records: r,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Supplier audit complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to audit supplier');
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Seed/Clone Supplier Audit</h1>
          <p className="page-subtitle">Score supplier quality, compliance, and reliability</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setSupplier(JSON.stringify(SAMPLE_SUPPLIER, null, 2)); setRecords(JSON.stringify(SAMPLE_RECORDS, null, 2)); }}>Load Sample</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Supplier Data (JSON)</label>
          <textarea className="form-input" rows="10" style={{ fontFamily: 'monospace' }} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Compliance Records (JSON array, optional)</label>
          <textarea className="form-input" rows="5" style={{ fontFamily: 'monospace' }} value={records} onChange={(e) => setRecords(e.target.value)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Auditing...' : 'Audit Supplier'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaSeedling /></div>
          <div className="empty-state-text">Provide supplier details to receive a quality and compliance scorecard.</div>
        </div>
      )}
      {loading && <div className="empty-state"><div className="empty-state-text">Reviewing supplier history...</div></div>}
      {analysis && <AIJsonRenderer data={analysis} title="Seed Supplier Audit" />}
    </div>
  );
}

export default SeedSupplierAudit;
