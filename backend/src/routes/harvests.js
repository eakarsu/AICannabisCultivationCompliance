import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM harvests');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM harvests ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching harvests:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM harvests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Harvest not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching harvest:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage, quality_grade, storage_location, status, notes } = req.body;

    if (!batch_id || !strain || !harvest_date) {
      return res.status(400).json({ error: 'Missing required fields: batch_id, strain, harvest_date.' });
    }

    const result = await pool.query(
      `INSERT INTO harvests (batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage, quality_grade, storage_location, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage || 'harvested', quality_grade, storage_location, status || 'processing', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating harvest:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage, quality_grade, storage_location, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE harvests SET batch_id=$1, grow_room_id=$2, strain=$3, harvest_date=$4, wet_weight_grams=$5,
       dry_weight_grams=$6, trim_weight_grams=$7, cure_start_date=$8, cure_end_date=$9, processing_stage=$10,
       quality_grade=$11, storage_location=$12, status=$13, notes=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage, quality_grade, storage_location, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Harvest not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating harvest:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM harvests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Harvest not found.' });
    res.json({ message: 'Harvest deleted successfully.', harvest: result.rows[0] });
  } catch (error) {
    console.error('Error deleting harvest:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/harvests/:id/ai-timing — optimal harvest timing recommendation
router.post('/:id/ai-timing', async (req, res) => {
  try {
    const { trichome_status, pistil_color_percentage, environmental_readings } = req.body;

    const result = await pool.query('SELECT * FROM harvests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Harvest not found.' });

    const harvest = result.rows[0];

    const promptString = `Analyze this cannabis harvest and provide optimal timing recommendations. Respond in valid JSON.

Harvest Details:
- Strain: ${harvest.strain}
- Batch ID: ${harvest.batch_id}
- Harvest Date: ${harvest.harvest_date}
- Wet Weight: ${harvest.wet_weight_grams}g
- Dry Weight: ${harvest.dry_weight_grams ?? 'Not yet measured'}g
- Processing Stage: ${harvest.processing_stage}
- Quality Grade: ${harvest.quality_grade || 'Not graded'}
- Cure Start: ${harvest.cure_start_date || 'Not started'}
- Cure End: ${harvest.cure_end_date || 'Not scheduled'}
- Storage Location: ${harvest.storage_location || 'Unknown'}
- Status: ${harvest.status}

Visual Indicators:
- Trichome Status: ${trichome_status || 'Not observed'}
- Pistil Color (% darkened): ${pistil_color_percentage ?? 'Not observed'}%

Environmental Readings: ${environmental_readings ? JSON.stringify(environmental_readings) : 'Not provided'}
Notes: ${harvest.notes || 'None'}

Return JSON with this structure:
{
  "harvest_readiness": "Not Ready|Nearly Ready|Optimal|Past Peak",
  "readiness_score": 0-100,
  "optimal_harvest_window": {"start_days": 0, "end_days": 0, "description": ""},
  "key_indicators": [{"indicator": "", "status": "", "recommendation": ""}],
  "drying_recommendations": {"target_temp_f": 0, "target_humidity": 0, "duration_days": 0, "notes": ""},
  "curing_recommendations": {"duration_weeks": 0, "method": "", "burping_schedule": "", "target_moisture": 0},
  "quality_maximization_tips": [],
  "risks_if_delayed": "",
  "risks_if_early": "",
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
        temperature: 0.4,
        max_tokens: 1500,
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

    res.json({ analysis, harvest });
  } catch (error) {
    console.error('Error in AI harvest timing:', error);
    res.status(500).json({ error: 'Failed to generate AI harvest timing recommendation.' });
  }
});

export default router;
