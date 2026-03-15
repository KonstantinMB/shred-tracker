-- Per-set data for exercise logs (reps/weight per set)
ALTER TABLE "exercise_logs" ADD COLUMN IF NOT EXISTS "sets_data" jsonb;

-- Mark workout as finished (End Workout)
ALTER TABLE "workout_logs" ADD COLUMN IF NOT EXISTS "finished_at" timestamptz;
