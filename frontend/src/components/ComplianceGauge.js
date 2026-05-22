import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api';

/**
 * Compliance Score Gauge — recharts RadialBar 0-100 + per-category breakdown.
 * VIZ 2.
 */
export default function ComplianceGauge() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/compliance-score')
      .then((r) => { setData(r.data); setErr(null); })
      .catch((e) => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#cbd5e1' }}>Loading compliance score...</div>;
  if (err)     return <div style={{ padding: 16, color: '#f87171' }}>Score error: {err}</div>;
  if (!data)   return null;

  const overall = data.overall_score || 0;
  const radialData = [{ name: 'Compliance', value: overall, fill: scoreColor(overall) }];
  const categoryData = (data.breakdown || []).map((c) => ({
    name: c.category, value: c.score, fill: scoreColor(c.score),
    note: c.note, weight: c.weight,
  }));

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Compliance Score</h2>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{data.facility}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        {/* main overall gauge */}
        <div style={{ height: 260, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%" outerRadius="100%"
              data={radialData} startAngle={210} endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={10} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor(overall) }}>{overall}</div>
            <div style={{ fontSize: 14, color: '#cbd5e1' }}>Grade {data.grade}</div>
          </div>
        </div>

        {/* per-category breakdown gauge */}
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="20%" outerRadius="100%"
              data={categoryData} startAngle={90} endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: '#0b1220', fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #334155' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* legend table */}
      <div style={{ marginTop: 14 }}>
        {(data.breakdown || []).map((c) => (
          <div key={c.category} style={{
            display: 'grid', gridTemplateColumns: '120px 60px 60px 1fr',
            gap: 8, padding: '6px 0', borderTop: '1px solid #1e293b', fontSize: 13,
          }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{c.category}</span>
            <span style={{ color: scoreColor(c.score), fontWeight: 700 }}>{c.score}</span>
            <span style={{ color: '#94a3b8' }}>w {Math.round(c.weight*100)}%</span>
            <span style={{ color: '#94a3b8' }}>{c.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreColor(v) {
  if (v >= 90) return '#22c55e';
  if (v >= 80) return '#84cc16';
  if (v >= 70) return '#f59e0b';
  return '#ef4444';
}
