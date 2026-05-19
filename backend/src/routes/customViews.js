/*
 * Custom Views — Cannabis Cultivation Compliance
 *
 * 4 endpoints:
 *   GET  /compliance-calendar     -> month-grid deadlines
 *   GET  /compliance-score        -> overall + per-category compliance score
 *   GET  /metrc-export            -> CSV (text/csv) for date range + report type
 *   POST /lab-coa-upload          -> multer PDF upload, returns extracted mock fields
 */
import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Auth: protect GET endpoints with verifyToken, except CSV (which is fetched
// via blob using axios + Bearer token already) and the lab COA upload.
// Apply globally — frontend uses axios interceptor that sets Authorization.
router.use(verifyToken);

// ----- 1. Compliance Calendar -----
router.get('/compliance-calendar', (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = (parseInt(req.query.month) || (now.getMonth() + 1)) - 1; // 0-indexed
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const eventTemplates = [
    { day: 5,  type: 'METRC_REPORT', title: 'METRC Monthly Plant Count', urgency: 'high' },
    { day: 8,  type: 'TAX',          title: 'State Cannabis Excise Tax Filing', urgency: 'critical' },
    { day: 12, type: 'LAB',          title: 'Lab COA Submission Due (Batch 24-A)', urgency: 'medium' },
    { day: 15, type: 'METRC_REPORT', title: 'METRC Inventory Reconciliation', urgency: 'high' },
    { day: 18, type: 'LICENSE',      title: 'Cultivator License Renewal Reminder', urgency: 'low' },
    { day: 22, type: 'WASTE',        title: 'Waste Manifest Filing (DEA Form)', urgency: 'medium' },
    { day: 25, type: 'SECURITY',     title: 'Video Surveillance Retention Audit', urgency: 'low' },
    { day: 28, type: 'METRC_REPORT', title: 'METRC Sales Reconciliation', urgency: 'critical' },
    { day: 30, type: 'TRAINING',     title: 'Employee Compliance Training Renewal', urgency: 'medium' },
  ];

  const events = eventTemplates
    .filter((e) => e.day <= daysInMonth)
    .map((e, idx) => ({
      id: idx + 1,
      date: new Date(year, month, e.day).toISOString().slice(0, 10),
      day: e.day,
      type: e.type,
      title: e.title,
      urgency: e.urgency,
      assigned_to: ['Jordan Chen', 'Maya Patel', 'Alex Rivera', 'Sam Walker'][idx % 4],
    }));

  res.json({
    year,
    month: month + 1,
    month_name: monthStart.toLocaleString('en-US', { month: 'long' }),
    first_weekday: monthStart.getDay(), // 0=Sun
    days_in_month: daysInMonth,
    events,
    urgency_legend: {
      critical: '#dc2626',
      high:     '#f97316',
      medium:   '#f59e0b',
      low:      '#22c55e',
    },
  });
});

// ----- 2. Compliance Score (RadialBar) -----
router.get('/compliance-score', (req, res) => {
  const breakdown = [
    { category: 'Licensing', score: 94, weight: 0.25, note: 'All facility licenses current; 1 renewal in 47 days.' },
    { category: 'Testing',   score: 88, weight: 0.25, note: '12/13 batches passed COA. 1 batch awaiting re-test.' },
    { category: 'Tracking',  score: 91, weight: 0.30, note: 'METRC sync healthy. 0 reconciliation variances.' },
    { category: 'Security',  score: 79, weight: 0.20, note: '1 surveillance gap (camera #7 Veg Room offline 4h).' },
  ];

  const overall = Math.round(
    breakdown.reduce((acc, c) => acc + c.score * c.weight, 0)
  );

  res.json({
    overall_score: overall,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : 'D',
    breakdown,
    generated_at: new Date().toISOString(),
    facility: 'GreenLeaf Cultivation, Suite 3B (Lic #CCL23-0007)',
  });
});

// ----- 3. METRC Export (CSV) -----
router.get('/metrc-export', (req, res) => {
  const startDate = req.query.start_date || '2026-04-01';
  const endDate   = req.query.end_date   || '2026-04-30';
  const reportType = (req.query.report_type || 'plants').toLowerCase();

  const buildRows = () => {
    if (reportType === 'harvests') {
      return [
        ['harvest_id','metrc_tag','strain','wet_weight_g','dry_weight_g','harvest_date','license'],
        ['HRV-1001','1A4FF0100000A29000000123','Blue Dream',         '4820', '1184', startDate, 'CCL23-0007'],
        ['HRV-1002','1A4FF0100000A29000000124','OG Kush',            '5310', '1296', startDate, 'CCL23-0007'],
        ['HRV-1003','1A4FF0100000A29000000125','Sour Diesel',        '4015', '982',  endDate,   'CCL23-0007'],
        ['HRV-1004','1A4FF0100000A29000000126','Northern Lights',    '5985', '1421', endDate,   'CCL23-0007'],
      ];
    }
    if (reportType === 'lab_tests') {
      return [
        ['test_id','metrc_package_tag','batch','thc_pct','cbd_pct','status','test_date'],
        ['LAB-2210','1A4FF0200000A29000000301','BD-2026-04-A','22.4','0.61','PASS','2026-04-09'],
        ['LAB-2211','1A4FF0200000A29000000302','OG-2026-04-B','25.1','0.42','PASS','2026-04-14'],
        ['LAB-2212','1A4FF0200000A29000000303','SD-2026-04-C','19.8','0.55','FAIL','2026-04-19'],
        ['LAB-2213','1A4FF0200000A29000000304','NL-2026-04-D','21.2','0.71','PASS','2026-04-24'],
      ];
    }
    if (reportType === 'waste') {
      return [
        ['waste_id','metrc_tag','reason','weight_g','witness_employee','disposal_date'],
        ['WST-501','1A4FF0300000A29000000401','Trim_remnants','312','Maya Patel','2026-04-06'],
        ['WST-502','1A4FF0300000A29000000402','Failed_test',  '1184','Alex Rivera','2026-04-19'],
        ['WST-503','1A4FF0300000A29000000403','Spoilage',     '88', 'Sam Walker',  '2026-04-22'],
      ];
    }
    // default: plants
    return [
      ['plant_id','metrc_tag','strain','stage','planted_date','grow_room','license'],
      ['P-3001','1A4FF0500000A29000000001','Blue Dream',     'flowering','2026-02-10','VegRoom-1','CCL23-0007'],
      ['P-3002','1A4FF0500000A29000000002','OG Kush',        'flowering','2026-02-12','FlowerRoom-2','CCL23-0007'],
      ['P-3003','1A4FF0500000A29000000003','Sour Diesel',    'veg',      '2026-03-04','VegRoom-2','CCL23-0007'],
      ['P-3004','1A4FF0500000A29000000004','Northern Lights','clone',    '2026-04-01','CloneRoom-1','CCL23-0007'],
      ['P-3005','1A4FF0500000A29000000005','Gorilla Glue',   'flowering','2026-02-08','FlowerRoom-1','CCL23-0007'],
    ];
  };

  const rows = buildRows();
  const csv = rows.map((r) => r.map((cell) => {
    const s = String(cell);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(',')).join('\n');

  const filename = `metrc_${reportType}_${startDate}_to_${endDate}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ----- 4. Lab COA upload (multer) -----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
});

router.post('/lab-coa-upload', upload.single('coa'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded. Field name must be "coa".' });
  }
  const isPdf =
    file.mimetype === 'application/pdf' ||
    /\.pdf$/i.test(file.originalname || '');

  // Synthesize deterministic-ish mock extracted values from file size.
  const seed = (file.size || 1) % 1000;
  const r = (min, max) => +(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min)).toFixed(2);

  const extracted = {
    cannabinoids: {
      thc_pct:    r(18, 28),
      cbd_pct:    r(0.1, 1.2),
      cbg_pct:    r(0.05, 0.9),
      total_pct:  r(20, 30),
    },
    terpenes: {
      myrcene_pct:     r(0.2, 1.5),
      limonene_pct:    r(0.1, 1.0),
      caryophyllene_pct: r(0.1, 0.9),
      pinene_pct:      r(0.05, 0.5),
    },
    pesticides_pass: (seed % 9) !== 0,
    microbials_pass: (seed % 7) !== 0,
  };

  res.json({
    ok: true,
    upload: {
      filename: file.originalname,
      mimetype: file.mimetype,
      size_bytes: file.size,
      is_pdf: isPdf,
    },
    extracted,
    note: 'Mock extraction — replace with real OCR/parser for production COA ingestion.',
    received_at: new Date().toISOString(),
  });
});

router.get('/health', (req, res) => res.json({ feature: 'custom_views', ok: true }));

export default router;
