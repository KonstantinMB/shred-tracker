/**
 * PostgreSQL-backed storage implementation using Drizzle ORM.
 * Used automatically when DATABASE_URL environment variable is set.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  weightLogs, workoutLogs, nutritionLogs, strengthLogs,
  WeightLog, WorkoutLog, NutritionLog, StrengthLog,
  InsertWeightLog, InsertWorkoutLog, InsertNutritionLog, InsertStrengthLog,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class PgStorage implements IStorage {
  private get db() {
    const d = getDb();
    if (!d) throw new Error("DATABASE_URL not set");
    return d;
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
