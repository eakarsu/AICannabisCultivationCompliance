import express from 'express';
import fetch from 'node-fetch';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/compliance
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM compliance_records');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM compliance_records ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/compliance/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching compliance record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/compliance
router.post('/', async (req, res) => {
  try {
    const {
      state, license_type, license_number, expiry_date, status, requirements,
      last_audit_date, next_audit_date, violations, penalty_amount, inspector, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO compliance_records (state, license_type, license_number, expiry_date, status,
        requirements, last_audit_date, next_audit_date, violations, penalty_amount, inspector, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [state, license_type, license_number, expiry_date, status || 'active',
       requirements ? JSON.stringify(requirements) : null, last_audit_date, next_audit_date,
       violations || 0, penalty_amount || 0, inspector, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating compliance record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/compliance/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      state, license_type, license_number, expiry_date, status, requirements,
      last_audit_date, next_audit_date, violations, penalty_amount, inspector, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE compliance_records SET state=$1, license_type=$2, license_number=$3, expiry_date=$4,
        status=$5, requirements=$6, last_audit_date=$7, next_audit_date=$8, violations=$9,
        penalty_amount=$10, inspector=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [state, license_type, license_number, expiry_date, status,
       requirements ? JSON.stringify(requirements) : null, last_audit_date, next_audit_date,
       violations, penalty_amount, inspector, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating compliance record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/compliance/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found.' });
    }
    res.json({ message: 'Compliance record deleted successfully.', record: result.rows[0] });
  } catch (error) {
    console.error('Error deleting compliance record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/compliance/:id/ai-analyze
router.post('/:id/ai-analyze', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found.' });
    }

    const record = result.rows[0];
    const promptString = `Analyze the following cannabis compliance record and provide detailed regulatory recommendations:

Compliance Record:
State: ${record.state}
License Type: ${record.license_type}
License Number: ${record.license_number}
Expiry Date: ${record.expiry_date}
Status: ${record.status}
Requirements: ${JSON.stringify(record.requirements)}
Last Audit Date: ${record.last_audit_date}
Next Audit Date: ${record.next_audit_date}
Violations: ${record.violations}
Penalty Amount: $${record.penalty_amount}
Inspector: ${record.inspector || 'Not assigned'}
Notes: ${record.notes || 'None'}

Please provide:
1. Current compliance status assessment
2. State-specific regulatory requirements and updates for ${record.state}
3. Upcoming deadlines and action items
4. Violation remediation recommendations
5. Audit preparation checklist
6. Risk assessment and mitigation strategies
7. Best practices for maintaining compliance in ${record.state}`;

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

    await pool.query('UPDATE compliance_records SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [aiContent, req.params.id]);

    res.json({ analysis: aiContent, record });
  } catch (error) {
    console.error('Error in AI compliance analysis:', error);
    res.status(500).json({ error: 'Failed to generate AI compliance analysis.' });
  }
});

export default router;
