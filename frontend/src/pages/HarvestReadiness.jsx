import React, { useState } from 'react';
import api from '../api';

export default function HarvestReadiness() {
  const [payload, setPayload] = useState('{"batch_id":"HARV-2026-014","days_to_target":3,"coa_status":"pass","open_compliance_tasks":1,"quarantine_hold":false,"moisture_pct":12.8}');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const run = async () => {
    setError('');
    try { setResult((await api.post('/harvest-readiness/score', JSON.parse(payload || '{}'))).data); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };
  return (
    <div className="page-container">
      <div className="page-header"><h1>Harvest Readiness</h1><button className="btn-primary" onClick={run}>Score Batch</button></div>
      <textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} />
      {error && <div className="error-message">{error}</div>}
      {result && <pre className="card">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
