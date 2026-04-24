import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFlask } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function LabTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    batch_id: '', test_type: '', lab_name: '', thc_percentage: '',
    cbd_percentage: '', passed: 'true', status: 'pending',
    terpene_profile: '', contaminant_results: '', notes: ''
  });

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
      const res = await api.get('/lab-tests');
      setTests(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.thc_percentage) payload.thc_percentage = parseFloat(payload.thc_percentage);
      else delete payload.thc_percentage;
      if (payload.cbd_percentage) payload.cbd_percentage = parseFloat(payload.cbd_percentage);
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
      await api.post('/lab-tests', payload);
      toast.success('Lab test created!');
      setShowModal(false);
      setForm({ batch_id: '', test_type: '', lab_name: '', thc_percentage: '', cbd_percentage: '', passed: 'true', status: 'pending', terpene_profile: '', contaminant_results: '', notes: '' });
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create lab test');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lab Testing</h1>
          <p className="page-subtitle">Track and manage laboratory test results</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaFlask /></div>
          <div className="empty-state-text">No lab tests yet. Add your first test!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Test Type</th>
                <th>Lab</th>
                <th>THC %</th>
                <th>CBD %</th>
                <th>Passed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="clickable-row" onClick={() => navigate(`/lab-tests/${test.id}`)}>
                  <td style={{ fontWeight: 600 }}>{test.batch_id || '-'}</td>
                  <td>{test.test_type || '-'}</td>
                  <td>{test.lab_name || '-'}</td>
                  <td>{test.thc_percentage != null ? `${test.thc_percentage}%` : '-'}</td>
                  <td>{test.cbd_percentage != null ? `${test.cbd_percentage}%` : '-'}</td>
                  <td>
                    <span className={`badge ${test.passed ? 'badge-passed' : 'badge-failed'}`}>
                      {test.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td><span className={`badge badge-${(test.status || 'pending').toLowerCase().replace(' ', '-')}`}>{test.status || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Lab Test">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Batch ID *</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} required placeholder="e.g. BATCH-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Test Type *</label>
              <input className="form-input" name="test_type" value={form.test_type} onChange={handleChange} required placeholder="e.g. Potency, Pesticide" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lab Name</label>
              <input className="form-input" name="lab_name" value={form.lab_name} onChange={handleChange} placeholder="e.g. GreenLeaf Labs" />
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
              <input className="form-input" name="thc_percentage" type="number" step="0.01" value={form.thc_percentage} onChange={handleChange} placeholder="22.5" />
            </div>
            <div className="form-group">
              <label className="form-label">CBD %</label>
              <input className="form-input" name="cbd_percentage" type="number" step="0.01" value={form.cbd_percentage} onChange={handleChange} placeholder="0.5" />
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
            <textarea className="form-textarea" name="terpene_profile" value={form.terpene_profile} onChange={handleChange} placeholder='{"myrcene": 0.5, "limonene": 0.3, "pinene": 0.2}' />
          </div>
          <div className="form-group">
            <label className="form-label">Contaminant Results (JSON)</label>
            <textarea className="form-textarea" name="contaminant_results" value={form.contaminant_results} onChange={handleChange} placeholder='{"pesticides": "none detected", "heavy_metals": "below limit"}' />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Lab Test</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LabTests;
