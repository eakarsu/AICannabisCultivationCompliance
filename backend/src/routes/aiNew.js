import express from 'express';
import fetch from 'node-fetch';
import aiRateLimiter from '../middleware/rateLimiter.js';
import authMiddleware from '../middleware/auth.js';
import pool from '../models/database.js';

const router = express.Router();
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function persistResult(req, feature, input, output) {
  try {
    const userId = req.user?.id || null;
    await pool.query(
      'INSERT INTO ai_results (user_id, feature, input, output, model) VALUES ($1, $2, $3, $4, $5)',
      [userId, feature, input ? JSON.stringify(input) : null, output ? JSON.stringify(output) : null, MODEL]
    );
  } catch (e) {
    // Persistence failures must never break a successful AI response
    console.warn('[ai_results] persist failed:', e.message);
  }
}

const SYSTEM_PROMPT = 'You are an expert cannabis cultivation AI assistant with deep knowledge of state-specific regulations, agricultural best practices, and cannabis science.';

async function callOpenRouter(prompt, maxTokens = 1800) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return data.choices[0].message.content;
}

// 3-strategy parser: direct parse → first balanced object → fenced ```json block
function parseJsonResponse(rawContent) {
  if (rawContent === null || rawContent === undefined) return { summary: '' };
  if (typeof rawContent === 'object') return rawContent;
  const text = String(rawContent).trim();

  // Strategy 1: direct parse
  try { return JSON.parse(text); } catch (_) { /* fall through */ }

  // Strategy 2: first balanced JSON object
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      let inStr = false;
      let escape = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            return JSON.parse(text.slice(start, i + 1));
          }
        }
      }
    }
  } catch (_) { /* fall through */ }

  // Strategy 3: fenced ```json ... ``` block
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) {
      return JSON.parse(fenced[1].trim());
    }
  } catch (_) { /* fall through */ }

  return { summary: text };
}

function validateBody(fields, body, res) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    return false;
  }
  return true;
}

// POST /api/ai/regulatory-tracker
// Body: { state, license_type, changes[] }
router.post('/regulatory-tracker', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['state', 'license_type', 'changes'], req.body, res)) return;
    const { state, license_type, changes } = req.body;

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes must be a non-empty array.' });
    }

    const prompt = `Analyze the following regulatory changes for a cannabis operation and provide actionable compliance adjustments. Respond in valid JSON.

State: ${state}
License Type: ${license_type}
Regulatory Changes:
${changes.map((c, i) => `${i + 1}. ${typeof c === 'object' ? JSON.stringify(c) : c}`).join('\n')}

Return JSON with this structure:
{
  "impact_level": "Low|Medium|High|Critical",
  "effective_date_notes": "",
  "compliance_adjustments": [{"change": "", "required_action": "", "deadline": "", "priority": "Low|Medium|High"}],
  "documentation_updates_needed": [],
  "staff_training_required": [],
  "estimated_compliance_cost": "",
  "risk_if_non_compliant": "",
  "license_renewal_impact": "",
  "action_plan": [{"step": 0, "action": "", "responsible_party": "", "timeline": ""}],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'regulatory-tracker', { state, license_type, changes }, analysis);
    res.json({ analysis, state, license_type });
  } catch (error) {
    console.error('Error in regulatory tracker:', error);
    res.status(500).json({ error: 'Failed to analyze regulatory changes.' });
  }
});

// POST /api/ai/harvest-timing-optimizer
// Body: { plant_data, terpene_targets, market_data }
router.post('/harvest-timing-optimizer', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['plant_data'], req.body, res)) return;
    const { plant_data, terpene_targets, market_data } = req.body;

    const prompt = `Optimize harvest timing for maximum terpene expression and market value. Respond in valid JSON.

Plant Data: ${JSON.stringify(plant_data)}
Terpene Targets: ${terpene_targets ? JSON.stringify(terpene_targets) : 'Not specified'}
Market Data: ${market_data ? JSON.stringify(market_data) : 'Not provided'}

