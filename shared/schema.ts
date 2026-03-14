import { pgTable, serial, integer, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profile — single row, all targets and settings
export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  startDate: text("start_date").notNull().default("2026-03-01"),
  startWeight: real("start_weight").notNull().default(94),
  goalWeight: real("goal_weight").notNull().default(84),
  goalMonths: integer("goal_months").notNull().default(12),
  estimatedBodyFat: real("estimated_body_fat"),
  caloriesTarget: integer("calories_target").notNull().default(2500),
  proteinTarget: real("protein_target").notNull().default(210),
  carbsTarget: real("carbs_target").notNull().default(240),
  fatTarget: real("fat_target").notNull().default(78),
  stepsTarget: integer("steps_target").notNull().default(10000),
  waterTarget: real("water_target").notNull().default(3),
  sleepTarget: real("sleep_target").notNull().default(8),
  location: text("location").default(""),
});

// Weight logs — daily weigh-ins (kg + notes on looks/feel)
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  weight: real("weight").notNull(), // kg
  notes: text("notes"), // how you look & feel
});

// Workout logs
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  type: text("type").notNull(), // 'gym', 'tennis', 'jump_rope', 'recovery'
  durationMin: integer("duration_min").notNull(), // minutes
  energyRating: integer("energy_rating"), // 1-10
  notes: text("notes"),
});

// Daily nutrition logs
export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull(), // g
  carbs: real("carbs").notNull(), // g
  fat: real("fat").notNull(), // g
  steps: integer("steps"), // daily step count
  water: real("water"), // litres
  sleep: real("sleep"), // hours
});

// User-defined exercises (custom movements)
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").default("compound"), // compound, isolation, cardio
  unit: text("unit").notNull().default("kg"), // kg, reps, time
});

// Exercise logs — per-workout exercise data (sets, reps, weight)
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  sets: integer("sets").notNull().default(1),
  reps: integer("reps"),
  weight: real("weight"),
  notes: text("notes"),
});

// Lift PRs — one row per lift per session (benchPress, barbellRow, legPress stored per row)
export const strengthLogs = pgTable("strength_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  benchPress: real("bench_press"), // kg
  barbellRow: real("barbell_row"), // kg
  legPress: real("leg_press"), // kg
  notes: text("notes"),
});

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfile).omit({ id: true });
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({ id: true });
export const insertStrengthLogSchema = createInsertSchema(strengthLogs).omit({ id: true });

// Insert types
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type InsertStrengthLog = z.infer<typeof insertStrengthLogSchema>;

// Select types
export type UserProfile = typeof userProfile.$inferSelect;
export type WeightLog = typeof weightLogs.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type StrengthLog = typeof strengthLogs.$inferSelect;
