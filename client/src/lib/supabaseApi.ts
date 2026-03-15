/**
 * Supabase-backed API — replaces the Express /api routes.
 * All CRUD goes directly to Supabase from the frontend.
 */
import { supabase, hasSupabase } from "./supabase";

export { hasSupabase };

// Map snake_case from DB to camelCase for our types
function toCamel<T>(row: Record<string, unknown> | null): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out as T;
}
function toCamelList<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => toCamel<T>(r)!).filter(Boolean);
}

// Map camelCase to snake_case for inserts/updates
function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

async function ensureSupabase() {
  if (!supabase) throw new Error("Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  return supabase;
}

// ─── Profile ─────────────────────────────────────────────────
export async function getProfile() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("user_profile").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function upsertProfile(profile: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data: existing } = await sb.from("user_profile").select("id").limit(1).maybeSingle();
  const payload = toSnake(profile);
  if (existing) {
    const { data, error } = await sb.from("user_profile").update(payload).eq("id", existing.id).select().single();
    if (error) throw new Error(error.message);
    return toCamel(data);
  }
  const { data, error } = await sb.from("user_profile").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

// ─── Weight ─────────────────────────────────────────────────
export async function getWeightLogs() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("weight_logs").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addWeightLog(log: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("weight_logs").insert(toSnake(log)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteWeightLog(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("weight_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Nutrition ───────────────────────────────────────────────
export async function getNutritionLogs() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("nutrition_logs").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addNutritionLog(log: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("nutrition_logs").insert(toSnake(log)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function updateNutritionLog(id: number, updates: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("nutrition_logs").update(toSnake(updates)).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteNutritionLog(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("nutrition_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Workouts ───────────────────────────────────────────────
export async function getWorkoutLogs() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("workout_logs").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addWorkoutLog(log: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("workout_logs").insert(toSnake(log)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function updateWorkoutLog(id: number, updates: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("workout_logs").update(toSnake(updates)).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteWorkoutLog(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("workout_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Exercises ──────────────────────────────────────────────
export async function getExercises() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("exercises").select("*").order("name");
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addExercise(exercise: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("exercises").insert(toSnake(exercise)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteExercise(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Exercise logs ──────────────────────────────────────────
export async function getExerciseLogs(workoutId?: number) {
  const sb = await ensureSupabase();
  let q = sb.from("exercise_logs").select("*").order("id");
  if (workoutId != null) q = q.eq("workout_id", workoutId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addExerciseLog(log: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("exercise_logs").insert(toSnake(log)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function updateExerciseLog(id: number, updates: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("exercise_logs").update(toSnake(updates)).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteExerciseLog(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("exercise_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Strength logs ──────────────────────────────────────────
export async function getStrengthLogs() {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("strength_logs").select("*").order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return toCamelList(data ?? []);
}

export async function addStrengthLog(log: Record<string, unknown>) {
  const sb = await ensureSupabase();
  const { data, error } = await sb.from("strength_logs").insert(toSnake(log)).select().single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function deleteStrengthLog(id: number) {
  const sb = await ensureSupabase();
  const { error } = await sb.from("strength_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
