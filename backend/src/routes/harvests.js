import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM harvests ORDER BY created_at DESC');
    res.json(result.rows);
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

export default router;
