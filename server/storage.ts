import {
  UserProfile, WeightLog, WorkoutLog, NutritionLog, StrengthLog, Exercise, ExerciseLog,
  InsertUserProfile, InsertWeightLog, InsertWorkoutLog, InsertNutritionLog, InsertStrengthLog,
  InsertExercise, InsertExerciseLog,
} from "@shared/schema";

export interface IStorage {
  // Profile
  getProfile(): Promise<UserProfile | null>;
  upsertProfile(profile: Partial<InsertUserProfile>): Promise<UserProfile>;

  // Exercises
  getExercises(): Promise<Exercise[]>;
  addExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;

  // Exercise logs (per-workout)
  getExerciseLogs(workoutId?: number): Promise<ExerciseLog[]>;
  addExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog>;
  updateExerciseLog(id: number, log: Partial<InsertExerciseLog>): Promise<ExerciseLog>;
  deleteExerciseLog(id: number): Promise<void>;

  // Weight
  getWeightLogs(): Promise<WeightLog[]>;
  addWeightLog(log: InsertWeightLog): Promise<WeightLog>;
  deleteWeightLog(id: number): Promise<void>;

  // Workout
  getWorkoutLogs(): Promise<WorkoutLog[]>;
  addWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: number, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog>;
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

const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: "Konstantin",
  startDate: "2026-03-01",
  startWeight: 94,
  goalWeight: 84,
  goalMonths: 12,
  estimatedBodyFat: null,
  caloriesTarget: 2500,
  proteinTarget: 210,
  carbsTarget: 240,
  fatTarget: 78,
  stepsTarget: 10000,
  waterTarget: 3,
  sleepTarget: 8,
  location: "Sofia, BG",
};

export class MemStorage implements IStorage {
  private profile: UserProfile = { ...DEFAULT_PROFILE };
  private exercises: Exercise[] = [
    { id: 1, name: "Bench Press", category: "compound", unit: "kg" },
    { id: 2, name: "Barbell Row", category: "compound", unit: "kg" },
    { id: 3, name: "Leg Press", category: "compound", unit: "kg" },
  ];
  private exerciseLogs: ExerciseLog[] = [];
  private weightLogs: WeightLog[] = [];
  private workoutLogs: WorkoutLog[] = [];
  private nutritionLogs: NutritionLog[] = [];
  private strengthLogs: StrengthLog[] = [];
  private nextId = 1;

  private getId() { return this.nextId++; }

  async getProfile(): Promise<UserProfile | null> {
    return { ...this.profile };
  }
  async upsertProfile(data: Partial<InsertUserProfile>): Promise<UserProfile> {
    this.profile = { ...this.profile, ...data, id: 1 };
    return { ...this.profile };
  }

  async getExercises(): Promise<Exercise[]> {
    return [...this.exercises];
  }
  async addExercise(exercise: InsertExercise): Promise<Exercise> {
    const entry = { ...exercise, id: this.nextId++, category: exercise.category ?? "compound", unit: exercise.unit ?? "kg" };
    this.exercises.push(entry);
    return entry;
  }
  async deleteExercise(id: number): Promise<void> {
    this.exercises = this.exercises.filter((e) => e.id !== id);
    this.exerciseLogs = this.exerciseLogs.filter((e) => e.exerciseId !== id);
  }

  async getExerciseLogs(workoutId?: number): Promise<ExerciseLog[]> {
    let list = [...this.exerciseLogs];
    if (workoutId != null) list = list.filter((e) => e.workoutId === workoutId);
    return list.sort((a, b) => a.id - b.id);
  }
  async addExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog> {
    const entry = { ...log, id: this.nextId++, sets: log.sets ?? 1, reps: log.reps ?? null, weight: log.weight ?? null, setsData: log.setsData ?? null, notes: log.notes ?? null };
    this.exerciseLogs.push(entry);
    return entry;
  }
  async updateExerciseLog(id: number, log: Partial<InsertExerciseLog>): Promise<ExerciseLog> {
    const idx = this.exerciseLogs.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Not found");
    this.exerciseLogs[idx] = { ...this.exerciseLogs[idx], ...log };
    return this.exerciseLogs[idx];
  }
  async deleteExerciseLog(id: number): Promise<void> {
    this.exerciseLogs = this.exerciseLogs.filter((e) => e.id !== id);
  }

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
    const entry = { ...log, id: this.getId(), notes: log.notes ?? null };
    this.weightLogs.push(entry);
    return entry;
  }
  async deleteWeightLog(id: number) { this.weightLogs = this.weightLogs.filter(l => l.id !== id); }

  async getWorkoutLogs() { return [...this.workoutLogs].sort((a, b) => b.date.localeCompare(a.date)); }
  async addWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const entry = { ...log, id: this.getId(), energyRating: log.energyRating ?? null, notes: log.notes ?? null, finishedAt: null };
    this.workoutLogs.push(entry);
    return entry;
  }
  async updateWorkoutLog(id: number, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog> {
    const idx = this.workoutLogs.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error("Not found");
    this.workoutLogs[idx] = { ...this.workoutLogs[idx], ...log };
    return this.workoutLogs[idx];
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
