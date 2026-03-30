import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, Loader2, Sparkles, Check, ImagePlus } from "lucide-react";
import type { InsertMeal } from "@shared/schema";

interface AnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: string;
  items: string[];
}

export default function AnalyzePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mealType, setMealType] = useState("lunch");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setResult(null);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/analyze", { imageData: imagePreview });
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const meal: InsertMeal = {
        name: result.name,
        date: dateStr,
        mealType,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        imageData: imagePreview,
        source: "ai",
      };
      await apiRequest("POST", "/api/meals", meal);
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      setSaved(true);
      toast({ title: "Meal logged", description: `${result.name} added to today's meals.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="page-analyze">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze Meal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo of your meal and AI will estimate the macronutrients.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Meal Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-md transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[240px] ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              data-testid="drop-zone"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                data-testid="input-file"
              />
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Meal preview"
                  className="max-h-[240px] rounded-md object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" />
                  <p className="text-sm font-medium">Drop an image here</p>
                  <p className="text-xs">or click to browse</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Meal Type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger data-testid="select-meal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 pt-4">
                <Button
                  className="w-full"
                  disabled={!imagePreview || analyzing}
                  onClick={analyzeImage}
                  data-testid="button-analyze"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="flex flex-col items-center justify-center min-h-[240px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Identifying foods and estimating macros...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{result.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confidence: {result.confidence}
                  </p>
                </div>

                {result.items.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.items.map((item, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="text-xl font-semibold tabular-nums">{result.calories}</p>
                    <p className="text-[10px] text-muted-foreground">kcal</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="text-xl font-semibold tabular-nums" style={{ color: "hsl(174, 58%, 34%)" }}>{result.protein}g</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="text-xl font-semibold tabular-nums" style={{ color: "hsl(45, 85%, 42%)" }}>{result.carbs}g</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="text-xl font-semibold tabular-nums" style={{ color: "hsl(340, 65%, 52%)" }}>{result.fat}g</p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={saveMeal}
                  disabled={saving || saved}
                  data-testid="button-save-meal"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Log This Meal"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-muted-foreground">
                <Camera className="h-10 w-10 mb-2" />
                <p className="text-sm">Upload a photo and tap Analyze</p>
                <p className="text-xs mt-1">to see the estimated macros here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
