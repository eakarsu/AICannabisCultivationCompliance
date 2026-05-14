import React, { useState } from 'react';
import { FaVial, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const SAMPLE = [
  { batch_id: 'B-2024-031', strain: 'Blue Dream', test_date: '2025-04-12', total_yeast_mold_cfu_g: 45000, total_aerobic_bacteria_cfu_g: 18000, e_coli_cfu_g: 0, salmonella: 'Negative', aspergillus: 'Negative', result: 'Pass' },
  { batch_id: 'B-2024-032', strain: 'OG Kush', test_date: '2025-04-15', total_yeast_mold_cfu_g: 110000, total_aerobic_bacteria_cfu_g: 24000, e_coli_cfu_g: 0, salmonella: 'Negative', aspergillus: 'Detected', result: 'Fail' },
  { batch_id: 'B-2024-033', strain: 'Blue Dream', test_date: '2025-04-21', total_yeast_mold_cfu_g: 78000, total_aerobic_bacteria_cfu_g: 21000, e_coli_cfu_g: 0, salmonella: 'Negative', aspergillus: 'Negative', result: 'Borderline' },
];

function MicrobialAnalyzer() {
  const [labResults, setLabResults] = useState(JSON.stringify(SAMPLE, null, 2));
  const [strain, setStrain] = useState('Multiple');
  const [envConditions, setEnvConditions] = useState('Average humidity 58%, temp 76F, room 3 had higher humidity readings');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    let parsed;
    try {
      parsed = JSON.parse(labResults);
    } catch {
      toast.error('Lab results must be valid JSON');
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error('Lab results must be a non-empty array');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/microbial-analyzer', {
        lab_results: parsed,
        strain,
        environmental_conditions: envConditions,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Microbial analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze microbial results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Microbial Testing Analyzer</h1>
          <p className="page-subtitle">Identify contamination patterns and predict future failures</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setLabResults(JSON.stringify(SAMPLE, null, 2))}>Load Sample</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Strain (optional)</label>
            <input className="form-input" value={strain} onChange={(e) => setStrain(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Environmental Notes</label>
            <input className="form-input" value={envConditions} onChange={(e) => setEnvConditions(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Lab Results (JSON array)</label>
          <textarea className="form-input" rows="10" style={{ fontFamily: 'monospace' }} value={labResults} onChange={(e) => setLabResults(e.target.value)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Analyzing...' : 'Analyze Microbial Trends'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaVial /></div>
          <div className="empty-state-text">Paste recent microbial results to surface contamination patterns and risks.</div>
        </div>
      )}

      {loading && <div className="empty-state"><div className="empty-state-text">Analyzing contamination trends...</div></div>}

      {analysis && <AIJsonRenderer data={analysis} title="Microbial Risk Analysis" />}
    </div>
  );
}

export default MicrobialAnalyzer;
