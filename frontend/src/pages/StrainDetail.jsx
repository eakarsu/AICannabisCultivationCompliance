import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function StrainDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [strain, setStrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchStrain(); }, [id]);

  const fetchStrain = async () => {
    try {
      const res = await api.get(`/strains/${id}`);
      const data = res.data;
      setStrain(data);
      setForm({
        name: data.name || '', type: data.type || '', thc_range: data.thc_range || '',
        cbd_range: data.cbd_range || '', flowering_time_days: data.flowering_time_days ?? '',
        yield_potential: data.yield_potential || '', difficulty: data.difficulty || '',
        genetics: data.genetics || '', terpene_profile: data.terpene_profile || '',
        effects: data.effects || '', grow_notes: data.grow_notes || '', status: data.status || 'active'
      });
    } catch (err) {
      toast.error('Failed to load strain');
      navigate('/strains');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/strains/${id}`, {
        ...form,
        flowering_time_days: form.flowering_time_days !== '' ? parseInt(form.flowering_time_days) : null,
      });
      toast.success('Strain updated!');
      setShowEditModal(false);
      fetchStrain();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this strain?')) return;
    try {
      await api.delete(`/strains/${id}`);
      toast.success('Strain deleted');
      navigate('/strains');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!strain) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/strains')}>
        <FaArrowLeft /> Back to Strain Library
      </button>
      <div className="detail-header">
        <h1 className="page-title">{strain.name}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Strain Information</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Name</span><span className="detail-item-value">{strain.name}</span></div>
          <div className="detail-item"><span className="detail-item-label">Type</span><span className="detail-item-value">{strain.type || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">THC Range</span><span className="detail-item-value">{strain.thc_range || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">CBD Range</span><span className="detail-item-value">{strain.cbd_range || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Flowering Time</span><span className="detail-item-value">{strain.flowering_time_days ? `${strain.flowering_time_days} days` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Yield Potential</span><span className="detail-item-value">{strain.yield_potential || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Difficulty</span><span className="detail-item-value">{strain.difficulty || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Genetics</span><span className="detail-item-value">{strain.genetics || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${strain.status === 'active' ? 'active' : 'inactive'}`}>{strain.status}</span></div>
        </div>
      </div>

      {strain.terpene_profile && (
        <div className="detail-section">
          <h3 className="detail-section-title">Terpene Profile</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{strain.terpene_profile}</p>
        </div>
      )}

      {strain.effects && (
        <div className="detail-section">
          <h3 className="detail-section-title">Effects</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{strain.effects}</p>
        </div>
      )}

      {strain.grow_notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Grow Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{strain.grow_notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Strain">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
                <option value="indica-dominant">Indica Dominant</option>
                <option value="sativa-dominant">Sativa Dominant</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">THC Range</label>
              <input className="form-input" name="thc_range" value={form.thc_range} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">CBD Range</label>
              <input className="form-input" name="cbd_range" value={form.cbd_range} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Flowering Time (days)</label>
              <input className="form-input" name="flowering_time_days" type="number" value={form.flowering_time_days} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Yield Potential</label>
              <input className="form-input" name="yield_potential" value={form.yield_potential} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Genetics</label>
            <input className="form-input" name="genetics" value={form.genetics} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Terpene Profile</label>
            <textarea className="form-input" name="terpene_profile" value={form.terpene_profile} onChange={handleChange} rows="2" />
          </div>
          <div className="form-group">
            <label className="form-label">Effects</label>
            <textarea className="form-input" name="effects" value={form.effects} onChange={handleChange} rows="2" />
          </div>
          <div className="form-group">
            <label className="form-label">Grow Notes</label>
            <textarea className="form-input" name="grow_notes" value={form.grow_notes} onChange={handleChange} rows="2" />
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

export default StrainDetail;
