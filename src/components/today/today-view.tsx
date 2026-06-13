"use client";

import { CalorieRing } from "@/components/today/calorie-ring";
import { MealSection } from "@/components/today/meal-section";
import { WaterAddSheet } from "@/components/today/water-add-sheet";
import { StitchHeader, StitchPage } from "@/components/layout/stitch-header";
import { StitchDailyNutrients, StitchMacroPills } from "@/components/layout/stitch-macro";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import { MEAL_TYPES } from "@/lib/constants";
import type { DailyLog, MealEntry, Profile } from "@/types/database";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface TodayViewProps {
  initialDataByProfile: Record<
    string,
    {
      meals: MealEntry[];
      dailyLog: DailyLog | null;
      waterMl: number;
    }
  >;
}

export function TodayView({ initialDataByProfile }: TodayViewProps) {
  const router = useRouter();
  const { activeProfile, isReady } = useActiveProfile();
  const profile = activeProfile as Profile | undefined;
  const data = profile ? initialDataByProfile[profile.id] : null;
  const logDate = format(new Date(), "yyyy-MM-dd");
  const [waterSheetOpen, setWaterSheetOpen] = useState(false);

  const mealsByType = useMemo(() => {
    const grouped: Record<string, MealEntry[]> = {};
    for (const type of MEAL_TYPES) grouped[type] = [];
    for (const meal of data?.meals ?? []) {
      grouped[meal.meal_type]?.push(meal);
    }
    return grouped;
  }, [data?.meals]);

  if (!isReady || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  const consumed = Number(data?.dailyLog?.total_kcal ?? 0);
  const protein = Number(data?.dailyLog?.total_protein_g ?? 0);
  const fat = Number(data?.dailyLog?.total_fat_g ?? 0);
  const carbs = Number(data?.dailyLog?.total_carbs_g ?? 0);
  const fiber = Number(data?.dailyLog?.total_fiber_g ?? 0);
  const displayWaterMl = Number(
    data?.waterMl ?? data?.dailyLog?.total_water_ml ?? 0
  );
  const remaining = Math.max(0, profile.daily_calories - consumed);

  return (
    <>
      <StitchHeader variant="brand" />
      <StitchPage>
        <section className="space-y-1">
          <p className="text-sm capitalize text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM", { locale: pl })}
          </p>
          <h2 className="text-2xl font-medium tracking-[0.01em] text-foreground">
            Dzień dobry, {profile.name}
          </h2>
        </section>

        <section
          className="overflow-hidden rounded-2xl border border-border/40 bg-card p-6"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <CalorieRing
            consumed={consumed}
            target={profile.daily_calories}
            accentColor={profile.accent_color}
            centerValue={remaining}
            centerLabel="kcal pozostało"
          />
          <StitchMacroPills
            protein={protein}
            proteinTarget={Number(profile.daily_protein_g)}
            carbs={carbs}
            carbsTarget={Number(profile.daily_carbs_g)}
            fat={fat}
            fatTarget={Number(profile.daily_fat_g)}
          />
          <StitchDailyNutrients
            fiber={fiber}
            fiberTarget={Number(profile.daily_fiber_g)}
            water={displayWaterMl}
            waterTarget={Number(profile.daily_water_ml)}
            onAddWater={() => setWaterSheetOpen(true)}
          />
        </section>

        <section className="space-y-6">
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={mealsByType[mealType] ?? []}
              profileId={profile.id}
              logDate={logDate}
            />
          ))}
        </section>
      </StitchPage>

      <WaterAddSheet
        open={waterSheetOpen}
        onOpenChange={setWaterSheetOpen}
        profileId={profile.id}
        logDate={logDate}
        onAdded={() => {
          router.refresh();
        }}
      />
    </>
  );
}
