import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodSchema, insertMealSchema, insertGoalSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Foods ────────────────────────────────────────────────────────
  app.get("/api/foods", async (_req, res) => {
    const foods = await storage.getAllFoods();
    res.json(foods);
  });

  app.post("/api/foods", async (req, res) => {
    const parsed = insertFoodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const food = await storage.createFood(parsed.data);
    res.status(201).json(food);
  });

  // ─── Meals ────────────────────────────────────────────────────────
  // /all must come before /:date to avoid matching "all" as a date
  app.get("/api/meals/all", async (_req, res) => {
    const meals = await storage.getAllMeals();
    res.json(meals);
  });

  app.get("/api/meals/:date", async (req, res) => {
    const meals = await storage.getMealsByDate(req.params.date);
    res.json(meals);
  });

  app.post("/api/meals", async (req, res) => {
    const parsed = insertMealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const meal = await storage.createMeal(parsed.data);
    res.status(201).json(meal);
  });

  app.delete("/api/meals/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    await storage.deleteMeal(id);
    res.status(204).send();
  });

  // ─── Goals ────────────────────────────────────────────────────────
  app.get("/api/goals", async (_req, res) => {
    const goals = await storage.getGoals();
    res.json(goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 });
  });

  app.put("/api/goals", async (req, res) => {
    const parsed = insertGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const goals = await storage.setGoals(parsed.data);
    res.json(goals);
  });

  // ─── AI Analyze ───────────────────────────────────────────────────
  app.post("/api/analyze", async (req, res) => {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    // Simulate AI analysis with realistic estimation logic
    // In production, this would call a vision API (GPT-4V, Claude, etc.)
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    const mealTypes = [
      {
        name: "Grilled Chicken Salad",
        items: ["Grilled Chicken", "Mixed Greens", "Tomatoes", "Cucumbers", "Olive Oil Dressing"],
        calories: 420,
        protein: 38,
        carbs: 18,
        fat: 22,
        fiber: 5,
        confidence: "High",
      },
      {
        name: "Pasta with Meat Sauce",
        items: ["Spaghetti", "Ground Beef", "Tomato Sauce", "Parmesan", "Garlic Bread"],
        calories: 680,
        protein: 32,
        carbs: 75,
        fat: 26,
        fiber: 4,
        confidence: "Medium",
      },
      {
        name: "Salmon & Quinoa Bowl",
        items: ["Salmon Fillet", "Quinoa", "Roasted Broccoli", "Avocado", "Lemon"],
        calories: 560,
        protein: 42,
        carbs: 38,
        fat: 28,
        fiber: 8,
        confidence: "High",
      },
      {
        name: "Veggie Stir-Fry with Rice",
        items: ["Bell Peppers", "Broccoli", "Tofu", "Soy Sauce", "White Rice"],
        calories: 480,
        protein: 22,
        carbs: 62,
        fat: 15,
        fiber: 7,
        confidence: "Medium",
      },
      {
        name: "Breakfast Plate",
        items: ["Scrambled Eggs", "Toast", "Avocado", "Turkey Bacon", "Orange Juice"],
        calories: 520,
        protein: 28,
        carbs: 42,
        fat: 26,
        fiber: 6,
        confidence: "High",
      },
      {
        name: "Protein Smoothie Bowl",
        items: ["Whey Protein", "Banana", "Blueberries", "Granola", "Almond Milk"],
        calories: 390,
        protein: 32,
        carbs: 48,
        fat: 8,
        fiber: 6,
        confidence: "Medium",
      },
    ];

    // Add slight randomization
    const base = mealTypes[Math.floor(Math.random() * mealTypes.length)];
    const variance = 0.85 + Math.random() * 0.3;
    const result = {
      ...base,
      calories: Math.round(base.calories * variance),
      protein: Math.round(base.protein * variance),
      carbs: Math.round(base.carbs * variance),
      fat: Math.round(base.fat * variance),
      fiber: Math.round(base.fiber * variance),
    };

    res.json(result);
  });

  return httpServer;
}
