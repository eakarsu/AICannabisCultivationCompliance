import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function EnvironmentalAlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchAlert(); }, [id]);

  const fetchAlert = async () => {
    try {
      const res = await api.get(`/environmental-alerts/${id}`);
      const data = res.data;
      setAlert(data);
      setForm({
        grow_room_id: data.grow_room_id ?? '', parameter: data.parameter || '',
        condition: data.condition || '', threshold_value: data.threshold_value ?? '',
        current_value: data.current_value ?? '', severity: data.severity || 'warning',
        status: data.status || 'active', notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load alert');
      navigate('/environmental-alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/environmental-alerts/${id}`, {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        threshold_value: form.threshold_value !== '' ? parseFloat(form.threshold_value) : null,
        current_value: form.current_value !== '' ? parseFloat(form.current_value) : null,
      });
      toast.success('Alert updated!');
      setShowEditModal(false);
      fetchAlert();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await api.delete(`/environmental-alerts/${id}`);
      toast.success('Alert deleted');
      navigate('/environmental-alerts');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!alert) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/environmental-alerts')}>
        <FaArrowLeft /> Back to Alerts
      </button>
      <div className="detail-header">
        <h1 className="page-title">Alert #{alert.id}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Alert Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Grow Room ID</span><span className="detail-item-value">{alert.grow_room_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Parameter</span><span className="detail-item-value">{alert.parameter || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Condition</span><span className="detail-item-value">{alert.condition || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Threshold Value</span><span className="detail-item-value">{alert.threshold_value ?? 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Current Value</span><span className="detail-item-value">{alert.current_value ?? 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Severity</span><span className={`badge badge-${alert.severity === 'critical' ? 'inactive' : alert.severity === 'warning' ? 'maintenance' : 'active'}`}>{alert.severity}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${alert.status === 'resolved' ? 'active' : alert.status === 'acknowledged' ? 'maintenance' : 'inactive'}`}>{alert.status}</span></div>
          <div className="detail-item"><span className="detail-item-label">Triggered At</span><span className="detail-item-value">{alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Acknowledged At</span><span className="detail-item-value">{alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Resolved At</span><span className="detail-item-value">{alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}</span></div>
        </div>
      </div>

      {alert.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{alert.notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Alert">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Grow Room ID</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Parameter</label>
              <select className="form-select" name="parameter" value={form.parameter} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="co2">CO2</option>
                <option value="light">Light</option>
                <option value="ph">pH</option>
                <option value="nutrient_ec">Nutrient EC</option>
                <option value="vpd">VPD</option>
                <option value="water_temp">Water Temp</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" name="condition" value={form.condition} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="equals">Equals</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select" name="severity" value={form.severity} onChange={handleChange}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Threshold Value</label>
              <input className="form-input" name="threshold_value" type="number" step="0.01" value={form.threshold_value} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Value</label>
              <input className="form-input" name="current_value" type="number" step="0.01" value={form.current_value} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" />
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

export default EnvironmentalAlertDetail;
