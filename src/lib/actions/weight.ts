"use server";

import { createClient } from "@/lib/supabase/server";
import {
  findOwnedProfile,
  requireAuthenticatedHousehold,
} from "@/lib/auth/verify-household";
import { validateWeightKg } from "@/lib/validation/profile-input";
import { revalidatePath } from "next/cache";

export async function addWeightLog(profileId: string, weightKg: number, loggedAt: string) {
  const validation = validateWeightKg(weightKg);
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

  const { error: logError } = await supabase.from("weight_logs").insert({
    profile_id: profileId,
    weight_kg: weightKg,
    logged_at: loggedAt,
  });

  if (logError) return { error: logError.message };

  await supabase
    .from("profiles")
    .update({ current_weight_kg: weightKg })
    .eq("id", profileId);

  revalidatePath("/profile");
  return { success: true };
}

export async function getWeightHistory(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("logged_at", { ascending: true });

  return data ?? [];
}

export async function updateWeightReminder(
  profileId: string,
  daysOfWeek: number[],
  enabled: boolean
) {
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
  const { data: existing } = await supabase
    .from("weight_reminder_settings")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("weight_reminder_settings")
      .update({ days_of_week: daysOfWeek, enabled })
      .eq("id", existing.id);
  } else {
    await supabase.from("weight_reminder_settings").insert({
      profile_id: profileId,
      days_of_week: daysOfWeek,
      enabled,
    });
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function getWeightReminder(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weight_reminder_settings")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return data;
}
