import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchItem(); }, [id]);

  const fetchItem = async () => {
    try {
      const res = await api.get(`/inventory/${id}`);
      const data = res.data;
      setItem(data);
      setForm({
        name: data.name || '', category: data.category || '', quantity: data.quantity ?? '',
        unit: data.unit || '', min_threshold: data.min_threshold ?? '', cost_per_unit: data.cost_per_unit ?? '',
        supplier: data.supplier || '', location: data.location || '',
        expiry_date: data.expiry_date ? data.expiry_date.split('T')[0] : '',
        status: data.status || 'in-stock', notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load item');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/inventory/${id}`, {
        ...form,
        quantity: form.quantity !== '' ? parseFloat(form.quantity) : null,
        min_threshold: form.min_threshold !== '' ? parseFloat(form.min_threshold) : null,
        cost_per_unit: form.cost_per_unit !== '' ? parseFloat(form.cost_per_unit) : null,
        expiry_date: form.expiry_date || null,
      });
      toast.success('Item updated!');
      setShowEditModal(false);
      fetchItem();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted');
      navigate('/inventory');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/inventory')}>
        <FaArrowLeft /> Back to Inventory
      </button>
      <div className="detail-header">
        <h1 className="page-title">{item.name}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Item Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Name</span><span className="detail-item-value">{item.name}</span></div>
          <div className="detail-item"><span className="detail-item-label">Category</span><span className="detail-item-value">{item.category || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Quantity</span><span className="detail-item-value">{item.quantity ?? 'N/A'} {item.unit || ''}</span></div>
          <div className="detail-item"><span className="detail-item-label">Min Threshold</span><span className="detail-item-value">{item.min_threshold ?? 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Cost Per Unit</span><span className="detail-item-value">{item.cost_per_unit != null ? `$${item.cost_per_unit}` : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Supplier</span><span className="detail-item-value">{item.supplier || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Location</span><span className="detail-item-value">{item.location || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Expiry Date</span><span className="detail-item-value">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${item.status === 'in-stock' ? 'active' : item.status === 'low-stock' ? 'maintenance' : 'inactive'}`}>{item.status}</span></div>
        </div>
      </div>

      {item.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{item.notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Inventory Item">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="nutrients">Nutrients</option>
                <option value="growing-media">Growing Media</option>
                <option value="equipment">Equipment</option>
                <option value="tools">Tools</option>
                <option value="packaging">Packaging</option>
                <option value="ph-control">pH Control</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="ordered">Ordered</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-input" name="unit" value={form.unit} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Threshold</label>
              <input className="form-input" name="min_threshold" type="number" step="0.01" value={form.min_threshold} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Per Unit ($)</label>
              <input className="form-input" name="cost_per_unit" type="number" step="0.01" value={form.cost_per_unit} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-input" name="supplier" value={form.supplier} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" name="location" value={form.location} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-input" name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
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

export default InventoryDetail;
