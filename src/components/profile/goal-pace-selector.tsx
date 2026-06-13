"use client";

import {
  calculateDailyTargets,
  type ProfileNutritionInput,
} from "@/lib/nutrition/calculator";
import {
  GOAL_PACE_OPTIONS,
  goalPaceApplies,
  goalPaceDisclaimer,
} from "@/lib/nutrition/goal-pace";
import type { Goal, GoalPace } from "@/types/database";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface GoalPaceSelectorProps {
  profile: ProfileNutritionInput;
  onChange: (pace: GoalPace) => void;
  className?: string;
}

export function GoalPaceSelector({
  profile,
  onChange,
  className,
}: GoalPaceSelectorProps) {
  const preview = useMemo(
    () => calculateDailyTargets(profile),
    [profile]
  );

  if (!goalPaceApplies(profile.goal)) {
    return (
      <div className={cn("rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground", className)}>
        Przy utrzymaniu wagi dzienne zapotrzebowanie = TDEE (
        {preview.tdee} kcal).
      </div>
    );
  }

  const disclaimer = goalPaceDisclaimer(profile.goal);
  const direction = profile.goal === "loss" ? "redukcji" : "masy";

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="pp-label-caps mb-1 text-[11px] text-muted-foreground">
          Tempo {direction}
        </p>
        <p className="text-sm text-muted-foreground">
          Wybierz, jak szybko chcesz {profile.goal === "loss" ? "chudnąć" : "przybierać na wadze"}.
          Aplikacja stosuje limity bezpieczeństwa (min. kalorie, maks. deficyt/nadwyżka).
        </p>
      </div>

      <div className="space-y-2">
        {(Object.entries(GOAL_PACE_OPTIONS) as [GoalPace, (typeof GOAL_PACE_OPTIONS)[GoalPace]][]).map(
          ([pace, meta]) => {
            const active = profile.goal_pace === pace;
            return (
              <button
                key={pace}
                type="button"
                onClick={() => onChange(pace)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 bg-card hover:bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{meta.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                  {meta.badge && (
                    <span
                      className={cn(
                        "pp-label-caps shrink-0 rounded-full px-2 py-1 text-[10px]",
                        pace === "fast"
                          ? "bg-amber-100 text-amber-900"
                          : pace === "moderate"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {meta.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          }
        )}
      </div>

      <div
        className="rounded-xl border border-border/40 bg-card p-4 text-sm"
        style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
      >
        <p className="font-medium">Podsumowanie obliczeń</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>TDEE (utrzymanie): {preview.tdee} kcal/d</li>
          <li>
            Cel dzienny:{" "}
            <span className="font-semibold text-foreground">
              {preview.daily_calories} kcal/d
            </span>
            {preview.calorie_adjustment !== 0 && (
              <>
                {" "}
                ({preview.calorie_adjustment > 0 ? "+" : ""}
                {preview.calorie_adjustment} kcal)
              </>
            )}
          </li>
          <li>
            Wybrane tempo: ~{preview.requested_kg_per_week} kg/tyg. → efektywne: ~
            {preview.effective_kg_per_week} kg/tyg.
          </li>
          <li>
            Białko: {preview.protein_g} g · Tłuszcz: {preview.fat_g} g · Węgle:{" "}
            {preview.carbs_g} g · Błonnik: {preview.fiber_g} g · Woda:{" "}
            {preview.daily_water_ml} ml
          </li>
        </ul>
        {preview.warnings.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border/40 pt-3 text-amber-800 dark:text-amber-200">
            {preview.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        )}
      </div>

      {disclaimer && (
        <p className="text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
      )}
    </div>
  );
}

export function GoalTabs({
  goal,
  onChange,
}: {
  goal: Goal;
  onChange: (goal: Goal) => void;
}) {
  const labels: Record<Goal, string> = {
    loss: "Redukcja",
    maintain: "Utrzymanie",
    gain: "Budowa masy",
  };

  return (
    <div className="flex rounded-xl border border-border/40 bg-muted p-1">
      {(Object.keys(labels) as Goal[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 rounded-lg py-3 text-sm transition-all",
            goal === key
              ? "border border-primary/50 bg-background text-foreground shadow-sm ring-1 ring-primary/30"
              : "border border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}
