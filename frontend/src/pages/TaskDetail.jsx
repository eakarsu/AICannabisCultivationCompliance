import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchTask(); }, [id]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      const data = res.data;
      setTask(data);
      setForm({
        title: data.title || '', description: data.description || '',
        priority: data.priority || 'medium', status: data.status || 'pending',
        assigned_to: data.assigned_to || '', grow_room_id: data.grow_room_id ?? '',
        due_date: data.due_date ? data.due_date.split('T')[0] : '',
        completed_date: data.completed_date ? data.completed_date.split('T')[0] : '',
        category: data.category || '', notes: data.notes || ''
      });
    } catch (err) {
      toast.error('Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${id}`, {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        due_date: form.due_date || null,
        completed_date: form.completed_date || null,
      });
      toast.success('Task updated!');
      setShowEditModal(false);
      fetchTask();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!task) return null;

  return (
    <div className="detail-page fade-in">
      <button className="detail-back-btn" onClick={() => navigate('/tasks')}>
        <FaArrowLeft /> Back to Tasks
      </button>
      <div className="detail-header">
        <h1 className="page-title">{task.title}</h1>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}><FaEdit /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Task Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-item-label">Title</span><span className="detail-item-value">{task.title}</span></div>
          <div className="detail-item"><span className="detail-item-label">Priority</span><span className={`badge badge-${task.priority === 'urgent' || task.priority === 'high' ? 'inactive' : 'active'}`}>{task.priority}</span></div>
          <div className="detail-item"><span className="detail-item-label">Status</span><span className={`badge badge-${task.status === 'completed' ? 'active' : task.status === 'in-progress' ? 'maintenance' : 'inactive'}`}>{task.status}</span></div>
          <div className="detail-item"><span className="detail-item-label">Category</span><span className="detail-item-value">{task.category || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Assigned To</span><span className="detail-item-value">{task.assigned_to || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Grow Room ID</span><span className="detail-item-value">{task.grow_room_id || 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Due Date</span><span className="detail-item-value">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><span className="detail-item-label">Completed Date</span><span className="detail-item-value">{task.completed_date ? new Date(task.completed_date).toLocaleDateString() : 'N/A'}</span></div>
        </div>
      </div>

      {task.description && (
        <div className="detail-section">
          <h3 className="detail-section-title">Description</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
        </div>
      )}

      {task.notes && (
        <div className="detail-section">
          <h3 className="detail-section-title">Notes</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{task.notes}</p>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task">
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" name="description" value={form.description} onChange={handleChange} rows="2" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <input className="form-input" name="assigned_to" value={form.assigned_to} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="watering">Watering</option>
                <option value="feeding">Feeding</option>
                <option value="pruning">Pruning</option>
                <option value="inspection">Inspection</option>
                <option value="harvest">Harvest</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" name="due_date" type="date" value={form.due_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Completed Date</label>
              <input className="form-input" name="completed_date" type="date" value={form.completed_date} onChange={handleChange} />
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

export default TaskDetail;
