// State Track-and-Trace integration stubs (METRC, BioTrack).
//
// Required env vars per provider:
//   METRC    — METRC_API_KEY, METRC_USER_KEY, METRC_BASE_URL (e.g. https://api-co.metrc.com)
//   BIOTRACK — BIOTRACK_API_KEY, BIOTRACK_LICENSE_NUMBER, BIOTRACK_BASE_URL
//
// Endpoints:
//   GET  /api/metrc/plants               — list plants from METRC (stubbed)
//   POST /api/metrc/plants/sync          — push a local plant to METRC
//   POST /api/metrc/biotrack/inventory   — sync inventory to BioTrack
//
// All gated on creds — return 503 + `{ missing: [...] }` when unset.
// PRODUCT-DECISION: METRC is the default for Colorado/Nevada/Massachusetts/
// Oklahoma/Montana/New Mexico (mirrors the seed); BioTrack is the explicit
// per-call alternative.
import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

function missingEnv(...keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}

router.get('/plants', async (req, res) => {
  const missing = missingEnv('METRC_API_KEY', 'METRC_USER_KEY', 'METRC_BASE_URL');
  if (missing.length > 0) return res.status(503).json({ error: 'METRC not configured', missing });
  res.json({ plants: [], note: 'stub: replace with GET {METRC_BASE_URL}/plants/v1/vegetative' });
});

router.post('/plants/sync', async (req, res) => {
  const { plant_id, stage } = req.body || {};
  if (!plant_id) return res.status(400).json({ error: 'plant_id required' });
  const missing = missingEnv('METRC_API_KEY', 'METRC_USER_KEY', 'METRC_BASE_URL');
  if (missing.length > 0) return res.status(503).json({ error: 'METRC not configured', missing });
  res.json({ synced: false, reason: 'stub', plant_id, stage: stage || null, note: 'stub: replace with POST {METRC_BASE_URL}/plants/v1/changegrowthphases' });
});

router.post('/biotrack/inventory', async (req, res) => {
  const { item_id, quantity } = req.body || {};
  if (!item_id || typeof quantity !== 'number') return res.status(400).json({ error: 'item_id and numeric quantity required' });
  const missing = missingEnv('BIOTRACK_API_KEY', 'BIOTRACK_LICENSE_NUMBER', 'BIOTRACK_BASE_URL');
  if (missing.length > 0) return res.status(503).json({ error: 'BioTrack not configured', missing });
  res.json({ synced: false, reason: 'stub', item_id, quantity, note: 'stub: replace with POST {BIOTRACK_BASE_URL}/inventory_adjust' });
});

export default router;
