import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import aiNewRoutes from './routes/aiNew.js';
import webhooksRoutes from './routes/webhooks.js';
import notificationsRoutes from './routes/notifications.js';
import metrcRoutes from './routes/metrc.js';
import reportsRoutes from './routes/reports.js';
import webhookDeliveryRoutes from './routes/webhookDelivery.js';
import agentOrchestratorRoutes from './routes/agentOrchestrator.js';
import harvestReadinessRoutes from './routes/harvestReadiness.js';

import _route_metrcAgent from './routes/metrcAgent.js';
import _route_stateRegulationsRag from './routes/stateRegulationsRag.js';
import _route_iotAnomalyDetector from './routes/iotAnomalyDetector.js';
import _route_licenseConsultantSaas from './routes/licenseConsultantSaas.js';
import customViewsRoutes from './routes/customViews.js';
const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
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
app.use('/api/ai', aiNewRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/metrc', metrcRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/webhook-delivery', webhookDeliveryRoutes);
app.use('/api/agents', agentOrchestratorRoutes);
app.use('/api/harvest-readiness', harvestReadinessRoutes);
app.use('/api/custom-views', customViewsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await initDatabase();
    
app.use('/api/metrc-agent', _route_metrcAgent); // apply pass 6 — audit custom suggestion

app.use('/api/state-regs-rag', _route_stateRegulationsRag); // apply pass 6 — audit custom suggestion

app.use('/api/iot-anomaly', _route_iotAnomalyDetector); // apply pass 6 — audit custom suggestion

app.use('/api/license-consultant', _route_licenseConsultantSaas); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();


// === Batch 01 Gaps & Frontend Mounts ===
// NOTE: original block used CommonJS require() inside an ESM module, which
// crashed the process on startup (ERR_AMBIGUOUS_MODULE_SYNTAX). Commented out
// because the underlying gap_*.js files are CJS and would also need rewriting.
// app.use('/api/gap-ai-endpoints-scaffolded-but-not-mounted-under-stan', require('./routes/gap_ai_endpoints_scaffolded_but_not_mounted_under_stan'));
// app.use('/api/gap-no-vision-based-plant-disease-pest-detection-model', require('./routes/gap_no_vision_based_plant_disease_pest_detection_model'));
// app.use('/api/gap-no-ai-yield-forecasting-model-behind-yieldpredicti', require('./routes/gap_no_ai_yield_forecasting_model_behind_yieldpredicti'));
// app.use('/api/gap-no-ai-metrc-submission-drafting-layer', require('./routes/gap_no_ai_metrc_submission_drafting_layer'));
// app.use('/api/gap-notification-routes-exist-but-no-sms-push-delivery', require('./routes/gap_notification_routes_exist_but_no_sms_push_delivery'));
// app.use('/api/gap-no-native-biotrack-leaf-integration-only-metrc', require('./routes/gap_no_native_biotrack_leaf_integration_only_metrc'));
// app.use('/api/gap-no-seed-to-sale-barcode-rfid-scanning-workflow', require('./routes/gap_no_seed_to_sale_barcode_rfid_scanning_workflow'));
// app.use('/api/gap-no-multi-facility-consolidation-reporting', require('./routes/gap_no_multi_facility_consolidation_reporting'));
// app.use('/api/gap-no-iot-environmental-sensor-stream-ingestion', require('./routes/gap_no_iot_environmental_sensor_stream_ingestion'));
