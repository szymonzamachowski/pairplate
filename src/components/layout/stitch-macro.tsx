import { cn } from "@/lib/utils";

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
              "flex flex-col items-center rounded-xl px-2 py-3",
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
}: {
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
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
