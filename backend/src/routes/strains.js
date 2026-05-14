import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM strains');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM strains ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching strains:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strains WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Strain not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching strain:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, type.' });
    }

    const result = await pool.query(
      `INSERT INTO strains (name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating strain:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status } = req.body;
    const result = await pool.query(
      `UPDATE strains SET name=$1, type=$2, thc_range=$3, cbd_range=$4, flowering_time_days=$5,
       yield_potential=$6, difficulty=$7, genetics=$8, terpene_profile=$9, effects=$10,
       grow_notes=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Strain not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating strain:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM strains WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Strain not found.' });
    res.json({ message: 'Strain deleted successfully.', strain: result.rows[0] });
  } catch (error) {
    console.error('Error deleting strain:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/strains/:id/ai-profile — growth optimization recommendations for strain
router.post('/:id/ai-profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strains WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Strain not found.' });

    const strain = result.rows[0];
    const { grow_environment, target_thc, target_yield, state } = req.body;

    const promptString = `Generate detailed growth optimization recommendations for this cannabis strain. Respond in valid JSON.

Strain Profile:
- Name: ${strain.name}
- Type: ${strain.type}
- THC Range: ${strain.thc_range}
- CBD Range: ${strain.cbd_range}
- Flowering Time: ${strain.flowering_time_days} days
- Yield Potential: ${strain.yield_potential}
- Difficulty: ${strain.difficulty}
- Genetics: ${strain.genetics || 'Unknown'}
- Terpene Profile: ${strain.terpene_profile || 'Unknown'}
- Effects: ${strain.effects || 'Unknown'}
- Current Grow Notes: ${strain.grow_notes || 'None'}

Grower Targets:
- Target THC: ${target_thc || 'Not specified'}%
- Target Yield: ${target_yield || 'Not specified'} g/plant
- Grow Environment: ${grow_environment || 'Not specified'}
- State: ${state || 'Not specified'}

Return JSON with this structure:
{
  "strain_classification": {"difficulty_rating": "", "experience_level_needed": "", "commercial_viability": ""},
  "vegetative_phase": {"duration_weeks": 0, "light_schedule": "", "temperature_f": {"min": 0, "max": 0}, "humidity_percent": {"min": 0, "max": 0}, "nutrients": {"nitrogen": "", "phosphorus": "", "potassium": ""}, "training_methods": [], "tips": []},
  "flowering_phase": {"duration_weeks": 0, "light_schedule": "", "temperature_f": {"min": 0, "max": 0}, "humidity_percent": {"min": 0, "max": 0}, "nutrients": {"nitrogen": "", "phosphorus": "", "potassium": ""}, "flush_timing_weeks_before_harvest": 0, "tips": []},
  "yield_optimization": {"expected_grams_per_sqft": 0, "top_techniques": [], "common_mistakes": []},
  "thc_maximization_strategies": [],
  "terpene_preservation_tips": [],
  "pest_vulnerabilities": [],
  "clone_vs_seed_recommendation": "",
  "state_compliance_notes": "",
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
        max_tokens: 2000,
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

    res.json({ analysis, strain });
  } catch (error) {
    console.error('Error in AI strain profile:', error);
    res.status(500).json({ error: 'Failed to generate AI strain profile.' });
  }
});

export default router;
