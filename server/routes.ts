import type { Express } from "express";
import { Server } from "http";
import { storage as memStorage, PgStorage } from "./storage";
import {
  insertUserProfileSchema, insertWeightLogSchema, insertWorkoutLogSchema,
  insertNutritionLogSchema, insertStrengthLogSchema,
  insertExerciseSchema, insertExerciseLogSchema,
} from "@shared/schema";
import type { IStorage } from "./storage";

// Use PostgreSQL when DATABASE_URL is set, otherwise use in-memory storage
let _storage: IStorage | null = null;
function getStorage(): IStorage {
  if (!_storage) {
    _storage = process.env.DATABASE_URL ? new PgStorage() : memStorage;
  }
  return _storage;
}

export async function registerRoutes(httpServer: Server, app: Express) {
  // Profile
  app.get("/api/profile", async (_req, res) => {
    const profile = await getStorage().getProfile();
    res.json(profile);
  });
  app.patch("/api/profile", async (req, res) => {
    const parsed = insertUserProfileSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().upsertProfile(parsed.data));
  });

  // Exercises
  app.get("/api/exercises", async (_req, res) => {
    res.json(await getStorage().getExercises());
  });
  app.post("/api/exercises", async (req, res) => {
    const parsed = insertExerciseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addExercise(parsed.data));
  });
  app.delete("/api/exercises/:id", async (req, res) => {
    await getStorage().deleteExercise(Number(req.params.id));
    res.json({ ok: true });
  });

  // Exercise logs (per-workout)
  app.get("/api/exercise-logs", async (req, res) => {
    const workoutId = req.query.workoutId ? Number(req.query.workoutId) : undefined;
    res.json(await getStorage().getExerciseLogs(workoutId));
  });
  app.post("/api/exercise-logs", async (req, res) => {
    const parsed = insertExerciseLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addExerciseLog(parsed.data));
  });
  app.delete("/api/exercise-logs/:id", async (req, res) => {
    await getStorage().deleteExerciseLog(Number(req.params.id));
    res.json({ ok: true });
  });

  // Weight logs
  app.get("/api/weight", async (_req, res) => {
    res.json(await getStorage().getWeightLogs());
  });
  app.post("/api/weight", async (req, res) => {
    const parsed = insertWeightLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addWeightLog(parsed.data));
  });
  app.delete("/api/weight/:id", async (req, res) => {
    await getStorage().deleteWeightLog(Number(req.params.id));
    res.json({ ok: true });
  });

  // Workout logs
  app.get("/api/workouts", async (_req, res) => {
    res.json(await getStorage().getWorkoutLogs());
  });
  app.post("/api/workouts", async (req, res) => {
    const parsed = insertWorkoutLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addWorkoutLog(parsed.data));
  });
  app.delete("/api/workouts/:id", async (req, res) => {
    await getStorage().deleteWorkoutLog(Number(req.params.id));
    res.json({ ok: true });
  });

  // Nutrition logs
  app.get("/api/nutrition", async (_req, res) => {
    res.json(await getStorage().getNutritionLogs());
  });
  app.post("/api/nutrition", async (req, res) => {
    const parsed = insertNutritionLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addNutritionLog(parsed.data));
  });
  app.patch("/api/nutrition/:id", async (req, res) => {
    const updated = await getStorage().updateNutritionLog(Number(req.params.id), req.body);
    res.json(updated);
  });
  app.delete("/api/nutrition/:id", async (req, res) => {
    await getStorage().deleteNutritionLog(Number(req.params.id));
    res.json({ ok: true });
  });

  // Strength logs
  app.get("/api/strength", async (_req, res) => {
    res.json(await getStorage().getStrengthLogs());
  });
  app.post("/api/strength", async (req, res) => {
    const parsed = insertStrengthLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.json(await getStorage().addStrengthLog(parsed.data));
  });
  app.delete("/api/strength/:id", async (req, res) => {
    await getStorage().deleteStrengthLog(Number(req.params.id));
    res.json({ ok: true });
  });

  return httpServer;
}
