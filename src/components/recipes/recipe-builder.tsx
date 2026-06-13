"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { searchProducts } from "@/lib/actions/products";
import {
  calculateRecipeNutritionFromDraft,
  type RecipeDraftItem,
} from "@/lib/recipes/nutrition";
import { calculateProductNutrition } from "@/lib/nutrition/calculator";
import type { Product, SavedRecipe } from "@/types/database";
import { Link2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { RecipeMacroSummary } from "@/components/recipes/recipe-macro-summary";

export interface RecipeBuilderValue {
  name: string;
  sourceUrl: string;
  notes: string;
  items: RecipeDraftItem[];
}

interface RecipeBuilderProps {
  householdId: string;
  initialRecipe?: SavedRecipe;
  initialItems?: RecipeDraftItem[];
  submitLabel: string;
  onSubmit: (value: RecipeBuilderValue) => Promise<{ error?: string; success?: boolean }>;
  onCancel?: () => void;
}

function parseRecipeDescription(description?: string | null) {
  if (!description) return { sourceUrl: "", notes: "" };
  const lines = description.split("\n");
  const sourceLine = lines.find((line) => line.startsWith("Źródło: "));
  if (sourceLine) {
    return {
      sourceUrl: sourceLine.replace("Źródło: ", ""),
      notes: lines.filter((line) => !line.startsWith("Źródło: ")).join("\n").trim(),
    };
  }
  return { sourceUrl: "", notes: description };
}

export function RecipeBuilder({
  householdId,
  initialRecipe,
  initialItems,
  submitLabel,
  onSubmit,
  onCancel,
}: RecipeBuilderProps) {
  const parsedDescription = parseRecipeDescription(initialRecipe?.description);
  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [sourceUrl, setSourceUrl] = useState(parsedDescription.sourceUrl);
  const [notes, setNotes] = useState(parsedDescription.notes);
  const [query, setQuery] = useState("");
  const [gramsInput, setGramsInput] = useState("100");
  const [results, setResults] = useState<Product[]>([]);
  const [items, setItems] = useState<RecipeDraftItem[]>(initialItems ?? []);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const data = await searchProducts(query, householdId);
      setResults(data as Product[]);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, householdId]);

  const nutrition = calculateRecipeNutritionFromDraft(items);

  function addItem(product: Product) {
    const grams = Number(gramsInput) || 100;
    setItems((prev) => [...prev, { product, grams }]);
    setQuery("");
    toast.success(`Dodano ${product.name}`);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Podaj nazwę przepisu");
      return;
    }
    if (items.length === 0) {
      toast.error("Dodaj co najmniej jeden składnik");
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({ name: name.trim(), sourceUrl, notes, items });
      if (result.error) toast.error(result.error);
      else toast.success("Zapisano przepis");
    });
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Informacje o przepisie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nazwa przepisu</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Owsianka z bananem"
              className="rounded-2xl"
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link z internetu (opcjonalnie)
            </Label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-2xl"
            />
          </div>
          <div>
            <Label>Notatki (opcjonalnie)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. skrócona wersja przepisu z bloga..."
              className="min-h-20 rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Składniki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wyszukaj składnik z bazy..."
              className="rounded-2xl pl-10"
            />
          </div>
          <div>
            <Label>Gramatura</Label>
            <Input
              type="number"
              value={gramsInput}
              onChange={(e) => setGramsInput(e.target.value)}
              className="rounded-2xl"
            />
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addItem(product)}
                className="flex w-full items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-left transition hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.kcal_per_100g} kcal / 100 g
                  </p>
                </div>
                <Plus className="h-4 w-4" />
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className="flex items-center gap-2 rounded-2xl bg-muted/40 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateProductNutrition(item.product, item.grams).kcal} kcal
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={item.grams}
                    onChange={(e) => {
                      const grams = Number(e.target.value) || 0;
                      setItems((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, grams } : d))
                      );
                    }}
                    className="w-24 rounded-xl"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Usuń
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-primary/5 p-4">
            <p className="text-sm font-medium">Makro całego przepisu</p>
            <RecipeMacroSummary nutrition={nutrition} className="mt-1 font-medium text-foreground" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Button className="rounded-2xl" disabled={isPending} onClick={handleSubmit}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outline" className="rounded-2xl" onClick={onCancel}>
            Anuluj
          </Button>
        )}
      </div>
    </div>
  );
}
