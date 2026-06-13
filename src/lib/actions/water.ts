"use server";

import {
  findOwnedProfile,
  requireAuthenticatedHousehold,
} from "@/lib/auth/verify-household";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

function validateWaterAmountMl(amountMl: number): string | null {
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    return "Podaj dodatnią ilość wody";
  }
  if (amountMl > 5000) {
    return "Maksymalnie 5000 ml na jedno dodanie";
  }
  return null;
}

async function syncDailyWaterTotal(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  profileId: string,
  logDate: string
) {
  const { data: entries } = await supabase
    .from("water_logs")
    .select("amount_ml")
    .eq("profile_id", profileId)
    .eq("log_date", logDate);

  const totalWaterMl = (entries ?? []).reduce(
    (sum, entry) => sum + Number(entry.amount_ml),
    0
  );

  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("profile_id", profileId)
    .eq("log_date", logDate)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("daily_logs")
      .update({ total_water_ml: totalWaterMl })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("daily_logs").insert({
    profile_id: profileId,
    log_date: logDate,
    total_water_ml: totalWaterMl,
  });
}

export async function addWaterIntake(
  profileId: string,
  amountMl: number,
  logDate?: string
) {
  const validationError = validateWaterAmountMl(amountMl);
  if (validationError) return { error: validationError };

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
  const date = logDate ?? format(new Date(), "yyyy-MM-dd");
  const roundedAmount = Math.round(amountMl);

  const { error } = await supabase.from("water_logs").insert({
    profile_id: profileId,
    log_date: date,
    amount_ml: roundedAmount,
  });

  if (error) return { error: error.message };

  await syncDailyWaterTotal(supabase, profileId, date);
  revalidatePath("/today");
  return { success: true, totalAdded: roundedAmount };
}

export async function getDailyWaterTotal(profileId: string, logDate: string) {
  const supabase = await (
    await import("@/lib/supabase/server")
  ).createClient();

  const { data } = await supabase
    .from("water_logs")
    .select("amount_ml")
    .eq("profile_id", profileId)
    .eq("log_date", logDate);

  return (data ?? []).reduce((sum, entry) => sum + Number(entry.amount_ml), 0);
}
