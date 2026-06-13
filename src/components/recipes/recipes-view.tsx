"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RecipeBuilder } from "@/components/recipes/recipe-builder";
import { RecipeMacroSummary } from "@/components/recipes/recipe-macro-summary";
import {
  RecipePickerSheet,
} from "@/components/recipes/recipe-picker-sheet";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import {
  deleteRecipe,
  resolveRecipeDraftItems,
  saveRecipe,
  updateRecipe,
} from "@/lib/actions/recipes";
import type { RecipeDraftItem, RecipeWithNutrition } from "@/lib/recipes/nutrition";
import type { SavedRecipe } from "@/types/database";
import { ExternalLink, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ViewMode = "list" | "create" | "edit";

export function RecipesView({
  householdId,
  initialRecipes,
}: {
  householdId: string;
  initialRecipes: RecipeWithNutrition[];
}) {
  const { activeProfile } = useActiveProfile();
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [view, setView] = useState<ViewMode>("list");
  const [detailRecipe, setDetailRecipe] = useState<RecipeWithNutrition | null>(null);
  const [editRecipe, setEditRecipe] = useState<SavedRecipe | null>(null);
  const [editItems, setEditItems] = useState<RecipeDraftItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function openEdit(recipe: RecipeWithNutrition) {
    const resolved = await resolveRecipeDraftItems(recipe.id, 1);
    if ("error" in resolved) {
      toast.error(resolved.error);
      return;
    }
    setEditRecipe(resolved.recipe);
    setEditItems(resolved.items);
    setView("edit");
  }

  async function handleDelete(recipeId: string) {
    startTransition(async () => {
      const result = await deleteRecipe(recipeId);
      if (result.error) toast.error(result.error);
      else {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        setDetailRecipe(null);
        toast.success("Usunięto przepis");
      }
    });
  }

  if (view === "create") {
    return (
      <div className="space-y-6 px-4 pt-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nowy przepis</h1>
          <p className="text-sm text-muted-foreground">
            Dodaj przepis z internetu — wyszukaj składniki, aplikacja policzy makro
          </p>
        </div>
        <RecipeBuilder
          householdId={householdId}
          submitLabel="Zapisz przepis"
          onCancel={() => setView("list")}
          onSubmit={async (value) => {
            const result = await saveRecipe({
              householdId,
              name: value.name,
              sourceUrl: value.sourceUrl || undefined,
              description: value.notes || undefined,
              items: value.items.map((item) => ({
                product_id: item.product.id,
                product_name: item.product.name,
                grams: item.grams,
              })),
            });
            if (!result.error) {
              setView("list");
              router.refresh();
            }
            return result;
          }}
        />
      </div>
    );
  }

  if (view === "edit" && editRecipe) {
    return (
      <div className="space-y-6 px-4 pt-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edytuj przepis</h1>
        </div>
        <RecipeBuilder
          householdId={householdId}
          initialRecipe={editRecipe}
          initialItems={editItems}
          submitLabel="Zapisz zmiany"
          onCancel={() => setView("list")}
          onSubmit={async (value) => {
            const result = await updateRecipe({
              recipeId: editRecipe.id,
              name: value.name,
              sourceUrl: value.sourceUrl || undefined,
              description: value.notes || undefined,
              items: value.items.map((item) => ({
                product_id: item.product.id,
                product_name: item.product.name,
                grams: item.grams,
              })),
            });
            if (!result.error) {
              setView("list");
              router.refresh();
            }
            return result;
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 pt-5 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="pp-label-caps text-[11px] text-muted-foreground">Biblioteka</p>
          <h1 className="text-2xl font-medium tracking-[0.01em]">Przepisy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zapisane dania z makro — dodawaj całość jednym kliknięciem
          </p>
        </div>
        <Button
          size="icon"
          className="shrink-0 rounded-full"
          onClick={() => setView("create")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      {recipes.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/60 shadow-none">
          <CardContent className="space-y-4 p-6 text-center">
            <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Znajdź przepis w internecie, dodaj składniki z bazy produktów — makro
              policzy się automatycznie.
            </p>
            <Button className="rounded-2xl" onClick={() => setView("create")}>
              Dodaj pierwszy przepis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setDetailRecipe(recipe)}
              className="pp-card w-full p-4 text-left transition hover:-translate-y-0.5"
            >
              <p className="font-semibold">{recipe.name}</p>
              <RecipeMacroSummary nutrition={recipe.nutrition} className="mt-1" />
              <p className="mt-2 text-xs text-muted-foreground">
                {recipe.itemCount} składników
              </p>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!detailRecipe} onOpenChange={(open) => !open && setDetailRecipe(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl px-4 pb-8">
          {detailRecipe && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{detailRecipe.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-y-auto">
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-sm font-medium">Makro przepisu</p>
                  <RecipeMacroSummary
                    nutrition={detailRecipe.nutrition}
                    className="mt-1 font-medium text-foreground"
                  />
                </div>

                {detailRecipe.description?.includes("Źródło: ") && (
                  <a
                    href={
                      detailRecipe.description
                        .split("\n")[0]
                        ?.replace("Źródło: ", "") ?? "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Otwórz źródło w internecie
                  </a>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Składniki</p>
                  {(detailRecipe.saved_recipe_items ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span>{item.product_name}</span>
                      <span className="text-muted-foreground">
                        {Math.round(Number(item.grams))} g
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Button
                    className="rounded-2xl"
                    onClick={() => {
                      setPickerOpen(true);
                    }}
                  >
                    Dodaj do dziennika
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => openEdit(detailRecipe)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-2xl text-destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(detailRecipe.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {activeProfile && detailRecipe && (
        <RecipePickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          householdId={householdId}
          profileId={activeProfile.id}
          recipes={[detailRecipe]}
          mode="add"
        />
      )}
    </div>
  );
}
