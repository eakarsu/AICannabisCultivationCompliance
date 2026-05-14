// Outbound webhook delivery.
//
// TOO-RISKY guardrails:
//   - In-process delivery only (no separate worker / queue infrastructure).
//   - Delivery is best-effort, soft-fails on network errors.
//   - 5-second timeout per call.
//   - HMAC-SHA256 signature in `X-Webhook-Signature` header when the
//     webhook row has a `secret` set; otherwise no signature.
//   - Persists each attempt to `webhook_deliveries` (additive table).
//   - No retry logic in this version (caller may re-POST /trigger).
//
// Endpoints:
//   POST /api/webhook-delivery/trigger   { event, data }
//   GET  /api/webhook-delivery/log
import express from 'express';
import crypto from 'crypto';
import authMiddleware from '../middleware/auth.js';
import pool from '../models/database.js';

const router = express.Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id SERIAL PRIMARY KEY,
      webhook_id INTEGER,
      event VARCHAR(100),
      url TEXT,
      status_code INTEGER,
      success BOOLEAN,
      error TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id)`).catch(() => {});
}
ensureTable();

router.use(authMiddleware);

async function deliverOne(webhook, payload) {
  const t0 = Date.now();
  let statusCode = null;
  let success = false;
  let error = null;
  try {
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };
    if (webhook.secret) {
      const sig = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${sig}`;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const resp = await fetch(webhook.url, { method: 'POST', headers, body, signal: ctrl.signal });
      statusCode = resp.status;
      success = resp.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    error = e.message || String(e);
  }
  const duration = Date.now() - t0;
  await pool.query(
    `INSERT INTO webhook_deliveries (webhook_id, event, url, status_code, success, error, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [webhook.id, payload.event || null, webhook.url, statusCode, success, error, duration]
  ).catch(() => {});
  return { webhook_id: webhook.id, status_code: statusCode, success, error, duration_ms: duration };
}

router.post('/trigger', async (req, res) => {
  const { event, data } = req.body || {};
  if (!event || typeof event !== 'string') return res.status(400).json({ error: 'event (string) required' });
  try {
    const r = await pool.query(
      `SELECT id, url, events, secret FROM webhooks WHERE active = true AND user_id = $1 AND $2 = ANY(events)`,
      [req.user?.id || null, event]
    ).catch(() => ({ rows: [] }));
    if (r.rows.length === 0) return res.json({ delivered: 0, results: [] });
    const payload = {
      event,
      delivery_id: `dlv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      data: data || {},
    };
    const results = await Promise.all(r.rows.map((w) => deliverOne(w, payload)));
    res.json({ delivered: results.length, results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to deliver webhooks', details: e.message });
  }
});

router.get('/log', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.id, d.webhook_id, d.event, d.url, d.status_code, d.success, d.error, d.duration_ms, d.created_at
         FROM webhook_deliveries d
         JOIN webhooks w ON w.id = d.webhook_id
        WHERE w.user_id = $1
        ORDER BY d.created_at DESC LIMIT 100`,
      [req.user?.id || null]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read delivery log', details: e.message });
  }
});

export default router;
