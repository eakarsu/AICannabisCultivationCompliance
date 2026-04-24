import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, priority, status, assigned_to, grow_room_id, due_date, completed_date, category, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, status, assigned_to, grow_room_id, due_date, completed_date, category, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, priority || 'medium', status || 'pending', assigned_to, grow_room_id, due_date, completed_date, category, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, status, assigned_to, grow_room_id, due_date, completed_date, category, notes } = req.body;
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, assigned_to=$5, grow_room_id=$6,
       due_date=$7, completed_date=$8, category=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, description, priority, status, assigned_to, grow_room_id, due_date, completed_date, category, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.', task: result.rows[0] });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