Return JSON with this structure:
{
  "optimal_harvest_window": {"start_days_from_now": 0, "end_days_from_now": 0, "peak_day": 0},
  "terpene_peak_conditions": [{"terpene": "", "optimal_temp_f": 0, "peak_timing": ""}],
  "market_timing_insight": "",
  "price_premium_opportunity": "",
  "harvest_sequence_if_multiple_plants": "",
  "post_harvest_handling": {"first_24hrs": "", "drying_protocol": "", "curing_protocol": ""},
  "quality_indicators_to_watch": [],
  "risks": [],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'harvest-timing-optimizer', { plant_data, terpene_targets, market_data }, analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in harvest timing optimizer:', error);
    res.status(500).json({ error: 'Failed to optimize harvest timing.' });
  }
});

// POST /api/ai/energy-optimizer
// Body: { grow_rooms[], power_data[] }
router.post('/energy-optimizer', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['grow_rooms', 'power_data'], req.body, res)) return;
    const { grow_rooms, power_data } = req.body;

    if (!Array.isArray(grow_rooms) || !Array.isArray(power_data)) {
      return res.status(400).json({ error: 'grow_rooms and power_data must be arrays.' });
    }

    const prompt = `Analyze energy usage across cannabis grow rooms and provide cost reduction recommendations. Respond in valid JSON.

Grow Rooms: ${JSON.stringify(grow_rooms)}
Power Data: ${JSON.stringify(power_data)}

Return JSON with this structure:
{
  "total_estimated_kwh_monthly": 0,
  "estimated_monthly_cost_usd": 0,
  "efficiency_score": 0,
  "highest_consumption_areas": [],
  "optimization_recommendations": [
    {
      "area": "",
      "current_usage": "",
      "recommended_change": "",
      "estimated_savings_kwh": 0,
      "estimated_savings_usd_monthly": 0,
      "implementation_cost": "",
      "roi_months": 0
    }
  ],
  "lighting_optimization": {"current_schedule": "", "recommended_schedule": "", "fixture_upgrades": []},
  "hvac_optimization": {"setpoint_adjustments": "", "scheduling_improvements": ""},
  "renewable_energy_opportunities": [],
  "compliance_impact": "",
  "priority_actions": [],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt, 2000);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'energy-optimizer', { grow_rooms, power_data }, analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in energy optimizer:', error);
    res.status(500).json({ error: 'Failed to generate energy optimization recommendations.' });
  }
});

// POST /api/ai/pest-detection
// Body: { symptoms[], environmental_readings }
router.post('/pest-detection', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['symptoms'], req.body, res)) return;
    const { symptoms, environmental_readings } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'symptoms must be a non-empty array.' });
    }

    const prompt = `Identify plant pathogens and pests based on observed symptoms and environmental conditions. Respond in valid JSON.

Observed Symptoms: ${symptoms.join(', ')}
Environmental Readings: ${environmental_readings ? JSON.stringify(environmental_readings) : 'Not provided'}

Return JSON with this structure:
{
  "primary_diagnosis": {"pathogen": "", "confidence": "Low|Medium|High", "description": ""},
  "differential_diagnoses": [{"pathogen": "", "confidence": "", "distinguishing_features": ""}],
  "spread_risk": "Low|Medium|High|Critical",
  "affected_growth_stages": [],
  "immediate_actions": [{"action": "", "priority": "Immediate|Within 24hrs|Within 1 week"}],
  "treatment_plan": {
    "organic_options": [{"treatment": "", "application_rate": "", "frequency": "", "notes": ""}],
    "conventional_options": [{"treatment": "", "application_rate": "", "frequency": "", "notes": "", "pre_harvest_interval_days": 0}]
  },
  "quarantine_required": false,
  "quarantine_steps": [],
  "environmental_corrections": [],
  "regulatory_reporting_required": false,
  "regulatory_reporting_notes": "",
  "prevention_protocol": [],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'pest-detection', { symptoms, environmental_readings }, analysis);
    res.json({ analysis, symptoms });
  } catch (error) {
    console.error('Error in pest detection:', error);
    res.status(500).json({ error: 'Failed to generate pest detection analysis.' });
  }
});

