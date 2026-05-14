-- Migration 001: Initial Schema
-- Cannabis Cultivation Compliance Database
-- Run once against a fresh database to set up all tables and indexes.

BEGIN;

-- ─────────────────────────────────────────────
-- Migration tracking table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(50) PRIMARY KEY,
  applied_at  TIMESTAMP DEFAULT NOW()
);

-- Guard: skip if already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001') THEN
    RAISE NOTICE 'Migration 001 already applied, skipping.';
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255),
  role        VARCHAR(50)  NOT NULL DEFAULT 'operator',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────────
-- Grow Rooms
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grow_rooms (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255),
  strain           VARCHAR(255),
  temperature      NUMERIC(5,2),
  humidity         NUMERIC(5,2),
  co2_level        NUMERIC(7,2),
  light_intensity  NUMERIC(7,2),
  light_schedule   VARCHAR(50),
  ph_level         NUMERIC(4,2),
  nutrient_ec      NUMERIC(5,2),
  water_temp       NUMERIC(5,2),
  vpd              NUMERIC(5,3),
  stage            VARCHAR(100),
  status           VARCHAR(50)  NOT NULL DEFAULT 'active',
  notes            TEXT,
  ai_recommendation TEXT,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Plants
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plants (
  id                SERIAL PRIMARY KEY,
  strain            VARCHAR(255),
  batch_id          VARCHAR(255),
  stage             VARCHAR(100),
  planted_date      DATE,
  expected_harvest  DATE,
  location          VARCHAR(255),
  grow_room_id      INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
  mother_plant      VARCHAR(255),
  clone_date        DATE,
  status            VARCHAR(50)  NOT NULL DEFAULT 'active',
  thc_potential     NUMERIC(5,2),
  cbd_potential     NUMERIC(5,2),
  weight_grams      NUMERIC(10,2),
  sale_price        NUMERIC(10,2),
  sold_to           VARCHAR(255),
  sold_date         DATE,
  notes             TEXT,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plants_batch_id    ON plants(batch_id);
CREATE INDEX IF NOT EXISTS idx_plants_grow_room   ON plants(grow_room_id);
CREATE INDEX IF NOT EXISTS idx_plants_stage       ON plants(stage);
CREATE INDEX IF NOT EXISTS idx_plants_status      ON plants(status);

-- ─────────────────────────────────────────────
-- Compliance Records
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_records (
  id              SERIAL PRIMARY KEY,
  state           VARCHAR(100),
  license_type    VARCHAR(255),
  license_number  VARCHAR(255),
  expiry_date     DATE,
  status          VARCHAR(50)  NOT NULL DEFAULT 'active',
  requirements    JSONB,
  last_audit_date DATE,
  next_audit_date DATE,
  violations      INTEGER      NOT NULL DEFAULT 0,
  penalty_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  inspector       VARCHAR(255),
  notes           TEXT,
  ai_analysis     TEXT,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_state  ON compliance_records(state);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(status);

-- ─────────────────────────────────────────────
-- Yield Predictions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yield_predictions (
  id                       SERIAL PRIMARY KEY,
  grow_room_id             INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
  strain                   VARCHAR(255),
  predicted_yield_grams    NUMERIC(10,2),
  actual_yield_grams       NUMERIC(10,2),
  confidence_score         NUMERIC(5,2),
  environmental_factors    JSONB,
  growth_stage             VARCHAR(100),
  days_to_harvest          INTEGER,
  prediction_date          DATE         NOT NULL DEFAULT CURRENT_DATE,
  harvest_date             DATE,
  status                   VARCHAR(50)  NOT NULL DEFAULT 'pending',
  ai_analysis              TEXT,
  notes                    TEXT,
  created_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yield_grow_room ON yield_predictions(grow_room_id);

-- ─────────────────────────────────────────────
-- Lab Tests
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_tests (
  id                   SERIAL PRIMARY KEY,
  plant_id             INTEGER REFERENCES plants(id) ON DELETE SET NULL,
  batch_id             VARCHAR(255),
  test_type            VARCHAR(255),
  lab_name             VARCHAR(255),
  status               VARCHAR(50)  NOT NULL DEFAULT 'pending',
  thc_result           NUMERIC(5,2),
  cbd_result           NUMERIC(5,2),
  cbn_result           NUMERIC(5,2),
  terpene_profile      JSONB,
  pesticide_result     VARCHAR(255),
  heavy_metals_result  VARCHAR(255),
  microbial_result     VARCHAR(255),
  moisture_content     NUMERIC(5,2),
  passed               BOOLEAN,
  test_date            DATE,
  results_date         DATE,
  certificate_number   VARCHAR(255),
  notes                TEXT,
  ai_analysis          TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_batch_id ON lab_tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_plant_id ON lab_tests(plant_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status   ON lab_tests(status);

-- ─────────────────────────────────────────────
-- Inventory
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255)  NOT NULL,
  category       VARCHAR(100),
  quantity       NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit           VARCHAR(50),
  min_threshold  NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_per_unit  NUMERIC(10,2),
  supplier       VARCHAR(255),
  location       VARCHAR(255),
  expiry_date    DATE,
  status         VARCHAR(50)   NOT NULL DEFAULT 'in-stock',
  notes          TEXT,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Tasks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(255)  NOT NULL,
  description    TEXT,
  priority       VARCHAR(50)   NOT NULL DEFAULT 'medium',
  status         VARCHAR(50)   NOT NULL DEFAULT 'pending',
  assigned_to    VARCHAR(255),
  grow_room_id   INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
  due_date       DATE,
  completed_date DATE,
  category       VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ─────────────────────────────────────────────
-- Harvests
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvests (
  id                SERIAL PRIMARY KEY,
  batch_id          VARCHAR(255),
  grow_room_id      INTEGER REFERENCES grow_rooms(id) ON DELETE SET NULL,
  strain            VARCHAR(255),
  harvest_date      DATE,
  wet_weight_grams  NUMERIC(10,2),
  dry_weight_grams  NUMERIC(10,2),
  trim_weight_grams NUMERIC(10,2),
  cure_start_date   DATE,
  cure_end_date     DATE,
  processing_stage  VARCHAR(100)  NOT NULL DEFAULT 'harvested',
  quality_grade     VARCHAR(50),
  storage_location  VARCHAR(255),
  status            VARCHAR(50)   NOT NULL DEFAULT 'processing',
  notes             TEXT,
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harvests_batch_id ON harvests(batch_id);
CREATE INDEX IF NOT EXISTS idx_harvests_status   ON harvests(status);

-- ─────────────────────────────────────────────
-- Strains
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strains (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(255)  NOT NULL,
  type                 VARCHAR(50),
  thc_range            VARCHAR(50),
  cbd_range            VARCHAR(50),
  flowering_time_days  INTEGER,
  yield_potential      VARCHAR(100),
  difficulty           VARCHAR(50),
  genetics             VARCHAR(255),
  terpene_profile      TEXT,
  effects              TEXT,
  grow_notes           TEXT,
  status               VARCHAR(50)   NOT NULL DEFAULT 'active',
  created_at           TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Waste Records
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waste_records (
  id               SERIAL PRIMARY KEY,
  waste_type       VARCHAR(100),
  source           VARCHAR(255),
  weight_grams     NUMERIC(10,2),
  disposal_method  VARCHAR(255),
  disposal_date    DATE,
  witness          VARCHAR(255),
  batch_id         VARCHAR(255),
  manifest_number  VARCHAR(255),
  status           VARCHAR(50)   NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Environmental Alerts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS environmental_alerts (
  id               SERIAL PRIMARY KEY,
  grow_room_id     INTEGER   REFERENCES grow_rooms(id) ON DELETE CASCADE,
  parameter        VARCHAR(100),
  condition        VARCHAR(50),
  threshold_value  NUMERIC(10,3),
  current_value    NUMERIC(10,3),
  severity         VARCHAR(50)   NOT NULL DEFAULT 'warning',
  status           VARCHAR(50)   NOT NULL DEFAULT 'active',
  triggered_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  acknowledged_at  TIMESTAMP,
  resolved_at      TIMESTAMP,
  notes            TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_alerts_grow_room ON environmental_alerts(grow_room_id);
CREATE INDEX IF NOT EXISTS idx_env_alerts_status    ON environmental_alerts(status);

-- ─────────────────────────────────────────────
-- Record migration
-- ─────────────────────────────────────────────
INSERT INTO schema_migrations(version) VALUES ('001')
  ON CONFLICT (version) DO NOTHING;

COMMIT;
