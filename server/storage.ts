import {
  WeightLog, WorkoutLog, NutritionLog, StrengthLog,
  InsertWeightLog, InsertWorkoutLog, InsertNutritionLog, InsertStrengthLog
} from "@shared/schema";

export interface IStorage {
  // Weight
  getWeightLogs(): Promise<WeightLog[]>;
  addWeightLog(log: InsertWeightLog): Promise<WeightLog>;
  deleteWeightLog(id: number): Promise<void>;

  // Workout
  getWorkoutLogs(): Promise<WorkoutLog[]>;
  addWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  deleteWorkoutLog(id: number): Promise<void>;

  // Nutrition
  getNutritionLogs(): Promise<NutritionLog[]>;
  addNutritionLog(log: InsertNutritionLog): Promise<NutritionLog>;
  updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog>;
  deleteNutritionLog(id: number): Promise<void>;

  // Strength
  getStrengthLogs(): Promise<StrengthLog[]>;
  addStrengthLog(log: InsertStrengthLog): Promise<StrengthLog>;
  deleteStrengthLog(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private weightLogs: WeightLog[] = [];
  private workoutLogs: WorkoutLog[] = [];
  private nutritionLogs: NutritionLog[] = [];
  private strengthLogs: StrengthLog[] = [];
  private nextId = 1;

  private getId() { return this.nextId++; }

  constructor() {
    // ── Seed 28 days of weight data (reverse: oldest first, ending at today Mar 12 2026)
    const weights = [94.0,93.7,93.5,93.8,93.4,93.1,92.9,92.6,92.4,92.7,92.2,91.9,91.6,91.4,91.1,90.8,90.6,91.0,90.5,90.2,89.9,89.7,89.5,89.3,89.1,88.9,88.6,88.3];
    const startDate = new Date("2026-03-12");
    weights.forEach((w, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() - weights.length + i + 1);
      this.weightLogs.push({
        id: this.getId(),
        date: d.toISOString().split("T")[0],
        weight: w,
        waist: parseFloat((88 - i * 0.1).toFixed(1)),
        notes: null
      });
    });

    // ── Seed workout logs
    const workoutSeeds: { type: string; durationMin: number; energyRating: number; notes: string }[] = [
      { type: "gym", durationMin: 55, energyRating: 8, notes: "Upper body heavy — bench + rows" },
      { type: "gym", durationMin: 50, energyRating: 7, notes: "Lower body — leg press, RDL" },
      { type: "gym", durationMin: 60, energyRating: 9, notes: "Metabolic circuit — great session" },
      { type: "recovery", durationMin: 20, energyRating: 6, notes: "10k steps, walking pad" },
      { type: "gym", durationMin: 50, energyRating: 7, notes: "Upper hypertrophy" },
      { type: "tennis", durationMin: 60, energyRating: 9, notes: "Tennis match — great cardio" },
      { type: "jump_rope", durationMin: 30, energyRating: 8, notes: "Jump rope + core circuit" },
      { type: "gym", durationMin: 55, energyRating: 8, notes: "Upper body heavy" },
      { type: "gym", durationMin: 50, energyRating: 7, notes: "Lower body moderate" },
      { type: "gym", durationMin: 60, energyRating: 8, notes: "Metabolic circuit" },
    ];
    workoutSeeds.forEach((ws, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() - 9 + i);
      this.workoutLogs.push({ id: this.getId(), date: d.toISOString().split("T")[0], ...ws });
    });

    // ── Seed nutrition logs (14 days)
    const nutBase = { calories: 2480, protein: 208, carbs: 236, fat: 76, steps: 10200, water: 3.5, sleep: 7.5 };
    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() - 13 + i);
      const v = () => (Math.random() - 0.5) * 0.12;
      this.nutritionLogs.push({
        id: this.getId(),
        date: d.toISOString().split("T")[0],
        calories: Math.round(nutBase.calories * (1 + v())),
        protein: Math.round(nutBase.protein * (1 + v())),
        carbs: Math.round(nutBase.carbs * (1 + v())),
        fat: Math.round(nutBase.fat * (1 + v())),
        steps: Math.round(nutBase.steps * (1 + (Math.random() - 0.5) * 0.2)),
        water: parseFloat((nutBase.water + (Math.random() - 0.5) * 0.5).toFixed(1)),
        sleep: parseFloat((nutBase.sleep + (Math.random() - 0.5) * 0.6).toFixed(1)),
      });
    }

    // ── Seed strength logs (4 sessions × each lift progresses by 2.5kg/week)
    for (let i = 0; i < 4; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() - 21 + i * 7);
      this.strengthLogs.push({
        id: this.getId(),
        date: d.toISOString().split("T")[0],
        benchPress: 80 + i * 2.5,
        barbellRow: 75 + i * 2.5,
        legPress: 150 + i * 2.5,
        notes: i === 3 ? "Feeling strong on the cut" : null,
      });
    }
  }

  async getWeightLogs() { return [...this.weightLogs].sort((a, b) => a.date.localeCompare(b.date)); }
  async addWeightLog(log: InsertWeightLog): Promise<WeightLog> {
    const entry = { ...log, id: this.getId(), waist: log.waist ?? null, notes: log.notes ?? null };
    this.weightLogs.push(entry);
    return entry;
  }
  async deleteWeightLog(id: number) { this.weightLogs = this.weightLogs.filter(l => l.id !== id); }

  async getWorkoutLogs() { return [...this.workoutLogs].sort((a, b) => b.date.localeCompare(a.date)); }
  async addWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const entry = { ...log, id: this.getId(), energyRating: log.energyRating ?? null, notes: log.notes ?? null };
    this.workoutLogs.push(entry);
    return entry;
  }
  async deleteWorkoutLog(id: number) { this.workoutLogs = this.workoutLogs.filter(l => l.id !== id); }

  async getNutritionLogs() { return [...this.nutritionLogs].sort((a, b) => b.date.localeCompare(a.date)); }
  async addNutritionLog(log: InsertNutritionLog): Promise<NutritionLog> {
    const entry = { ...log, id: this.getId(), steps: log.steps ?? null, water: log.water ?? null, sleep: log.sleep ?? null };
    this.nutritionLogs.push(entry);
    return entry;
  }
  async updateNutritionLog(id: number, log: Partial<InsertNutritionLog>): Promise<NutritionLog> {
    const idx = this.nutritionLogs.findIndex(l => l.id === id);
    if (idx === -1) throw new Error("Not found");
    this.nutritionLogs[idx] = { ...this.nutritionLogs[idx], ...log };
    return this.nutritionLogs[idx];
  }
  async deleteNutritionLog(id: number) { this.nutritionLogs = this.nutritionLogs.filter(l => l.id !== id); }

  async getStrengthLogs() { return [...this.strengthLogs].sort((a, b) => b.date.localeCompare(a.date)); }
  async addStrengthLog(log: InsertStrengthLog): Promise<StrengthLog> {
    const entry = { ...log, id: this.getId(), benchPress: log.benchPress ?? null, barbellRow: log.barbellRow ?? null, legPress: log.legPress ?? null, notes: log.notes ?? null };
    this.strengthLogs.push(entry);
    return entry;
  }
  async deleteStrengthLog(id: number) { this.strengthLogs = this.strengthLogs.filter(l => l.id !== id); }
}

export const storage = new MemStorage();

// Re-export PgStorage for use in index.ts
export { PgStorage } from "./pg-storage";
