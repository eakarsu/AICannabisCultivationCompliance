import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaBoxes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', quantity: '', unit: '', min_threshold: '',
    cost_per_unit: '', supplier: '', location: '', expiry_date: '', status: 'in-stock', notes: ''
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...form,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        min_threshold: form.min_threshold ? parseFloat(form.min_threshold) : null,
        cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : null,
        expiry_date: form.expiry_date || null,
      });
      toast.success('Item added!');
      setShowModal(false);
      setForm({ name: '', category: '', quantity: '', unit: '', min_threshold: '', cost_per_unit: '', supplier: '', location: '', expiry_date: '', status: 'in-stock', notes: '' });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create item');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'in-stock') return 'badge badge-active';
    if (s === 'low-stock') return 'badge badge-maintenance';
    if (s === 'out-of-stock') return 'badge badge-inactive';
    return 'badge badge-active';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Track supplies, nutrients, and equipment</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaBoxes /></div>
          <div className="empty-state-text">No inventory items yet. Add your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => navigate(`/inventory/${item.id}`)}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.category || '-'}</td>
                  <td>{item.quantity ?? '-'}</td>
                  <td>{item.unit || '-'}</td>
                  <td>{item.supplier || '-'}</td>
                  <td><span className={getStatusBadge(item.status)}>{item.status || 'in-stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Flora Series Nutrients" />
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
              <input className="form-input" name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} placeholder="12" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-input" name="unit" value={form.unit} onChange={handleChange} placeholder="bottles, lbs, gallons" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Threshold</label>
              <input className="form-input" name="min_threshold" type="number" step="0.01" value={form.min_threshold} onChange={handleChange} placeholder="3" />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Per Unit ($)</label>
              <input className="form-input" name="cost_per_unit" type="number" step="0.01" value={form.cost_per_unit} onChange={handleChange} placeholder="15.99" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-input" name="supplier" value={form.supplier} onChange={handleChange} placeholder="General Hydroponics" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="Storage Room A" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-input" name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Inventory;
