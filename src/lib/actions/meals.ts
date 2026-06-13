"use server";

import { createClient } from "@/lib/supabase/server";
import {
  splitNutritionByRatio,
  sumNutrition,
} from "@/lib/nutrition/calculator";
import type { MealItemInput } from "@/lib/meals/utils";
export type { MealItemInput } from "@/lib/meals/utils";
import type { MealType, NutritionTotals } from "@/types/database";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

async function upsertDailyLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  logDate: string
) {
  const { data: entries } = await supabase
    .from("meal_entries")
    .select("total_kcal, total_protein_g, total_fat_g, total_carbs_g")
    .eq("profile_id", profileId)
    .eq("log_date", logDate);

  const totals = sumNutrition(
    (entries ?? []).map((e) => ({
      kcal: Number(e.total_kcal),
      protein_g: Number(e.total_protein_g),
      fat_g: Number(e.total_fat_g),
      carbs_g: Number(e.total_carbs_g),
    }))
  );

  await supabase.from("daily_logs").upsert(
    {
      profile_id: profileId,
      log_date: logDate,
      total_kcal: totals.kcal,
      total_protein_g: totals.protein_g,
      total_fat_g: totals.fat_g,
      total_carbs_g: totals.carbs_g,
    },
    { onConflict: "profile_id,log_date" }
  );
}

