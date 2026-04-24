import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBrain } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function ComplianceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchRecord(); }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/compliance/${id}`);
      const data = res.data.data || res.data;
      setRecord(data);
      const reqs = Array.isArray(data.requirements) ? data.requirements.join('\n') : (data.requirements || '');
      setForm({
        state: data.state || '', license_type: data.license_type || '',
        license_number: data.license_number || '',
        expiry_date: data.expiry_date ? data.expiry_date.split('T')[0] : '',
        status: data.status || 'active', violations: data.violations ?? '0',
        requirements: reqs, notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load record');
      navigate('/compliance');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        violations: parseInt(form.violations) || 0,
        requirements: form.requirements ? form.requirements.split('\n').filter(r => r.trim()) : []
      };
      if (!payload.expiry_date) delete payload.expiry_date;
      await api.put(`/compliance/${id}`, payload);
      toast.success('Record updated!');
      setShowEditModal(false);
      fetchRecord();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this compliance record?')) return;
    try {
      await api.delete(`/compliance/${id}`);
      toast.success('Record deleted');
      navigate('/compliance');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/compliance/${id}/ai-analyze`);
      setAiResponse(res.data);
    } catch (err) {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const parseRequirements = (reqs) => {
    if (Array.isArray(reqs)) return reqs;
    if (typeof reqs === 'string') {
      try { return JSON.parse(reqs); } catch { return reqs.split('\n').filter(r => r.trim()); }
    }
    return [];
  };

  if (loading) return <LoadingSpinner />;
  if (!record) return null;

  const requirements = parseRequirements(record.requirements);

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/compliance')}>
        <FaArrowLeft /> Back to Compliance
      </button>

      <div className="detail-header">
        <h1 className="page-title">{record.state} - {record.license_type}</h1>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAiAnalyze} disabled={aiLoading}>
            <FaBrain /> {aiLoading ? 'Analyzing...' : 'AI Compliance Analysis'}
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
        <h3 className="detail-section-title">License Information</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">State</span><span className="detail-item-value">{record.state}</span></div>
          <div className="detail-item"><span className="detail-item-label">License Type</span><span className="detail-item-value">{record.license_type}</span></div>
          <div className="detail-item"><span className="detail-item-label">License Number</span><span className="detail-item-value">{record.license_number || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Expiry Date</span><span className="detail-item-value">{record.expiry_date ? new Date(record.expiry_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${(record.status || 'active').toLowerCase()}`}>{record.status || 'active'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Violations</span><span className="detail-item-value" style={{ color: (record.violations || 0) > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700 }}>{record.violations || 0}</span></div>
        </div>
      </div>

      {requirements.length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">Requirements</h3>
          <ul className="requirement-list">
            {requirements.map((req, i) => (
              <li key={i} className="requirement-item">{req}</li>
            ))}
          </ul>
        </div>
      )}

      {record.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{record.notes}</p>
        </div>
      )}

      <AIResponseDisplay response={aiResponse} loading={aiLoading} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Compliance Record">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">State *</label>
              <input className="form-input" name="state" value={form.state} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">License Type *</label>
              <input className="form-input" name="license_type" value={form.license_type} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input className="form-input" name="license_number" value={form.license_number} onChange={handleChange} />
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
            <textarea className="form-textarea" name="requirements" value={form.requirements} onChange={handleChange} />
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

export default ComplianceDetail;
