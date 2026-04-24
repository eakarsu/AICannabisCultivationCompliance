import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBrain } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchPlant(); }, [id]);

  const fetchPlant = async () => {
    try {
      const res = await api.get(`/plants/${id}`);
      const data = res.data.data || res.data;
      setPlant(data);
      setForm({
        strain: data.strain || '', batch_id: data.batch_id || '',
        stage: data.stage || 'seedling', planted_date: data.planted_date ? data.planted_date.split('T')[0] : '',
        location: data.location || '', status: data.status || 'active',
        harvest_date: data.harvest_date ? data.harvest_date.split('T')[0] : '',
        wet_weight: data.wet_weight ?? '', dry_weight: data.dry_weight ?? '',
        sale_price: data.sale_price ?? '', sold_date: data.sold_date ? data.sold_date.split('T')[0] : '',
        buyer: data.buyer || '', notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load plant');
      navigate('/plants');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.wet_weight !== '') payload.wet_weight = parseFloat(payload.wet_weight);
      else delete payload.wet_weight;
      if (payload.dry_weight !== '') payload.dry_weight = parseFloat(payload.dry_weight);
      else delete payload.dry_weight;
      if (payload.sale_price !== '') payload.sale_price = parseFloat(payload.sale_price);
      else delete payload.sale_price;
      if (!payload.harvest_date) delete payload.harvest_date;
      if (!payload.sold_date) delete payload.sold_date;
      await api.put(`/plants/${id}`, payload);
      toast.success('Plant updated!');
      setShowEditModal(false);
      fetchPlant();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this plant record?')) return;
    try {
      await api.delete(`/plants/${id}`);
      toast.success('Plant deleted');
      navigate('/plants');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAiTrack = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/plants/${id}/ai-track`);
      setAiResponse(res.data);
    } catch (err) {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!plant) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/plants')}>
        <FaArrowLeft /> Back to Plants
      </button>

      <div className="detail-header">
        <h1 className="page-title">{plant.strain} {plant.batch_id ? `(${plant.batch_id})` : ''}</h1>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAiTrack} disabled={aiLoading}>
            <FaBrain /> {aiLoading ? 'Analyzing...' : 'AI Track Analysis'}
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
        <h3 className="detail-section-title">Plant Information</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Strain</span><span className="detail-item-value">{plant.strain}</span></div>
          <div className="detail-item"><span className="detail-item-label">Batch ID</span><span className="detail-item-value">{plant.batch_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Stage</span><span className={`badge badge-${(plant.stage || '').toLowerCase()}`}>{plant.stage}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${(plant.status || 'active').toLowerCase()}`}>{plant.status || 'active'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Location</span><span className="detail-item-value">{plant.location || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Planted Date</span><span className="detail-item-value">{plant.planted_date ? new Date(plant.planted_date).toLocaleDateString() : 'N/A'}</span></div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Growth Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Harvest Date</span><span className="detail-item-value">{plant.harvest_date ? new Date(plant.harvest_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Wet Weight</span><span className="detail-item-value">{plant.wet_weight ? `${plant.wet_weight}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Dry Weight</span><span className="detail-item-value">{plant.dry_weight ? `${plant.dry_weight}g` : 'N/A'}</span></div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Sale Information</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Sale Price</span><span className="detail-item-value">{plant.sale_price ? `$${plant.sale_price}` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Sold Date</span><span className="detail-item-value">{plant.sold_date ? new Date(plant.sold_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Buyer</span><span className="detail-item-value">{plant.buyer || 'N/A'}</span></div>
        </div>
      </div>

      {plant.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{plant.notes}</p>
        </div>
      )}

      <AIResponseDisplay response={aiResponse} loading={aiLoading} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Plant">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Strain *</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select className="form-select" name="stage" value={form.stage} onChange={handleChange}>
                <option value="seedling">Seedling</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="harvested">Harvested</option>
                <option value="curing">Curing</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Planted Date</label>
              <input className="form-input" name="planted_date" type="date" value={form.planted_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" name="location" value={form.location} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Harvest Date</label>
              <input className="form-input" name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Buyer</label>
              <input className="form-input" name="buyer" value={form.buyer} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Wet Weight (g)</label>
              <input className="form-input" name="wet_weight" type="number" step="0.01" value={form.wet_weight} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Dry Weight (g)</label>
              <input className="form-input" name="dry_weight" type="number" step="0.01" value={form.dry_weight} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sale Price ($)</label>
              <input className="form-input" name="sale_price" type="number" step="0.01" value={form.sale_price} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Sold Date</label>
              <input className="form-input" name="sold_date" type="date" value={form.sold_date} onChange={handleChange} />
            </div>
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

export default PlantDetail;
