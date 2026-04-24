import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaLeaf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Plants() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    strain: '', batch_id: '', stage: 'seedling', planted_date: '',
    location: '', status: 'active', harvest_date: '', wet_weight: '',
    dry_weight: '', sale_price: '', sold_date: '', buyer: '', notes: ''
  });

  useEffect(() => { fetchPlants(); }, []);

  const fetchPlants = async () => {
    try {
      const res = await api.get('/plants');
      setPlants(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error('Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.wet_weight) payload.wet_weight = parseFloat(payload.wet_weight);
      if (payload.dry_weight) payload.dry_weight = parseFloat(payload.dry_weight);
      if (payload.sale_price) payload.sale_price = parseFloat(payload.sale_price);
      if (!payload.harvest_date) delete payload.harvest_date;
      if (!payload.sold_date) delete payload.sold_date;
      if (!payload.wet_weight) delete payload.wet_weight;
      if (!payload.dry_weight) delete payload.dry_weight;
      if (!payload.sale_price) delete payload.sale_price;
      await api.post('/plants', payload);
      toast.success('Plant created!');
      setShowModal(false);
      setForm({ strain: '', batch_id: '', stage: 'seedling', planted_date: '', location: '', status: 'active', harvest_date: '', wet_weight: '', dry_weight: '', sale_price: '', sold_date: '', buyer: '', notes: '' });
      fetchPlants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create plant');
    }
  };

  const getStageBadge = (stage) => {
    const s = (stage || '').toLowerCase();
    const map = { seedling: 'badge-seedling', vegetative: 'badge-vegetative', flowering: 'badge-flowering', harvested: 'badge-harvested', curing: 'badge-curing', sold: 'badge-sold' };
    return `badge ${map[s] || 'badge-pending'}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Seed-to-Sale Tracking</h1>
          <p className="page-subtitle">Track plants from seedling to sale</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Plant
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaLeaf /></div>
          <div className="empty-state-text">No plants tracked yet. Add your first plant!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Strain</th>
                <th>Batch ID</th>
                <th>Stage</th>
                <th>Planted Date</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.id} className="clickable-row" onClick={() => navigate(`/plants/${plant.id}`)}>
                  <td style={{ fontWeight: 600 }}>{plant.strain}</td>
                  <td>{plant.batch_id || '-'}</td>
                  <td><span className={getStageBadge(plant.stage)}>{plant.stage}</span></td>
                  <td>{plant.planted_date ? new Date(plant.planted_date).toLocaleDateString() : '-'}</td>
                  <td>{plant.location || '-'}</td>
                  <td><span className={`badge badge-${(plant.status || 'active').toLowerCase()}`}>{plant.status || 'active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Plant">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Strain *</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} required placeholder="e.g. OG Kush" />
            </div>
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} placeholder="e.g. BATCH-001" />
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
              <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Room A1" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Harvest Date</label>
              <input className="form-input" name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Buyer</label>
              <input className="form-input" name="buyer" value={form.buyer} onChange={handleChange} placeholder="Buyer name" />
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
            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Plant</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Plants;
