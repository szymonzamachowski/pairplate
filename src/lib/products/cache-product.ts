import type { MappedOffProduct } from "@/lib/products/open-food-facts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function findProductByBarcode(
  supabase: SupabaseClient,
  barcode: string,
  householdId: string
): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order("household_id", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  return (data as Product | null) ?? null;
}

export async function cacheOffProduct(
  mapped: MappedOffProduct,
  householdId: string,
  userSupabase: SupabaseClient
): Promise<Product | null> {
  const row = {
    household_id: null,
    name: mapped.name,
    brand: mapped.brand,
    barcode: mapped.barcode,
    source: "open_food_facts" as const,
    category: mapped.category,
    kcal_per_100g: mapped.kcal_per_100g,
    protein_per_100g: mapped.protein_per_100g,
    fat_per_100g: mapped.fat_per_100g,
    carbs_per_100g: mapped.carbs_per_100g,
  };

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("products")
      .select("*")
      .eq("barcode", mapped.barcode)
      .is("household_id", null)
      .maybeSingle();

    if (existing) return existing as Product;

    const { data, error } = await admin
      .from("products")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      const { data: raced } = await admin
        .from("products")
        .select("*")
        .eq("barcode", mapped.barcode)
        .is("household_id", null)
        .maybeSingle();
      return (raced as Product | null) ?? null;
    }

    return data as Product;
  } catch {
    const { data: householdCached } = await userSupabase
      .from("products")
      .select("*")
      .eq("barcode", mapped.barcode)
      .eq("household_id", householdId)
      .maybeSingle();

    if (householdCached) return householdCached as Product;

    const { data, error } = await userSupabase
      .from("products")
      .insert({ ...row, household_id: householdId })
      .select("*")
      .single();

    if (error) return null;
    return data as Product;
  }
}

export function offPreviewToProduct(
  mapped: MappedOffProduct,
  householdId: string
): Product {
  return {
    id: `off-${mapped.barcode}`,
    household_id: householdId,
    name: mapped.name,
    brand: mapped.brand,
    barcode: mapped.barcode,
    source: "open_food_facts",
    category: mapped.category,
    kcal_per_100g: mapped.kcal_per_100g,
    protein_per_100g: mapped.protein_per_100g,
    fat_per_100g: mapped.fat_per_100g,
    carbs_per_100g: mapped.carbs_per_100g,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
