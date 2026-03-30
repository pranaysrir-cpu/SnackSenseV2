import { pgTable, text, varchar, integer, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Preset food database
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  servingSize: text("serving_size").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
});

export const insertFoodSchema = createInsertSchema(foods).omit({ id: true });
export type InsertFood = z.infer<typeof insertFoodSchema>;
export type Food = typeof foods.$inferSelect;

// Meal entries (logged meals)
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  imageData: text("image_data"), // base64 thumbnail
  source: text("source").notNull(), // 'manual' | 'ai' | 'database'
});

export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

// Daily goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
