import express from 'express';
import pool from '../models/database.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      growRoomsCount,
      plantsCount,
      complianceCount,
      yieldPredictionsCount,
      labTestsCount,
      activeGrowRooms,
      activePlants,
      activeCompliance,
      passedLabTests,
      failedLabTests,
      pendingLabTests,
      totalPredictedYield,
      totalActualYield,
      totalViolations,
      totalPenalties,
      plantsByStage,
      growRoomsByStage,
      recentPlants,
      recentLabTests,
      inventoryCount,
      lowStockCount,
      tasksCount,
      pendingTasksCount,
      harvestsCount,
      processingHarvestsCount,
      strainsCount,
      wasteRecordsCount,
      activeAlertsCount,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM grow_rooms'),
      pool.query('SELECT COUNT(*) FROM plants'),
      pool.query('SELECT COUNT(*) FROM compliance_records'),
      pool.query('SELECT COUNT(*) FROM yield_predictions'),
      pool.query('SELECT COUNT(*) FROM lab_tests'),
      pool.query("SELECT COUNT(*) FROM grow_rooms WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM plants WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM compliance_records WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) FROM lab_tests WHERE passed = true'),
      pool.query('SELECT COUNT(*) FROM lab_tests WHERE passed = false'),
      pool.query("SELECT COUNT(*) FROM lab_tests WHERE status = 'pending'"),
      pool.query('SELECT COALESCE(SUM(predicted_yield_grams), 0) as total FROM yield_predictions'),
      pool.query('SELECT COALESCE(SUM(actual_yield_grams), 0) as total FROM yield_predictions WHERE actual_yield_grams IS NOT NULL'),
      pool.query('SELECT COALESCE(SUM(violations), 0) as total FROM compliance_records'),
      pool.query('SELECT COALESCE(SUM(penalty_amount), 0) as total FROM compliance_records'),
      pool.query('SELECT stage, COUNT(*) as count FROM plants WHERE stage IS NOT NULL GROUP BY stage ORDER BY count DESC'),
      pool.query('SELECT stage, COUNT(*) as count FROM grow_rooms WHERE stage IS NOT NULL GROUP BY stage ORDER BY count DESC'),
      pool.query('SELECT id, strain, stage, status, created_at FROM plants ORDER BY created_at DESC LIMIT 5'),
      pool.query('SELECT id, batch_id, test_type, lab_name, status, passed, created_at FROM lab_tests ORDER BY created_at DESC LIMIT 5'),
      pool.query('SELECT COUNT(*) FROM inventory'),
      pool.query("SELECT COUNT(*) FROM inventory WHERE quantity <= min_threshold AND status = 'in-stock'"),
      pool.query('SELECT COUNT(*) FROM tasks'),
      pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'pending'"),
      pool.query('SELECT COUNT(*) FROM harvests'),
      pool.query("SELECT COUNT(*) FROM harvests WHERE status = 'processing'"),
      pool.query('SELECT COUNT(*) FROM strains'),
      pool.query('SELECT COUNT(*) FROM waste_records'),
      pool.query("SELECT COUNT(*) FROM environmental_alerts WHERE status = 'active'"),
    ]);

    res.json({
      counts: {
        grow_rooms: parseInt(growRoomsCount.rows[0].count),
        plants: parseInt(plantsCount.rows[0].count),
        compliance_records: parseInt(complianceCount.rows[0].count),
        yield_predictions: parseInt(yieldPredictionsCount.rows[0].count),
        lab_tests: parseInt(labTestsCount.rows[0].count),
      },
      active: {
        grow_rooms: parseInt(activeGrowRooms.rows[0].count),
        plants: parseInt(activePlants.rows[0].count),
        compliance_records: parseInt(activeCompliance.rows[0].count),
      },
      lab_tests_summary: {
        passed: parseInt(passedLabTests.rows[0].count),
        failed: parseInt(failedLabTests.rows[0].count),
        pending: parseInt(pendingLabTests.rows[0].count),
      },
      yield_summary: {
        total_predicted_grams: parseFloat(totalPredictedYield.rows[0].total),
        total_actual_grams: parseFloat(totalActualYield.rows[0].total),
      },
      compliance_summary: {
        total_violations: parseInt(totalViolations.rows[0].total),
        total_penalties: parseFloat(totalPenalties.rows[0].total),
      },
      plants_by_stage: plantsByStage.rows,
      grow_rooms_by_stage: growRoomsByStage.rows,
      recent_plants: recentPlants.rows,
      recent_lab_tests: recentLabTests.rows,
      inventory_summary: {
        total: parseInt(inventoryCount.rows[0].count),
        low_stock: parseInt(lowStockCount.rows[0].count),
      },
      tasks_summary: {
        total: parseInt(tasksCount.rows[0].count),
        pending: parseInt(pendingTasksCount.rows[0].count),
      },
      harvests_summary: {
        total: parseInt(harvestsCount.rows[0].count),
        processing: parseInt(processingHarvestsCount.rows[0].count),
      },
      strains_count: parseInt(strainsCount.rows[0].count),
      waste_records_count: parseInt(wasteRecordsCount.rows[0].count),
      alerts_summary: {
        active: parseInt(activeAlertsCount.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
