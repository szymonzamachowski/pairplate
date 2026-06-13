import {
  calculateProductNutrition,
  sumNutrition,
} from "@/lib/nutrition/calculator";
import type { NutritionTotals, Product, SavedRecipe, SavedRecipeItem } from "@/types/database";

export interface RecipeDraftItem {
  product: Product;
  grams: number;
}

export interface RecipeWithNutrition extends SavedRecipe {
  nutrition: NutritionTotals;
  itemCount: number;
}

export function calculateRecipeNutritionFromDraft(
  items: RecipeDraftItem[]
): NutritionTotals {
  return sumNutrition(
    items.map((item) => calculateProductNutrition(item.product, item.grams))
  );
}

export function calculateRecipeNutritionFromItems(
  items: SavedRecipeItem[],
  productsById: Map<string, Product>
): NutritionTotals {
  const draftItems: RecipeDraftItem[] = items.map((item) => {
    const product =
      (item.product_id ? productsById.get(item.product_id) : null) ??
      fallbackProduct(item);

    return {
      product,
      grams: Number(item.grams),
    };
  });

  return calculateRecipeNutritionFromDraft(draftItems);
}

export function scaleDraftItems(
  items: RecipeDraftItem[],
  portion: number
): RecipeDraftItem[] {
  return items.map((item) => ({
    product: item.product,
    grams: Math.round(item.grams * portion * 10) / 10,
  }));
}

function fallbackProduct(item: SavedRecipeItem): Product {
  return {
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
    created_at: "",
    updated_at: "",
  };
}

export function formatMacroSummary(nutrition: NutritionTotals): string {
  return `${Math.round(nutrition.kcal)} kcal · B ${Math.round(nutrition.protein_g)} · W ${Math.round(nutrition.carbs_g)} · T ${Math.round(nutrition.fat_g)}`;
}
