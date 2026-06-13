import { TodayView } from "@/components/today/today-view";
import { requireProfiles } from "@/lib/auth/context";
import type { DailyLog, MealEntry } from "@/types/database";
import { format } from "date-fns";

export default async function TodayPage() {
  const { profiles, supabase } = await requireProfiles();
  const logDate = format(new Date(), "yyyy-MM-dd");

  const initialDataByProfile: Record<
    string,
    { meals: MealEntry[]; dailyLog: DailyLog | null; waterMl: number }
  > = {};

  await Promise.all(
    profiles.map(async (profile) => {
      const [{ data: meals }, { data: dailyLog }, { data: waterLogs }] =
        await Promise.all([
          supabase
            .from("meal_entries")
            .select("*, meal_items(*)")
            .eq("profile_id", profile.id)
            .eq("log_date", logDate)
            .order("created_at", { ascending: true }),
          supabase
            .from("daily_logs")
            .select("*")
            .eq("profile_id", profile.id)
            .eq("log_date", logDate)
            .maybeSingle(),
          supabase
            .from("water_logs")
            .select("amount_ml")
            .eq("profile_id", profile.id)
            .eq("log_date", logDate),
        ]);

      const waterMl = (waterLogs ?? []).reduce(
        (sum, entry) => sum + Number(entry.amount_ml),
        0
      );

      initialDataByProfile[profile.id] = {
        meals: (meals ?? []) as MealEntry[],
        dailyLog: dailyLog as DailyLog | null,
        waterMl,
      };
    })
  );

  return <TodayView initialDataByProfile={initialDataByProfile} />;
}
