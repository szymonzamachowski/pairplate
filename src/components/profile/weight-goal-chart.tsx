"use client";

import {
  goalReached,
  remainingToTarget,
} from "@/lib/nutrition/target-weight";
import type { Goal, WeightLog } from "@/types/database";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Flag } from "lucide-react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeightGoalChartProps {
  weightLogs: WeightLog[];
  goal: Goal;
  targetWeightKg: number | null;
  referenceWeightKg: number;
  fallbackStartKg: number;
  accentColor: string;
  isPreview?: boolean;
}

function goalProgressPercent(
  goal: Goal,
  startKg: number,
  currentKg: number,
  targetKg: number
): number {
  if (goal === "loss") {
    const total = startKg - targetKg;
    if (total <= 0) return 100;
    const done = startKg - currentKg;
    return Math.min(100, Math.max(0, (done / total) * 100));
  }

  const total = targetKg - startKg;
  if (total <= 0) return 100;
  const done = currentKg - startKg;
  return Math.min(100, Math.max(0, (done / total) * 100));
}

export function WeightGoalChart({
  weightLogs,
  goal,
  targetWeightKg,
  referenceWeightKg,
  fallbackStartKg,
  accentColor,
  isPreview = false,
}: WeightGoalChartProps) {
  const hasGoal = goal !== "maintain" && targetWeightKg !== null;
  const remaining =
    hasGoal && targetWeightKg
      ? remainingToTarget(goal, referenceWeightKg, targetWeightKg)
      : null;
  const reached =
    hasGoal && targetWeightKg
      ? goalReached(goal, referenceWeightKg, targetWeightKg)
      : false;

  const startKg = weightLogs[0]
    ? Number(weightLogs[0].weight_kg)
    : fallbackStartKg;

  const progressPercent =
    hasGoal && targetWeightKg && !reached
      ? goalProgressPercent(goal, startKg, referenceWeightKg, targetWeightKg)
      : reached
        ? 100
        : null;

  const chartData =
    weightLogs.length > 0
      ? weightLogs.map((w) => ({
          date: format(new Date(w.logged_at), "d MMM", { locale: pl }),
          weight: Number(w.weight_kg),
          target: hasGoal ? targetWeightKg : undefined,
        }))
      : hasGoal
        ? [
            {
              date: "Teraz",
              weight: referenceWeightKg,
              target: targetWeightKg,
            },
          ]
        : [];

  const weights = [
    ...weightLogs.map((w) => Number(w.weight_kg)),
    referenceWeightKg,
    ...(targetWeightKg ? [targetWeightKg] : []),
    startKg,
  ];
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const displayWeight =
    weightLogs.length > 0 && !isPreview
      ? Number(weightLogs[weightLogs.length - 1].weight_kg)
      : referenceWeightKg;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="pp-label-caps text-[11px] text-muted-foreground">
            {isPreview ? "Podgląd wagi" : "Aktualna waga"}
          </p>
          <h2 className="text-3xl font-semibold tabular-nums">
            {displayWeight.toFixed(1)}
            <span className="ml-1 text-lg text-muted-foreground">kg</span>
          </h2>
          {hasGoal && targetWeightKg && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flag className="h-3.5 w-3.5 text-secondary" />
              Cel: {targetWeightKg.toFixed(1)} kg
            </p>
          )}
        </div>

        {hasGoal && (
          <div className="text-right">
            {reached ? (
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                Cel osiągnięty
              </span>
            ) : (
              <>
                <p className="pp-label-caps text-[10px] text-muted-foreground">
                  Do celu
                </p>
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {remaining?.toFixed(1)}
                  <span className="ml-0.5 text-base font-semibold">kg</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {hasGoal && progressPercent !== null && !reached && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{startKg.toFixed(1)} kg</span>
            <span className="font-medium text-primary">
              {Math.round(progressPercent)}% drogi
            </span>
            <span>{targetWeightKg!.toFixed(1)} kg</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className={hasGoal ? "h-32" : "h-24"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
              <YAxis domain={[minW, maxW]} hide />
              <Tooltip
                formatter={(value, name) => {
                  const n = typeof value === "number" ? value : Number(value);
                  return [
                    `${n.toFixed(1)} kg`,
                    name === "weight" ? "Waga" : "Cel",
                  ];
                }}
                labelStyle={{ fontSize: 11 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border) / 0.4)",
                  fontSize: 12,
                }}
              />
              {hasGoal && targetWeightKg && (
                <ReferenceLine
                  y={targetWeightKg}
                  stroke="hsl(var(--secondary))"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: `Cel ${targetWeightKg.toFixed(1)} kg`,
                    position: "insideTopRight",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                stroke={accentColor || "#47645b"}
                strokeWidth={2.5}
                dot={{ r: 3, fill: accentColor || "#47645b", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasGoal && isPreview && remaining !== null && !reached && (
        <p className="text-xs text-muted-foreground">
          Podgląd: przy {referenceWeightKg.toFixed(1)} kg zostaje{" "}
          {remaining.toFixed(1)} kg do celu
        </p>
      )}
    </div>
  );
}
