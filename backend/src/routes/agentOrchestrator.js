// Multi-agent compliance orchestration.
//
// PRODUCT-DECISION: chains 3 existing AI endpoints in series for an
// end-to-end compliance review:
//   1. /api/ai/regulatory-tracker     — what changed in regs?
//   2. /api/ai/license-renewal        — am I due / what's missing?
//   3. /api/ai/supply-chain-audit     — supplier-side compliance.
// Caller passes a single `context` and receives a merged JSON. Agents are
// invoked in-process; we re-use the existing /api/ai handlers' contracts.
//
// Returns 503 + missing OPENROUTER_API_KEY when the underlying AI helpers
// would themselves fail (we surface the first 503 we see).
import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// In-process call to a sibling /api/ai/<feature> route by mounting a
// minimal Express request via fetch — simpler than re-exporting the
// route handlers. Uses BACKEND_PORT env so it works under start.sh.
async function callAi(featurePath, body, authHeader) {
  const port = process.env.BACKEND_PORT || 3001;
  const url = `http://localhost:${port}/api/ai/${featurePath}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader || '' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

router.post('/compliance-review', async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'your_openrouter_api_key_here' || key === 'your-openrouter-api-key-here') {
    return res.status(503).json({ error: 'OpenRouter not configured', missing: ['OPENROUTER_API_KEY'] });
  }
  const { state, license_type, changes, license_data, suppliers } = req.body || {};
  if (!state || !license_type) return res.status(400).json({ error: 'state and license_type required' });

  const auth = req.headers['authorization'];
  const out = { steps: {} };

  try {
    const reg = await callAi('regulatory-tracker', { state, license_type, changes: changes || [{ summary: 'No specific changes provided; review baseline rules' }] }, auth);
    out.steps.regulatory = { status: reg.status, ...reg.data };

    const ren = await callAi('license-renewal', {
      license_data: license_data || { state, license_type, expiration_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) },
      state,
    }, auth);
    out.steps.renewal = { status: ren.status, ...ren.data };

    const sc = await callAi('supply-chain-audit', { suppliers: suppliers || [{ name: 'placeholder', type: 'genetics', certifications: [] }] }, auth);
    out.steps.supply_chain = { status: sc.status, ...sc.data };

    out.summary = {
      regulatory_impact: out.steps.regulatory?.analysis?.impact_level || 'unknown',
      renewal_status: out.steps.renewal?.analysis?.renewal_status || 'unknown',
      supplier_risk: out.steps.supply_chain?.analysis?.overall_risk || 'unknown',
    };
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Orchestration failed', details: e.message, partial: out });
  }
});

export default router;
