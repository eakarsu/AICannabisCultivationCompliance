import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaBrain } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function LabTestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchTest(); }, [id]);

  const fetchTest = async () => {
    try {
      const res = await api.get(`/lab-tests/${id}`);
      const data = res.data.data || res.data;
      setTest(data);
      setForm({
        batch_id: data.batch_id || '', test_type: data.test_type || '',
        lab_name: data.lab_name || '', thc_percentage: data.thc_percentage ?? '',
        cbd_percentage: data.cbd_percentage ?? '', passed: data.passed ? 'true' : 'false',
        status: data.status || 'pending',
        terpene_profile: data.terpene_profile ? JSON.stringify(data.terpene_profile, null, 2) : '',
        contaminant_results: data.contaminant_results ? JSON.stringify(data.contaminant_results, null, 2) : '',
        notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load lab test');
      navigate('/lab-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.thc_percentage !== '') payload.thc_percentage = parseFloat(payload.thc_percentage);
      else delete payload.thc_percentage;
      if (payload.cbd_percentage !== '') payload.cbd_percentage = parseFloat(payload.cbd_percentage);
      else delete payload.cbd_percentage;
      payload.passed = payload.passed === 'true';
      if (payload.terpene_profile) {
        try { payload.terpene_profile = JSON.parse(payload.terpene_profile); }
        catch { delete payload.terpene_profile; }
      } else { delete payload.terpene_profile; }
      if (payload.contaminant_results) {
        try { payload.contaminant_results = JSON.parse(payload.contaminant_results); }
        catch { delete payload.contaminant_results; }
      } else { delete payload.contaminant_results; }
      await api.put(`/lab-tests/${id}`, payload);
      toast.success('Lab test updated!');
      setShowEditModal(false);
      fetchTest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lab test?')) return;
    try {
      await api.delete(`/lab-tests/${id}`);
      toast.success('Lab test deleted');
      navigate('/lab-tests');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/lab-tests/${id}/ai-analyze`);
      setAiResponse(res.data);
    } catch (err) {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const parseJSON = (val) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return {}; }
  };

  if (loading) return <LoadingSpinner />;
  if (!test) return null;

  const terpenes = parseJSON(test.terpene_profile);
  const contaminants = parseJSON(test.contaminant_results);

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/lab-tests')}>
        <FaArrowLeft /> Back to Lab Tests
      </button>

      <div className="detail-header">
        <h1 className="page-title">Lab Test - {test.batch_id || 'Details'}</h1>
        <div className="btn-group">
          <button className="btn btn-ai" onClick={handleAiAnalyze} disabled={aiLoading}>
            <FaBrain /> {aiLoading ? 'Analyzing...' : 'AI Analyze Results'}
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
        <h3 className="detail-section-title">Basic Information</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Batch ID</span><span className="detail-item-value">{test.batch_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Test Type</span><span className="detail-item-value">{test.test_type || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Lab Name</span><span className="detail-item-value">{test.lab_name || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${(test.status || 'pending').toLowerCase().replace(' ', '-')}`}>{test.status || 'pending'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Passed</span><span className={`badge ${test.passed ? 'badge-passed' : 'badge-failed'}`}>{test.passed ? 'PASSED' : 'FAILED'}</span></div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Cannabinoid Results</h3>
        <div className="env-grid">
          <div className="env-item">
            <div className="env-item-label">THC</div>
            <div className="env-item-value">{test.thc_percentage != null ? test.thc_percentage : 'N/A'}<span className="env-item-unit">%</span></div>
          </div>
          <div className="env-item">
            <div className="env-item-label">CBD</div>
            <div className="env-item-value">{test.cbd_percentage != null ? test.cbd_percentage : 'N/A'}<span className="env-item-unit">%</span></div>
          </div>
          {test.thc_percentage != null && test.cbd_percentage != null && (
            <div className="env-item">
              <div className="env-item-label">THC:CBD Ratio</div>
              <div className="env-item-value">
                {test.cbd_percentage > 0 ? (test.thc_percentage / test.cbd_percentage).toFixed(1) : 'N/A'}
                <span className="env-item-unit">:1</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {Object.keys(contaminants).length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">Contaminant Results</h3>
          <div className="detail-grid">
            {Object.entries(contaminants).map(([key, value]) => (
              <div className="detail-item" key={key}>
                <span className="detail-item-label">{key.replace(/_/g, ' ')}</span>
                <span className="detail-item-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(terpenes).length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">Terpene Profile</h3>
          <div className="terpene-grid">
            {Object.entries(terpenes).map(([name, value]) => (
              <div className="terpene-item" key={name}>
                <div className="terpene-name">{name}</div>
                <div className="terpene-value">{typeof value === 'number' ? `${value}%` : value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {test.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{test.notes}</p>
        </div>
      )}

      <AIResponseDisplay response={aiResponse} loading={aiLoading} />

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Lab Test">
        <form onSubmit={handleUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Batch ID *</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Test Type *</label>
              <input className="form-input" name="test_type" value={form.test_type} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lab Name</label>
              <input className="form-input" name="lab_name" value={form.lab_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Passed</label>
              <select className="form-select" name="passed" value={form.passed} onChange={handleChange}>
                <option value="true">Passed</option>
                <option value="false">Failed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">THC %</label>
              <input className="form-input" name="thc_percentage" type="number" step="0.01" value={form.thc_percentage} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">CBD %</label>
              <input className="form-input" name="cbd_percentage" type="number" step="0.01" value={form.cbd_percentage} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Terpene Profile (JSON)</label>
            <textarea className="form-textarea" name="terpene_profile" value={form.terpene_profile} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Contaminant Results (JSON)</label>
            <textarea className="form-textarea" name="contaminant_results" value={form.contaminant_results} onChange={handleChange} />
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

export default LabTestDetail;
