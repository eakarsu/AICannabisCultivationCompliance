import React, { useState } from 'react';
import api from '../api';

/**
 * METRC Export (CSV) — date range + report type, downloads text/csv.
 * NON-VIZ 1.
 */
const REPORT_TYPES = [
  { value: 'plants',    label: 'Plant Inventory' },
  { value: 'harvests',  label: 'Harvests'         },
  { value: 'lab_tests', label: 'Lab Tests / COA'  },
  { value: 'waste',     label: 'Waste Manifest'   },
];

export default function METRCExporter() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate,   setEndDate]   = useState(today);
  const [reportType, setReportType] = useState('plants');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleExport = async () => {
    setBusy(true); setMsg(null); setErr(null);
    try {
      const resp = await api.get('/custom-views/metrc-export', {
        params: { start_date: startDate, end_date: endDate, report_type: reportType },
        responseType: 'blob',
      });
      const blob = new Blob([resp.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrc_${reportType}_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsg(`Downloaded ${a.download}`);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, color: '#e2e8f0' }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>METRC Report Export (CSV)</h2>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
        Generate a METRC-format CSV for state regulator submission. Date range applies to record activity.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
        <Field label="Start date">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="End date">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Report type">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={inputStyle}>
            {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
      </div>

      <button
        onClick={handleExport}
        disabled={busy}
        style={{
          marginTop: 16,
          background: busy ? '#475569' : '#22c55e',
          color: '#0b1220',
          fontWeight: 700,
          padding: '10px 18px',
          border: 'none',
          borderRadius: 6,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 14,
        }}
      >
        {busy ? 'Generating...' : 'Download CSV'}
      </button>

      {msg && <div style={{ marginTop: 12, color: '#22c55e', fontSize: 13 }}>{msg}</div>}
      {err && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>Error: {err}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: '#0b1220',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
};
