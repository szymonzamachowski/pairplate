"use server";

import { createClient } from "@/lib/supabase/server";
import { getRecipesWithNutrition } from "@/lib/actions/recipes";
import type { Product, ProductCategory } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function searchProducts(query: string, householdId: string) {
  const supabase = await createClient();
  const trimmed = query.trim();

  if (!trimmed) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .order("name")
      .limit(20);
    return data ?? [];
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .ilike("name", `%${trimmed}%`)
    .order("name")
    .limit(30);

  return data ?? [];
}

export async function createCustomProduct(input: {
  householdId: string;
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  brand?: string;
  barcode?: string;
  category?: ProductCategory;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      household_id: input.householdId,
      name: input.name,
      brand: input.brand,
      barcode: input.barcode,
      source: "custom",
      category: input.category ?? "other",
      kcal_per_100g: input.kcal_per_100g,
      protein_per_100g: input.protein_per_100g,
      fat_per_100g: input.fat_per_100g,
      carbs_per_100g: input.carbs_per_100g,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/add");
  return { product: data };
}

export async function toggleFavorite(profileId: string, productId: string) {
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
