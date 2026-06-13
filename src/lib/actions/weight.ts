"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addWeightLog(profileId: string, weightKg: number, loggedAt: string) {
  const supabase = await createClient();

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
  const supabase = await createClient();
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
