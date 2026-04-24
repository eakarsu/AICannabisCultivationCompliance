import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/lab-tests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, p.strain as plant_strain, p.batch_id as plant_batch_id
       FROM lab_tests lt
       LEFT JOIN plants p ON lt.plant_id = p.id
       ORDER BY lt.created_at DESC`
    );
    res.json(result.rows);
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
