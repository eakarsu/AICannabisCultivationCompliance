import React, { useState, useEffect } from 'react';
import { FaBell, FaPaperPlane, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';

const ALLOWED_EVENTS = [
  'plant.harvested',
  'plant.pest_detected',
  'plant.lifecycle_stage_changed',
  'lab_test.completed',
  'lab_test.failed',
  'compliance.violation',
  'environmental.alert',
  'inventory.low',
  'license.expiring',
  'waste.recorded',
];

function Webhooks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ url: '', secret: '', events: ['plant.harvested'] });
  const [testResult, setTestResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/webhooks');
      setItems(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load webhooks');
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleEvent = (ev) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast.warn('URL is required'); return; }
    if (form.events.length === 0) { toast.warn('Select at least one event'); return; }
    setCreating(true);
    try {
      await api.post('/webhooks', { url: form.url, events: form.events, secret: form.secret || null });
      toast.success('Webhook created');
      setForm({ url: '', secret: '', events: ['plant.harvested'] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setCreating(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this webhook?')) return;
    try {
      await api.delete(`/webhooks/${id}`);
      setItems((xs) => xs.filter((x) => x.id !== id));
      toast.success('Removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const test = async (id) => {
    setTestResult(null);
    try {
      const r = await api.post(`/webhooks/${id}/test`);
      setTestResult(r.data);
      toast.success('Test payload generated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Test failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FaBell /> Webhook Subscriptions</h1>
          <p className="page-subtitle">Subscribe external systems to cultivation & compliance events</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>+ New Subscription</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Endpoint URL</label>
              <input type="url" placeholder="https://example.com/hooks/cannabis" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Signing Secret (optional)</label>
              <input type="text" placeholder="hex/base64" value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Events</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALLOWED_EVENTS.map((ev) => (
                <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                  <span>{ev}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            <FaPlus /> {creating ? 'Creating...' : 'Create Subscription'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Active Webhooks</h3>
        {loading && <p>Loading...</p>}
        {!loading && items.length === 0 && <p>No webhooks subscribed yet.</p>}
        {!loading && items.length > 0 && (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>URL</th><th>Events</th><th>Active</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>{w.id}</td>
                  <td style={{ wordBreak: 'break-all', maxWidth: 280 }}>{w.url}</td>
                  <td style={{ fontSize: 12 }}>{(w.events || []).join(', ')}</td>
                  <td>{w.active ? 'Yes' : 'No'}</td>
                  <td>{w.created_at ? new Date(w.created_at).toLocaleString() : ''}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => test(w.id)} style={{ marginRight: 8 }}>
                      <FaPaperPlane /> Test
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => remove(w.id)}>
                      <FaTrash /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {testResult && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Test Payload</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Webhooks;
