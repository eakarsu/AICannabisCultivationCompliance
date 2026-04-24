import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function HarvestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [harvest, setHarvest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchHarvest(); }, [id]);

  const fetchHarvest = async () => {
    try {
      const res = await api.get(`/harvests/${id}`);
      const data = res.data;
      setHarvest(data);
      setForm({
        batch_id: data.batch_id || '', grow_room_id: data.grow_room_id ?? '',
        strain: data.strain || '', harvest_date: data.harvest_date ? data.harvest_date.split('T')[0] : '',
        wet_weight_grams: data.wet_weight_grams ?? '', dry_weight_grams: data.dry_weight_grams ?? '',
        trim_weight_grams: data.trim_weight_grams ?? '',
        cure_start_date: data.cure_start_date ? data.cure_start_date.split('T')[0] : '',
        cure_end_date: data.cure_end_date ? data.cure_end_date.split('T')[0] : '',
        processing_stage: data.processing_stage || 'harvested', quality_grade: data.quality_grade || '',
        storage_location: data.storage_location || '', status: data.status || 'processing', notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load harvest');
      navigate('/harvests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/harvests/${id}`, {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        wet_weight_grams: form.wet_weight_grams !== '' ? parseFloat(form.wet_weight_grams) : null,
        dry_weight_grams: form.dry_weight_grams !== '' ? parseFloat(form.dry_weight_grams) : null,
        trim_weight_grams: form.trim_weight_grams !== '' ? parseFloat(form.trim_weight_grams) : null,
        harvest_date: form.harvest_date || null,
        cure_start_date: form.cure_start_date || null,
        cure_end_date: form.cure_end_date || null,
      });
      toast.success('Harvest updated!');
      setShowEditModal(false);
      fetchHarvest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this harvest?')) return;
    try {
      await api.delete(`/harvests/${id}`);
      toast.success('Harvest deleted');
      navigate('/harvests');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!harvest) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/harvests')}>
        <FaArrowLeft /> Back to Harvests
      </button>
      <div className="detail-header">
        <h1 className="page-title">{harvest.batch_id || `Harvest #${harvest.id}`}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Harvest Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Batch ID</span><span className="detail-item-value">{harvest.batch_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Strain</span><span className="detail-item-value">{harvest.strain || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Grow Room ID</span><span className="detail-item-value">{harvest.grow_room_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Harvest Date</span><span className="detail-item-value">{harvest.harvest_date ? new Date(harvest.harvest_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Processing Stage</span><span className="detail-item-value">{harvest.processing_stage || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${harvest.status === 'completed' ? 'active' : 'maintenance'}`}>{harvest.status}</span></div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Weight Data</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Wet Weight</span><span className="detail-item-value">{harvest.wet_weight_grams != null ? `${harvest.wet_weight_grams}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Dry Weight</span><span className="detail-item-value">{harvest.dry_weight_grams != null ? `${harvest.dry_weight_grams}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Trim Weight</span><span className="detail-item-value">{harvest.trim_weight_grams != null ? `${harvest.trim_weight_grams}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Quality Grade</span><span className="detail-item-value">{harvest.quality_grade || 'N/A'}</span></div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Curing & Storage</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Cure Start</span><span className="detail-item-value">{harvest.cure_start_date ? new Date(harvest.cure_start_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Cure End</span><span className="detail-item-value">{harvest.cure_end_date ? new Date(harvest.cure_end_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Storage Location</span><span className="detail-item-value">{harvest.storage_location || 'N/A'}</span></div>
        </div>
      </div>

      {harvest.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{harvest.notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Harvest">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Strain</label>
              <input className="form-input" name="strain" value={form.strain} onChange={handleChange} />
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
              <label className="form-label">Quality Grade</label>
              <select className="form-select" name="quality_grade" value={form.quality_grade} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <input className="form-input" name="storage_location" value={form.storage_location} onChange={handleChange} />
            </div>
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

export default HarvestDetail;
