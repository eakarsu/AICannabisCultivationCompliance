import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM waste_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waste records:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM waste_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waste record not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching waste record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO waste_records (waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating waste record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE waste_records SET waste_type=$1, source=$2, weight_grams=$3, disposal_method=$4,
       disposal_date=$5, witness=$6, batch_id=$7, manifest_number=$8, status=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waste record not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating waste record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM waste_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waste record not found.' });
    res.json({ message: 'Waste record deleted successfully.', record: result.rows[0] });
  } catch (error) {
    console.error('Error deleting waste record:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
