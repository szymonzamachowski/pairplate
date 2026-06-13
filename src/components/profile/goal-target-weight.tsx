"use client";

import {
  bmiForWeight,
  goalReached,
  HEALTHY_BMI_MAX,
  HEALTHY_BMI_MIN,
  remainingToTarget,
  suggestTargetWeight,
  targetWeightBounds,
} from "@/lib/nutrition/target-weight";
import type { Goal } from "@/types/database";
import { cn } from "@/lib/utils";

interface GoalTargetWeightProps {
  goal: Goal;
  heightCm: number;
  referenceWeightKg: number;
  targetWeightKg: number | null;
  onChange: (target: number | null) => void;
  className?: string;
  compact?: boolean;
}

export function GoalTargetWeightSelector({
  goal,
  heightCm,
  referenceWeightKg,
  targetWeightKg,
  onChange,
  className,
  compact = false,
}: GoalTargetWeightProps) {
  const bounds = targetWeightBounds(goal, heightCm, referenceWeightKg);

  if (!bounds || goal === "maintain") {
    return null;
  }

  const value = Math.min(
    bounds.max,
    Math.max(bounds.min, targetWeightKg ?? bounds.suggested)
  );

  const remaining = remainingToTarget(goal, referenceWeightKg, value);
  const reached = goalReached(goal, referenceWeightKg, value);
  const targetBmi = bmiForWeight(value, heightCm);
  const isLoss = goal === "loss";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card p-4",
        !compact && "space-y-4",
        className
      )}
      style={{ boxShadow: compact ? undefined : "0 4px 20px rgba(25, 28, 29, 0.04)" }}
    >
      <div className={cn(compact ? "space-y-3" : "space-y-4")}>
        <div>
          <p className="pp-label-caps mb-1 text-[11px] text-muted-foreground">
            Waga docelowa
          </p>
          <p className="text-sm text-muted-foreground">
            {isLoss
              ? `Sugerujemy wagę w zdrowym zakresie BMI (min. ${HEALTHY_BMI_MIN}). Nie schodzimy poniżej BMI ${HEALTHY_BMI_MIN}.`
              : `Sugerujemy wagę do BMI ${HEALTHY_BMI_MAX} — górna granica zdrowego zakresu.`}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {value.toFixed(1)}
              <span className="ml-1 text-lg text-muted-foreground">kg</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              BMI {targetBmi} · zdrowy zakres {HEALTHY_BMI_MIN}–{HEALTHY_BMI_MAX}
            </p>
          </div>
          {!reached && remaining !== null && (
            <div className="text-right">
              <p className="pp-label-caps text-[10px] text-muted-foreground">
                {isLoss ? "Do celu" : "Do celu"}
              </p>
              <p className="text-lg font-semibold text-primary tabular-nums">
                {remaining.toFixed(1)} kg
              </p>
            </div>
          )}
          {reached && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Cel osiągnięty
            </span>
          )}
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={0.1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
            aria-label="Waga docelowa"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{bounds.min.toFixed(1)} kg</span>
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() =>
                onChange(
                  suggestTargetWeight(goal, heightCm, referenceWeightKg) ??
                    bounds.suggested
                )
              }
            >
              Sugestia: {bounds.suggested.toFixed(1)} kg
            </button>
            <span>{bounds.max.toFixed(1)} kg</span>
          </div>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground">
            Aktualnie: {referenceWeightKg.toFixed(1)} kg
            {remaining !== null && !reached
              ? isLoss
                ? ` · zostało ${remaining.toFixed(1)} kg do redukcji`
                : ` · zostało ${remaining.toFixed(1)} kg do przyrostu`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export function GoalTargetProgress({
  goal,
  heightCm,
  referenceWeightKg,
  targetWeightKg,
  className,
  referenceLabel = "ostatniego pomiaru",
}: {
  goal: Goal;
  heightCm: number;
  referenceWeightKg: number;
  targetWeightKg: number | null;
  className?: string;
  referenceLabel?: string;
}) {
  if (goal === "maintain" || !targetWeightKg) return null;

  const remaining = remainingToTarget(goal, referenceWeightKg, targetWeightKg);
  const reached = goalReached(goal, referenceWeightKg, targetWeightKg);
  const isLoss = goal === "loss";

  if (reached) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm",
          className
        )}
      >
        <p className="font-medium text-primary">Cel wagowy osiągnięty</p>
        <p className="mt-1 text-muted-foreground">
          {isLoss ? "Redukcja" : "Budowa masy"}: docelowo {targetWeightKg.toFixed(1)} kg
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card p-4",
        className
      )}
      style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
    >
      <p className="pp-label-caps text-[10px] text-muted-foreground">
        Cel wagowy
      </p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <p className="font-medium">
            {isLoss ? "Redukcja do" : "Masa do"} {targetWeightKg.toFixed(1)} kg
          </p>
          <p className="text-sm text-muted-foreground">
            BMI docelowe {bmiForWeight(targetWeightKg, heightCm)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-primary tabular-nums">
            {remaining?.toFixed(1)} kg
          </p>
          <p className="text-xs text-muted-foreground">zostało</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Na podstawie {referenceLabel}: {referenceWeightKg.toFixed(1)} kg
      </p>
    </div>
  );
}
