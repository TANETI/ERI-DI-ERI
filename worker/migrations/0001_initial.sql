PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_meta (key, value)
VALUES ('schema_version', '1');

CREATE TABLE IF NOT EXISTS app_settings (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  adoption_date TEXT NOT NULL,
  feeding_start_date TEXT NOT NULL,
  feeding_interval_days INTEGER NOT NULL,
  feeding_time TEXT NOT NULL,
  feeding_grace_until_hour INTEGER NOT NULL,
  weight_start_date TEXT,
  weight_interval_days INTEGER NOT NULL,
  font_preset TEXT NOT NULL,
  weather_location_label TEXT,
  weather_latitude REAL,
  weather_longitude REAL,
  weather_alerts_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (
  singleton,
  adoption_date,
  feeding_start_date,
  feeding_interval_days,
  feeding_time,
  feeding_grace_until_hour,
  weight_start_date,
  weight_interval_days,
  font_preset,
  weather_location_label,
  weather_latitude,
  weather_longitude,
  weather_alerts_enabled,
  updated_at
)
VALUES (
  1,
  '2026-08-30',
  '2026-08-31',
  2,
  '21:00',
  6,
  NULL,
  7,
  'system',
  '경기도 김포시 구래동',
  37.64368,
  126.62370,
  1,
  CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feeding_schedule_periods (
  id TEXT PRIMARY KEY,
  effective_from TEXT NOT NULL,
  interval_days INTEGER NOT NULL,
  time TEXT NOT NULL,
  grace_until_hour INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feeding_schedule_effective
ON feeding_schedule_periods (effective_from);

INSERT OR IGNORE INTO feeding_schedule_periods (
  id,
  effective_from,
  interval_days,
  time,
  grace_until_hour
)
VALUES (
  'initial-feeding-2026-08-31',
  '2026-08-31',
  2,
  '21:00',
  6
);

CREATE TABLE IF NOT EXISTS weight_schedule_periods (
  id TEXT PRIMARY KEY,
  effective_from TEXT NOT NULL,
  interval_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_schedule_effective
ON weight_schedule_periods (effective_from);

CREATE TABLE IF NOT EXISTS feeding_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT,
  food TEXT NOT NULL,
  amount INTEGER,
  amount_ml REAL,
  memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_feeding_date
ON feeding_logs (date DESC);

CREATE TABLE IF NOT EXISTS weight_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight REAL NOT NULL,
  memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_weight_date
ON weight_logs (date DESC);

CREATE TABLE IF NOT EXISTS tmi_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmi_date
ON tmi_logs (date DESC);

CREATE TABLE IF NOT EXISTS preset_selections (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  group_name TEXT NOT NULL,
  label TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_preset_date
ON preset_selections (date DESC);

CREATE TABLE IF NOT EXISTS environment_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT,
  temperature REAL,
  humidity REAL,
  memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_environment_date
ON environment_logs (date DESC);

CREATE TABLE IF NOT EXISTS defecation_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  status TEXT,
  memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_defecation_date
ON defecation_logs (date DESC);

CREATE TABLE IF NOT EXISTS evaluation_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  report_start TEXT NOT NULL,
  report_end TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluation_created
ON evaluation_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS management_decisions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  evaluation_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_decision_date
ON management_decisions (date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_evaluation
ON management_decisions (evaluation_id);

-- Phase 5.3에서 R2 원본과 연결할 사진 메타데이터.
CREATE TABLE IF NOT EXISTS photo_meta (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  caption TEXT,
  is_cover INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  object_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_photo_date
ON photo_meta (date DESC, created_at DESC);