async function trackProductUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  productId: string
) {
  const { data: existing } = await supabase
    .from("product_usage_stats")
    .select("*")
    .eq("profile_id", profileId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("product_usage_stats")
      .update({
        use_count: existing.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("product_usage_stats").insert({
      profile_id: profileId,
      product_id: productId,
      use_count: 1,
    });
  }
}

export async function addSoloMeal(input: {
  householdId: string;
  profileId: string;
  mealType: MealType;
  logDate?: string;
  name?: string;
  items: MealItemInput[];
}) {
  const supabase = await createClient();
  const logDate = input.logDate ?? format(new Date(), "yyyy-MM-dd");
  const totals = sumNutrition(
    input.items.map((i) => ({
      kcal: i.kcal,
      protein_g: i.protein_g,
      fat_g: i.fat_g,
      carbs_g: i.carbs_g,
    }))
  );

  const { data: mealEntry, error } = await supabase
    .from("meal_entries")
    .insert({
      household_id: input.householdId,
      profile_id: input.profileId,
      log_date: logDate,
      meal_type: input.mealType,
      name: input.name,
      is_shared: false,
      total_kcal: totals.kcal,
      total_protein_g: totals.protein_g,
      total_fat_g: totals.fat_g,
      total_carbs_g: totals.carbs_g,
    })
    .select("id")
    .single();

  if (error || !mealEntry) return { error: error?.message ?? "Błąd zapisu posiłku" };

  await supabase.from("meal_items").insert(
    input.items.map((item, index) => ({
      meal_entry_id: mealEntry.id,
      product_id: item.product_id,
      product_name: item.product_name,
      grams: item.grams,
      kcal: item.kcal,
      protein_g: item.protein_g,
      fat_g: item.fat_g,
      carbs_g: item.carbs_g,
      sort_order: index,
    }))
  );

  for (const item of input.items) {
    if (item.product_id) {
      await trackProductUsage(supabase, input.profileId, item.product_id);
    }
  }

  await upsertDailyLog(supabase, input.profileId, logDate);
  revalidatePath("/today");
  revalidatePath("/add");
  return { success: true };
}

export async function addSharedMeal(input: {
  householdId: string;
  activeProfileId: string;
  partnerProfileId: string;
  mealType: MealType;
  logDate?: string;
  name?: string;
  items: MealItemInput[];
  totalWeightG: number;
  activeProfileGrams: number;
  partnerProfileGrams: number;
}) {
  const supabase = await createClient();
  const logDate = input.logDate ?? format(new Date(), "yyyy-MM-dd");

  const dishTotals = sumNutrition(
    input.items.map((i) => ({
      kcal: i.kcal,
      protein_g: i.protein_g,
      fat_g: i.fat_g,
      carbs_g: i.carbs_g,
    }))
  );

  const activePortion = splitNutritionByRatio(
    dishTotals,
    input.activeProfileGrams,
    input.totalWeightG
  );
  const partnerPortion = splitNutritionByRatio(
    dishTotals,
    input.partnerProfileGrams,
    input.totalWeightG
  );

  const { data: sharedMeal, error: sharedError } = await supabase
    .from("shared_meals")
    .insert({
      household_id: input.householdId,
      log_date: logDate,
      meal_type: input.mealType,
      name: input.name,
      total_weight_g: input.totalWeightG,
      profile_a_id: input.activeProfileId,
      profile_b_id: input.partnerProfileId,
      profile_a_grams: input.activeProfileGrams,
      profile_b_grams: input.partnerProfileGrams,
      total_kcal: dishTotals.kcal,
      total_protein_g: dishTotals.protein_g,
      total_fat_g: dishTotals.fat_g,
      total_carbs_g: dishTotals.carbs_g,
    })
    .select("id")
    .single();

  if (sharedError || !sharedMeal) {
    return { error: sharedError?.message ?? "Błąd zapisu wspólnego posiłku" };
  }

  const profiles = [
    {
      profileId: input.activeProfileId,
      grams: input.activeProfileGrams,
      totals: activePortion,
    },
    {
      profileId: input.partnerProfileId,
      grams: input.partnerProfileGrams,
      totals: partnerPortion,
    },
  ];

  for (const profile of profiles) {
    const { data: mealEntry } = await supabase
      .from("meal_entries")
      .insert({
        household_id: input.householdId,
        profile_id: profile.profileId,
        log_date: logDate,
        meal_type: input.mealType,
        name: input.name ?? "Posiłek wspólny",
        is_shared: true,
        shared_meal_id: sharedMeal.id,
        total_kcal: profile.totals.kcal,
        total_protein_g: profile.totals.protein_g,
        total_fat_g: profile.totals.fat_g,
        total_carbs_g: profile.totals.carbs_g,
      })
      .select("id")
      .single();

    if (mealEntry) {
      const ratio = profile.grams / input.totalWeightG;
      await supabase.from("meal_items").insert(
        input.items.map((item, index) => ({
          meal_entry_id: mealEntry.id,
          product_id: item.product_id,
          product_name: item.product_name,
          grams: Math.round(item.grams * ratio * 10) / 10,
          kcal: Math.round(item.kcal * ratio * 10) / 10,
          protein_g: Math.round(item.protein_g * ratio * 10) / 10,
          fat_g: Math.round(item.fat_g * ratio * 10) / 10,
          carbs_g: Math.round(item.carbs_g * ratio * 10) / 10,
          sort_order: index,
        }))
      );
    }

    await upsertDailyLog(supabase, profile.profileId, logDate);
  }

  for (const item of input.items) {
    if (item.product_id) {
      await trackProductUsage(supabase, input.activeProfileId, item.product_id);
    }
  }

  revalidatePath("/today");
  revalidatePath("/add");
  return { success: true };
}

export async function deleteMealEntry(mealEntryId: string, profileId: string, logDate: string) {
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("meal_entries")
    .select("shared_meal_id, is_shared")
    .eq("id", mealEntryId)
    .single();

  if (entry?.is_shared && entry.shared_meal_id) {
    const { data: sharedEntries } = await supabase
      .from("meal_entries")
      .select("id, profile_id")
      .eq("shared_meal_id", entry.shared_meal_id);

    for (const sharedEntry of sharedEntries ?? []) {
      await supabase.from("meal_items").delete().eq("meal_entry_id", sharedEntry.id);
      await supabase.from("meal_entries").delete().eq("id", sharedEntry.id);
      await upsertDailyLog(supabase, sharedEntry.profile_id, logDate);
    }

    await supabase.from("shared_meals").delete().eq("id", entry.shared_meal_id);
  } else {
    await supabase.from("meal_items").delete().eq("meal_entry_id", mealEntryId);
    await supabase.from("meal_entries").delete().eq("id", mealEntryId);
    await upsertDailyLog(supabase, profileId, logDate);
  }

  revalidatePath("/today");
  return { success: true };
}

export async function getTodayData(profileId: string, logDate: string) {
  const supabase = await createClient();

  const [{ data: profile }, { data: meals }, { data: dailyLog }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).single(),
    supabase
      .from("meal_entries")
      .select("*, meal_items(*)")
      .eq("profile_id", profileId)
      .eq("log_date", logDate)
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_logs")
      .select("*")
      .eq("profile_id", profileId)
      .eq("log_date", logDate)
      .maybeSingle(),
  ]);

  return { profile, meals: meals ?? [], dailyLog };
}

export async function getDayHistory(profileId: string, limit = 14) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("log_date", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export type { NutritionTotals };
