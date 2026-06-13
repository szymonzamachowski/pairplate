"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateDailyTargets } from "@/lib/nutrition/calculator";
import { PROFILE_COLORS } from "@/lib/constants";
import type { ActivityLevel, Gender, Goal } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/today");
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    await supabase.from("households").insert({
      user_id: data.user.id,
      name: "PairPlate",
    });
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface ProfileInput {
  name: string;
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal: Goal;
  activity_level: ActivityLevel;
}

export async function createProfiles(profileA: ProfileInput, profileB: ProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Brak sesji użytkownika" };

  let { data: household } = await supabase
    .from("households")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!household) {
    const { data: newHousehold, error } = await supabase
      .from("households")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (error) return { error: error.message };
    household = newHousehold;
  }

  const profiles = [profileA, profileB].map((profile, index) => {
    const targets = calculateDailyTargets(profile);
    return {
      household_id: household!.id,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      height_cm: profile.height_cm,
      current_weight_kg: profile.current_weight_kg,
      goal: profile.goal,
      activity_level: profile.activity_level,
      daily_calories: targets.daily_calories,
      daily_protein_g: targets.protein_g,
      daily_fat_g: targets.fat_g,
      daily_carbs_g: targets.carbs_g,
      accent_color: PROFILE_COLORS[index],
      sort_order: index,
    };
  });

  const { error } = await supabase.from("profiles").insert(profiles);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/select-profile");
}

export async function updateProfile(profileId: string, input: ProfileInput) {
  const supabase = await createClient();
  const targets = calculateDailyTargets(input);

  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      gender: input.gender,
      age: input.age,
      height_cm: input.height_cm,
      current_weight_kg: input.current_weight_kg,
      goal: input.goal,
      activity_level: input.activity_level,
      daily_calories: targets.daily_calories,
      daily_protein_g: targets.protein_g,
      daily_fat_g: targets.fat_g,
      daily_carbs_g: targets.carbs_g,
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