// POST /api/ai/seed-supplier-audit
// Body: { supplier_data, compliance_records }
router.post('/seed-supplier-audit', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['supplier_data'], req.body, res)) return;
    const { supplier_data, compliance_records } = req.body;

    const prompt = `Audit a cannabis seed supplier for quality and regulatory compliance. Respond in valid JSON.

Supplier Data: ${JSON.stringify(supplier_data)}
Compliance Records: ${compliance_records ? JSON.stringify(compliance_records) : 'Not provided'}

Return JSON with this structure:
{
  "overall_score": 0,
  "quality_score": 0,
  "compliance_score": 0,
  "reliability_score": 0,
  "rating": "Excellent|Good|Acceptable|Poor|Unacceptable",
  "strengths": [],
  "weaknesses": [],
  "compliance_flags": [{"issue": "", "severity": "Low|Medium|High|Critical", "recommendation": ""}],
  "quality_concerns": [],
  "due_diligence_checklist": [{"item": "", "status": "Verified|Needs Verification|Failed|N/A"}],
  "recommended_contract_clauses": [],
  "alternative_suppliers_criteria": "",
  "approval_recommendation": "Approve|Approve with Conditions|Reject",
  "conditions_if_any": [],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'seed-supplier-audit', { supplier_data, compliance_records }, analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in seed supplier audit:', error);
    res.status(500).json({ error: 'Failed to generate seed supplier audit.' });
  }
});

// POST /api/ai/license-renewal
// Body: { license_data, state, current_date? }
router.post('/license-renewal', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['license_data', 'state'], req.body, res)) return;
    const { license_data, state, current_date } = req.body;

    const prompt = `Analyze a cannabis license for renewal readiness. Identify documents, deadlines, and risks. Respond in valid JSON.

State: ${state}
Today: ${current_date || new Date().toISOString().split('T')[0]}
License Data: ${JSON.stringify(license_data)}

Return JSON with this structure:
{
  "renewal_status": "On Track|At Risk|Overdue|Imminent",
  "days_until_expiry": 0,
  "renewal_window_open": true,
  "renewal_deadline": "",
  "required_documents": [{"document": "", "obtained": false, "where_to_get": "", "deadline": ""}],
  "fees": [{"item": "", "amount_usd": 0, "due_date": ""}],
  "estimated_total_cost_usd": 0,
  "compliance_prerequisites": [],
  "training_renewal_required": [],
  "background_checks_required": [],
  "auto_generated_application": {
    "applicant_name": "",
    "license_number": "",
    "license_type": "",
    "renewal_period_months": 0,
    "narrative": ""
  },
  "risks_if_late": [],
  "recommended_action_plan": [{"step": 0, "action": "", "responsible_party": "", "deadline": ""}],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt, 2000);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'license-renewal', { license_data, state, current_date }, analysis);
    res.json({ analysis, state });
  } catch (error) {
    console.error('Error in license renewal:', error);
    res.status(500).json({ error: 'Failed to analyze license renewal.' });
  }
});

