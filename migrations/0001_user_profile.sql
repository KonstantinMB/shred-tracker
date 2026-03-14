-- User profile — single row for all targets and settings
CREATE TABLE IF NOT EXISTS "user_profile" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL DEFAULT '',
  "start_date" text NOT NULL DEFAULT '2026-03-01',
  "start_weight" real NOT NULL DEFAULT 94,
  "goal_weight" real NOT NULL DEFAULT 84,
  "goal_months" integer NOT NULL DEFAULT 12,
  "estimated_body_fat" real,
  "calories_target" integer NOT NULL DEFAULT 2500,
  "protein_target" real NOT NULL DEFAULT 210,
  "carbs_target" real NOT NULL DEFAULT 240,
  "fat_target" real NOT NULL DEFAULT 78,
  "steps_target" integer NOT NULL DEFAULT 10000,
  "water_target" real NOT NULL DEFAULT 3,
  "sleep_target" real NOT NULL DEFAULT 8,
  "location" text DEFAULT ''
);

-- Seed default profile if empty
INSERT INTO "user_profile" (
  name, start_date, start_weight, goal_weight, goal_months,
  calories_target, protein_target, carbs_target, fat_target,
  steps_target, water_target, sleep_target, location
) SELECT
  'Konstantin', '2026-03-01', 94, 84, 12,
  2500, 210, 240, 78,
  10000, 3, 8, 'Sofia, BG'
WHERE NOT EXISTS (SELECT 1 FROM "user_profile");
