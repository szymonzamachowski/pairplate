import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type MacroLimitStatus = "ok" | "warning" | "exceeded";

const MACRO_LIMIT_WARNING_RATIO = 0.85;

function getMacroLimitStatus(
  current: number,
  target?: number
): MacroLimitStatus {
  if (target === undefined || target <= 0) return "ok";
  const ratio = current / target;
  if (ratio >= 1) return "exceeded";
  if (ratio >= MACRO_LIMIT_WARNING_RATIO) return "warning";
  return "ok";
}

function macroLimitClasses(status: MacroLimitStatus) {
  switch (status) {
    case "warning":
      return {
        container:
          "border-2 border-orange-400 bg-orange-500/10 dark:border-orange-500 dark:bg-orange-500/15",
        label: "text-orange-700 dark:text-orange-300",
        value: "text-orange-800 dark:text-orange-200",
      };
    case "exceeded":
      return {
        container:
          "border-2 border-red-500 bg-red-500/10 dark:border-red-500 dark:bg-red-500/15",
        label: "text-red-700 dark:text-red-300",
        value: "text-red-800 dark:text-red-200",
      };
    default:
      return {
        container: "border border-border/40 bg-muted/20",
        label: "text-muted-foreground",
        value: "text-foreground",
      };
  }
}

function getMinimumGoalStatus(
  current: number,
  target: number
): "low" | "near" | "met" {
  if (target <= 0) return "met";
  const ratio = current / target;
  if (ratio >= 1) return "met";
  if (ratio >= MACRO_LIMIT_WARNING_RATIO) return "near";
  return "low";
}

function minimumGoalBarClasses(status: "low" | "near" | "met") {
  switch (status) {
    case "near":
      return {
        track: "bg-orange-500/15",
        fill: "bg-orange-500",
        value: "text-orange-700 dark:text-orange-300",
      };
    case "met":
      return {
        track: "bg-emerald-500/15",
        fill: "bg-emerald-600",
        value: "text-emerald-700 dark:text-emerald-300",
      };
    default:
      return {
        track: "bg-muted",
        fill: "bg-[#6b7c4e]",
        value: "text-foreground",
      };
  }
}

export function StitchNutrientProgressBar({
  label,
  current,
  target,
  unit = "g",
  accentColor = "#6b7c4e",
  onAdd,
}: {
  label: string;
  current: number;
  target: number;
  unit?: string;
  accentColor?: string;
  onAdd?: () => void;
}) {
  const status = getMinimumGoalStatus(current, target);
  const styles = minimumGoalBarClasses(status);
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const displayCurrent =
    unit === "g" ? Math.round(current * 10) / 10 : Math.round(current);
  const displayTarget =
    unit === "g" ? Math.round(target * 10) / 10 : Math.round(target);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="pp-label-caps text-[10px] text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-medium tabular-nums", styles.value)}>
            {displayCurrent}
            <span className="font-normal text-muted-foreground">
              {" "}
              / {displayTarget} {unit}
            </span>
          </span>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Dodaj ${label.toLowerCase()}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/50 bg-card text-primary transition-colors hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div
        className={cn("h-2 overflow-hidden rounded-full", styles.track)}
        role="progressbar"
        aria-valuenow={displayCurrent}
        aria-valuemin={0}
        aria-valuemax={displayTarget}
        aria-label={`${label}: ${displayCurrent} z ${displayTarget} ${unit}`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", styles.fill)}
          style={{
            width: `${progress * 100}%`,
            backgroundColor: status === "low" ? accentColor : undefined,
          }}
        />
      </div>
    </div>
  );
}

export function StitchDailyNutrients({
  fiber,
  fiberTarget,
  water,
  waterTarget,
  onAddWater,
  nutrients,
}: {
  fiber: number;
  fiberTarget: number;
  water?: number;
  waterTarget?: number;
  onAddWater?: () => void;
  /** Dodatkowe metryki pod wodą. */
  nutrients?: Array<{
    key: string;
    label: string;
    current: number;
    target: number;
    unit?: string;
    accentColor?: string;
    onAdd?: () => void;
  }>;
}) {
  return (
    <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
      <StitchNutrientProgressBar
        label="Błonnik"
        current={fiber}
        target={fiberTarget}
      />
      {waterTarget !== undefined && waterTarget > 0 && (
        <StitchNutrientProgressBar
          label="Woda"
          current={water ?? 0}
          target={waterTarget}
          unit="ml"
          accentColor="#455f88"
          onAdd={onAddWater}
        />
      )}
      {nutrients?.map((item) => (
        <StitchNutrientProgressBar
          key={item.key}
          label={item.label}
          current={item.current}
          target={item.target}
          unit={item.unit}
          accentColor={item.accentColor}
          onAdd={item.onAdd}
        />
      ))}
    </div>
  );
}

export function StitchMacroPills({
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
}: {
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}) {
  const items = [
    {
      label: "Białko",
      value: protein,
      target: proteinTarget,
    },
    {
      label: "Węgle",
      value: carbs,
      target: carbsTarget,
    },
    {
      label: "Tłuszcze",
      value: fat,
      target: fatTarget,
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-3 gap-2">
      {items.map((item) => {
        const status = getMacroLimitStatus(item.value, item.target);
        const styles = macroLimitClasses(status);

        return (
          <div
            key={item.label}
            className={cn(
              "flex min-w-0 flex-col items-center rounded-xl px-2 py-3",
              styles.container
            )}
          >
            <span className={cn("pp-label-caps text-[10px]", styles.label)}>
              {item.label}
            </span>
            <span className={cn("mt-1 text-lg font-medium", styles.value)}>
              {Math.round(item.value)}g
            </span>
            {item.target !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                / {Math.round(item.target)}g
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StitchMacroSummaryBar({
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
  fiber,
  fiberTarget,
}: {
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  fiber?: number;
  fiberTarget?: number;
}) {
  return (
    <div className="pp-card mt-4 border border-border/40 p-4">
      <p className="pp-label-caps mb-3 text-[11px] text-muted-foreground">
        Rozkład makroskładników
      </p>
      <div className="grid grid-cols-3 divide-x divide-border/50 text-center">
        <MacroCell label="Białko" current={protein} target={proteinTarget} dot="#47645b" />
        <MacroCell label="Węgle" current={carbs} target={carbsTarget} dot="#625b73" />
        <MacroCell label="Tłuszcz" current={fat} target={fatTarget} dot="#455f88" />
      </div>
      {fiber !== undefined && fiberTarget !== undefined && fiberTarget > 0 && (
        <StitchDailyNutrients fiber={fiber} fiberTarget={fiberTarget} />
      )}
    </div>
  );
}

function MacroCell({
  label,
  current,
  target,
  dot,
}: {
  label: string;
  current: number;
  target: number;
  dot: string;
}) {
  return (
    <div className="px-2">
      <div className="mb-1 flex items-center justify-center gap-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-base font-semibold text-primary">
        {Math.round(current)}g
      </p>
      <p className="text-xs text-muted-foreground">/ {Math.round(target)}g</p>
    </div>
  );
}
