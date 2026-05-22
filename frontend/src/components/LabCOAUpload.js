import React, { useRef, useState } from 'react';
import api from '../api';

/**
 * Lab COA Upload — drag-drop a PDF; backend (multer) returns mock-extracted
 * {cannabinoids, terpenes, pesticides_pass, microbials_pass}.
 * NON-VIZ 2.
 */
export default function LabCOAUpload() {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const handleFile = async (file) => {
    setErr(null); setResult(null);
    if (!file) return;
    const fd = new FormData();
    fd.append('coa', file);
    setBusy(true);
    try {
      const resp = await api.post('/custom-views/lab-coa-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(resp.data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, color: '#e2e8f0' }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Lab COA Upload</h2>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
        Drop a PDF Certificate of Analysis. Mock parser extracts cannabinoids, terpenes, pesticide/microbial pass status.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          marginTop: 12,
          border: `2px dashed ${drag ? '#22c55e' : '#334155'}`,
          background: drag ? 'rgba(34,197,94,0.08)' : '#0b1220',
          borderRadius: 10,
          padding: 28,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 120ms',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{busy ? '...' : '+'}</div>
        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>
          {busy ? 'Uploading & extracting...' : 'Drop PDF here, or click to browse'}
        </div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Max 10 MB · PDF preferred</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {err && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 13 }}>Error: {err}</div>}

      {result && (
        <div style={{ marginTop: 16, background: '#0b1220', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
          <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>
            Extracted from {result.upload?.filename}
            <span style={{ marginLeft: 8, color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>
              ({Math.round((result.upload?.size_bytes || 0)/1024)} KB)
            </span>
          </div>

          <Section title="Cannabinoids" obj={result.extracted?.cannabinoids} />
          <Section title="Terpenes" obj={result.extracted?.terpenes} />

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <Pass label="Pesticides" pass={result.extracted?.pesticides_pass} />
            <Pass label="Microbials"  pass={result.extracted?.microbials_pass} />
          </div>

          <div style={{ marginTop: 10, color: '#64748b', fontSize: 11 }}>{result.note}</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, obj }) {
  if (!obj) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 8px' }}>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>{k}</div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pass({ label, pass }) {
  return (
    <div style={{
      flex: 1,
      background: pass ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${pass ? '#22c55e' : '#ef4444'}`,
      color: pass ? '#86efac' : '#fca5a5',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 600,
    }}>
      {label}: {pass ? 'PASS' : 'FAIL'}
    </div>
  );
}
