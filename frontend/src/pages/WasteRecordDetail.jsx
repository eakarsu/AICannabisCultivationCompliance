import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function WasteRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchRecord(); }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/waste-records/${id}`);
      const data = res.data;
      setRecord(data);
      setForm({
        waste_type: data.waste_type || '', source: data.source || '',
        weight_grams: data.weight_grams ?? '', disposal_method: data.disposal_method || '',
        disposal_date: data.disposal_date ? data.disposal_date.split('T')[0] : '',
        witness: data.witness || '', batch_id: data.batch_id || '',
        manifest_number: data.manifest_number || '', status: data.status || 'pending',
        notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load record');
      navigate('/waste-records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/waste-records/${id}`, {
        ...form,
        weight_grams: form.weight_grams !== '' ? parseFloat(form.weight_grams) : null,
        disposal_date: form.disposal_date || null,
      });
      toast.success('Record updated!');
      setShowEditModal(false);
      fetchRecord();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/waste-records/${id}`);
      toast.success('Record deleted');
      navigate('/waste-records');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!record) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/waste-records')}>
        <FaArrowLeft /> Back to Waste Tracking
      </button>
      <div className="detail-header">
        <h1 className="page-title">Waste Record #{record.id}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Waste Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Waste Type</span><span className="detail-item-value">{record.waste_type || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Source</span><span className="detail-item-value">{record.source || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Weight</span><span className="detail-item-value">{record.weight_grams != null ? `${record.weight_grams}g` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Disposal Method</span><span className="detail-item-value">{record.disposal_method || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Disposal Date</span><span className="detail-item-value">{record.disposal_date ? new Date(record.disposal_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Witness</span><span className="detail-item-value">{record.witness || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Batch ID</span><span className="detail-item-value">{record.batch_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Manifest Number</span><span className="detail-item-value">{record.manifest_number || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${record.status === 'documented' ? 'active' : record.status === 'disposed' ? 'maintenance' : 'inactive'}`}>{record.status}</span></div>
        </div>
      </div>

      {record.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{record.notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Waste Record">
        <form onSubmit={handleUpdate}>
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
              <input className="form-input" name="source" value={form.source} onChange={handleChange} />
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
              <input className="form-input" name="witness" value={form.witness} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Manifest Number</label>
              <input className="form-input" name="manifest_number" value={form.manifest_number} onChange={handleChange} />
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

export default WasteRecordDetail;
