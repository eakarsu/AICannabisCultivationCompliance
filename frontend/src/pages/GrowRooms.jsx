import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSeedling } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function GrowRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', strain: '', temperature: '', humidity: '',
    co2_level: '', light_intensity: '', ph_level: '',
    nutrient_ec: '', vpd: '', status: 'active'
  });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/grow-rooms');
      setRooms(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error('Failed to load grow rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/grow-rooms', {
        ...form,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        humidity: form.humidity ? parseFloat(form.humidity) : null,
        co2_level: form.co2_level ? parseFloat(form.co2_level) : null,
        light_intensity: form.light_intensity ? parseFloat(form.light_intensity) : null,
        ph_level: form.ph_level ? parseFloat(form.ph_level) : null,
        nutrient_ec: form.nutrient_ec ? parseFloat(form.nutrient_ec) : null,
        vpd: form.vpd ? parseFloat(form.vpd) : null,
      });
      toast.success('Grow room created!');
      setShowModal(false);
      setForm({ name: '', strain: '', temperature: '', humidity: '', co2_level: '', light_intensity: '', ph_level: '', nutrient_ec: '', vpd: '', status: 'active' });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create grow room');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'badge badge-active';
    if (s === 'maintenance') return 'badge badge-maintenance';
    return 'badge badge-inactive';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grow Rooms</h1>
          <p className="page-subtitle">Manage and monitor your cultivation environments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Grow Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaSeedling /></div>
          <div className="empty-state-text">No grow rooms yet. Create your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Strain</th>
                <th>Temp (F)</th>
                <th>Humidity (%)</th>
                <th>CO2 (ppm)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="clickable-row" onClick={() => navigate(`/grow-rooms/${room.id}`)}>
                  <td style={{ fontWeight: 600 }}>{room.name}</td>
                  <td>{room.strain || '-'}</td>
                  <td>{room.temperature ?? '-'}</td>
                  <td>{room.humidity ?? '-'}</td>
                  <td>{room.co2_level ?? '-'}</td>
                  <td><span className={getStatusBadge(room.status)}>{room.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Grow Room">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Room A1" />
          </div>
          <div className="form-group">
            <label className="form-label">Strain</label>
            <input className="form-input" name="strain" value={form.strain} onChange={handleChange} placeholder="e.g. Blue Dream" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temperature (F)</label>
              <input className="form-input" name="temperature" type="number" step="0.1" value={form.temperature} onChange={handleChange} placeholder="75" />
            </div>
            <div className="form-group">
              <label className="form-label">Humidity (%)</label>
              <input className="form-input" name="humidity" type="number" step="0.1" value={form.humidity} onChange={handleChange} placeholder="60" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CO2 Level (ppm)</label>
              <input className="form-input" name="co2_level" type="number" step="1" value={form.co2_level} onChange={handleChange} placeholder="800" />
            </div>
            <div className="form-group">
              <label className="form-label">Light Intensity</label>
              <input className="form-input" name="light_intensity" type="number" step="0.1" value={form.light_intensity} onChange={handleChange} placeholder="600" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">pH Level</label>
              <input className="form-input" name="ph_level" type="number" step="0.01" value={form.ph_level} onChange={handleChange} placeholder="6.2" />
            </div>
            <div className="form-group">
              <label className="form-label">Nutrient EC (mS/cm)</label>
              <input className="form-input" name="nutrient_ec" type="number" step="0.01" value={form.nutrient_ec} onChange={handleChange} placeholder="1.5" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">VPD</label>
              <input className="form-input" name="vpd" type="number" step="0.01" value={form.vpd} onChange={handleChange} placeholder="1.2" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Grow Room</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GrowRooms;
