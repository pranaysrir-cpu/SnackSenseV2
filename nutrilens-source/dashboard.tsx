import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroRing } from "@/components/macro-ring";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Beef, Wheat, Droplets, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meal, Goal } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const MACRO_COLORS = {
  protein: "hsl(174, 58%, 34%)",
  carbs: "hsl(45, 85%, 52%)",
  fat: "hsl(340, 65%, 52%)",
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const today = getTodayStr();

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals", today],
  });

  const { data: goals } = useQuery<Goal>({
    queryKey: ["/api/goals"],
  });

  const todayMeals = meals;
  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goal = goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 };

  const calPercent = Math.min(Math.round((totals.calories / goal.calories) * 100), 100);

  const pieData = [
    { name: "Protein", value: totals.protein * 4, color: MACRO_COLORS.protein },
    { name: "Carbs", value: totals.carbs * 4, color: MACRO_COLORS.carbs },
    { name: "Fat", value: totals.fat * 9, color: MACRO_COLORS.fat },
  ].filter((d) => d.value > 0);

  const mealTypeLabels: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  };

  const deleteMeal = async (id: number) => {
    await apiRequest("DELETE", `/api/meals/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
  };

  if (mealsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-testid="page-dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today's Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Calorie progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Calories</span>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(totals.calories)} / {goal.calories} kcal
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 tabular-nums">
            {Math.max(0, Math.round(goal.calories - totals.calories))} kcal remaining
          </p>
        </CardContent>
      </Card>

      {/* Macro rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <MacroRing
              value={totals.protein}
              max={goal.protein}
              label="Protein"
              unit="g"
              color={MACRO_COLORS.protein}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <MacroRing
              value={totals.carbs}
              max={goal.carbs}
              label="Carbs"
              unit="g"
              color={MACRO_COLORS.carbs}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <MacroRing
              value={totals.fat}
              max={goal.fat}
              label="Fat"
              unit="g"
              color={MACRO_COLORS.fat}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex justify-center">
            {pieData.length > 0 ? (
              <div className="flex flex-col items-center gap-1">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${Math.round(value)} kcal`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <span className="text-xs font-medium text-muted-foreground">
                  Macro Split
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[116px]">
                <span className="text-sm text-muted-foreground">No data yet</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's meals list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="text-base">Today's Meals</CardTitle>
          <Badge variant="secondary">{todayMeals.length} logged</Badge>
        </CardHeader>
        <CardContent>
          {todayMeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No meals logged today.</p>
              <p className="text-xs mt-1">Use "Analyze Meal" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                  data-testid={`meal-entry-${meal.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {meal.imageData ? (
                      <img
                        src={meal.imageData}
                        alt={meal.name}
                        className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Flame className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mealTypeLabels[meal.mealType] || meal.mealType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Flame className="h-3 w-3" />
                        {Math.round(meal.calories)}
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Beef className="h-3 w-3" />
                        {Math.round(meal.protein)}g
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Wheat className="h-3 w-3" />
                        {Math.round(meal.carbs)}g
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Droplets className="h-3 w-3" />
                        {Math.round(meal.fat)}g
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMeal(meal.id)}
                      data-testid={`button-delete-meal-${meal.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
