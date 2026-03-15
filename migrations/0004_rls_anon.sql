-- Allow anonymous read/write for personal app (no auth).
-- For production with auth, replace with user-based RLS policies.

ALTER TABLE "user_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weight_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workout_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nutrition_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strength_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exercises" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exercise_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON "user_profile" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "weight_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "workout_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "nutrition_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "strength_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "exercises" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON "exercise_logs" FOR ALL USING (true) WITH CHECK (true);
