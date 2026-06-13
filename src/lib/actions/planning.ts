"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedHousehold } from "@/lib/auth/verify-household";
import { addSoloMeal } from "@/lib/actions/meals";
import { buildMealItemFromProduct } from "@/lib/meals/utils";
import type { MealType, ProductCategory } from "@/types/database";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function addPlannedMeal(input: {
  householdId: string;
  profileId: string;
  planDate: string;
  mealType: MealType;
  name: string;
  items: Array<{
    product_id: string | null;
    product_name: string;
    grams: number;
  }>;
  savedRecipeId?: string;
}) {
  const supabase = await createClient();

  const { data: plannedMeal, error } = await supabase
    .from("planned_meals")
    .insert({
      household_id: input.householdId,
      profile_id: input.profileId,
      plan_date: input.planDate,
      meal_type: input.mealType,
      name: input.name,
      saved_recipe_id: input.savedRecipeId,
    })
    .select("id")
    .single();

  if (error || !plannedMeal) return { error: error?.message };

  if (input.items.length > 0) {
    await supabase.from("planned_meal_items").insert(
      input.items.map((item, index) => ({
        planned_meal_id: plannedMeal.id,
        product_id: item.product_id,
        product_name: item.product_name,
        grams: item.grams,
        sort_order: index,
      }))
    );
  }

  await regenerateShoppingList(input.householdId);
  revalidatePath("/plan");
  revalidatePath("/shopping");
  return { success: true };
}

export async function deletePlannedMeal(plannedMealId: string, householdId: string) {
  const supabase = await createClient();
  await supabase.from("planned_meal_items").delete().eq("planned_meal_id", plannedMealId);
  await supabase.from("planned_meals").delete().eq("id", plannedMealId);
  await regenerateShoppingList(householdId);
  revalidatePath("/plan");
  revalidatePath("/shopping");
  return { success: true };
}

export async function getPlannedMeals(householdId: string, fromDate: string, toDate: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("planned_meals")
    .select("*, planned_meal_items(*), profiles(name, accent_color)")
    .eq("household_id", householdId)
    .gte("plan_date", fromDate)
    .lte("plan_date", toDate)
    .order("plan_date")
    .order("meal_type");

  return data ?? [];
}

export async function movePlannedMealToDiary(plannedMealId: string, profileId: string) {
  const supabase = await createClient();

  const { data: plannedMeal } = await supabase
    .from("planned_meals")
    .select("*, planned_meal_items(*)")
    .eq("id", plannedMealId)
    .single();

  if (!plannedMeal) return { error: "Nie znaleziono zaplanowanego posiłku" };

  const items = [];
  for (const item of plannedMeal.planned_meal_items ?? []) {
    if (item.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .single();
      if (product) {
        items.push(buildMealItemFromProduct(product, Number(item.grams)));
        continue;
      }
    }
    items.push({
      product_id: item.product_id,
      product_name: item.product_name,
      grams: Number(item.grams),
      kcal: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0,
    });
  }

  await addSoloMeal({
    householdId: plannedMeal.household_id,
    profileId,
    mealType: plannedMeal.meal_type as MealType,
    logDate: format(new Date(), "yyyy-MM-dd"),
    name: plannedMeal.name,
    items,
  });

  revalidatePath("/today");
  revalidatePath("/plan");
  return { success: true };
}

export async function regenerateShoppingList(householdId: string) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const future = format(new Date(Date.now() + 14 * 86400000), "yyyy-MM-dd");

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("household_id", householdId)
    .eq("is_manual", false);

  const { data: plannedMeals } = await supabase
    .from("planned_meals")
    .select("id, planned_meal_items(*, products(category))")
    .eq("household_id", householdId)
    .gte("plan_date", today)
    .lte("plan_date", future);

  const aggregated = new Map<
    string,
    {
      product_id: string | null;
      product_name: string;
      grams: number;
      category: ProductCategory;
      planned_meal_id: string;
    }
  >();

  for (const meal of plannedMeals ?? []) {
    for (const item of meal.planned_meal_items ?? []) {
      const key = `${item.product_id ?? item.product_name}`;
      const existing = aggregated.get(key);
      const category =
        (item.products as { category?: ProductCategory } | null)?.category ?? "other";

      if (existing) {
        existing.grams += Number(item.grams);
      } else {
        aggregated.set(key, {
          product_id: item.product_id,
          product_name: item.product_name,
          grams: Number(item.grams),
          category,
          planned_meal_id: meal.id,
        });
      }
    }
  }

  const rows = Array.from(aggregated.values()).map((item) => ({
    household_id: householdId,
    product_id: item.product_id,
    product_name: item.product_name,
    grams: item.grams,
    category: item.category,
    is_manual: false,
    planned_meal_id: item.planned_meal_id,
  }));

  if (rows.length > 0) {
    await supabase.from("shopping_list_items").insert(rows);
  }
}

export async function getShoppingList(householdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("household_id", householdId)
    .order("is_checked")
    .order("category")
    .order("product_name");

  return data ?? [];
}

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const supabase = await createClient();
  await supabase
    .from("shopping_list_items")
    .update({ is_checked: checked })
    .eq("id", itemId);
  revalidatePath("/shopping");
  return { success: true };
}

export async function addManualShoppingItem(
  householdId: string,
  productName: string,
  category: ProductCategory = "other"
) {
  let authContext;
  try {
    authContext = await requireAuthenticatedHousehold();
  } catch {
    return { error: "Brak sesji użytkownika" };
  }

  if (authContext.householdId !== householdId) {
    return { error: "Brak dostępu do listy zakupów" };
  }

  const name = productName.trim();
  if (!name) return { error: "Podaj nazwę produktu" };

  const supabase = authContext.supabase;
  const { data, error } = await supabase
    .from("shopping_list_items")
    .insert({
      household_id: householdId,
      product_name: name,
      category,
      is_manual: true,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/shopping");
  return { success: true, item: data };
}

export async function deleteShoppingItem(itemId: string) {
  const supabase = await createClient();
  await supabase.from("shopping_list_items").delete().eq("id", itemId);
  revalidatePath("/shopping");
  return { success: true };
}
