"use server";

import {
  cacheOffProduct,
  findProductByBarcode,
  offPreviewToProduct,
} from "@/lib/products/cache-product";
import {
  fetchOffProductByBarcode,
  normalizeBarcode,
  searchOffProducts,
} from "@/lib/products/open-food-facts";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";
import { revalidatePath } from "next/cache";

function mergeProducts(local: Product[], remote: Product[]): Product[] {
  const seen = new Set<string>();
  const merged: Product[] = [];

  for (const product of [...local, ...remote]) {
    const key = product.barcode ?? product.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(product);
  }

  return merged.slice(0, 30);
}

async function searchLocalProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  householdId: string
) {
  const trimmed = query.trim();

  if (!trimmed) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .order("name")
      .limit(20);
    return (data ?? []) as Product[];
  }

  const barcode = normalizeBarcode(trimmed);
  if (barcode) {
    const cached = await findProductByBarcode(supabase, barcode, householdId);
    if (cached) return [cached];
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .ilike("name", `%${trimmed}%`)
    .order("name")
    .limit(20);

  return (data ?? []) as Product[];
}

export async function searchProducts(query: string, householdId: string) {
  const supabase = await createClient();
  const local = await searchLocalProducts(supabase, query, householdId);

  const trimmed = query.trim();
  if (trimmed.length < 2) return local;

  try {
    const offHits = await searchOffProducts(trimmed, 12);
    const offProducts = offHits.map((hit) => offPreviewToProduct(hit, householdId));
    return mergeProducts(local, offProducts);
  } catch {
    return local;
  }
}

export async function lookupProductByBarcode(barcode: string, householdId: string) {
  const supabase = await createClient();
  const normalized = normalizeBarcode(barcode);

  if (!normalized) {
    return { error: "Nieprawidłowy kod kreskowy" as const };
  }

  const cached = await findProductByBarcode(supabase, normalized, householdId);
  if (cached) {
    return { product: cached };
  }

  try {
    const offProduct = await fetchOffProductByBarcode(normalized);
    if (!offProduct) {
      return {
        error: "Nie znaleziono produktu w bazie Open Food Facts" as const,
      };
    }

    const product = await cacheOffProduct(offProduct, householdId, supabase);
    if (!product) {
      return { error: "Nie udało się zapisać produktu" as const };
    }

    revalidatePath("/add");
    return { product };
  } catch {
    return { error: "Błąd połączenia z bazą produktów" as const };
  }
}

export async function importOffProduct(barcode: string, householdId: string) {
  const result = await lookupProductByBarcode(barcode, householdId);
  if ("error" in result && result.error) return result;
  if (!result.product) return { error: "Nie znaleziono produktu" as const };

  revalidatePath("/add");
  return { product: result.product };
}

export async function createCustomProduct(input: {
  householdId: string;
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  brand?: string;
  barcode?: string;
  category?: import("@/types/database").ProductCategory;
}) {
  const supabase = await createClient();
  const normalizedBarcode = input.barcode
    ? normalizeBarcode(input.barcode)
    : null;

  const { data, error } = await supabase
    .from("products")
    .insert({
      household_id: input.householdId,
      name: input.name,
      brand: input.brand,
      barcode: normalizedBarcode,
      source: "custom",
      category: input.category ?? "other",
      kcal_per_100g: input.kcal_per_100g,
      protein_per_100g: input.protein_per_100g,
      fat_per_100g: input.fat_per_100g,
      carbs_per_100g: input.carbs_per_100g,
      fiber_per_100g: input.fiber_per_100g ?? 0,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/add");
  return { product: data };
}

export async function toggleFavorite(profileId: string, productId: string) {
  if (productId.startsWith("off-")) {
    return { error: "Najpierw dodaj produkt z wyszukiwania" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("favorite_products")
    .select("id")
    .eq("profile_id", profileId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorite_products").delete().eq("id", existing.id);
  } else {
    await supabase.from("favorite_products").insert({
      profile_id: profileId,
      product_id: productId,
    });
  }

  revalidatePath("/add");
  return { success: true };
}

export async function getProductShortcuts(profileId: string, householdId: string) {
  const supabase = await createClient();
  const { getRecipesWithNutrition } = await import("@/lib/actions/recipes");

  const [favorites, recent, frequent] = await Promise.all([
    supabase
      .from("favorite_products")
      .select("product_id, products(*)")
      .eq("profile_id", profileId)
      .limit(10),
    supabase
      .from("product_usage_stats")
      .select("product_id, products(*), last_used_at")
      .eq("profile_id", profileId)
      .order("last_used_at", { ascending: false })
      .limit(10),
    supabase
      .from("product_usage_stats")
      .select("product_id, products(*), use_count")
      .eq("profile_id", profileId)
      .order("use_count", { ascending: false })
      .limit(10),
  ]);

  const toProduct = (value: unknown): Product | null => {
    if (!value || Array.isArray(value)) return null;
    return value as Product;
  };

  const savedRecipes = await getRecipesWithNutrition(householdId);

  return {
    favorites: (favorites.data ?? [])
      .map((f) => toProduct(f.products))
      .filter((p): p is Product => Boolean(p)),
    recent: (recent.data ?? [])
      .map((r) => toProduct(r.products))
      .filter((p): p is Product => Boolean(p)),
    frequent: (frequent.data ?? [])
      .map((f) => toProduct(f.products))
      .filter((p): p is Product => Boolean(p)),
    savedRecipes,
  };
}
