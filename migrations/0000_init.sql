-- Summer Shred Tracker — Initial Schema Migration
-- Run this once in your PostgreSQL database (Neon / Supabase / Vercel Postgres)
-- Or use: npm run db:push  (requires DATABASE_URL env var)

CREATE TABLE IF NOT EXISTS "weight_logs" (
  "id"     serial PRIMARY KEY,
  "date"   text   NOT NULL,
  "weight" real   NOT NULL,
  "waist"  real,
  "notes"  text
);

CREATE TABLE IF NOT EXISTS "workout_logs" (
  "id"           serial PRIMARY KEY,
  "date"         text    NOT NULL,
  "type"         text    NOT NULL,
  "duration_min" integer NOT NULL,
  "energy_rating" integer,
  "notes"        text
);

CREATE TABLE IF NOT EXISTS "nutrition_logs" (
  "id"       serial PRIMARY KEY,
  "date"     text    NOT NULL,
  "calories" integer NOT NULL,
  "protein"  real    NOT NULL,
  "carbs"    real    NOT NULL,
  "fat"      real    NOT NULL,
  "steps"    integer,
  "water"    real,
  "sleep"    real,
  "notes"    text
);

CREATE TABLE IF NOT EXISTS "strength_logs" (
  "id"           serial PRIMARY KEY,
  "date"         text    NOT NULL,
  "bench_press"  real,
  "barbell_row"  real,
  "leg_press"    real,
  "notes"        text
);
