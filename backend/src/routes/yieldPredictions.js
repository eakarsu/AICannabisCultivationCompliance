import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/yield-predictions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT yp.*, gr.name as grow_room_name
       FROM yield_predictions yp
       LEFT JOIN grow_rooms gr ON yp.grow_room_id = gr.id
       ORDER BY yp.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching yield predictions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/yield-predictions/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT yp.*, gr.name as grow_room_name
       FROM yield_predictions yp
       LEFT JOIN grow_rooms gr ON yp.grow_room_id = gr.id
       WHERE yp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Yield prediction not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching yield prediction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/yield-predictions
router.post('/', async (req, res) => {
  try {
    const {
      grow_room_id, strain, predicted_yield_grams, actual_yield_grams, confidence_score,
      environmental_factors, growth_stage, days_to_harvest, prediction_date, harvest_date,
      status, ai_analysis, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO yield_predictions (grow_room_id, strain, predicted_yield_grams, actual_yield_grams,
        confidence_score, environmental_factors, growth_stage, days_to_harvest, prediction_date,
        harvest_date, status, ai_analysis, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [grow_room_id, strain, predicted_yield_grams, actual_yield_grams, confidence_score,
       environmental_factors ? JSON.stringify(environmental_factors) : null, growth_stage,
       days_to_harvest, prediction_date, harvest_date, status || 'pending', ai_analysis, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating yield prediction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/yield-predictions/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      grow_room_id, strain, predicted_yield_grams, actual_yield_grams, confidence_score,
      environmental_factors, growth_stage, days_to_harvest, prediction_date, harvest_date,
      status, ai_analysis, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE yield_predictions SET grow_room_id=$1, strain=$2, predicted_yield_grams=$3,
        actual_yield_grams=$4, confidence_score=$5, environmental_factors=$6, growth_stage=$7,
        days_to_harvest=$8, prediction_date=$9, harvest_date=$10, status=$11, ai_analysis=$12,
        notes=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [grow_room_id, strain, predicted_yield_grams, actual_yield_grams, confidence_score,
       environmental_factors ? JSON.stringify(environmental_factors) : null, growth_stage,
       days_to_harvest, prediction_date, harvest_date, status, ai_analysis, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Yield prediction not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating yield prediction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/yield-predictions/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM yield_predictions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Yield prediction not found.' });
    }
    res.json({ message: 'Yield prediction deleted successfully.', prediction: result.rows[0] });
  } catch (error) {
    console.error('Error deleting yield prediction:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/yield-predictions/:id/ai-predict
router.post('/:id/ai-predict', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT yp.*, gr.name as grow_room_name, gr.temperature, gr.humidity,
        gr.co2_level, gr.light_intensity, gr.ph_level, gr.nutrient_ec, gr.vpd
       FROM yield_predictions yp
       LEFT JOIN grow_rooms gr ON yp.grow_room_id = gr.id
       WHERE yp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Yield prediction not found.' });
    }

    const prediction = result.rows[0];
    const promptString = `Based on the following data, provide a detailed cannabis yield prediction and analysis:

Prediction Record:
Strain: ${prediction.strain}
Growth Stage: ${prediction.growth_stage}
Days to Harvest: ${prediction.days_to_harvest}
Current Predicted Yield: ${prediction.predicted_yield_grams}g
Grow Room: ${prediction.grow_room_name || 'Not assigned'}

Environmental Factors:
Temperature: ${prediction.temperature || 'N/A'}°F
Humidity: ${prediction.humidity || 'N/A'}%
CO2 Level: ${prediction.co2_level || 'N/A'} ppm
Light Intensity: ${prediction.light_intensity || 'N/A'} PPFD
pH Level: ${prediction.ph_level || 'N/A'}
Nutrient EC: ${prediction.nutrient_ec || 'N/A'} mS/cm
VPD: ${prediction.vpd || 'N/A'} kPa
Additional Factors: ${JSON.stringify(prediction.environmental_factors)}
Notes: ${prediction.notes || 'None'}

Please provide:
1. Refined yield prediction (grams) with confidence percentage
2. Factors that will most impact yield
3. Optimization recommendations to maximize yield
4. Risk factors that could reduce yield
5. Comparison with typical yields for ${prediction.strain}
6. Timeline adjustments if needed
7. Quality vs quantity trade-off analysis`;

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

    await pool.query('UPDATE yield_predictions SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiContent, req.params.id]);

    res.json({ prediction: aiContent, record: prediction });
  } catch (error) {
    console.error('Error in AI yield prediction:', error);
    res.status(500).json({ error: 'Failed to generate AI yield prediction.' });
  }
});

export default router;
