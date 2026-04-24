import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/grow-rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grow_rooms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching grow rooms:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/grow-rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grow_rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grow room not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching grow room:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/grow-rooms
router.post('/', async (req, res) => {
  try {
    const {
      name, strain, temperature, humidity, co2_level, light_intensity,
      light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO grow_rooms (name, strain, temperature, humidity, co2_level, light_intensity,
        light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [name, strain, temperature, humidity, co2_level, light_intensity,
       light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status || 'active', notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating grow room:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/grow-rooms/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      name, strain, temperature, humidity, co2_level, light_intensity,
      light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE grow_rooms SET name=$1, strain=$2, temperature=$3, humidity=$4, co2_level=$5,
        light_intensity=$6, light_schedule=$7, ph_level=$8, nutrient_ec=$9, water_temp=$10,
        vpd=$11, stage=$12, status=$13, notes=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [name, strain, temperature, humidity, co2_level, light_intensity,
       light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grow room not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating grow room:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/grow-rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grow_rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grow room not found.' });
    }
    res.json({ message: 'Grow room deleted successfully.', room: result.rows[0] });
  } catch (error) {
    console.error('Error deleting grow room:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/grow-rooms/:id/ai-optimize
router.post('/:id/ai-optimize', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grow_rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grow room not found.' });
    }

    const room = result.rows[0];
    const promptString = `Analyze the following cannabis grow room environmental data and provide detailed optimization recommendations:

Grow Room: ${room.name}
Strain: ${room.strain}
Growth Stage: ${room.stage}
Temperature: ${room.temperature}°F
Humidity: ${room.humidity}%
CO2 Level: ${room.co2_level} ppm
Light Intensity: ${room.light_intensity} PPFD
Light Schedule: ${room.light_schedule}
pH Level: ${room.ph_level}
Nutrient EC: ${room.nutrient_ec} mS/cm
Water Temperature: ${room.water_temp}°F
VPD: ${room.vpd} kPa
Status: ${room.status}
Notes: ${room.notes || 'None'}

Please provide specific recommendations for optimizing:
1. Temperature and humidity adjustments
2. CO2 supplementation
3. Light intensity and schedule optimization
4. pH and nutrient management
5. VPD optimization
6. Any strain-specific considerations
7. Overall environmental improvements for maximum yield and quality`;

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

    await pool.query('UPDATE grow_rooms SET ai_recommendation = $1, updated_at = NOW() WHERE id = $2', [aiContent, req.params.id]);

    res.json({ recommendation: aiContent, grow_room: room });
  } catch (error) {
    console.error('Error in AI optimization:', error);
    res.status(500).json({ error: 'Failed to generate AI optimization.' });
  }
});

export default router;
