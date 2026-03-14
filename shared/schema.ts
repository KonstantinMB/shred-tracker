import { pgTable, serial, integer, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Weight logs — daily weigh-ins
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  weight: real("weight").notNull(), // kg
  waist: real("waist"), // cm
  notes: text("notes"),
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
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true });
export const insertStrengthLogSchema = createInsertSchema(strengthLogs).omit({ id: true });

// Insert types
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type InsertStrengthLog = z.infer<typeof insertStrengthLogSchema>;

// Select types
export type WeightLog = typeof weightLogs.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type StrengthLog = typeof strengthLogs.$inferSelect;
