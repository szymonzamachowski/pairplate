import { calculateProductNutrition } from "@/lib/nutrition/calculator";
import type { Product } from "@/types/database";

export interface MealItemInput {
  product_id: string | null;
  product_name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export function buildMealItemFromProduct(
  product: Product,
  grams: number
): MealItemInput {
  const nutrition = calculateProductNutrition(product, grams);
  return {
    product_id: product.id,
    product_name: product.name,
    grams,
    kcal: nutrition.kcal,
    protein_g: nutrition.protein_g,
    fat_g: nutrition.fat_g,
    carbs_g: nutrition.carbs_g,
    fiber_g: nutrition.fiber_g,
  };
}
