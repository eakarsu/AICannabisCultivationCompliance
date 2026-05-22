import React, { useEffect, useState } from 'react';
import api from '../api';

/**
 * Compliance Calendar — CSS-grid month view of compliance deadlines.
 * VIZ 1 (no chart lib): native CSS grid + color-coded urgency.
 */
export default function ComplianceCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/custom-views/compliance-calendar?year=${year}&month=${month}`)
      .then((r) => { if (alive) { setData(r.data); setErr(null); } })
      .catch((e) => { if (alive) setErr(e.response?.data?.error || e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [year, month]);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    setMonth(m); setYear(y);
  };

  if (loading) return <div style={{ padding: 16, color: '#cbd5e1' }}>Loading calendar...</div>;
  if (err)     return <div style={{ padding: 16, color: '#f87171' }}>Calendar error: {err}</div>;
  if (!data)   return null;

  // Build day cells. data.first_weekday = 0..6 (Sun=0)
  const cells = [];
  for (let i = 0; i < data.first_weekday; i++) cells.push({ blank: true, key: `b-${i}` });
  for (let d = 1; d <= data.days_in_month; d++) {
    const dayEvents = (data.events || []).filter((e) => e.day === d);
    cells.push({ blank: false, day: d, events: dayEvents, key: `d-${d}` });
  }

  const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const legend = data.urgency_legend || {};

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Compliance Calendar — {data.month_name} {data.year}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => changeMonth(-1)} style={navBtn}>{'<'}</button>
          <button onClick={() => { const t = new Date(); setMonth(t.getMonth()+1); setYear(t.getFullYear()); }} style={navBtn}>Today</button>
          <button onClick={() => changeMonth(1)}  style={navBtn}>{'>'}</button>
        </div>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap', fontSize: 12 }}>
        {Object.entries(legend).map(([k, color]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: color, borderRadius: 3, display: 'inline-block' }} />
            {k}
          </span>
        ))}
      </div>

      {/* weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {weekdayHeaders.map((h) => (
          <div key={h} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
        ))}
      </div>

      {/* day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((c) => {
          if (c.blank) return <div key={c.key} />;
          const topEv = (c.events || [])[0];
          const cellBg = topEv ? legend[topEv.urgency] || '#334155' : '#1e293b';
          return (
            <div key={c.key} style={{
              background: '#0b1220',
              border: `1px solid ${cellBg}`,
              borderRadius: 6,
              minHeight: 78,
              padding: 6,
              position: 'relative',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{c.day}</div>
              {(c.events || []).map((e) => (
                <div key={e.id} title={`${e.type}: ${e.title} (assigned: ${e.assigned_to})`}
                     style={{
                       background: legend[e.urgency] || '#475569',
                       color: '#0b1220',
                       fontSize: 10,
                       fontWeight: 600,
                       padding: '2px 4px',
                       borderRadius: 3,
                       marginTop: 4,
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                       whiteSpace: 'nowrap',
                     }}>
                  {e.type === 'METRC_REPORT' ? 'METRC' : e.type}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
        {data.events?.length || 0} compliance event(s) this month
      </div>
    </div>
  );
}

const navBtn = {
  background: '#1e293b',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
};
