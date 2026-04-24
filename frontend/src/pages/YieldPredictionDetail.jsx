import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBrain } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function YieldPredictionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchPrediction(); }, [id]);

  const fetchPrediction = async () => {
    try {
      const res = await api.get(`/yield-predictions/${id}`);
      const data = res.data.data || res.data;
      setPrediction(data);
      setForm({
        strain: data.strain || '', predicted_yield: data.predicted_yield ?? '',
        actual_yield: data.actual_yield ?? '', confidence: data.confidence ?? '',
        status: data.status || 'pending', grow_room_id: data.grow_room_id ?? '',
        environmental_factors: data.environmental_factors ? JSON.stringify(data.environmental_factors, null, 2) : '',
        notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load prediction');
      navigate('/yield-predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.predicted_yield !== '') payload.predicted_yield = parseFloat(payload.predicted_yield);
      else delete payload.predicted_yield;
      if (payload.actual_yield !== '') payload.actual_yield = parseFloat(payload.actual_yield);
      else delete payload.actual_yield;
      if (payload.confidence !== '') payload.confidence = parseFloat(payload.confidence);
      else delete payload.confidence;
      if (payload.grow_room_id !== '') payload.grow_room_id = parseInt(payload.grow_room_id);
      else delete payload.grow_room_id;
      if (payload.environmental_factors) {
        try { payload.environmental_factors = JSON.parse(payload.environmental_factors); }
        catch { delete payload.environmental_factors; }
      } else { delete payload.environmental_factors; }
      await api.put(`/yield-predictions/${id}`, payload);
      toast.success('Prediction updated!');
      setShowEditModal(false);
      fetchPrediction();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this prediction?')) return;
    try {
      await api.delete(`/yield-predictions/${id}`);
      toast.success('Prediction deleted');
      navigate('/yield-predictions');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAiPredict = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/yield-predictions/${id}/ai-predict`);
      setAiResponse(res.data);
    } catch (err) {
      toast.error('AI prediction failed');
    } finally {
      setAiLoading(false);
    }
  };

  const parseEnvFactors = (factors) => {
    if (!factors) return {};
    if (typeof factors === 'object') return factors;
    try { return JSON.parse(factors); } catch { return {}; }
  };

  if (loading) return <LoadingSpinner />;
  if (!prediction) return null;

  const envFactors = parseEnvFactors(prediction.environmental_factors);

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/yield-predictions')}>
        <FaArrowLeft /> Back to Yield Predictions
      </button>

      <div className="detail-header">
        <h1 className="page-title">{prediction.strain} - Yield Prediction</h1>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAiPredict} disabled={aiLoading}>
            <FaBrain /> {aiLoading ? 'Predicting...' : 'AI Predict'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <FaEdit /> Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Prediction Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Strain</span><span className="detail-item-value">{prediction.strain}</span></div>
          <div className="detail-item"><span className="detail-item-label">Predicted Yield</span><span className="detail-item-value">{prediction.predicted_yield != null ? `${prediction.predicted_yield}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Actual Yield</span><span className="detail-item-value">{prediction.actual_yield != null ? `${prediction.actual_yield}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Confidence</span><span className="detail-item-value">{prediction.confidence != null ? `${prediction.confidence}%` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${(prediction.status || 'pending').toLowerCase().replace(' ', '-')}`}>{prediction.status || 'pending'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Grow Room ID</span><span className="detail-item-value">{prediction.grow_room_id || 'N/A'}</span></div>
        </div>
      </div>

      {Object.keys(envFactors).length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">Environmental Factors</h3>
          <div className="env-grid">
            {Object.entries(envFactors).map(([key, value]) => (
              <div className="env-item" key={key}>
                <div className="env-item-label">{key.replace(/_/g, ' ')}</div>
                <div className="env-item-value">{typeof value === 'object' ? JSON.stringify(value) : value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prediction.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{prediction.notes}</p>
        </div>
      )}

      <AIResponseDisplay response={aiResponse} loading={aiLoading} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Yield Prediction">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Strain *</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Grow Room ID</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Predicted Yield (g)</label>
              <input className="form-input" name="predicted_yield" type="number" step="0.01" value={form.predicted_yield} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Yield (g)</label>
              <input className="form-input" name="actual_yield" type="number" step="0.01" value={form.actual_yield} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Confidence (%)</label>
              <input className="form-input" name="confidence" type="number" step="0.1" min="0" max="100" value={form.confidence} onChange={handleChange} />
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
            <textarea className="form-textarea" name="environmental_factors" value={form.environmental_factors} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default YieldPredictionDetail;
