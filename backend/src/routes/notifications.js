// Notifications integration stubs.
//
// Required env vars (per provider):
//   EMAIL  — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   SMS    — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
//   PUSH   — FCM_SERVER_KEY (Firebase Cloud Messaging legacy server key)
//
// All endpoints return 503 with `{ missing: [<env vars>] }` if creds are
// unset. No outbound HTTP calls are made when creds are missing — this is
// intentional so a mis-configured env can never silently dispatch real
// messages. When creds ARE present, the endpoints persist the dispatch
// intent and currently return 200 with `dispatched: false, reason: 'stub'`
// — wire to the real provider SDK before flipping to live.
//
// PRODUCT-DECISION: dispatch records are persisted to a `notifications_log`
// table (additive, CREATE TABLE IF NOT EXISTS) so an operator can audit
// what *would* have been sent during the stub phase.
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import pool from '../models/database.js';

const router = express.Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      channel VARCHAR(32) NOT NULL,
      target TEXT,
      subject TEXT,
      body TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      provider_response JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}
ensureTable();

router.use(authMiddleware);

function missingEnv(...keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}

async function logDispatch(userId, channel, target, subject, body, status, providerResponse) {
  try {
    const r = await pool.query(
      `INSERT INTO notifications_log (user_id, channel, target, subject, body, status, provider_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [userId, channel, target, subject, body, status, providerResponse ? JSON.stringify(providerResponse) : null]
    );
    return r.rows[0];
  } catch (e) {
    return { id: null, created_at: new Date().toISOString(), persist_error: e.message };
  }
}

// POST /api/notifications/email
// Body: { to, subject, body }
router.post('/email', async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body required' });

  const missing = missingEnv('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM');
  if (missing.length > 0) {
    return res.status(503).json({ error: 'Email provider not configured', missing });
  }

  const log = await logDispatch(req.user?.id || null, 'email', to, subject, body, 'stub-success', { note: 'stub: replace with nodemailer/SMTP send' });
  res.json({ dispatched: false, reason: 'stub', log_id: log.id, channel: 'email' });
});

// POST /api/notifications/sms
// Body: { to, body }
router.post('/sms', async (req, res) => {
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to, body required' });

  const missing = missingEnv('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER');
  if (missing.length > 0) {
    return res.status(503).json({ error: 'Twilio not configured', missing });
  }

  const log = await logDispatch(req.user?.id || null, 'sms', to, null, body, 'stub-success', { note: 'stub: replace with twilio SDK send' });
  res.json({ dispatched: false, reason: 'stub', log_id: log.id, channel: 'sms' });
});

// POST /api/notifications/push
// Body: { device_token, title, body }
router.post('/push', async (req, res) => {
  const { device_token, title, body } = req.body || {};
  if (!device_token || !title || !body) return res.status(400).json({ error: 'device_token, title, body required' });

  const missing = missingEnv('FCM_SERVER_KEY');
  if (missing.length > 0) {
    return res.status(503).json({ error: 'FCM not configured', missing });
  }

  const log = await logDispatch(req.user?.id || null, 'push', device_token, title, body, 'stub-success', { note: 'stub: replace with FCM HTTP v1 send' });
  res.json({ dispatched: false, reason: 'stub', log_id: log.id, channel: 'push' });
});

// GET /api/notifications/log — recent dispatches for the authed user
router.get('/log', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, channel, target, subject, status, created_at FROM notifications_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user?.id || null]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read log', details: e.message });
  }
});

export default router;
