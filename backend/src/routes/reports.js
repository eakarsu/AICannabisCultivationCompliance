// Reports & exports.
//
// PRODUCT-DECISION: format defaults to JSON; pass ?format=csv for CSV.
// Reports are READ-ONLY aggregations of existing tables — no schema changes,
// no template engine. Three reports surface the highest-value compliance
// data: harvest summary, lab-test pass/fail breakdown, waste log.
//
// Endpoints:
//   GET /api/reports/harvest-summary?days=30
//   GET /api/reports/lab-test-summary?days=90
//   GET /api/reports/waste-log?days=30
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import pool from '../models/database.js';

const router = express.Router();
router.use(authMiddleware);

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

function send(res, format, payload, filename) {
  if (format === 'csv') {
    const rows = Array.isArray(payload) ? payload : (payload.rows || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(toCsv(rows));
  }
  res.json(payload);
}

router.get('/harvest-summary', async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 30));
  const format = (req.query.format || 'json').toLowerCase();
  try {
    const r = await pool.query(
      `SELECT id, strain_name, harvest_date, dry_weight_grams, status
         FROM harvests
         WHERE harvest_date >= NOW() - INTERVAL '1 day' * $1
         ORDER BY harvest_date DESC`,
      [days]
    ).catch(() => ({ rows: [] }));
    send(res, format, r.rows, `harvest_summary_${days}d`);
  } catch (e) {
    res.status(500).json({ error: 'Failed to build harvest summary', details: e.message });
  }
});

router.get('/lab-test-summary', async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 90));
  const format = (req.query.format || 'json').toLowerCase();
  try {
    const r = await pool.query(
      `SELECT status, COUNT(*) AS count
         FROM lab_tests
         WHERE created_at >= NOW() - INTERVAL '1 day' * $1
         GROUP BY status
         ORDER BY count DESC`,
      [days]
    ).catch(() => ({ rows: [] }));
    send(res, format, r.rows, `lab_test_summary_${days}d`);
  } catch (e) {
    res.status(500).json({ error: 'Failed to build lab-test summary', details: e.message });
  }
});

router.get('/waste-log', async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 30));
  const format = (req.query.format || 'json').toLowerCase();
  try {
    const r = await pool.query(
      `SELECT id, waste_type, weight_grams, disposal_method, recorded_at
         FROM waste_records
         WHERE recorded_at >= NOW() - INTERVAL '1 day' * $1
         ORDER BY recorded_at DESC`,
      [days]
    ).catch(() => ({ rows: [] }));
    send(res, format, r.rows, `waste_log_${days}d`);
  } catch (e) {
    res.status(500).json({ error: 'Failed to build waste log', details: e.message });
  }
});

export default router;
