import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaCut } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Harvests() {
  const navigate = useNavigate();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    batch_id: '', grow_room_id: '', strain: '', harvest_date: '',
    wet_weight_grams: '', dry_weight_grams: '', trim_weight_grams: '',
    cure_start_date: '', cure_end_date: '', processing_stage: 'harvested',
    quality_grade: '', storage_location: '', status: 'processing', notes: ''
  });

  useEffect(() => { fetchHarvests(); }, []);

  const fetchHarvests = async () => {
    try {
      const res = await api.get('/harvests');
      setHarvests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load harvests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/harvests', {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        wet_weight_grams: form.wet_weight_grams ? parseFloat(form.wet_weight_grams) : null,
        dry_weight_grams: form.dry_weight_grams ? parseFloat(form.dry_weight_grams) : null,
        trim_weight_grams: form.trim_weight_grams ? parseFloat(form.trim_weight_grams) : null,
        harvest_date: form.harvest_date || null,
        cure_start_date: form.cure_start_date || null,
        cure_end_date: form.cure_end_date || null,
      });
      toast.success('Harvest created!');
      setShowModal(false);
      setForm({ batch_id: '', grow_room_id: '', strain: '', harvest_date: '', wet_weight_grams: '', dry_weight_grams: '', trim_weight_grams: '', cure_start_date: '', cure_end_date: '', processing_stage: 'harvested', quality_grade: '', storage_location: '', status: 'processing', notes: '' });
      fetchHarvests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create harvest');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'badge badge-active';
    if (s === 'processing') return 'badge badge-maintenance';
    return 'badge badge-active';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Harvests</h1>
          <p className="page-subtitle">Track post-harvest processing and curing</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Harvest
        </button>
      </div>

      {harvests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaCut /></div>
          <div className="empty-state-text">No harvests yet. Record your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Strain</th>
                <th>Harvest Date</th>
                <th>Wet Weight (g)</th>
                <th>Dry Weight (g)</th>
                <th>Stage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {harvests.map((h) => (
                <tr key={h.id} className="clickable-row" onClick={() => navigate(`/harvests/${h.id}`)}>
                  <td style={{ fontWeight: 600 }}>{h.batch_id || '-'}</td>
                  <td>{h.strain || '-'}</td>
                  <td>{h.harvest_date ? new Date(h.harvest_date).toLocaleDateString() : '-'}</td>
                  <td>{h.wet_weight_grams ?? '-'}</td>
                  <td>{h.dry_weight_grams ?? '-'}</td>
                  <td>{h.processing_stage || '-'}</td>
                  <td><span className={getStatusBadge(h.status)}>{h.status || 'processing'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Harvest">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} placeholder="e.g. HARVEST-2026-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Strain</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} placeholder="e.g. Blue Dream" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Grow Room ID</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Harvest Date</label>
              <input className="form-input" name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Wet Weight (g)</label>
              <input className="form-input" name="wet_weight_grams" type="number" step="0.1" value={form.wet_weight_grams} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Dry Weight (g)</label>
              <input className="form-input" name="dry_weight_grams" type="number" step="0.1" value={form.dry_weight_grams} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trim Weight (g)</label>
              <input className="form-input" name="trim_weight_grams" type="number" step="0.1" value={form.trim_weight_grams} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Quality Grade</label>
              <select className="form-select" name="quality_grade" value={form.quality_grade} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Processing Stage</label>
              <select className="form-select" name="processing_stage" value={form.processing_stage} onChange={handleChange}>
                <option value="harvested">Harvested</option>
                <option value="drying">Drying</option>
                <option value="trimming">Trimming</option>
                <option value="curing">Curing</option>
                <option value="cured">Cured</option>
                <option value="packaged">Packaged</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cure Start Date</label>
              <input className="form-input" name="cure_start_date" type="date" value={form.cure_start_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Cure End Date</label>
              <input className="form-input" name="cure_end_date" type="date" value={form.cure_end_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Storage Location</label>
            <input className="form-input" name="storage_location" value={form.storage_location} onChange={handleChange} placeholder="e.g. Vault A" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Harvest</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Harvests;
