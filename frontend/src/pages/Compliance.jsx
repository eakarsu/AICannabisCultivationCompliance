import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBalanceScale } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Compliance() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    state: '', license_type: '', license_number: '', expiry_date: '',
    status: 'active', violations: '0', requirements: '', notes: ''
  });

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/compliance');
      setRecords(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error('Failed to load compliance records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        violations: parseInt(form.violations) || 0,
        requirements: form.requirements ? form.requirements.split('\n').filter(r => r.trim()) : []
      };
      if (!payload.expiry_date) delete payload.expiry_date;
      await api.post('/compliance', payload);
      toast.success('Compliance record created!');
      setShowModal(false);
      setForm({ state: '', license_type: '', license_number: '', expiry_date: '', status: 'active', violations: '0', requirements: '', notes: '' });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const getViolationClass = (count) => {
    const n = parseInt(count) || 0;
    if (n === 0) return 'violations-count zero';
    if (n <= 2) return 'violations-count warning';
    return 'violations-count danger';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory Compliance</h1>
          <p className="page-subtitle">Manage licenses and compliance records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Record
        </button>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBalanceScale /></div>
          <div className="empty-state-text">No compliance records yet. Add your first record!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>License Type</th>
                <th>License #</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Violations</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="clickable-row" onClick={() => navigate(`/compliance/${rec.id}`)}>
                  <td style={{ fontWeight: 600 }}>{rec.state}</td>
                  <td>{rec.license_type || '-'}</td>
                  <td>{rec.license_number || '-'}</td>
                  <td>{rec.expiry_date ? new Date(rec.expiry_date).toLocaleDateString() : '-'}</td>
                  <td><span className={`badge badge-${(rec.status || 'active').toLowerCase()}`}>{rec.status || 'active'}</span></td>
                  <td><span className={getViolationClass(rec.violations)}>{rec.violations || 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Compliance Record">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">State *</label>
              <input className="form-input" name="state" value={form.state} onChange={handleChange} required placeholder="e.g. California" />
            </div>
            <div className="form-group">
              <label className="form-label">License Type *</label>
              <input className="form-input" name="license_type" value={form.license_type} onChange={handleChange} required placeholder="e.g. Cultivation" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input className="form-input" name="license_number" value={form.license_number} onChange={handleChange} placeholder="e.g. LIC-2024-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Violations</label>
              <input className="form-input" name="violations" type="number" min="0" value={form.violations} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Requirements (one per line)</label>
            <textarea className="form-textarea" name="requirements" value={form.requirements} onChange={handleChange} placeholder="Enter each requirement on a new line" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Compliance;
