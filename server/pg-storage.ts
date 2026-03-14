/**
 * PostgreSQL-backed storage implementation using Drizzle ORM.
 * Used automatically when DATABASE_URL environment variable is set.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  userProfile, exercises, exerciseLogs, weightLogs, workoutLogs, nutritionLogs, strengthLogs,
  UserProfile, Exercise, ExerciseLog, WeightLog, WorkoutLog, NutritionLog, StrengthLog,
  InsertUserProfile, InsertExercise, InsertExerciseLog, InsertWeightLog, InsertWorkoutLog, InsertNutritionLog, InsertStrengthLog,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class PgStorage implements IStorage {
  private get db() {
    const d = getDb();
    if (!d) throw new Error("DATABASE_URL not set");
    return d;
  }

  // ── Profile ─────────────────────────────────────────────────
  async getProfile(): Promise<UserProfile | null> {
    const [row] = await this.db.select().from(userProfile).limit(1);
    return row ?? null;
  }
  async upsertProfile(data: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile();
    if (existing) {
      const [row] = await this.db.update(userProfile).set(data).where(eq(userProfile.id, existing.id)).returning();
      return row!;
    }
    const [row] = await this.db.insert(userProfile).values({
      name: data.name ?? "",
      startDate: data.startDate ?? "2026-03-01",
      startWeight: data.startWeight ?? 94,
      goalWeight: data.goalWeight ?? 84,
      goalMonths: data.goalMonths ?? 12,
      estimatedBodyFat: data.estimatedBodyFat ?? null,
      caloriesTarget: data.caloriesTarget ?? 2500,
      proteinTarget: data.proteinTarget ?? 210,
      carbsTarget: data.carbsTarget ?? 240,
      fatTarget: data.fatTarget ?? 78,
      stepsTarget: data.stepsTarget ?? 10000,
      waterTarget: data.waterTarget ?? 3,
      sleepTarget: data.sleepTarget ?? 8,
      location: data.location ?? "",
    }).returning();
    return row!;
  }

  // ── Exercises ───────────────────────────────────────────────
  async getExercises(): Promise<Exercise[]> {
    return this.db.select().from(exercises).orderBy(exercises.name);
  }
  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const [row] = await this.db.insert(exercises).values({
      name: exercise.name,
      category: exercise.category ?? "compound",
      unit: exercise.unit ?? "kg",
    }).returning();
    return row;
  }
  async deleteExercise(id: number): Promise<void> {
    await this.db.delete(exerciseLogs).where(eq(exerciseLogs.exerciseId, id));
    await this.db.delete(exercises).where(eq(exercises.id, id));
  }

  async getExerciseLogs(workoutId?: number): Promise<ExerciseLog[]> {
    if (workoutId != null) {
      return this.db.select().from(exerciseLogs).where(eq(exerciseLogs.workoutId, workoutId)).orderBy(exerciseLogs.id);
    }
    return this.db.select().from(exerciseLogs).orderBy(exerciseLogs.id);
  }
  async addExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog> {
    const [row] = await this.db.insert(exerciseLogs).values({
      workoutId: log.workoutId,
      exerciseId: log.exerciseId,
      sets: log.sets ?? 1,
      reps: log.reps ?? null,
      weight: log.weight ?? null,
      notes: log.notes ?? null,
    }).returning();
    return row;
  }
  async deleteExerciseLog(id: number): Promise<void> {
    await this.db.delete(exerciseLogs).where(eq(exerciseLogs.id, id));
  }

  // ── Weight ──────────────────────────────────────────────────
  async getWeightLogs(): Promise<WeightLog[]> {
    return this.db.select().from(weightLogs).orderBy(weightLogs.date);
  }
  async addWeightLog(log: InsertWeightLog): Promise<WeightLog> {
    const [row] = await this.db.insert(weightLogs).values(log).returning();
    return row;
  }
  async deleteWeightLog(id: number): Promise<void> {
    await this.db.delete(weightLogs).where(eq(weightLogs.id, id));
  }

  // ── Workouts ─────────────────────────────────────────────────
  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    return this.db.select().from(workoutLogs).orderBy(workoutLogs.date);
  }
  async addWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [row] = await this.db.insert(workoutLogs).values(log).returning();
    return row;
  }
  async deleteWorkoutLog(id: number): Promise<void> {
    await this.db.delete(workoutLogs).where(eq(workoutLogs.id, id));
  }

  // ── Nutrition ─────────────────────────────────────────────────
  async getNutritionLogs(): Promise<NutritionLog[]> {
    return this.db.select().from(nutritionLogs).orderBy(nutritionLogs.date);
  }
  async addNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const [row] = await this.db.insert(nutritionLogs).values(log).returning();
    return row;
  }
  async updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog> {
    const [row] = await this.db.update(nutritionLogs).set(log).where(eq(nutritionLogs.id, id)).returning();
    if (!row) throw new Error("Not found");
    return row;
  }
  async deleteNutritionLog(id: number): Promise<void> {
    await this.db.delete(nutritionLogs).where(eq(nutritionLogs.id, id));
  }

  // ── Strength ──────────────────────────────────────────────────
  async getStrengthLogs(): Promise<StrengthLog[]> {
    return this.db.select().from(strengthLogs).orderBy(strengthLogs.date);
  }
  async addStrengthLog(log: InsertStrengthLog): Promise<StrengthLog> {
    const [row] = await this.db.insert(strengthLogs).values(log).returning();
    return row;
  }
  async deleteStrengthLog(id: number): Promise<void> {
    await this.db.delete(strengthLogs).where(eq(strengthLogs.id, id));
  }
}
