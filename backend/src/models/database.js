import pg from 'pg';
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

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'operator',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grow_rooms (
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

      CREATE TABLE IF NOT EXISTS plants (
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

      CREATE TABLE IF NOT EXISTS compliance_records (
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

      CREATE TABLE IF NOT EXISTS yield_predictions (
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

      CREATE TABLE IF NOT EXISTS lab_tests (
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

      CREATE TABLE IF NOT EXISTS inventory (
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

      CREATE TABLE IF NOT EXISTS tasks (
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

      CREATE TABLE IF NOT EXISTS harvests (
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

      CREATE TABLE IF NOT EXISTS strains (
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

      CREATE TABLE IF NOT EXISTS waste_records (
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

      CREATE TABLE IF NOT EXISTS environmental_alerts (
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

      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        feature VARCHAR(100) NOT NULL,
        input JSONB,
        output JSONB,
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
      CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);
    `);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool, initDatabase };
export default pool;
