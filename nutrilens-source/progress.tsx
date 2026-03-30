import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import type { Meal, Goal } from "@shared/schema";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface DaySummary {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return days;
}

function shortLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProgressPage() {
  const { data: allMeals = [], isLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals/all"],
  });

  const { data: goals } = useQuery<Goal>({
    queryKey: ["/api/goals"],
  });

  const goal = goals || { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const days = getLast14Days();

  const dailyData: DaySummary[] = days.map((date) => {
    const dayMeals = allMeals.filter((m) => m.date === date);
    const totals = dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      date,
      label: shortLabel(date),
      ...totals,
      mealCount: dayMeals.length,
    };
  });

  const daysWithData = dailyData.filter((d) => d.mealCount > 0);
  const avgCalories = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0;
  const avgProtein = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
    : 0;

  // Trend: compare last 7 days vs. prior 7
  const last7 = dailyData.slice(7);
  const prior7 = dailyData.slice(0, 7);
  const avgLast7Cal = last7.filter((d) => d.mealCount > 0).length
    ? last7.filter((d) => d.mealCount > 0).reduce((s, d) => s + d.calories, 0) /
      last7.filter((d) => d.mealCount > 0).length
    : 0;
  const avgPrior7Cal = prior7.filter((d) => d.mealCount > 0).length
    ? prior7.filter((d) => d.mealCount > 0).reduce((s, d) => s + d.calories, 0) /
      prior7.filter((d) => d.mealCount > 0).length
    : 0;
  const calTrend = avgPrior7Cal > 0 ? ((avgLast7Cal - avgPrior7Cal) / avgPrior7Cal) * 100 : 0;

  const COLORS = {
    calories: "hsl(174, 58%, 34%)",
    protein: "hsl(174, 58%, 34%)",
    carbs: "hsl(45, 85%, 52%)",
    fat: "hsl(340, 65%, 52%)",
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-testid="page-progress">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your nutrition trends over the past 14 days.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Avg. Daily Calories</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold tabular-nums">{avgCalories}</span>
              <span className="text-xs text-muted-foreground mb-1">kcal</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {calTrend > 2 ? (
                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              ) : calTrend < -2 ? (
                <TrendingDown className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.abs(Math.round(calTrend))}% vs prior week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Avg. Daily Protein</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold tabular-nums">{avgProtein}g</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground tabular-nums">
                Goal: {goal.protein}g
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Days Tracked</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold tabular-nums">{daysWithData.length}</span>
              <span className="text-xs text-muted-foreground mb-1">/ 14</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {allMeals.length} total meals logged
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calorie trend chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Calorie Trend</CardTitle>
          <Badge variant="secondary" className="text-[10px]">14 days</Badge>
        </CardHeader>
        <CardContent>
          {daysWithData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Log meals to see your calorie trend here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.calories} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={COLORS.calories} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number) => [`${Math.round(value)} kcal`, "Calories"]}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke={COLORS.calories}
                  strokeWidth={2}
                  fill="url(#calGradient)"
                  dot={{ r: 3, fill: COLORS.calories }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Macro breakdown bar chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Daily Macro Breakdown</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.protein }} />
              <span className="text-[10px] text-muted-foreground">Protein</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.carbs }} />
              <span className="text-[10px] text-muted-foreground">Carbs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.fat }} />
              <span className="text-[10px] text-muted-foreground">Fat</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {daysWithData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Log meals to see your macro breakdown here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  label={{ value: "grams", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
                />
                <Bar dataKey="protein" name="Protein" fill={COLORS.protein} radius={[3, 3, 0, 0]} />
                <Bar dataKey="carbs" name="Carbs" fill={COLORS.carbs} radius={[3, 3, 0, 0]} />
                <Bar dataKey="fat" name="Fat" fill={COLORS.fat} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Protein goal tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Protein Goal Tracking</CardTitle>
          <Badge variant="secondary" className="text-[10px]">Goal: {goal.protein}g/day</Badge>
        </CardHeader>
        <CardContent>
          {daysWithData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Log meals to see your protein tracking here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
                />
                <Line
                  type="monotone"
                  dataKey="protein"
                  name="Protein"
                  stroke={COLORS.protein}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.protein }}
                />
                {/* Goal reference line */}
                <Line
                  type="monotone"
                  dataKey={() => goal.protein}
                  name="Goal"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="6 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
