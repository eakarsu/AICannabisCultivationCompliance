import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaDna } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Strains() {
  const navigate = useNavigate();
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', type: '', thc_range: '', cbd_range: '', flowering_time_days: '',
    yield_potential: '', difficulty: '', genetics: '', terpene_profile: '',
    effects: '', grow_notes: '', status: 'active'
  });

  useEffect(() => { fetchStrains(); }, []);

  const fetchStrains = async () => {
    try {
      const res = await api.get('/strains');
      setStrains(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load strains');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/strains', {
        ...form,
        flowering_time_days: form.flowering_time_days ? parseInt(form.flowering_time_days) : null,
      });
      toast.success('Strain added!');
      setShowModal(false);
      setForm({ name: '', type: '', thc_range: '', cbd_range: '', flowering_time_days: '', yield_potential: '', difficulty: '', genetics: '', terpene_profile: '', effects: '', grow_notes: '', status: 'active' });
      fetchStrains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create strain');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Strain Library</h1>
          <p className="page-subtitle">Genetic catalog with grow characteristics</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Strain
        </button>
      </div>

      {strains.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaDna /></div>
          <div className="empty-state-text">No strains yet. Add your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>THC Range</th>
                <th>CBD Range</th>
                <th>Flowering (days)</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {strains.map((s) => (
                <tr key={s.id} className="clickable-row" onClick={() => navigate(`/strains/${s.id}`)}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.type || '-'}</td>
                  <td>{s.thc_range || '-'}</td>
                  <td>{s.cbd_range || '-'}</td>
                  <td>{s.flowering_time_days ?? '-'}</td>
                  <td>{s.difficulty || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Strain">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Blue Dream" />
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
              <input className="form-input" name="thc_range" value={form.thc_range} onChange={handleChange} placeholder="e.g. 17-24%" />
            </div>
            <div className="form-group">
              <label className="form-label">CBD Range</label>
              <input className="form-input" name="cbd_range" value={form.cbd_range} onChange={handleChange} placeholder="e.g. 0.1-0.2%" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Flowering Time (days)</label>
              <input className="form-input" name="flowering_time_days" type="number" value={form.flowering_time_days} onChange={handleChange} placeholder="65" />
            </div>
            <div className="form-group">
              <label className="form-label">Yield Potential</label>
              <input className="form-input" name="yield_potential" value={form.yield_potential} onChange={handleChange} placeholder="e.g. High, 500-600g/m2" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Genetics</label>
            <input className="form-input" name="genetics" value={form.genetics} onChange={handleChange} placeholder="e.g. Blueberry x Haze" />
          </div>
          <div className="form-group">
            <label className="form-label">Terpene Profile</label>
            <textarea className="form-input" name="terpene_profile" value={form.terpene_profile} onChange={handleChange} rows="2" placeholder="e.g. Myrcene, Caryophyllene, Pinene" />
          </div>
          <div className="form-group">
            <label className="form-label">Effects</label>
            <textarea className="form-input" name="effects" value={form.effects} onChange={handleChange} rows="2" placeholder="e.g. Relaxing, euphoric, creative" />
          </div>
          <div className="form-group">
            <label className="form-label">Grow Notes</label>
            <textarea className="form-input" name="grow_notes" value={form.grow_notes} onChange={handleChange} rows="2" placeholder="Special cultivation tips..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Strain</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Strains;
