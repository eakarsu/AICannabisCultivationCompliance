import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

// Unified ops page covering the apply-pass-5 backlog:
//   - Notifications (email/SMS/push) — gated 503-stubs
//   - METRC / BioTrack — gated 503-stubs
//   - Reports (harvest/lab-test/waste) — JSON or CSV
//   - Webhook delivery trigger + log
//   - Multi-agent compliance review
function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function ResultBlock({ data }) {
  if (!data) return null;
  return <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>;
}

export default function Operations() {
  const [notifResult, setNotifResult] = useState(null);
  const [metrcResult, setMetrcResult] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [whResult, setWhResult] = useState(null);
  const [agentResult, setAgentResult] = useState(null);

  const sendEmail = async () => {
    try {
      const r = await api.post('/notifications/email', { to: 'ops@example.com', subject: 'Cannabis ops test', body: 'test' });
      setNotifResult(r.data);
    } catch (err) { setNotifResult(err.response?.data || { error: err.message }); }
  };

  const fetchMetrcPlants = async () => {
    try {
      const r = await api.get('/metrc/plants');
      setMetrcResult(r.data);
    } catch (err) { setMetrcResult(err.response?.data || { error: err.message }); }
  };

  const fetchHarvestSummary = async () => {
    try {
      const r = await api.get('/reports/harvest-summary?days=30');
      setReportResult(r.data);
    } catch (err) { setReportResult(err.response?.data || { error: err.message }); }
  };

  const triggerWebhook = async () => {
    try {
      const r = await api.post('/webhook-delivery/trigger', { event: 'compliance.violation', data: { test: true } });
      setWhResult(r.data);
    } catch (err) { setWhResult(err.response?.data || { error: err.message }); }
  };

  const runComplianceReview = async () => {
    try {
      const r = await api.post('/agents/compliance-review', { state: 'Colorado', license_type: 'Cultivation' });
      setAgentResult(r.data);
    } catch (err) {
      const data = err.response?.data;
      setAgentResult(data || { error: err.message });
      if (err.response?.status === 503) toast.info('OpenRouter not configured (503).');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Operations &amp; Integrations</h2>
      <Section title="Notifications (email/SMS/push)">
        <p style={{ fontSize: 13, color: '#666' }}>Integrations are gated by env vars; unset providers return 503 with a list of missing vars.</p>
        <button onClick={sendEmail}>Test email send</button>
        <ResultBlock data={notifResult} />
      </Section>
      <Section title="State Track-and-Trace (METRC / BioTrack)">
        <button onClick={fetchMetrcPlants}>List METRC plants</button>
        <ResultBlock data={metrcResult} />
      </Section>
      <Section title="Reports">
        <button onClick={fetchHarvestSummary}>Harvest summary (30d, JSON)</button>
        <a style={{ marginLeft: 12 }} href={`http://localhost:${process.env.REACT_APP_BACKEND_PORT || 3001}/api/reports/harvest-summary?format=csv&days=30`} target="_blank" rel="noreferrer">CSV link</a>
        <ResultBlock data={reportResult} />
      </Section>
      <Section title="Webhook delivery">
        <button onClick={triggerWebhook}>Trigger compliance.violation webhook</button>
        <ResultBlock data={whResult} />
      </Section>
      <Section title="Multi-agent compliance review">
        <button onClick={runComplianceReview}>Run review (Colorado / Cultivation)</button>
        <ResultBlock data={agentResult} />
      </Section>
    </div>
  );
}
