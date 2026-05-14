import React, { useState } from 'react';
import { FaBolt, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const SAMPLE_ROOMS = [
  { name: 'Veg Room A', sq_ft: 1800, light_fixtures: 24, light_type: 'HPS 1000W', hvac_tons: 6, schedule_hours: 18 },
  { name: 'Flower Room 1', sq_ft: 2200, light_fixtures: 32, light_type: 'HPS 1000W', hvac_tons: 8, schedule_hours: 12 },
  { name: 'Flower Room 2', sq_ft: 2200, light_fixtures: 30, light_type: 'LED 720W', hvac_tons: 6, schedule_hours: 12 },
];
const SAMPLE_POWER = [
  { month: '2025-01', total_kwh: 124000, cost_usd: 18600, lights_kwh: 88000, hvac_kwh: 32000 },
  { month: '2025-02', total_kwh: 119000, cost_usd: 17800, lights_kwh: 84000, hvac_kwh: 31000 },
  { month: '2025-03', total_kwh: 132000, cost_usd: 19800, lights_kwh: 94000, hvac_kwh: 34000 },
];

function EnergyOptimizer() {
  const [rooms, setRooms] = useState(JSON.stringify(SAMPLE_ROOMS, null, 2));
  const [power, setPower] = useState(JSON.stringify(SAMPLE_POWER, null, 2));
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    let parsedRooms, parsedPower;
    try { parsedRooms = JSON.parse(rooms); parsedPower = JSON.parse(power); }
    catch { toast.error('Both inputs must be valid JSON arrays'); return; }
    if (!Array.isArray(parsedRooms) || !Array.isArray(parsedPower)) {
      toast.error('Both inputs must be JSON arrays'); return;
    }
    setLoading(true); setAnalysis(null);
    try {
      const res = await api.post('/ai/energy-optimizer', { grow_rooms: parsedRooms, power_data: parsedPower });
      setAnalysis(res.data.analysis || res.data);
      toast.success('Energy optimization analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to optimize energy usage');
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Energy Cost Optimizer</h1>
          <p className="page-subtitle">Reduce kWh usage and identify ROI-positive efficiency upgrades</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setRooms(JSON.stringify(SAMPLE_ROOMS, null, 2)); setPower(JSON.stringify(SAMPLE_POWER, null, 2)); }}>Load Sample</button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Grow Rooms (JSON array)</label>
          <textarea className="form-input" rows="8" style={{ fontFamily: 'monospace' }} value={rooms} onChange={(e) => setRooms(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Power Usage History (JSON array)</label>
          <textarea className="form-input" rows="8" style={{ fontFamily: 'monospace' }} value={power} onChange={(e) => setPower(e.target.value)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
            <FaPlay /> {loading ? 'Analyzing...' : 'Run Energy Analysis'}
          </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBolt /></div>
          <div className="empty-state-text">Provide grow room and power data to surface energy savings opportunities.</div>
        </div>
      )}
      {loading && <div className="empty-state"><div className="empty-state-text">Crunching kWh numbers...</div></div>}
      {analysis && <AIJsonRenderer data={analysis} title="Energy Optimization Plan" />}
    </div>
  );
}

export default EnergyOptimizer;
