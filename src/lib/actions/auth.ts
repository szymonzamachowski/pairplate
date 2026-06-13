"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateDailyTargets } from "@/lib/nutrition/calculator";
import { GENDER_ACCENT_COLORS } from "@/lib/constants";
import { suggestTargetWeight, clampTargetWeight } from "@/lib/nutrition/target-weight";
import {
  findOwnedProfile,
  requireAuthenticatedHousehold,
} from "@/lib/auth/verify-household";
import { validateProfileInput } from "@/lib/validation/profile-input";
import type { ActivityLevel, Gender, Goal, GoalPace } from "@/types/database";
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
  goal_pace: GoalPace;
  target_weight_kg: number | null;
  activity_level: ActivityLevel;
}

export async function createProfiles(profileA: ProfileInput, profileB: ProfileInput) {
  const validationA = validateProfileInput(profileA);
  if (validationA.error) return { error: validationA.error };
  const validationB = validateProfileInput(profileB);
  if (validationB.error) return { error: validationB.error };

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
      goal_pace: profile.goal_pace,
      target_weight_kg:
        profile.goal === "maintain"
          ? null
          : clampTargetWeight(
              profile.goal,
              profile.height_cm,
              profile.current_weight_kg,
              profile.target_weight_kg ??
                suggestTargetWeight(
                  profile.goal,
                  profile.height_cm,
                  profile.current_weight_kg
                )
            ),
      activity_level: profile.activity_level,
      daily_calories: targets.daily_calories,
      daily_protein_g: targets.protein_g,
      daily_fat_g: targets.fat_g,
      daily_carbs_g: targets.carbs_g,
      accent_color: GENDER_ACCENT_COLORS[profile.gender],
      sort_order: index,
    };
  });

  const { error } = await supabase.from("profiles").insert(profiles);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/select-profile");
}

export async function updateProfile(profileId: string, input: ProfileInput) {
  const validation = validateProfileInput(input);
  if (validation.error) return { error: validation.error };

  let authContext;
  try {
    authContext = await requireAuthenticatedHousehold();
  } catch {
    return { error: "Brak sesji użytkownika" };
  }

  if (!findOwnedProfile(authContext.profiles, profileId)) {
    return { error: "Profil nie należy do Twojego konta" };
  }

  const supabase = authContext.supabase;
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
      goal_pace: input.goal_pace,
      target_weight_kg:
        input.goal === "maintain"
          ? null
          : clampTargetWeight(
              input.goal,
              input.height_cm,
              input.current_weight_kg,
              input.target_weight_kg
            ),
      activity_level: input.activity_level,
      daily_calories: targets.daily_calories,
      daily_protein_g: targets.protein_g,
      daily_fat_g: targets.fat_g,
      daily_carbs_g: targets.carbs_g,
      accent_color: GENDER_ACCENT_COLORS[input.gender],
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
