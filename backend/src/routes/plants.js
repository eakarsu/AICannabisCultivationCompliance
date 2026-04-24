import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/plants
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gr.name as grow_room_name
       FROM plants p
       LEFT JOIN grow_rooms gr ON p.grow_room_id = gr.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/plants/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gr.name as grow_room_name
       FROM plants p
       LEFT JOIN grow_rooms gr ON p.grow_room_id = gr.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/plants
router.post('/', async (req, res) => {
  try {
    const {
      strain, batch_id, stage, planted_date, expected_harvest, location,
      grow_room_id, mother_plant, clone_date, status, thc_potential,
      cbd_potential, weight_grams, sale_price, sold_to, sold_date, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO plants (strain, batch_id, stage, planted_date, expected_harvest, location,
        grow_room_id, mother_plant, clone_date, status, thc_potential, cbd_potential,
        weight_grams, sale_price, sold_to, sold_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [strain, batch_id, stage, planted_date, expected_harvest, location,
       grow_room_id, mother_plant, clone_date, status || 'active', thc_potential,
       cbd_potential, weight_grams, sale_price, sold_to, sold_date, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/plants/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      strain, batch_id, stage, planted_date, expected_harvest, location,
      grow_room_id, mother_plant, clone_date, status, thc_potential,
      cbd_potential, weight_grams, sale_price, sold_to, sold_date, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE plants SET strain=$1, batch_id=$2, stage=$3, planted_date=$4, expected_harvest=$5,
        location=$6, grow_room_id=$7, mother_plant=$8, clone_date=$9, status=$10,
        thc_potential=$11, cbd_potential=$12, weight_grams=$13, sale_price=$14,
        sold_to=$15, sold_date=$16, notes=$17, updated_at=NOW()
       WHERE id=$18 RETURNING *`,
      [strain, batch_id, stage, planted_date, expected_harvest, location,
       grow_room_id, mother_plant, clone_date, status, thc_potential,
       cbd_potential, weight_grams, sale_price, sold_to, sold_date, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/plants/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM plants WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found.' });
    }
    res.json({ message: 'Plant deleted successfully.', plant: result.rows[0] });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/plants/:id/ai-track
router.post('/:id/ai-track', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gr.name as grow_room_name
       FROM plants p
       LEFT JOIN grow_rooms gr ON p.grow_room_id = gr.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found.' });
    }

    const plant = result.rows[0];
    const promptString = `Analyze the following cannabis plant's seed-to-sale journey and provide detailed tracking recommendations:

Plant Details:
Strain: ${plant.strain}
Batch ID: ${plant.batch_id}
Current Stage: ${plant.stage}
Planted Date: ${plant.planted_date}
Expected Harvest: ${plant.expected_harvest}
Location: ${plant.location}
Grow Room: ${plant.grow_room_name || 'Not assigned'}
Mother Plant: ${plant.mother_plant || 'N/A'}
Clone Date: ${plant.clone_date || 'N/A'}
Status: ${plant.status}
THC Potential: ${plant.thc_potential}%
CBD Potential: ${plant.cbd_potential}%
Weight: ${plant.weight_grams}g
Sale Price: $${plant.sale_price || 'Not set'}
Sold To: ${plant.sold_to || 'Not sold'}
Notes: ${plant.notes || 'None'}

Please provide:
1. Current stage assessment and next steps
2. Seed-to-sale compliance tracking recommendations
3. Quality optimization suggestions for this strain
4. Harvest timing recommendations
5. Post-harvest handling advice
6. Documentation and traceability recommendations
7. Any concerns or red flags in the current data`;

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

    res.json({ analysis: aiContent, plant });
  } catch (error) {
    console.error('Error in AI plant tracking:', error);
    res.status(500).json({ error: 'Failed to generate AI tracking analysis.' });
  }
});

export default router;
