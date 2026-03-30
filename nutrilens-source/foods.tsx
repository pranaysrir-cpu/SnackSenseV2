import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Database, Beef, Wheat, Droplets, Flame } from "lucide-react";
import type { Food, InsertFood } from "@shared/schema";

const CATEGORIES = [
  "Protein",
  "Grains",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Fats & Oils",
  "Snacks",
  "Beverages",
  "Prepared Meals",
  "Other",
];

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const { data: foods = [], isLoading } = useQuery<Food[]>({
    queryKey: ["/api/foods"],
  });

  const addFood = useMutation({
    mutationFn: async (food: InsertFood) => {
      await apiRequest("POST", "/api/foods", food);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foods"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Food added", description: `${name} has been added to the database.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const logFromDb = async (food: Food) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    try {
      await apiRequest("POST", "/api/meals", {
        name: food.name,
        date: dateStr,
        mealType: "snack",
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        source: "database",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Logged", description: `${food.name} added to today's meals.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("Other");
    setServingSize("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !servingSize || !calories || !protein || !carbs || !fat) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    addFood.mutate({
      name,
      category,
      servingSize,
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
      fiber: fiber ? parseFloat(fiber) : null,
    });
  };

  const filtered = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === "all" || f.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-testid="page-foods">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Food Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search preset foods or add your own custom entries.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-food">
              <Plus className="h-4 w-4 mr-2" />
              Add Food
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Food</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="food-name">Name</Label>
                  <Input
                    id="food-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grilled Chicken Breast"
                    data-testid="input-food-name"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-food-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serving">Serving Size</Label>
                  <Input
                    id="serving"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="e.g. 100g"
                    data-testid="input-serving-size"
                  />
                </div>
                <div>
                  <Label htmlFor="cal">Calories (kcal)</Label>
                  <Input
                    id="cal"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    data-testid="input-calories"
                  />
                </div>
                <div>
                  <Label htmlFor="pro">Protein (g)</Label>
                  <Input
                    id="pro"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    data-testid="input-protein"
                  />
                </div>
                <div>
                  <Label htmlFor="carb">Carbs (g)</Label>
                  <Input
                    id="carb"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    data-testid="input-carbs"
                  />
                </div>
                <div>
                  <Label htmlFor="fat-input">Fat (g)</Label>
                  <Input
                    id="fat-input"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    data-testid="input-fat"
                  />
                </div>
                <div>
                  <Label htmlFor="fib">Fiber (g, optional)</Label>
                  <Input
                    id="fib"
                    type="number"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    data-testid="input-fiber"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addFood.isPending} data-testid="button-submit-food">
                {addFood.isPending ? "Adding..." : "Add to Database"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-foods"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Food list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search || filterCategory !== "all"
                ? "No foods match your search."
                : "No foods in the database yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((food) => (
            <Card key={food.id} data-testid={`food-card-${food.id}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {food.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center mb-3">
                  <div>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Flame className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{Math.round(food.calories)}</p>
                    <p className="text-[10px] text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Beef className="h-3 w-3" style={{ color: "hsl(174, 58%, 34%)" }} />
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{Math.round(food.protein)}g</p>
                    <p className="text-[10px] text-muted-foreground">protein</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Wheat className="h-3 w-3" style={{ color: "hsl(45, 85%, 42%)" }} />
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{Math.round(food.carbs)}g</p>
                    <p className="text-[10px] text-muted-foreground">carbs</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Droplets className="h-3 w-3" style={{ color: "hsl(340, 65%, 52%)" }} />
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{Math.round(food.fat)}g</p>
                    <p className="text-[10px] text-muted-foreground">fat</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => logFromDb(food)}
                  data-testid={`button-log-food-${food.id}`}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Quick Log
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
