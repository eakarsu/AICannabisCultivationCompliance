import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/lab-tests
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM lab_tests');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT lt.*, p.strain as plant_strain, p.batch_id as plant_batch_id
       FROM lab_tests lt
       LEFT JOIN plants p ON lt.plant_id = p.id
       ORDER BY lt.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/lab-tests/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, p.strain as plant_strain, p.batch_id as plant_batch_id
       FROM lab_tests lt
       LEFT JOIN plants p ON lt.plant_id = p.id
       WHERE lt.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab test not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/lab-tests
router.post('/', async (req, res) => {
  try {
    const {
      plant_id, batch_id, test_type, lab_name, status, thc_result, cbd_result,
      cbn_result, terpene_profile, pesticide_result, heavy_metals_result,
      microbial_result, moisture_content, passed, test_date, results_date,
      certificate_number, notes
    } = req.body;

    if (!batch_id || !test_type || !lab_name) {
      return res.status(400).json({ error: 'Missing required fields: batch_id, test_type, lab_name.' });
    }

    const result = await pool.query(
      `INSERT INTO lab_tests (plant_id, batch_id, test_type, lab_name, status, thc_result,
        cbd_result, cbn_result, terpene_profile, pesticide_result, heavy_metals_result,
        microbial_result, moisture_content, passed, test_date, results_date,
        certificate_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [plant_id, batch_id, test_type, lab_name, status || 'pending', thc_result,
       cbd_result, cbn_result, terpene_profile ? JSON.stringify(terpene_profile) : null,
       pesticide_result, heavy_metals_result, microbial_result, moisture_content,
       passed, test_date, results_date, certificate_number, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/lab-tests/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      plant_id, batch_id, test_type, lab_name, status, thc_result, cbd_result,
      cbn_result, terpene_profile, pesticide_result, heavy_metals_result,
      microbial_result, moisture_content, passed, test_date, results_date,
      certificate_number, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE lab_tests SET plant_id=$1, batch_id=$2, test_type=$3, lab_name=$4, status=$5,
        thc_result=$6, cbd_result=$7, cbn_result=$8, terpene_profile=$9, pesticide_result=$10,
        heavy_metals_result=$11, microbial_result=$12, moisture_content=$13, passed=$14,
        test_date=$15, results_date=$16, certificate_number=$17, notes=$18, updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [plant_id, batch_id, test_type, lab_name, status, thc_result, cbd_result,
       cbn_result, terpene_profile ? JSON.stringify(terpene_profile) : null,
       pesticide_result, heavy_metals_result, microbial_result, moisture_content,
       passed, test_date, results_date, certificate_number, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab test not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/lab-tests/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lab_tests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab test not found.' });
    }
    res.json({ message: 'Lab test deleted successfully.', test: result.rows[0] });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/lab-tests/:id/ai-interpretation — microbial/potency result interpretation
router.post('/:id/ai-interpretation', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, p.strain as plant_strain, p.batch_id as plant_batch_id
       FROM lab_tests lt
       LEFT JOIN plants p ON lt.plant_id = p.id
       WHERE lt.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab test not found.' });
    }

    const { state } = req.body;
    const test = result.rows[0];

    const promptString = `Interpret the following cannabis lab test results with focus on microbial safety and potency. Respond in valid JSON.

Lab Test Details:
- Batch ID: ${test.batch_id}
- Strain: ${test.plant_strain || 'Unknown'}
- Test Type: ${test.test_type}
- Lab: ${test.lab_name}
- State: ${state || 'Not specified'}
- Passed: ${test.passed !== null ? test.passed : 'Pending'}

Potency Results:
- THC: ${test.thc_result ?? 'N/A'}%
- CBD: ${test.cbd_result ?? 'N/A'}%
- CBN: ${test.cbn_result ?? 'N/A'}%
- Terpene Profile: ${JSON.stringify(test.terpene_profile)}

Microbial & Safety Results:
- Microbial Result: ${test.microbial_result || 'Pending'}
- Pesticide Result: ${test.pesticide_result || 'Pending'}
- Heavy Metals Result: ${test.heavy_metals_result || 'Pending'}
- Moisture Content: ${test.moisture_content ?? 'N/A'}%

Return JSON with this structure:
{
  "overall_pass_fail": "Pass|Fail|Pending",
  "potency_interpretation": {
    "thc_assessment": "",
    "cbd_assessment": "",
    "cannabinoid_ratio_insight": "",
    "expected_effects": [],
    "market_category": ""
  },
  "microbial_interpretation": {
    "risk_level": "None|Low|Medium|High|Critical",
    "findings": "",
    "compliance_status": "",
    "remediation_required": false,
    "remediation_options": []
  },
  "terpene_insights": {"dominant_terpenes": [], "effect_profile": "", "aroma_description": ""},
  "state_compliance_notes": "",
  "actionable_recommendations": [],
  "retesting_required": false,
  "retesting_reason": "",
  "consumer_safety_rating": "Safe|Conditionally Safe|Unsafe",
  "summary": ""
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'You are an expert cannabis cultivation AI assistant with deep knowledge of state-specific regulations, agricultural best practices, and cannabis science.' },
          { role: 'user', content: promptString }
        ],
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'OpenRouter API error');

    const rawContent = data.choices[0].message.content;
    let analysis;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: rawContent };
    } catch {
      analysis = { summary: rawContent };
    }

    res.json({ analysis, test });
  } catch (error) {
    console.error('Error in AI lab test interpretation:', error);
    res.status(500).json({ error: 'Failed to generate AI lab test interpretation.' });
  }
});

// POST /api/lab-tests/:id/ai-analyze
router.post('/:id/ai-analyze', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, p.strain as plant_strain
       FROM lab_tests lt
       LEFT JOIN plants p ON lt.plant_id = p.id
       WHERE lt.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab test not found.' });
    }

    const test = result.rows[0];
    const promptString = `Analyze the following cannabis lab test results and provide detailed safety and quality recommendations:

Lab Test Details:
Batch ID: ${test.batch_id}
Strain: ${test.plant_strain || 'Unknown'}
Test Type: ${test.test_type}
Lab Name: ${test.lab_name}
Test Date: ${test.test_date}
Results Date: ${test.results_date}
Status: ${test.status}
Passed: ${test.passed !== null ? test.passed : 'Pending'}

Cannabinoid Results:
THC: ${test.thc_result}%
CBD: ${test.cbd_result}%
CBN: ${test.cbn_result}%

Terpene Profile: ${JSON.stringify(test.terpene_profile)}

Safety Testing:
Pesticide Result: ${test.pesticide_result || 'Pending'}
Heavy Metals Result: ${test.heavy_metals_result || 'Pending'}
Microbial Result: ${test.microbial_result || 'Pending'}
Moisture Content: ${test.moisture_content}%

Certificate Number: ${test.certificate_number || 'Not issued'}
Notes: ${test.notes || 'None'}

Please provide:
1. Overall quality assessment based on cannabinoid profile
2. Safety analysis of pesticide, heavy metals, and microbial results
3. Terpene profile analysis and expected effects
4. Moisture content assessment and storage recommendations
5. Compliance with typical state testing requirements
6. Recommendations for improvement in future batches
7. Consumer safety recommendations
8. Any red flags or concerns in the results`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert cannabis cultivation and compliance AI assistant.' },
          { role: 'user', content: promptString }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    await pool.query('UPDATE lab_tests SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiContent, req.params.id]);

    res.json({ analysis: aiContent, test });
  } catch (error) {
    console.error('Error in AI lab test analysis:', error);
    res.status(500).json({ error: 'Failed to generate AI lab test analysis.' });
  }
});

export default router;
