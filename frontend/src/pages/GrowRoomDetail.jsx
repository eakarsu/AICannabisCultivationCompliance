import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBrain, FaThermometerHalf, FaTint, FaCloud, FaSun, FaFlask, FaLeaf, FaWind } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function GrowRoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchRoom(); }, [id]);

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/grow-rooms/${id}`);
      const data = res.data.data || res.data;
      setRoom(data);
      setForm({
        name: data.name || '', strain: data.strain || '',
        temperature: data.temperature ?? '', humidity: data.humidity ?? '',
        co2_level: data.co2_level ?? '', light_intensity: data.light_intensity ?? '',
        light_schedule: data.light_schedule || '', ph_level: data.ph_level ?? '',
        nutrient_ec: data.nutrient_ec ?? '', water_temp: data.water_temp ?? '',
        vpd: data.vpd ?? '', stage: data.stage || '', status: data.status || 'active',
        notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load grow room');
      navigate('/grow-rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/grow-rooms/${id}`, {
        ...form,
        temperature: form.temperature !== '' ? parseFloat(form.temperature) : null,
        humidity: form.humidity !== '' ? parseFloat(form.humidity) : null,
        co2_level: form.co2_level !== '' ? parseFloat(form.co2_level) : null,
        light_intensity: form.light_intensity !== '' ? parseFloat(form.light_intensity) : null,
        ph_level: form.ph_level !== '' ? parseFloat(form.ph_level) : null,
        nutrient_ec: form.nutrient_ec !== '' ? parseFloat(form.nutrient_ec) : null,
        water_temp: form.water_temp !== '' ? parseFloat(form.water_temp) : null,
        stage: form.stage || null,
        notes: form.notes || null,
        light_schedule: form.light_schedule || null,
        vpd: form.vpd !== '' ? parseFloat(form.vpd) : null,
      });
      toast.success('Grow room updated!');
      setShowEditModal(false);
      fetchRoom();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this grow room?')) return;
    try {
      await api.delete(`/grow-rooms/${id}`);
      toast.success('Grow room deleted');
      navigate('/grow-rooms');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAiOptimize = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/grow-rooms/${id}/ai-optimize`);
      setAiResponse(res.data);
    } catch (err) {
      toast.error('AI optimization failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!room) return null;

  const envData = [
    { label: 'Temperature', value: room.temperature, unit: 'F', icon: <FaThermometerHalf /> },
    { label: 'Humidity', value: room.humidity, unit: '%', icon: <FaTint /> },
    { label: 'CO2 Level', value: room.co2_level, unit: 'ppm', icon: <FaCloud /> },
    { label: 'Light Intensity', value: room.light_intensity, unit: 'umol', icon: <FaSun /> },
    { label: 'pH Level', value: room.ph_level, unit: '', icon: <FaFlask /> },
    { label: 'Nutrient EC', value: room.nutrient_ec, unit: 'mS/cm', icon: <FaLeaf /> },
    { label: 'VPD', value: room.vpd, unit: 'kPa', icon: <FaWind /> },
  ];

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/grow-rooms')}>
        <FaArrowLeft /> Back to Grow Rooms
      </button>

      <div className="detail-header">
        <h1 className="page-title">{room.name}</h1>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAiOptimize} disabled={aiLoading}>
            <FaBrain /> {aiLoading ? 'Analyzing...' : 'AI Optimize'}
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
        <h3 className="detail-section-title">Room Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-item-label">Name</span>
            <span className="detail-item-value">{room.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-item-label">Strain</span>
            <span className="detail-item-value">{room.strain || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-item-label">Status</span>
            <span className={`badge badge-${(room.status || 'active').toLowerCase()}`}>{room.status || 'active'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Environmental Readings</h3>
        <div className="env-grid">
          {envData.map((item) => (
            <div className="env-item" key={item.label}>
              <div className="env-item-label">{item.label}</div>
              <div className="env-item-value">
                {item.value != null ? item.value : 'N/A'}
                {item.value != null && item.unit && <span className="env-item-unit"> {item.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} loading={aiLoading} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Grow Room">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Room Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Strain</label>
            <input className="form-input" name="strain" value={form.strain} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Temperature (F)</label>
              <input className="form-input" name="temperature" type="number" step="0.1" value={form.temperature} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Humidity (%)</label>
              <input className="form-input" name="humidity" type="number" step="0.1" value={form.humidity} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CO2 Level (ppm)</label>
              <input className="form-input" name="co2_level" type="number" step="1" value={form.co2_level} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Light Intensity</label>
              <input className="form-input" name="light_intensity" type="number" step="0.1" value={form.light_intensity} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">pH Level</label>
              <input className="form-input" name="ph_level" type="number" step="0.01" value={form.ph_level} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Nutrient EC (mS/cm)</label>
              <input className="form-input" name="nutrient_ec" type="number" step="0.01" value={form.nutrient_ec} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">VPD</label>
              <input className="form-input" name="vpd" type="number" step="0.01" value={form.vpd} onChange={handleChange} />
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
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GrowRoomDetail;
