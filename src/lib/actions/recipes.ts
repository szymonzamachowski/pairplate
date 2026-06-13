"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateRecipeNutritionFromDraft,
  calculateRecipeNutritionFromItems,
  scaleDraftItems,
  type RecipeDraftItem,
  type RecipeWithNutrition,
} from "@/lib/recipes/nutrition";
import { buildMealItemFromProduct } from "@/lib/meals/utils";
import type { Product, SavedRecipe, SavedRecipeItem } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface RecipeItemInput {
  product_id: string | null;
  product_name: string;
  grams: number;
}

async function fetchProductsForItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: Array<{ product_id: string | null }>
): Promise<Map<string, Product>> {
  const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[];
  if (ids.length === 0) return new Map();

  const { data } = await supabase.from("products").select("*").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p as Product]));
}

export async function getSavedRecipes(householdId: string): Promise<SavedRecipe[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_recipes")
    .select("*, saved_recipe_items(*)")
    .eq("household_id", householdId)
    .order("name");

  return (data ?? []) as SavedRecipe[];
}

export async function getRecipesWithNutrition(
  householdId: string
): Promise<RecipeWithNutrition[]> {
  const recipes = await getSavedRecipes(householdId);
  const supabase = await createClient();

  return Promise.all(
    recipes.map(async (recipe) => {
      const items = recipe.saved_recipe_items ?? [];
      const products = await fetchProductsForItems(supabase, items);

      return {
        ...recipe,
        itemCount: items.length,
        nutrition: calculateRecipeNutritionFromItems(items, products),
      };
    })
  );
}

export async function resolveRecipeDraftItems(
  recipeId: string,
  portion = 1
): Promise<{ recipe: SavedRecipe; items: RecipeDraftItem[] } | { error: string }> {
  const supabase = await createClient();
  const { data: recipe, error } = await supabase
    .from("saved_recipes")
    .select("*, saved_recipe_items(*)")
    .eq("id", recipeId)
    .single();

  if (error || !recipe) {
    return { error: error?.message ?? "Nie znaleziono przepisu" };
  }

  const items = ((recipe.saved_recipe_items ?? []) as SavedRecipeItem[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const products = await fetchProductsForItems(supabase, items);

  const draftItems: RecipeDraftItem[] = items.map((item) => {
    const product =
      (item.product_id ? products.get(item.product_id) : null) ??
      ({
        id: item.product_id ?? item.id,
        household_id: null,
        name: item.product_name,
        brand: null,
        barcode: null,
        source: "local",
        category: "other",
        kcal_per_100g: 0,
        protein_per_100g: 0,
        fat_per_100g: 0,
        carbs_per_100g: 0,
        fiber_per_100g: 0,
        created_at: "",
        updated_at: "",
      } as Product);

    return {
      product,
      grams: Number(item.grams),
    };
  });

  return {
    recipe: recipe as SavedRecipe,
    items: scaleDraftItems(draftItems, portion),
  };
}

export async function saveRecipe(input: {
  householdId: string;
  name: string;
  sourceUrl?: string;
  description?: string;
  items: RecipeItemInput[];
}) {
  const supabase = await createClient();
  const { data: recipe, error } = await supabase
    .from("saved_recipes")
    .insert({
      household_id: input.householdId,
      name: input.name,
      description:
        input.sourceUrl
          ? `Źródło: ${input.sourceUrl}${input.description ? `\n${input.description}` : ""}`
          : input.description ?? null,
    })
    .select("id")
    .single();

  if (error || !recipe) return { error: error?.message };

  if (input.items.length > 0) {
    await supabase.from("saved_recipe_items").insert(
      input.items.map((item, index) => ({
        recipe_id: recipe.id,
        product_id: item.product_id,
        product_name: item.product_name,
        grams: item.grams,
        sort_order: index,
      }))
    );
  }

  revalidatePath("/recipes");
  revalidatePath("/add");
  return { success: true, recipeId: recipe.id };
}

export async function updateRecipe(input: {
  recipeId: string;
  name: string;
  sourceUrl?: string;
  description?: string;
  items: RecipeItemInput[];
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("saved_recipes")
    .update({
      name: input.name,
      description:
        input.sourceUrl
          ? `Źródło: ${input.sourceUrl}${input.description ? `\n${input.description}` : ""}`
          : input.description ?? null,
    })
    .eq("id", input.recipeId);

  if (error) return { error: error.message };

  await supabase.from("saved_recipe_items").delete().eq("recipe_id", input.recipeId);

  if (input.items.length > 0) {
    await supabase.from("saved_recipe_items").insert(
      input.items.map((item, index) => ({
        recipe_id: input.recipeId,
        product_id: item.product_id,
        product_name: item.product_name,
        grams: item.grams,
        sort_order: index,
      }))
    );
  }

  revalidatePath("/recipes");
  revalidatePath("/add");
  return { success: true };
}

export async function deleteRecipe(recipeId: string) {
  const supabase = await createClient();
  await supabase.from("saved_recipe_items").delete().eq("recipe_id", recipeId);
  const { error } = await supabase.from("saved_recipes").delete().eq("id", recipeId);

  if (error) return { error: error.message };

  revalidatePath("/recipes");
  revalidatePath("/add");
  return { success: true };
}

export async function buildMealItemsFromRecipe(recipeId: string, portion = 1) {
  const resolved = await resolveRecipeDraftItems(recipeId, portion);
  if ("error" in resolved) return resolved;

  return {
    recipe: resolved.recipe,
    items: resolved.items.map((item) =>
      buildMealItemFromProduct(item.product, item.grams)
    ),
    nutrition: calculateRecipeNutritionFromDraft(resolved.items),
  };
}
