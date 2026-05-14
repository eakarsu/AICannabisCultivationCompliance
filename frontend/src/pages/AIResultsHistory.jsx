import React, { useEffect, useState, useCallback } from 'react';
import { FaHistory, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import AIJsonRenderer from '../components/AIJsonRenderer';

const FEATURE_OPTIONS = [
  '', 'regulatory-tracker', 'harvest-timing-optimizer', 'energy-optimizer', 'pest-detection',
  'seed-supplier-audit', 'license-renewal', 'microbial-analyzer', 'supply-chain-audit',
];

function AIResultsHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feature, setFeature] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (feature) params.feature = feature;
      const res = await api.get('/ai/results', { params });
      setItems(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load AI history');
    } finally {
      setLoading(false);
    }
  }, [page, feature]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Results History</h1>
          <p className="page-subtitle">Paginated record of every AI analysis stored to ai_results</p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label"><FaFilter /> Filter by Feature</label>
          <select className="form-select" value={feature} onChange={(e) => { setPage(1); setFeature(e.target.value); }}>
            {FEATURE_OPTIONS.map((f) => <option key={f} value={f}>{f || 'All Features'}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>

      {items.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon"><FaHistory /></div>
          <div className="empty-state-text">No AI results stored yet. Run an AI feature to populate this history.</div>
        </div>
      )}

      {items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Feature</th>
                <th>Model</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td><span className="badge">{row.feature}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{row.model}</td>
                  <td style={{ fontSize: 12 }}>{new Date(row.created_at).toLocaleString()}</td>
                  <td><button className="btn btn-secondary" onClick={() => setSelected(row)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span style={{ padding: '0 12px' }}>Page {page} of {totalPages}</span>
        <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {selected && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>Result #{selected.id} — {selected.feature}</h2>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
          <AIJsonRenderer data={selected.output} title="Stored Output" />
        </div>
      )}
    </div>
  );
}

export default AIResultsHistory;
