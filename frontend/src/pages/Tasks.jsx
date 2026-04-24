import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTasks } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'pending',
    assigned_to: '', grow_room_id: '', due_date: '', category: '', notes: ''
  });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        ...form,
        grow_room_id: form.grow_room_id ? parseInt(form.grow_room_id) : null,
        due_date: form.due_date || null,
      });
      toast.success('Task created!');
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', status: 'pending', assigned_to: '', grow_room_id: '', due_date: '', category: '', notes: '' });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent') return 'badge badge-inactive';
    if (p === 'high') return 'badge badge-maintenance';
    if (p === 'medium') return 'badge badge-active';
    return 'badge badge-active';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'badge badge-active';
    if (s === 'in-progress') return 'badge badge-maintenance';
    if (s === 'cancelled') return 'badge badge-inactive';
    return 'badge badge-active';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage cultivation tasks and workflows</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FaTasks /></div>
          <div className="empty-state-text">No tasks yet. Create your first one!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="clickable-row" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <td style={{ fontWeight: 600 }}>{task.title}</td>
                  <td><span className={getPriorityBadge(task.priority)}>{task.priority || 'medium'}</span></td>
                  <td><span className={getStatusBadge(task.status)}>{task.status || 'pending'}</span></td>
                  <td>{task.assigned_to || '-'}</td>
                  <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                  <td>{task.category || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Task">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Check pH levels" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" name="description" value={form.description} onChange={handleChange} rows="2" placeholder="Task details..." />
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
              <input className="form-input" name="assigned_to" value={form.assigned_to} onChange={handleChange} placeholder="Team member name" />
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
              <label className="form-label">Grow Room ID</label>
              <input className="form-input" name="grow_room_id" type="number" value={form.grow_room_id} onChange={handleChange} placeholder="Room ID" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} rows="2" placeholder="Additional notes..." />
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Tasks;
