import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strains ORDER BY created_at DESC');
    res.json(result.rows);
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

export default router;
