import type { Food, InsertFood, Meal, InsertMeal, Goal, InsertGoal } from "@shared/schema";

export interface IStorage {
  // Foods
  getAllFoods(): Promise<Food[]>;
  getFoodById(id: number): Promise<Food | undefined>;
  createFood(food: InsertFood): Promise<Food>;

  // Meals
  getMealsByDate(date: string): Promise<Meal[]>;
  getAllMeals(): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;

  // Goals
  getGoals(): Promise<Goal | undefined>;
  setGoals(goal: InsertGoal): Promise<Goal>;
}

export class MemStorage implements IStorage {
  private foods: Map<number, Food> = new Map();
  private meals: Map<number, Meal> = new Map();
  private goalData: Goal | undefined;
  private nextFoodId = 1;
  private nextMealId = 1;

  constructor() {
    this.seedFoods();
    this.seedMeals();
    this.goalData = { id: 1, calories: 2000, protein: 150, carbs: 250, fat: 65 };
  }

  private seedFoods() {
    const presets: Omit<Food, "id">[] = [
      { name: "Chicken Breast (Grilled)", category: "Protein", servingSize: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      { name: "Brown Rice (Cooked)", category: "Grains", servingSize: "1 cup (195g)", calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5 },
      { name: "Salmon Fillet", category: "Protein", servingSize: "100g", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
      { name: "Broccoli (Steamed)", category: "Vegetables", servingSize: "1 cup (156g)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1 },
      { name: "Sweet Potato (Baked)", category: "Vegetables", servingSize: "1 medium (114g)", calories: 103, protein: 2.3, carbs: 24, fat: 0.1, fiber: 3.8 },
      { name: "Greek Yogurt (Plain)", category: "Dairy", servingSize: "1 cup (245g)", calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0 },
      { name: "Almonds", category: "Snacks", servingSize: "1 oz (28g)", calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
      { name: "Banana", category: "Fruits", servingSize: "1 medium (118g)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
      { name: "Egg (Whole, Boiled)", category: "Protein", servingSize: "1 large (50g)", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0 },
      { name: "Avocado", category: "Fruits", servingSize: "1/2 medium (68g)", calories: 114, protein: 1.3, carbs: 6, fat: 10.5, fiber: 4.6 },
      { name: "Oatmeal (Cooked)", category: "Grains", servingSize: "1 cup (234g)", calories: 154, protein: 5.4, carbs: 27, fat: 2.6, fiber: 4 },
      { name: "Whole Wheat Bread", category: "Grains", servingSize: "1 slice (30g)", calories: 81, protein: 4, carbs: 14, fat: 1.1, fiber: 1.9 },
      { name: "Olive Oil", category: "Fats & Oils", servingSize: "1 tbsp (14g)", calories: 119, protein: 0, carbs: 0, fat: 14, fiber: 0 },
      { name: "Cottage Cheese (1%)", category: "Dairy", servingSize: "1 cup (226g)", calories: 163, protein: 28, carbs: 6.2, fat: 2.3, fiber: 0 },
      { name: "Quinoa (Cooked)", category: "Grains", servingSize: "1 cup (185g)", calories: 222, protein: 8.1, carbs: 39, fat: 3.6, fiber: 5.2 },
      { name: "Tofu (Firm)", category: "Protein", servingSize: "100g", calories: 144, protein: 17, carbs: 3, fat: 8.7, fiber: 2.3 },
      { name: "Spinach (Raw)", category: "Vegetables", servingSize: "1 cup (30g)", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7 },
      { name: "Peanut Butter", category: "Fats & Oils", servingSize: "2 tbsp (32g)", calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 1.6 },
      { name: "Apple", category: "Fruits", servingSize: "1 medium (182g)", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
      { name: "White Rice (Cooked)", category: "Grains", servingSize: "1 cup (186g)", calories: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6 },
      { name: "Lentils (Cooked)", category: "Protein", servingSize: "1 cup (198g)", calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 15.6 },
      { name: "Turkey Breast (Deli)", category: "Protein", servingSize: "2 oz (56g)", calories: 62, protein: 12, carbs: 1, fat: 1, fiber: 0 },
      { name: "Blueberries", category: "Fruits", servingSize: "1 cup (148g)", calories: 85, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 },
      { name: "Cheddar Cheese", category: "Dairy", servingSize: "1 oz (28g)", calories: 113, protein: 7, carbs: 0.4, fat: 9.3, fiber: 0 },
      { name: "Mixed Greens Salad", category: "Vegetables", servingSize: "2 cups (85g)", calories: 18, protein: 1.5, carbs: 3.5, fat: 0.2, fiber: 1.8 },
      { name: "Protein Shake (Whey)", category: "Beverages", servingSize: "1 scoop (30g)", calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
      { name: "Pasta (Cooked)", category: "Grains", servingSize: "1 cup (140g)", calories: 220, protein: 8.1, carbs: 43, fat: 1.3, fiber: 2.5 },
      { name: "Ground Beef (90% lean)", category: "Protein", servingSize: "100g", calories: 176, protein: 20, carbs: 0, fat: 10, fiber: 0 },
    ];

    for (const food of presets) {
      const id = this.nextFoodId++;
      this.foods.set(id, { ...food, id });
    }
  }

  private seedMeals() {
    // Seed some sample meals for the past few days for demo
    const today = new Date();
    const sampleMeals: Omit<Meal, "id">[] = [];

    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (daysAgo > 0) {
        // Past days - generate realistic sample data
        const baseCal = 1700 + Math.random() * 600;
        const protRatio = 0.25 + Math.random() * 0.1;
        const carbRatio = 0.4 + Math.random() * 0.1;
        const fatRatio = 1 - protRatio - carbRatio;

        sampleMeals.push({
          name: "Oatmeal with Berries",
          date: dateStr,
          mealType: "breakfast",
          calories: Math.round(baseCal * 0.25),
          protein: Math.round((baseCal * 0.25 * protRatio) / 4),
          carbs: Math.round((baseCal * 0.25 * carbRatio) / 4),
          fat: Math.round((baseCal * 0.25 * fatRatio) / 9),
          fiber: 4,
          imageData: null,
          source: "manual",
        });

        sampleMeals.push({
          name: "Chicken & Rice Bowl",
          date: dateStr,
          mealType: "lunch",
          calories: Math.round(baseCal * 0.35),
          protein: Math.round((baseCal * 0.35 * protRatio) / 4),
          carbs: Math.round((baseCal * 0.35 * carbRatio) / 4),
          fat: Math.round((baseCal * 0.35 * fatRatio) / 9),
          fiber: 3,
          imageData: null,
          source: "manual",
        });

        sampleMeals.push({
          name: "Salmon with Vegetables",
          date: dateStr,
          mealType: "dinner",
          calories: Math.round(baseCal * 0.35),
          protein: Math.round((baseCal * 0.35 * protRatio) / 4),
          carbs: Math.round((baseCal * 0.35 * carbRatio) / 4),
          fat: Math.round((baseCal * 0.35 * fatRatio) / 9),
          fiber: 5,
          imageData: null,
          source: "manual",
        });

        if (Math.random() > 0.4) {
          sampleMeals.push({
            name: "Greek Yogurt & Almonds",
            date: dateStr,
            mealType: "snack",
            calories: Math.round(baseCal * 0.05),
            protein: Math.round((baseCal * 0.05 * 0.35) / 4),
            carbs: Math.round((baseCal * 0.05 * 0.3) / 4),
            fat: Math.round((baseCal * 0.05 * 0.35) / 9),
            fiber: 1,
            imageData: null,
            source: "manual",
          });
        }
      }
    }

    for (const meal of sampleMeals) {
      const id = this.nextMealId++;
      this.meals.set(id, { ...meal, id });
    }
  }

  async getAllFoods(): Promise<Food[]> {
    return Array.from(this.foods.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFoodById(id: number): Promise<Food | undefined> {
    return this.foods.get(id);
  }

  async createFood(food: InsertFood): Promise<Food> {
    const id = this.nextFoodId++;
    const newFood: Food = { ...food, id };
    this.foods.set(id, newFood);
    return newFood;
  }

  async getMealsByDate(date: string): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter((m) => m.date === date);
  }

  async getAllMeals(): Promise<Meal[]> {
    return Array.from(this.meals.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const id = this.nextMealId++;
    const newMeal: Meal = { ...meal, id };
    this.meals.set(id, newMeal);
    return newMeal;
  }

  async deleteMeal(id: number): Promise<void> {
    this.meals.delete(id);
  }

  async getGoals(): Promise<Goal | undefined> {
    return this.goalData;
  }

  async setGoals(goal: InsertGoal): Promise<Goal> {
    this.goalData = { ...goal, id: 1 };
    return this.goalData;
  }
}

export const storage = new MemStorage();
