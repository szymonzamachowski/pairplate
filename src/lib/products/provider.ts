import type { Product } from "@/types/database";

/**
 * Product data provider abstraction.
 * MVP uses Supabase local/custom products.
 * Future: Open Food Facts, barcode scanner, external APIs, AI meal analysis.
 */
export interface ProductSearchParams {
  query: string;
  householdId?: string;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  source: "local" | "open_food_facts" | "external_api" | "mixed";
}

export interface ProductProvider {
  search(params: ProductSearchParams): Promise<ProductSearchResult>;
  getByBarcode?(barcode: string): Promise<Product | null>;
}

export interface CreateCustomProductInput {
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  brand?: string;
  barcode?: string;
  household_id: string;
}

export interface AiMealAnalysisInput {
  type: "text" | "image";
  payload: Record<string, unknown>;
  householdId: string;
  profileId?: string;
}

/** Placeholder for future AI meal analysis integration */
export interface AiMealAnalysisProvider {
  analyze(input: AiMealAnalysisInput): Promise<{
    items: Array<{ name: string; grams: number; nutrition: Product }>;
    confidence?: number;
  }>;
}
