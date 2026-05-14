import React, { useState } from 'react';
import { FaSeedling, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

function HarvestTimingOptimizer() {
  const [plantData, setPlantData] = useState({
    strain: 'Blue Dream',
    stage: 'late_flower',
    days_in_flower: 56,
    trichome_color_pct: { clear: 10, cloudy: 70, amber: 20 },
    pistil_color_pct: { white: 25, brown: 75 },
    average_temp_f: 72,
    average_humidity_pct: 50,
  });
  const [terpeneTargets, setTerpeneTargets] = useState('myrcene, pinene, caryophyllene');
  const [marketData, setMarketData] = useState('Premium flower averaging $1,800/lb wholesale; high-terpene cultivars drawing 15% premium');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const updateField = (key, value) => setPlantData({ ...plantData, [key]: value });

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/harvest-timing-optimizer', {
        plant_data: plantData,
        terpene_targets: terpeneTargets.split(',').map((t) => t.trim()).filter(Boolean),
        market_data: marketData,
      });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Harvest timing analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to optimize harvest timing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Harvest Timing Optimizer</h1>
          <p className="page-subtitle">Predict the optimal harvest window based on terpene and market data</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Strain</label>
            <input className="form-input" value={plantData.strain} onChange={(e) => updateField('strain', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Days in Flower</label>
            <input type="number" className="form-input" value={plantData.days_in_flower}
              onChange={(e) => updateField('days_in_flower', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cloudy Trichomes (%)</label>
            <input type="number" className="form-input" value={plantData.trichome_color_pct.cloudy}
              onChange={(e) => updateField('trichome_color_pct', { ...plantData.trichome_color_pct, cloudy: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amber Trichomes (%)</label>
            <input type="number" className="form-input" value={plantData.trichome_color_pct.amber}
              onChange={(e) => updateField('trichome_color_pct', { ...plantData.trichome_color_pct, amber: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Pistils Brown (%)</label>
            <input type="number" className="form-input" value={plantData.pistil_color_pct.brown}
              onChange={(e) => updateField('pistil_color_pct', { ...plantData.pistil_color_pct, brown: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Terpene Targets (comma-separated)</label>
          <input className="form-input" value={terpeneTargets} onChange={(e) => setTerpeneTargets(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Market Data</label>
          <textarea className="form-input" rows="2" value={marketData} onChange={(e) => setMarketData(e.target.value)} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Optimizing...' : 'Optimize Harvest Window'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaSeedling /></div>
          <div className="empty-state-text">Provide plant and market context above to receive an optimal harvest window.</div>
        </div>
      )}

      {loading && <div className="empty-state"><div className="empty-state-text">Calculating optimal harvest window...</div></div>}

      {analysis && <AIJsonRenderer data={analysis} title="Harvest Timing Recommendation" />}
    </div>
  );
}

export default HarvestTimingOptimizer;
