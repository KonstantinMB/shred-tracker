-- User-defined exercises
CREATE TABLE IF NOT EXISTS "exercises" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "category" text DEFAULT 'compound',
  "unit" text NOT NULL DEFAULT 'kg'
);

-- Exercise logs (per-workout)
CREATE TABLE IF NOT EXISTS "exercise_logs" (
  "id" serial PRIMARY KEY,
  "workout_id" integer NOT NULL REFERENCES "workout_logs"("id") ON DELETE CASCADE,
  "exercise_id" integer NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "sets" integer NOT NULL DEFAULT 1,
  "reps" integer,
  "weight" real,
  "notes" text
);

-- Seed default exercises if empty
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "exercises") = 0 THEN
    INSERT INTO "exercises" (name, category, unit) VALUES
      ('Bench Press', 'compound', 'kg'),
      ('Barbell Row', 'compound', 'kg'),
      ('Leg Press', 'compound', 'kg');
  END IF;
END $$;
