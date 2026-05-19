import React from 'react';
import ComplianceCalendar from '../components/ComplianceCalendar';
import ComplianceGauge from '../components/ComplianceGauge';
import METRCExporter from '../components/METRCExporter';
import LabCOAUpload from '../components/LabCOAUpload';

/**
 * Compliance Views — 4 custom features:
 *   1. Compliance Calendar (VIZ)
 *   2. Compliance Score Gauge (VIZ — recharts RadialBar)
 *   3. METRC CSV Export (NON-VIZ)
 *   4. Lab COA Upload (NON-VIZ — drag/drop PDF)
 */
export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24, color: '#e2e8f0' }} data-testid="custom-views-page">
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>Compliance Views</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>
          Cannabis cultivation compliance toolkit — METRC reporting, deadlines, scoring, and lab COA ingestion.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ gridColumn: '1 / -1' }}><ComplianceCalendar /></div>
        <ComplianceGauge />
        <METRCExporter />
        <div style={{ gridColumn: '1 / -1' }}><LabCOAUpload /></div>
      </div>
    </div>
  );
}
