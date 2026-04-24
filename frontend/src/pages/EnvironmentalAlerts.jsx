import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function EnvironmentalAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    grow_room_id: '', parameter: '', condition: '', threshold_value: '',
    current_value: '', severity: 'warning', status: 'active', notes: ''
  });

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/environmental-alerts');
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/environmental-alerts', {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        threshold_value: form.threshold_value ? parseFloat(form.threshold_value) : null,
        current_value: form.current_value ? parseFloat(form.current_value) : null,
      });
      toast.success('Alert created!');
      setShowModal(false);
      setForm({ grow_room_id: '', parameter: '', condition: '', threshold_value: '', current_value: '', severity: 'warning', status: 'active', notes: '' });
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create alert');
    }
  };

  const getSeverityBadge = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical') return 'badge badge-inactive';
    if (s === 'warning') return 'badge badge-maintenance';
    return 'badge badge-active';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') return 'badge badge-active';
    if (s === 'acknowledged') return 'badge badge-maintenance';
    return 'badge badge-inactive';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Environmental Alerts</h1>
          <p className="page-subtitle">Monitor and manage grow room threshold alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBell /></div>
          <div className="empty-state-text">No alerts yet. Create your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Parameter</th>
                <th>Condition</th>
                <th>Threshold</th>
                <th>Current</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="clickable-row" onClick={() => navigate(`/environmental-alerts/${a.id}`)}>
                  <td style={{ fontWeight: 600 }}>{a.grow_room_id || '-'}</td>
                  <td>{a.parameter || '-'}</td>
                  <td>{a.condition || '-'}</td>
                  <td>{a.threshold_value ?? '-'}</td>
                  <td>{a.current_value ?? '-'}</td>
                  <td><span className={getSeverityBadge(a.severity)}>{a.severity || 'warning'}</span></td>
                  <td><span className={getStatusBadge(a.status)}>{a.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Environmental Alert">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Grow Room ID *</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} required placeholder="Room ID" />
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
              <input className="form-input" name="threshold_value" type="number" step="0.01" value={form.threshold_value} onChange={handleChange} placeholder="85" />
            </div>
            <div className="form-group">
              <label className="form-label">Current Value</label>
              <input className="form-input" name="current_value" type="number" step="0.01" value={form.current_value} onChange={handleChange} placeholder="88" />
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
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Alert details..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Alert</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EnvironmentalAlerts;
