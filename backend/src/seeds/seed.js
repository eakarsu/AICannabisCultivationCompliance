import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'cannabis_compliance',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS environmental_alerts CASCADE;
      DROP TABLE IF EXISTS waste_records CASCADE;
      DROP TABLE IF EXISTS harvests CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS strains CASCADE;
      DROP TABLE IF EXISTS lab_tests CASCADE;
      DROP TABLE IF EXISTS yield_predictions CASCADE;
      DROP TABLE IF EXISTS compliance_records CASCADE;
      DROP TABLE IF EXISTS plants CASCADE;
      DROP TABLE IF EXISTS grow_rooms CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'operator',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE grow_rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        strain VARCHAR(255),
        temperature NUMERIC,
        humidity NUMERIC,
        co2_level NUMERIC,
        light_intensity NUMERIC,
        light_schedule VARCHAR(50),
        ph_level NUMERIC,
        nutrient_ec NUMERIC,
        water_temp NUMERIC,
        vpd NUMERIC,
        stage VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE plants (
        id SERIAL PRIMARY KEY,
        strain VARCHAR(255),
        batch_id VARCHAR(255),
        stage VARCHAR(100),
        planted_date DATE,
        expected_harvest DATE,
        location VARCHAR(255),
        grow_room_id INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
        mother_plant VARCHAR(255),
        clone_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        thc_potential NUMERIC,
        cbd_potential NUMERIC,
        weight_grams NUMERIC,
        sale_price NUMERIC,
        sold_to VARCHAR(255),
        sold_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE compliance_records (
        id SERIAL PRIMARY KEY,
        state VARCHAR(100),
        license_type VARCHAR(255),
        license_number VARCHAR(255),
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        requirements JSONB,
        last_audit_date DATE,
        next_audit_date DATE,
        violations INTEGER DEFAULT 0,
        penalty_amount NUMERIC DEFAULT 0,
        inspector VARCHAR(255),
        notes TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE yield_predictions (
        id SERIAL PRIMARY KEY,
        grow_room_id INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
        strain VARCHAR(255),
        predicted_yield_grams NUMERIC,
        actual_yield_grams NUMERIC,
        confidence_score NUMERIC,
        environmental_factors JSONB,
        growth_stage VARCHAR(100),
        days_to_harvest INTEGER,
        prediction_date DATE DEFAULT CURRENT_DATE,
        harvest_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        ai_analysis TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE lab_tests (
        id SERIAL PRIMARY KEY,
        plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
        batch_id VARCHAR(255),
        test_type VARCHAR(255),
        lab_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        thc_result NUMERIC,
        cbd_result NUMERIC,
        cbn_result NUMERIC,
        terpene_profile JSONB,
        pesticide_result VARCHAR(255),
        heavy_metals_result VARCHAR(255),
        microbial_result VARCHAR(255),
        moisture_content NUMERIC,
        passed BOOLEAN,
        test_date DATE,
        results_date DATE,
        certificate_number VARCHAR(255),
        notes TEXT,
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity NUMERIC DEFAULT 0,
        unit VARCHAR(50),
        min_threshold NUMERIC DEFAULT 0,
        cost_per_unit NUMERIC,
        supplier VARCHAR(255),
        location VARCHAR(255),
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'in-stock',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        grow_room_id INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
        due_date DATE,
        completed_date DATE,
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE harvests (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(255),
        grow_room_id INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
        strain VARCHAR(255),
        harvest_date DATE,
        wet_weight_grams NUMERIC,
        dry_weight_grams NUMERIC,
        trim_weight_grams NUMERIC,
        cure_start_date DATE,
        cure_end_date DATE,
        processing_stage VARCHAR(100) DEFAULT 'harvested',
        quality_grade VARCHAR(50),
        storage_location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'processing',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE strains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        thc_range VARCHAR(50),
        cbd_range VARCHAR(50),
        flowering_time_days INTEGER,
        yield_potential VARCHAR(100),
        difficulty VARCHAR(50),
        genetics VARCHAR(255),
        terpene_profile TEXT,
        effects TEXT,
        grow_notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE waste_records (
        id SERIAL PRIMARY KEY,
        waste_type VARCHAR(100),
        source VARCHAR(255),
        weight_grams NUMERIC,
        disposal_method VARCHAR(255),
        disposal_date DATE,
        witness VARCHAR(255),
        batch_id VARCHAR(255),
        manifest_number VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE environmental_alerts (
        id SERIAL PRIMARY KEY,
        grow_room_id INTEGER REFERENCES grow_rooms(id) ON DELETE CASCADE,
        parameter VARCHAR(100),
        condition VARCHAR(50),
        threshold_value NUMERIC,
        current_value NUMERIC,
        severity VARCHAR(50) DEFAULT 'warning',
        status VARCHAR(50) DEFAULT 'active',
        triggered_at TIMESTAMP DEFAULT NOW(),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed demo user
    console.log('Seeding demo user...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
      ['admin@cannabis.com', hashedPassword, 'Admin User', 'admin']
    );

    // Seed grow rooms (15)
    console.log('Seeding grow rooms...');
    await client.query(`
      INSERT INTO grow_rooms (name, strain, temperature, humidity, co2_level, light_intensity, light_schedule, ph_level, nutrient_ec, water_temp, vpd, stage, status, notes) VALUES
      ('Room A1 - Veg', 'Blue Dream', 78, 65, 1200, 600, '18/6', 6.2, 1.8, 68, 1.1, 'vegetative', 'active', 'Main vegetative room, 30 plants'),
      ('Room A2 - Flower', 'OG Kush', 75, 50, 1400, 900, '12/12', 6.0, 2.2, 67, 1.3, 'flowering', 'active', 'Week 5 of flower, heavy feeding'),
      ('Room B1 - Veg', 'Girl Scout Cookies', 77, 62, 1100, 550, '18/6', 6.3, 1.6, 69, 1.0, 'vegetative', 'active', 'Recently transplanted clones'),
      ('Room B2 - Flower', 'Sour Diesel', 74, 48, 1350, 850, '12/12', 5.9, 2.4, 66, 1.4, 'flowering', 'active', 'Week 7 of flower, flush starting'),
      ('Room C1 - Clone', 'Gelato', 80, 75, 800, 300, '18/6', 6.5, 0.8, 72, 0.7, 'clone', 'active', 'Cloning room, high humidity dome'),
      ('Room C2 - Flower', 'White Widow', 73, 45, 1500, 950, '12/12', 6.1, 2.0, 65, 1.5, 'flowering', 'active', 'Late flower, trichome check daily'),
      ('Room D1 - Veg', 'Jack Herer', 79, 60, 1250, 650, '18/6', 6.4, 1.9, 70, 1.2, 'vegetative', 'active', 'Training and topping phase'),
      ('Room D2 - Dry', 'Northern Lights', 65, 55, 400, 0, '0/24', 0, 0, 0, 0, 'drying', 'active', 'Drying room, 10-14 day hang dry'),
      ('Room E1 - Mother', 'Granddaddy Purple', 76, 58, 1000, 500, '18/6', 6.2, 1.5, 68, 1.0, 'mother', 'active', 'Mother plants for cloning stock'),
      ('Room E2 - Flower', 'Gorilla Glue #4', 74, 47, 1450, 920, '12/12', 6.0, 2.3, 66, 1.4, 'flowering', 'active', 'Heavy resin producer, week 6'),
      ('Room F1 - Seedling', 'Pineapple Express', 80, 70, 600, 250, '18/6', 6.5, 0.6, 73, 0.6, 'seedling', 'active', 'New seedlings from seed stock'),
      ('Room F2 - Flower', 'Wedding Cake', 73, 46, 1400, 880, '12/12', 5.8, 2.1, 65, 1.3, 'flowering', 'active', 'Dense colas forming, support added'),
      ('Room G1 - Cure', 'Zkittlez', 62, 60, 400, 0, '0/24', 0, 0, 0, 0, 'curing', 'active', 'Curing in glass jars, week 3'),
      ('Room G2 - Veg', 'Purple Punch', 78, 63, 1150, 580, '18/6', 6.3, 1.7, 69, 1.1, 'vegetative', 'active', 'Heavy defoliation completed'),
      ('Room H1 - Flower', 'Mimosa', 74, 49, 1350, 870, '12/12', 6.1, 2.2, 67, 1.3, 'flowering', 'inactive', 'Maintenance scheduled, room cleaning')
    `);

    // Seed plants (18)
    console.log('Seeding plants...');
    await client.query(`
      INSERT INTO plants (strain, batch_id, stage, planted_date, expected_harvest, location, grow_room_id, mother_plant, clone_date, status, thc_potential, cbd_potential, weight_grams, sale_price, sold_to, sold_date, notes) VALUES
      ('Blue Dream', 'BD-2026-001', 'vegetative', '2026-01-15', '2026-04-15', 'Room A1, Row 1', 1, 'BD-Mother-01', '2026-01-10', 'active', 21.5, 0.8, NULL, NULL, NULL, NULL, 'Strong vegetative growth, 4 weeks in'),
      ('OG Kush', 'OGK-2026-001', 'flowering', '2025-12-01', '2026-03-25', 'Room A2, Row 1', 2, 'OGK-Mother-02', '2025-11-25', 'active', 24.0, 0.3, NULL, NULL, NULL, NULL, 'Week 5 flower, pistils turning amber'),
      ('Girl Scout Cookies', 'GSC-2026-001', 'vegetative', '2026-02-01', '2026-05-01', 'Room B1, Row 1', 3, 'GSC-Mother-01', '2026-01-28', 'active', 25.0, 1.0, NULL, NULL, NULL, NULL, 'Recently topped, responding well'),
      ('Sour Diesel', 'SD-2026-001', 'flowering', '2025-11-15', '2026-03-15', 'Room B2, Row 2', 4, 'SD-Mother-03', '2025-11-10', 'active', 22.0, 0.5, NULL, NULL, NULL, NULL, 'Flush started, 2 weeks to harvest'),
      ('Gelato', 'GEL-2026-001', 'clone', '2026-02-20', '2026-06-01', 'Room C1, Tray 1', 5, 'GEL-Mother-01', '2026-02-20', 'active', 23.5, 0.6, NULL, NULL, NULL, NULL, 'Roots visible after 10 days'),
      ('White Widow', 'WW-2026-001', 'flowering', '2025-11-01', '2026-03-10', 'Room C2, Row 1', 6, 'WW-Mother-02', '2025-10-25', 'active', 20.0, 1.2, NULL, NULL, NULL, NULL, 'Heavy trichome coverage, almost ready'),
      ('Jack Herer', 'JH-2026-001', 'vegetative', '2026-01-20', '2026-04-20', 'Room D1, Row 1', 7, 'JH-Mother-01', '2026-01-15', 'active', 23.0, 0.4, NULL, NULL, NULL, NULL, 'LST training applied, branching well'),
      ('Northern Lights', 'NL-2025-012', 'drying', '2025-09-15', '2026-01-15', 'Room D2, Rack 1', 8, 'NL-Mother-04', '2025-09-10', 'harvested', 18.5, 0.9, 485, NULL, NULL, NULL, 'Harvested and hung to dry'),
      ('Granddaddy Purple', 'GDP-2026-001', 'mother', '2025-06-01', NULL, 'Room E1, Pot 1', 9, NULL, NULL, 'active', 20.5, 0.7, NULL, NULL, NULL, NULL, 'Mother plant, 8 months old, heavy producer'),
      ('Gorilla Glue #4', 'GG4-2026-001', 'flowering', '2025-12-10', '2026-04-01', 'Room E2, Row 1', 10, 'GG4-Mother-01', '2025-12-05', 'active', 28.0, 0.1, NULL, NULL, NULL, NULL, 'Extremely sticky, heavy resin'),
      ('Pineapple Express', 'PE-2026-001', 'seedling', '2026-02-25', '2026-06-15', 'Room F1, Tray 2', 11, NULL, NULL, 'active', 19.0, 0.5, NULL, NULL, NULL, NULL, 'From feminized seeds, day 22'),
      ('Wedding Cake', 'WC-2026-001', 'flowering', '2025-12-15', '2026-04-05', 'Room F2, Row 2', 12, 'WC-Mother-02', '2025-12-10', 'active', 25.5, 0.3, NULL, NULL, NULL, NULL, 'Beautiful purple hues appearing'),
      ('Zkittlez', 'ZK-2025-008', 'curing', '2025-08-20', '2025-12-20', 'Room G1, Jar Rack', 13, 'ZK-Mother-01', '2025-08-15', 'curing', 22.0, 0.4, 520, NULL, NULL, NULL, 'Week 3 of cure, burping daily'),
      ('Purple Punch', 'PP-2026-001', 'vegetative', '2026-01-28', '2026-04-28', 'Room G2, Row 1', 14, 'PP-Mother-03', '2026-01-23', 'active', 21.0, 0.6, NULL, NULL, NULL, NULL, 'Defoliation done, recovery looks good'),
      ('Blue Dream', 'BD-2025-015', 'sold', '2025-06-01', '2025-10-01', 'Vault', NULL, 'BD-Mother-01', '2025-05-25', 'sold', 21.5, 0.8, 450, 3150.00, 'Green Leaf Dispensary', '2025-11-15', 'Sold after passing all lab tests'),
      ('OG Kush', 'OGK-2025-010', 'sold', '2025-07-10', '2025-11-10', 'Vault', NULL, 'OGK-Mother-02', '2025-07-05', 'sold', 24.0, 0.3, 380, 3040.00, 'Mountain High Collective', '2025-12-20', 'Premium grade, top shelf product'),
      ('Mimosa', 'MIM-2026-001', 'flowering', '2025-12-20', '2026-04-10', 'Room H1, Row 1', 15, 'MIM-Mother-01', '2025-12-15', 'active', 22.5, 0.4, NULL, NULL, NULL, NULL, 'Citrus aroma developing nicely'),
      ('Gelato', 'GEL-2025-009', 'sold', '2025-05-15', '2025-09-15', 'Vault', NULL, 'GEL-Mother-01', '2025-05-10', 'sold', 23.5, 0.6, 410, 3280.00, 'Cali Buds Co-op', '2025-10-30', 'Excellent terp profile, premium pricing')
    `);

    // Seed compliance records (16)
    console.log('Seeding compliance records...');
    await client.query(`
      INSERT INTO compliance_records (state, license_type, license_number, expiry_date, status, requirements, last_audit_date, next_audit_date, violations, penalty_amount, inspector, notes) VALUES
      ('Colorado', 'Cultivation', 'CO-CUL-2024-1847', '2026-12-31', 'active', '{"seed_to_sale_tracking": true, "video_surveillance": true, "waste_disposal": true, "visitor_log": true, "inventory_reconciliation": "monthly"}', '2025-09-15', '2026-03-15', 0, 0, 'James Rodriguez', 'All systems compliant, zero violations'),
      ('California', 'Cultivation - Type 3', 'CA-CUL3-2024-9283', '2026-06-30', 'active', '{"track_and_trace": "METRC", "water_usage_reporting": true, "pesticide_restrictions": true, "environmental_impact": true, "labor_compliance": true}', '2025-11-01', '2026-05-01', 1, 2500, 'Maria Santos', 'Minor labeling violation corrected'),
      ('Oregon', 'Producer - Tier II', 'OR-PRD2-2024-5561', '2026-09-30', 'active', '{"cts_tracking": true, "energy_reporting": true, "waste_management": true, "security_plan": true, "employee_training": true}', '2025-08-20', '2026-02-20', 0, 0, 'Tom Williams', 'Exemplary compliance record'),
      ('Washington', 'Producer/Processor', 'WA-PP-2024-7734', '2026-08-31', 'active', '{"traceability": "LEAF", "quality_assurance": true, "security_requirements": true, "transportation_manifest": true}', '2025-10-10', '2026-04-10', 2, 5000, 'Sarah Chen', 'Two minor violations: signage and record keeping'),
      ('Michigan', 'Class C Grower', 'MI-GRC-2024-3321', '2026-11-30', 'active', '{"metrc_tracking": true, "facility_security": true, "product_safety": true, "waste_disposal": true, "employee_background_checks": true}', '2025-12-05', '2026-06-05', 0, 0, 'David Kim', 'New license, first audit passed'),
      ('Nevada', 'Cultivation', 'NV-CUL-2024-8892', '2026-07-31', 'active', '{"seed_to_sale": "METRC", "security_cameras": true, "testing_requirements": true, "packaging_standards": true}', '2025-07-15', '2026-01-15', 1, 1500, 'Robert Garcia', 'Camera system upgraded after finding'),
      ('Massachusetts', 'Cultivation', 'MA-CUL-2024-4456', '2026-10-31', 'active', '{"seed_to_sale": "METRC", "energy_efficiency": true, "community_impact": true, "diversity_plan": true}', '2025-09-01', '2026-03-01', 0, 0, 'Emily Brown', 'Excellent community engagement score'),
      ('Illinois', 'Cultivation Center', 'IL-CC-2024-2278', '2026-05-31', 'active', '{"biotrack_thc": true, "security_plan": true, "sanitation_standards": true, "recall_procedures": true}', '2025-10-20', '2026-04-20', 3, 7500, 'Michael Johnson', 'Multiple violations being remediated'),
      ('Arizona', 'Cultivation', 'AZ-CUL-2024-6613', '2026-12-31', 'active', '{"seed_to_sale_tracking": true, "water_conservation": true, "pesticide_compliance": true, "product_testing": true}', '2025-11-15', '2026-05-15', 0, 0, 'Lisa Martinez', 'Water conservation program commended'),
      ('Maine', 'Cultivation - Tier 3', 'ME-CUL3-2024-1190', '2026-08-31', 'active', '{"metrc_tracking": true, "facility_requirements": true, "testing_protocols": true, "waste_management": true}', '2025-06-30', '2025-12-30', 1, 1000, 'Chris Taylor', 'Minor waste documentation issue'),
      ('Oklahoma', 'Commercial Grower', 'OK-CG-2024-5547', '2026-04-30', 'warning', '{"seed_to_sale": "METRC", "security_requirements": true, "testing_compliance": true, "inventory_tracking": true}', '2025-08-10', '2026-02-10', 2, 3500, 'Jennifer White', 'Warning status due to testing delays'),
      ('Montana', 'Cultivation', 'MT-CUL-2024-3378', '2026-09-30', 'active', '{"seed_to_sale": true, "security_plan": true, "employee_training": true, "product_testing": true}', '2025-07-22', '2026-01-22', 0, 0, 'Mark Anderson', 'Small operation, fully compliant'),
      ('Missouri', 'Cultivation', 'MO-CUL-2024-9901', '2026-06-30', 'active', '{"metrc_tracking": true, "facility_security": true, "product_safety": true, "labeling_requirements": true}', '2025-12-01', '2026-06-01', 0, 0, 'Rachel Green', 'First year of operations, excellent start'),
      ('Vermont', 'Cultivation - Tier 2', 'VT-CUL2-2024-2245', '2026-11-30', 'active', '{"tracking_system": true, "environmental_compliance": true, "organic_certification": true, "water_testing": true}', '2025-10-05', '2026-04-05', 0, 0, 'Brian Wilson', 'Pursuing organic certification'),
      ('New Mexico', 'Producer', 'NM-PRD-2024-7789', '2026-03-31', 'expiring', '{"seed_to_sale": "BioTrack", "security_requirements": true, "testing_standards": true, "packaging_compliance": true}', '2025-09-25', '2026-03-25', 1, 2000, 'Ana Lopez', 'License renewal pending, minor violation resolved'),
      ('Connecticut', 'Cultivation', 'CT-CUL-2024-1123', '2026-10-31', 'active', '{"tracking_system": true, "facility_standards": true, "quality_assurance": true, "employee_training": true}', '2025-11-10', '2026-05-10', 0, 0, 'Kevin Murphy', 'Model facility, used for training tours')
    `);

    // Seed yield predictions (16)
    console.log('Seeding yield predictions...');
    await client.query(`
      INSERT INTO yield_predictions (grow_room_id, strain, predicted_yield_grams, actual_yield_grams, confidence_score, environmental_factors, growth_stage, days_to_harvest, prediction_date, harvest_date, status, notes) VALUES
      (1, 'Blue Dream', 550, NULL, 82, '{"avg_temp": 78, "avg_humidity": 65, "co2_avg": 1200, "light_ppfd": 600}', 'vegetative', 60, '2026-02-15', NULL, 'pending', 'Strong growth indicators, expect above average yield'),
      (2, 'OG Kush', 480, NULL, 78, '{"avg_temp": 75, "avg_humidity": 50, "co2_avg": 1400, "light_ppfd": 900}', 'flowering', 25, '2026-01-20', NULL, 'pending', 'Dense bud formation, on track'),
      (3, 'Girl Scout Cookies', 520, NULL, 75, '{"avg_temp": 77, "avg_humidity": 62, "co2_avg": 1100, "light_ppfd": 550}', 'vegetative', 75, '2026-02-10', NULL, 'pending', 'Early stage prediction, may adjust'),
      (4, 'Sour Diesel', 460, NULL, 88, '{"avg_temp": 74, "avg_humidity": 48, "co2_avg": 1350, "light_ppfd": 850}', 'flowering', 14, '2026-01-15', NULL, 'pending', 'Near harvest, high confidence'),
      (6, 'White Widow', 500, NULL, 90, '{"avg_temp": 73, "avg_humidity": 45, "co2_avg": 1500, "light_ppfd": 950}', 'flowering', 10, '2026-01-10', NULL, 'pending', 'Almost harvest ready, trichomes milky'),
      (7, 'Jack Herer', 530, NULL, 70, '{"avg_temp": 79, "avg_humidity": 60, "co2_avg": 1250, "light_ppfd": 650}', 'vegetative', 70, '2026-02-05', NULL, 'pending', 'Good structure, needs more time to assess'),
      (8, 'Northern Lights', 490, 485, 85, '{"avg_temp": 74, "avg_humidity": 52, "co2_avg": 1300, "light_ppfd": 880}', 'harvested', 0, '2025-12-01', '2026-01-15', 'completed', 'Prediction was within 1% of actual'),
      (10, 'Gorilla Glue #4', 600, NULL, 80, '{"avg_temp": 74, "avg_humidity": 47, "co2_avg": 1450, "light_ppfd": 920}', 'flowering', 30, '2026-02-01', NULL, 'pending', 'Heavy yielder, resin production exceptional'),
      (12, 'Wedding Cake', 470, NULL, 77, '{"avg_temp": 73, "avg_humidity": 46, "co2_avg": 1400, "light_ppfd": 880}', 'flowering', 28, '2026-02-05', NULL, 'pending', 'Dense cola formation, moderate yield expected'),
      (13, 'Zkittlez', 510, 520, 83, '{"avg_temp": 75, "avg_humidity": 50, "co2_avg": 1350, "light_ppfd": 870}', 'harvested', 0, '2025-11-01', '2025-12-20', 'completed', 'Exceeded prediction by 2%'),
      (14, 'Purple Punch', 490, NULL, 72, '{"avg_temp": 78, "avg_humidity": 63, "co2_avg": 1150, "light_ppfd": 580}', 'vegetative', 65, '2026-02-15', NULL, 'pending', 'Moderate yield strain, good quality'),
      (15, 'Mimosa', 540, NULL, 76, '{"avg_temp": 74, "avg_humidity": 49, "co2_avg": 1350, "light_ppfd": 870}', 'flowering', 35, '2026-02-10', NULL, 'pending', 'Sativa-leaning, may need extended flower'),
      (1, 'Blue Dream', 520, 510, 80, '{"avg_temp": 77, "avg_humidity": 63, "co2_avg": 1180, "light_ppfd": 590}', 'harvested', 0, '2025-07-01', '2025-10-01', 'completed', 'Previous cycle harvest data'),
      (2, 'OG Kush', 450, 380, 75, '{"avg_temp": 76, "avg_humidity": 52, "co2_avg": 1380, "light_ppfd": 880}', 'harvested', 0, '2025-08-01', '2025-11-10', 'completed', 'Below prediction due to nutrient lockout'),
      (5, 'Gelato', 480, NULL, 60, '{"avg_temp": 80, "avg_humidity": 75, "co2_avg": 800, "light_ppfd": 300}', 'clone', 100, '2026-02-25', NULL, 'pending', 'Very early stage, low confidence'),
      (11, 'Pineapple Express', 440, NULL, 55, '{"avg_temp": 80, "avg_humidity": 70, "co2_avg": 600, "light_ppfd": 250}', 'seedling', 110, '2026-03-01', NULL, 'pending', 'Seedling stage, preliminary estimate only')
    `);

    // Seed lab tests (16)
    console.log('Seeding lab tests...');
    await client.query(`
      INSERT INTO lab_tests (plant_id, batch_id, test_type, lab_name, status, thc_result, cbd_result, cbn_result, terpene_profile, pesticide_result, heavy_metals_result, microbial_result, moisture_content, passed, test_date, results_date, certificate_number, notes) VALUES
      (8, 'NL-2025-012', 'Full Panel', 'CannaSafe Analytics', 'completed', 18.2, 0.85, 0.12, '{"myrcene": 0.45, "limonene": 0.32, "caryophyllene": 0.28, "linalool": 0.15, "pinene": 0.10}', 'Pass', 'Pass', 'Pass', 10.5, true, '2026-01-20', '2026-01-25', 'CS-2026-NL-0012', 'All tests passed, premium quality flower'),
      (15, 'BD-2025-015', 'Full Panel', 'Steep Hill Laboratory', 'completed', 21.3, 0.78, 0.08, '{"myrcene": 0.55, "limonene": 0.41, "caryophyllene": 0.22, "terpinolene": 0.18, "ocimene": 0.12}', 'Pass', 'Pass', 'Pass', 9.8, true, '2025-10-15', '2025-10-20', 'SH-2025-BD-0415', 'Excellent terpene profile, high THC'),
      (16, 'OGK-2025-010', 'Full Panel', 'SC Labs', 'completed', 23.8, 0.31, 0.05, '{"myrcene": 0.62, "limonene": 0.38, "caryophyllene": 0.35, "humulene": 0.14, "linalool": 0.11}', 'Pass', 'Pass', 'Pass', 11.2, true, '2025-11-25', '2025-11-30', 'SCL-2025-OGK-0710', 'Top shelf OG Kush, all clear'),
      (18, 'GEL-2025-009', 'Full Panel', 'Kaycha Labs', 'completed', 23.1, 0.55, 0.09, '{"limonene": 0.48, "caryophyllene": 0.35, "myrcene": 0.30, "linalool": 0.22, "humulene": 0.15}', 'Pass', 'Pass', 'Pass', 10.1, true, '2025-10-10', '2025-10-16', 'KL-2025-GEL-0309', 'Dessert-like terpene profile, premium grade'),
      (13, 'ZK-2025-008', 'Full Panel', 'Anresco Laboratories', 'completed', 21.8, 0.42, 0.07, '{"limonene": 0.52, "linalool": 0.38, "caryophyllene": 0.25, "myrcene": 0.20, "humulene": 0.12}', 'Pass', 'Pass', 'Pass', 10.8, true, '2025-12-28', '2026-01-03', 'AN-2025-ZK-0808', 'Fruity terpene profile as expected'),
      (2, 'OGK-2026-001', 'Potency', 'CannaSafe Analytics', 'completed', 24.5, 0.28, 0.04, '{"myrcene": 0.58, "limonene": 0.35, "caryophyllene": 0.32}', NULL, NULL, NULL, NULL, NULL, '2026-02-28', '2026-03-05', 'CS-2026-OGK-0201', 'Potency test only, full panel pending'),
      (1, 'BD-2026-001', 'Potency', 'Steep Hill Laboratory', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-10', NULL, NULL, 'Sample submitted, awaiting results'),
      (4, 'SD-2026-001', 'Full Panel', 'SC Labs', 'in_progress', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-05', NULL, NULL, 'Testing in progress, expect results in 5 days'),
      (6, 'WW-2026-001', 'Full Panel', 'Kaycha Labs', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-12', NULL, NULL, 'Pre-harvest sample submitted'),
      (10, 'GG4-2026-001', 'Potency', 'Anresco Laboratories', 'completed', 27.5, 0.12, 0.03, '{"caryophyllene": 0.65, "limonene": 0.42, "myrcene": 0.38, "humulene": 0.20}', NULL, NULL, NULL, NULL, NULL, '2026-02-20', '2026-02-25', 'AN-2026-GG4-0101', 'Exceptionally high THC, GG4 living up to name'),
      (12, 'WC-2026-001', 'Terpene Analysis', 'CannaSafe Analytics', 'completed', NULL, NULL, NULL, '{"limonene": 0.55, "caryophyllene": 0.42, "myrcene": 0.35, "linalool": 0.28, "humulene": 0.18, "pinene": 0.12}', NULL, NULL, NULL, NULL, NULL, '2026-02-15', '2026-02-18', 'CS-2026-WC-TERP01', 'Rich terpene profile, gas and cake notes'),
      (3, 'GSC-2026-001', 'Pesticide Screen', 'SC Labs', 'completed', NULL, NULL, NULL, NULL, 'Pass', NULL, NULL, NULL, true, '2026-02-25', '2026-03-01', 'SCL-2026-GSC-PST01', 'Clean pesticide screen, organic growing practices'),
      (7, 'JH-2026-001', 'Heavy Metals', 'Steep Hill Laboratory', 'completed', NULL, NULL, NULL, NULL, NULL, 'Pass', NULL, NULL, true, '2026-02-10', '2026-02-15', 'SH-2026-JH-HM01', 'All heavy metals below detectable limits'),
      (11, 'PE-2026-001', 'Microbial Screen', 'Kaycha Labs', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-15', NULL, NULL, 'Routine microbial screening for seedling batch'),
      (17, 'MIM-2026-001', 'Potency', 'Anresco Laboratories', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18', NULL, NULL, 'Mid-flower potency check submitted'),
      (9, 'GDP-2026-001', 'Full Panel', 'CannaSafe Analytics', 'completed', 20.2, 0.68, 0.10, '{"myrcene": 0.50, "caryophyllene": 0.30, "pinene": 0.25, "linalool": 0.20, "humulene": 0.15}', 'Pass', 'Pass', 'Pass', 11.0, true, '2026-01-05', '2026-01-10', 'CS-2026-GDP-0101', 'Mother plant cutting test, excellent genetics confirmed')
    `);

    // Seed inventory
    console.log('Seeding inventory...');
    await client.query(`
      INSERT INTO inventory (name, category, quantity, unit, min_threshold, cost_per_unit, supplier, location, expiry_date, status, notes) VALUES
      ('General Hydroponics Flora Series', 'nutrients', 12, 'bottles', 3, 15.99, 'General Hydroponics', 'Storage Room A', '2027-06-15', 'in-stock', 'Three-part nutrient system for all growth stages'),
      ('Rockwool Cubes 1.5 inch', 'growing-media', 200, 'cubes', 50, 0.25, 'Grodan', 'Storage Room B', NULL, 'in-stock', 'Starter cubes for cloning and germination'),
      ('pH Down Solution', 'ph-control', 2, 'gallons', 1, 12.99, 'General Hydroponics', 'Storage Room A', '2027-12-01', 'in-stock', 'Phosphoric acid solution for pH adjustment'),
      ('Pruning Shears - Fiskars', 'tools', 5, 'units', 2, 24.99, 'Fiskars', 'Tool Shed', NULL, 'in-stock', 'Spring-loaded bypass pruners'),
      ('CalMag Supplement', 'nutrients', 1, 'gallons', 2, 18.50, 'Botanicare', 'Storage Room A', '2027-03-01', 'low-stock', 'Calcium-magnesium supplement, need to reorder'),
      ('Mylar Reflective Film', 'equipment', 3, 'rolls', 1, 32.00, 'HTG Supply', 'Storage Room B', NULL, 'in-stock', '25ft rolls for grow room walls'),
      ('Neem Oil Concentrate', 'ph-control', 0, 'bottles', 1, 14.99, 'Safer Brand', 'Storage Room A', '2026-09-01', 'out-of-stock', 'Organic pest prevention - needs reorder'),
      ('Turkey Bags - Large', 'packaging', 500, 'bags', 100, 0.15, 'Reynolds', 'Packaging Area', NULL, 'in-stock', 'For curing and storage')
    `);

    // Seed tasks
    console.log('Seeding tasks...');
    await client.query(`
      INSERT INTO tasks (title, description, priority, status, assigned_to, grow_room_id, due_date, completed_date, category, notes) VALUES
      ('Check pH levels in all rooms', 'Measure and record pH levels in all active grow rooms. Adjust if outside 5.8-6.5 range.', 'high', 'pending', 'Mike Torres', 1, '2026-03-22', NULL, 'inspection', 'Weekly pH check - bring calibration solution'),
      ('Transplant seedlings to Room B', 'Move 20 seedlings from propagation to Room B2. Prepare rockwool slabs.', 'medium', 'in-progress', 'Sarah Kim', 5, '2026-03-23', NULL, 'maintenance', 'Seedlings are 2 weeks old, ready for transplant'),
      ('Order CalMag supplement', 'Current stock is low. Order 4 gallons from Botanicare.', 'low', 'completed', 'Admin User', NULL, '2026-03-18', '2026-03-17', 'other', 'Ordered via usual supplier account'),
      ('Inspect pest traps Room A1', 'Check sticky traps and replace if needed. Look for fungus gnats.', 'medium', 'pending', 'Mike Torres', 1, '2026-03-24', NULL, 'inspection', 'Monthly pest monitoring'),
      ('Flush nutrients - OG Kush', 'Begin 2-week flush before harvest. Switch to plain pH water.', 'urgent', 'pending', 'Sarah Kim', 2, '2026-03-21', NULL, 'feeding', 'OG Kush is 2 weeks from harvest'),
      ('Clean and sanitize Room C3', 'Full room cleaning between cycles. Bleach solution for surfaces.', 'medium', 'pending', 'Jake Wilson', 9, '2026-03-25', NULL, 'cleaning', 'Room is empty after last harvest'),
      ('Install new CO2 controller', 'Replace malfunctioning CO2 controller in Room D1. New unit arrived.', 'high', 'in-progress', 'Jake Wilson', 10, '2026-03-22', NULL, 'maintenance', 'Autopilot APCEM2 controller')
    `);

    // Seed harvests
    console.log('Seeding harvests...');
    await client.query(`
      INSERT INTO harvests (batch_id, grow_room_id, strain, harvest_date, wet_weight_grams, dry_weight_grams, trim_weight_grams, cure_start_date, cure_end_date, processing_stage, quality_grade, storage_location, status, notes) VALUES
      ('HARV-2026-001', 8, 'Northern Lights', '2026-01-15', 2500, 625, 180, '2026-01-22', '2026-02-22', 'cured', 'A', 'Vault A - Shelf 3', 'completed', 'Excellent trichome coverage, dense buds'),
      ('HARV-2026-002', 2, 'OG Kush', '2026-02-10', 1800, 450, 130, '2026-02-17', NULL, 'curing', 'A+', 'Cure Room 1', 'processing', 'Premium quality, gas terps developing nicely in cure'),
      ('HARV-2025-015', 13, 'Zkittlez', '2025-12-20', 2100, 520, 150, '2025-12-27', '2026-01-27', 'packaged', 'A', 'Vault B - Shelf 1', 'completed', 'Fruity aroma, sold to dispensary'),
      ('HARV-2026-003', 4, 'Sour Diesel', '2026-03-05', 2200, NULL, NULL, NULL, NULL, 'drying', NULL, 'Dry Room 2', 'processing', 'Just harvested, hanging to dry for 10-14 days'),
      ('HARV-2026-004', 6, 'White Widow', '2026-03-10', 1950, NULL, NULL, NULL, NULL, 'drying', NULL, 'Dry Room 1', 'processing', 'Frosty buds, expecting good dry weight')
    `);

    // Seed strains
    console.log('Seeding strains...');
    await client.query(`
      INSERT INTO strains (name, type, thc_range, cbd_range, flowering_time_days, yield_potential, difficulty, genetics, terpene_profile, effects, grow_notes, status) VALUES
      ('Blue Dream', 'sativa-dominant', '17-24%', '0.1-0.2%', 65, 'High - 500-600g/m2', 'easy', 'Blueberry x Haze', 'Myrcene, Caryophyllene, Pinene, Limonene', 'Relaxed, euphoric, creative, uplifting', 'Very forgiving strain, great for beginners. Responds well to LST and SCROG. Watch for stretch in early flower.', 'active'),
      ('OG Kush', 'indica-dominant', '20-25%', '0.2-0.3%', 56, 'Moderate - 400-500g/m2', 'moderate', 'Chemdawg x Lemon Thai x Hindu Kush', 'Myrcene, Limonene, Caryophyllene', 'Relaxed, happy, euphoric, hungry', 'Sensitive to overfeeding. Keep EC below 1.8 in flower. Prefers lower humidity in late flower to prevent bud rot.', 'active'),
      ('Girl Scout Cookies', 'hybrid', '25-28%', '0.1%', 63, 'Moderate - 350-450g/m2', 'hard', 'OG Kush x Durban Poison', 'Caryophyllene, Limonene, Humulene', 'Euphoric, happy, relaxed, creative', 'Needs heavy defoliation. Multiple phenotypes - select for cookie smell. Heavy feeder in flower.', 'active'),
      ('Northern Lights', 'indica', '16-21%', '0.1%', 48, 'Moderate - 400-500g/m2', 'easy', 'Afghani landrace', 'Myrcene, Caryophyllene, Pinene', 'Relaxed, sleepy, happy, euphoric', 'Classic easy-grow indica. Short flowering time. Compact plant, great for SOG. Very resinous.', 'active'),
      ('Sour Diesel', 'sativa-dominant', '20-25%', '0.2%', 70, 'High - 500-600g/m2', 'moderate', 'Chemdawg 91 x Super Skunk', 'Caryophyllene, Myrcene, Limonene', 'Energetic, happy, uplifting, creative', 'Tall stretchy plant, needs height management. Long flower time but worth it. Strong diesel aroma.', 'active'),
      ('Gelato', 'hybrid', '20-25%', '0.1%', 58, 'Moderate - 400-500g/m2', 'moderate', 'Sunset Sherbet x Thin Mint GSC', 'Limonene, Caryophyllene, Myrcene, Linalool', 'Relaxed, happy, euphoric, uplifting', 'Beautiful purple coloring with cool night temps. Dense buds prone to mold - keep airflow high.', 'active')
    `);

    // Seed waste records
    console.log('Seeding waste records...');
    await client.query(`
      INSERT INTO waste_records (waste_type, source, weight_grams, disposal_method, disposal_date, witness, batch_id, manifest_number, status, notes) VALUES
      ('plant-waste', 'Grow Room A1 - Blue Dream', 500, 'composting', '2026-03-10', 'Mike Torres', 'BD-2026-001', 'WM-2026-0045', 'documented', 'Fan leaves and lower branch trim from defoliation'),
      ('trim', 'Harvest HARV-2026-001', 180, 'composting', '2026-01-20', 'Sarah Kim', 'HARV-2026-001', 'WM-2026-0032', 'documented', 'Sugar leaf trim from Northern Lights harvest'),
      ('stems', 'Grow Room C3 cleanup', 350, 'disposal-facility', '2026-03-15', 'Jake Wilson', NULL, 'WM-2026-0051', 'disposed', 'End of cycle stem waste, sent to licensed facility'),
      ('soil', 'Room B2 media change', 5000, 'composting', '2026-02-28', 'Mike Torres', NULL, 'WM-2026-0040', 'documented', 'Used coco coir from previous grow cycle'),
      ('chemical', 'Storage Room A', 250, 'disposal-facility', NULL, NULL, NULL, NULL, 'pending', 'Expired pH calibration solutions, awaiting pickup')
    `);

    // Seed environmental alerts
    console.log('Seeding environmental alerts...');
    await client.query(`
      INSERT INTO environmental_alerts (grow_room_id, parameter, condition, threshold_value, current_value, severity, status, notes) VALUES
      (1, 'temperature', 'above', 82, 85, 'warning', 'active', 'Room A1 temperature rising above optimal range. Check HVAC.'),
      (5, 'humidity', 'below', 40, 35, 'critical', 'active', 'Room B2 humidity critically low. Humidifier may be malfunctioning.'),
      (2, 'co2', 'above', 1600, 1650, 'warning', 'acknowledged', 'CO2 slightly elevated in Room A2. Controller adjusted.'),
      (10, 'ph', 'above', 6.8, 7.1, 'critical', 'active', 'pH drifting high in Room D1 reservoir. Needs immediate attention.'),
      (3, 'temperature', 'below', 68, 65, 'info', 'resolved', 'Brief temperature dip overnight in Room A3. Heater kicked in.')
    `);

    console.log('Seed completed successfully!');
    console.log('Demo user: admin@cannabis.com / password123');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
