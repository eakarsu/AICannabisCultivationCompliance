import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initDatabase } from './models/database.js';
import authRoutes from './routes/auth.js';
import growRoomsRoutes from './routes/growRooms.js';
import plantsRoutes from './routes/plants.js';
import complianceRoutes from './routes/compliance.js';
import yieldPredictionsRoutes from './routes/yieldPredictions.js';
import labTestsRoutes from './routes/labTests.js';
import dashboardRoutes from './routes/dashboard.js';
import inventoryRoutes from './routes/inventory.js';
import tasksRoutes from './routes/tasks.js';
import harvestsRoutes from './routes/harvests.js';
import strainsRoutes from './routes/strains.js';
import wasteRecordsRoutes from './routes/wasteRecords.js';
import environmentalAlertsRoutes from './routes/environmentalAlerts.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grow-rooms', growRoomsRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/yield-predictions', yieldPredictionsRoutes);
app.use('/api/lab-tests', labTestsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/harvests', harvestsRoutes);
app.use('/api/strains', strainsRoutes);
app.use('/api/waste-records', wasteRecordsRoutes);
app.use('/api/environmental-alerts', environmentalAlertsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
