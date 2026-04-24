import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const {
      name, category, quantity, unit, min_threshold, cost_per_unit,
      supplier, location, expiry_date, status, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO inventory (name, category, quantity, unit, min_threshold, cost_per_unit,
        supplier, location, expiry_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [name, category, quantity, unit, min_threshold, cost_per_unit,
       supplier, location, expiry_date, status || 'in-stock', notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      name, category, quantity, unit, min_threshold, cost_per_unit,
      supplier, location, expiry_date, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET name=$1, category=$2, quantity=$3, unit=$4, min_threshold=$5,
        cost_per_unit=$6, supplier=$7, location=$8, expiry_date=$9, status=$10, notes=$11,
        updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, category, quantity, unit, min_threshold, cost_per_unit,
       supplier, location, expiry_date, status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    res.json({ message: 'Inventory item deleted successfully.', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
