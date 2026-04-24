import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { grow_room_id, parameter, condition, threshold_value, current_value, severity, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO environmental_alerts (grow_room_id, parameter, condition, threshold_value, current_value, severity, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [grow_room_id, parameter, condition, threshold_value, current_value, severity || 'warning', status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { grow_room_id, parameter, condition, threshold_value, current_value, severity, status, acknowledged_at, resolved_at, notes } = req.body;
    const result = await pool.query(
      `UPDATE environmental_alerts SET grow_room_id=$1, parameter=$2, condition=$3, threshold_value=$4,
       current_value=$5, severity=$6, status=$7, acknowledged_at=$8, resolved_at=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [grow_room_id, parameter, condition, threshold_value, current_value, severity, status, acknowledged_at, resolved_at, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM environmental_alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ message: 'Alert deleted successfully.', alert: result.rows[0] });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
