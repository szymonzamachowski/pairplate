"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/constants";
import { buildMealItemsFromRecipe } from "@/lib/actions/recipes";
import { addSoloMeal } from "@/lib/actions/meals";
import type { MealType } from "@/types/database";
import type { RecipeWithNutrition } from "@/lib/recipes/nutrition";
import { BookOpen, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { RecipeMacroSummary } from "@/components/recipes/recipe-macro-summary";

interface RecipePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  profileId: string;
  recipes: RecipeWithNutrition[];
  defaultMealType?: MealType;
  mode?: "load" | "add";
  onSelectRecipe?: (recipeId: string, portion: number) => Promise<void>;
}

export function RecipePickerSheet({
  open,
  onOpenChange,
  householdId,
  profileId,
  recipes,
  defaultMealType = "lunch",
  mode = "load",
  onSelectRecipe,
}: RecipePickerSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [portion, setPortion] = useState("1");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [isPending, startTransition] = useTransition();

  const selected = recipes.find((r) => r.id === selectedId);

  async function handleConfirm() {
    if (!selectedId) return;
    const portionNum = Number(portion) || 1;

    startTransition(async () => {
      if (mode === "load" && onSelectRecipe) {
        await onSelectRecipe(selectedId, portionNum);
        onOpenChange(false);
        toast.success("Załadowano przepis");
        return;
      }

      const built = await buildMealItemsFromRecipe(selectedId, portionNum);
      if ("error" in built) {
        toast.error(built.error);
        return;
      }

      const result = await addSoloMeal({
        householdId,
        profileId,
        mealType,
        name: built.recipe.name,
        items: built.items,
      });

      if (result.error) toast.error(result.error);
      else {
        toast.success("Dodano przepis do dziennika");
        onOpenChange(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Wybierz przepis</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pb-4">
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak zapisanych przepisów. Dodaj pierwszy w zakładce Przepisy.
            </p>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setSelectedId(recipe.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                    selectedId === recipe.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-muted/30"
                  }`}
                >
                  <div>
                    <p className="font-medium">{recipe.name}</p>
                    <RecipeMacroSummary nutrition={recipe.nutrition} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {recipe.itemCount} składników
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
              <div>
                <Label>Porcja (mnożnik)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="rounded-xl"
                  placeholder="1 = pełny przepis, 0.5 = połowa"
                />
              </div>

              {mode === "add" && (
                <div>
                  <Label>Sekcja posiłku</Label>
                  <Select
                    value={mealType}
                    onValueChange={(v) => v && setMealType(v as MealType)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {MEAL_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full rounded-2xl"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {mode === "load" ? "Użyj przepisu" : "Dodaj do dziennika"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function RecipePickerButton({
  onClick,
  label = "Wybierz przepis",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto w-full justify-start gap-3 rounded-2xl py-4"
      onClick={onClick}
    >
      <BookOpen className="h-5 w-5 text-primary" />
      <div className="text-left">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Cały przepis naraz — z automatycznym makro
        </p>
      </div>
    </Button>
  );
}