// POST /api/ai/microbial-analyzer
// Body: { lab_results[], strain?, environmental_conditions? }
router.post('/microbial-analyzer', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['lab_results'], req.body, res)) return;
    const { lab_results, strain, environmental_conditions } = req.body;

    if (!Array.isArray(lab_results) || lab_results.length === 0) {
      return res.status(400).json({ error: 'lab_results must be a non-empty array.' });
    }

    const prompt = `Analyze microbial lab test results, identify contamination patterns, and predict future failures. Respond in valid JSON.

Strain: ${strain || 'Multiple/Unknown'}
Environmental Conditions: ${environmental_conditions ? JSON.stringify(environmental_conditions) : 'Not provided'}
Lab Results: ${JSON.stringify(lab_results)}

Return JSON with this structure:
{
  "overall_risk": "Low|Medium|High|Critical",
  "pass_fail_summary": {"passed": 0, "failed": 0, "borderline": 0},
  "contamination_patterns": [
    {"organism": "", "frequency": "", "trend": "Increasing|Stable|Decreasing", "linked_to": ""}
  ],
  "failure_prediction": {
    "next_30_days_probability_pct": 0,
    "high_risk_strains": [],
    "high_risk_rooms": [],
    "drivers": []
  },
  "environmental_correlation": [{"factor": "", "correlation": "", "recommended_setpoint": ""}],
  "hygiene_recommendations": [{"area": "", "recommendation": "", "priority": "Low|Medium|High"}],
  "process_improvements": [{"stage": "", "improvement": "", "expected_reduction_pct": 0}],
  "regulatory_implications": [],
  "retest_schedule": [{"item": "", "interval_days": 0, "rationale": ""}],
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt, 2000);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'microbial-analyzer', { lab_results, strain, environmental_conditions }, analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in microbial analyzer:', error);
    res.status(500).json({ error: 'Failed to analyze microbial test results.' });
  }
});

// POST /api/ai/supply-chain-audit
// Body: { suppliers[], recent_changes? }
router.post('/supply-chain-audit', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!validateBody(['suppliers'], req.body, res)) return;
    const { suppliers, recent_changes } = req.body;

    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ error: 'suppliers must be a non-empty array.' });
    }

    const prompt = `Audit a cannabis cultivation supply chain. Verify certifications, flag compliance-critical changes, and rank supplier risk. Respond in valid JSON.

Suppliers: ${JSON.stringify(suppliers)}
Recent Supply Changes: ${recent_changes ? JSON.stringify(recent_changes) : 'None reported'}

Return JSON with this structure:
{
  "overall_supply_chain_risk": "Low|Medium|High|Critical",
  "suppliers_evaluated": 0,
  "supplier_scorecard": [
    {
      "supplier_name": "",
      "category": "Nutrients|Seeds|Equipment|Lab|Packaging|Other",
      "risk_score": 0,
      "rating": "Preferred|Acceptable|Watch|Restricted",
      "certifications_verified": [],
      "missing_certifications": [],
      "compliance_flags": [],
      "concentration_risk_pct": 0
    }
  ],
  "compliance_critical_changes": [{"change": "", "severity": "Low|Medium|High|Critical", "action_required": ""}],
  "diversification_recommendations": [],
  "single_source_risks": [],
  "alternative_supplier_suggestions": [{"category": "", "suggested_qualities": []}],
  "audit_trail_gaps": [],
  "next_audit_due_date": "",
  "summary": ""
}`;

    const raw = await callOpenRouter(prompt, 2000);
    const analysis = parseJsonResponse(raw);
    await persistResult(req, 'supply-chain-audit', { suppliers, recent_changes }, analysis);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in supply chain audit:', error);
    res.status(500).json({ error: 'Failed to run supply chain audit.' });
  }
});

// GET /api/ai/results — paginated list of stored AI results (filterable by feature)
router.get('/results', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const feature = req.query.feature ? String(req.query.feature) : null;

    const params = [];
    let where = '';
    if (feature) {
      params.push(feature);
      where = 'WHERE feature = $1';
    }

    const countSql = `SELECT COUNT(*)::int AS total FROM ai_results ${where}`;
    const countRes = await pool.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const limitIdx = dataParams.length - 1;
    const offsetIdx = dataParams.length;
    const dataSql = `SELECT id, user_id, feature, input, output, model, created_at
                     FROM ai_results ${where}
                     ORDER BY created_at DESC
                     LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const rows = await pool.query(dataSql, dataParams);

    res.json({
      data: rows.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error listing ai_results:', err);
    res.status(500).json({ error: 'Failed to list AI results.' });
  }
});

export default router;
