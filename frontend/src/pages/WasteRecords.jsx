import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaRecycle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function WasteRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    waste_type: '', source: '', weight_grams: '', disposal_method: '',
    disposal_date: '', witness: '', batch_id: '', manifest_number: '',
    status: 'pending', notes: ''
  });

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/waste-records');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load waste records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/waste-records', {
        ...form,
        weight_grams: form.weight_grams ? parseFloat(form.weight_grams) : null,
        disposal_date: form.disposal_date || null,
      });
      toast.success('Waste record created!');
      setShowModal(false);
      setForm({ waste_type: '', source: '', weight_grams: '', disposal_method: '', disposal_date: '', witness: '', batch_id: '', manifest_number: '', status: 'pending', notes: '' });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'documented') return 'badge badge-active';
    if (s === 'disposed') return 'badge badge-maintenance';
    return 'badge badge-inactive';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Waste Tracking</h1>
          <p className="page-subtitle">Regulatory waste disposal records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Record
        </button>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaRecycle /></div>
          <div className="empty-state-text">No waste records yet. Create your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Waste Type</th>
                <th>Source</th>
                <th>Weight (g)</th>
                <th>Disposal Method</th>
                <th>Disposal Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="clickable-row" onClick={() => navigate(`/waste-records/${r.id}`)}>
                  <td style={{ fontWeight: 600 }}>{r.waste_type || '-'}</td>
                  <td>{r.source || '-'}</td>
                  <td>{r.weight_grams ?? '-'}</td>
                  <td>{r.disposal_method || '-'}</td>
                  <td>{r.disposal_date ? new Date(r.disposal_date).toLocaleDateString() : '-'}</td>
                  <td><span className={getStatusBadge(r.status)}>{r.status || 'pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Waste Record">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Waste Type</label>
              <select className="form-select" name="waste_type" value={form.waste_type} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="plant-waste">Plant Waste</option>
                <option value="trim">Trim</option>
                <option value="stems">Stems</option>
                <option value="roots">Roots</option>
                <option value="soil">Soil</option>
                <option value="packaging">Packaging</option>
                <option value="chemical">Chemical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <input className="form-input" name="source" value={form.source} onChange={handleChange} placeholder="e.g. Grow Room A1" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight (g)</label>
              <input className="form-input" name="weight_grams" type="number" step="0.1" value={form.weight_grams} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Disposal Method</label>
              <select className="form-select" name="disposal_method" value={form.disposal_method} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="composting">Composting</option>
                <option value="incineration">Incineration</option>
                <option value="disposal-facility">Disposal Facility</option>
                <option value="recycling">Recycling</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Disposal Date</label>
              <input className="form-input" name="disposal_date" type="date" value={form.disposal_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="disposed">Disposed</option>
                <option value="documented">Documented</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Witness</label>
              <input className="form-input" name="witness" value={form.witness} onChange={handleChange} placeholder="Witness name" />
            </div>
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" name="batch_id" value={form.batch_id} onChange={handleChange} placeholder="Related batch" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Manifest Number</label>
            <input className="form-input" name="manifest_number" value={form.manifest_number} onChange={handleChange} placeholder="Disposal manifest #" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" />
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

export default WasteRecords;
