import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function YieldPredictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    strain: '', predicted_yield: '', actual_yield: '',
    confidence: '', status: 'pending', grow_room_id: '',
    environmental_factors: '', notes: ''
  });

  useEffect(() => { fetchPredictions(); }, []);

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/yield-predictions');
      setPredictions(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.predicted_yield) payload.predicted_yield = parseFloat(payload.predicted_yield);
      else delete payload.predicted_yield;
      if (payload.actual_yield) payload.actual_yield = parseFloat(payload.actual_yield);
      else delete payload.actual_yield;
      if (payload.confidence) payload.confidence = parseFloat(payload.confidence);
      else delete payload.confidence;
      if (payload.grow_room_id) payload.grow_room_id = parseInt(payload.grow_room_id);
      else delete payload.grow_room_id;
      if (payload.environmental_factors) {
        try { payload.environmental_factors = JSON.parse(payload.environmental_factors); }
        catch { delete payload.environmental_factors; }
      } else { delete payload.environmental_factors; }
      await api.post('/yield-predictions', payload);
      toast.success('Prediction created!');
      setShowModal(false);
      setForm({ strain: '', predicted_yield: '', actual_yield: '', confidence: '', status: 'pending', grow_room_id: '', environmental_factors: '', notes: '' });
      fetchPredictions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create prediction');
    }
  };

  const getConfidenceColor = (conf) => {
    const c = parseFloat(conf) || 0;
    if (c >= 80) return 'high';
    if (c >= 50) return 'medium';
    return 'low';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Yield Predictions</h1>
          <p className="page-subtitle">AI-powered yield forecasting and tracking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Prediction
        </button>
      </div>

      {predictions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaChartLine /></div>
          <div className="empty-state-text">No predictions yet. Create your first prediction!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Strain</th>
                <th>Predicted Yield (g)</th>
                <th>Actual Yield (g)</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => (
                <tr key={pred.id} className="clickable-row" onClick={() => navigate(`/yield-predictions/${pred.id}`)}>
                  <td style={{ fontWeight: 600 }}>{pred.strain}</td>
                  <td>{pred.predicted_yield ?? '-'}</td>
                  <td>{pred.actual_yield ?? '-'}</td>
                  <td>
                    {pred.confidence != null ? (
                      <>
                        {pred.confidence}%
                        <div className="confidence-bar">
                          <div className={`confidence-fill ${getConfidenceColor(pred.confidence)}`} style={{ width: `${Math.min(pred.confidence, 100)}%` }} />
                        </div>
                      </>
                    ) : '-'}
                  </td>
                  <td><span className={`badge badge-${(pred.status || 'pending').toLowerCase().replace(' ', '-')}`}>{pred.status || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Yield Prediction">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Strain *</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} required placeholder="e.g. Blue Dream" />
            </div>
            <div className="form-group">
              <label className="form-label">Grow Room ID</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} placeholder="Room ID" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Predicted Yield (g)</label>
              <input className="form-input" name="predicted_yield" type="number" step="0.01" value={form.predicted_yield} onChange={handleChange} placeholder="500" />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Yield (g)</label>
              <input className="form-input" name="actual_yield" type="number" step="0.01" value={form.actual_yield} onChange={handleChange} placeholder="480" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Confidence (%)</label>
              <input className="form-input" name="confidence" type="number" step="0.1" min="0" max="100" value={form.confidence} onChange={handleChange} placeholder="85" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Environmental Factors (JSON)</label>
            <textarea className="form-textarea" name="environmental_factors" value={form.environmental_factors} onChange={handleChange} placeholder='{"temperature": 75, "humidity": 60, "co2": 800}' />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Prediction</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default YieldPredictions;
