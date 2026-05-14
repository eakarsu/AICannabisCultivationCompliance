import React from 'react';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function humanize(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function severityClass(value) {
  const v = String(value).toLowerCase();
  if (['critical', 'high', 'fail', 'rejected', 'unacceptable'].includes(v)) return 'badge badge-inactive';
  if (['medium', 'warning', 'moderate', 'acceptable', 'questionable'].includes(v)) return 'badge badge-maintenance';
  if (['low', 'pass', 'good', 'excellent', 'approve', 'strong'].includes(v)) return 'badge badge-active';
  return 'badge';
}

function ScalarValue({ value }) {
  if (value === null || value === undefined || value === '') return <span style={{ color: '#94a3b8' }}>—</span>;
  if (typeof value === 'boolean') {
    return <span className={value ? 'badge badge-active' : 'badge badge-inactive'}>{value ? 'Yes' : 'No'}</span>;
  }
  if (typeof value === 'number') return <span style={{ fontWeight: 600 }}>{value.toLocaleString()}</span>;
  const str = String(value);
  // detect short status-like words
  if (str.length < 40 && /^[A-Za-z][A-Za-z0-9 +\-_/]+$/.test(str) && /critical|high|low|medium|pass|fail|approve|reject|good|excellent|moderate|warning|strong|weak/i.test(str)) {
    return <span className={severityClass(str)}>{str}</span>;
  }
  return <span>{str}</span>;
}

function RenderValue({ value, depth = 0 }) {
  if (value === null || value === undefined) return <ScalarValue value={value} />;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: '#94a3b8' }}>None</span>;
    if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
      return (
        <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
          {value.map((v, i) => (
            <li key={i}><ScalarValue value={v} /></li>
          ))}
        </ul>
      );
    }
    return (
      <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
        {value.map((item, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 8, padding: 12, border: '1px solid var(--border-color, #e5e7eb)' }}>
            <RenderValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: depth === 0 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: 10, marginTop: 4 }}>
        {entries.map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748b', marginBottom: 4 }}>
              {humanize(k)}
            </div>
            <div><RenderValue value={v} depth={depth + 1} /></div>
          </div>
        ))}
      </div>
    );
  }
  return <ScalarValue value={value} />;
}

export default function AIJsonRenderer({ data, title = 'AI Analysis' }) {
  if (!data) return null;
  return (
    <div className="ai-response-container">
      <div className="ai-response-inner">
        <div className="ai-response-header">
          <div className="ai-response-icon">AI</div>
          <div>
            <div className="ai-response-title">{title}</div>
            <div className="ai-response-subtitle">Structured AI output</div>
          </div>
        </div>
        <div className="ai-response-content" style={{ paddingTop: 12 }}>
          {data.summary && (
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderLeft: '4px solid #059669', padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
              {data.summary}
            </div>
          )}
          <RenderValue value={data} />
        </div>
      </div>
    </div>
  );
}
