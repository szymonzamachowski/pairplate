import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  containerClass?: string;
}

export function MacroBar({
  label,
  current,
  target,
  color,
  containerClass,
}: MacroBarProps) {
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div
      className={cn("space-y-2 rounded-xl p-3", containerClass)}
      style={{ backgroundColor: `${color}14` }}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="pp-label-caps text-[11px]" style={{ color }}>
          {label}
        </span>
        <span className="font-medium text-foreground">
          {Math.round(current)} / {Math.round(target)} g
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function MacroPills({
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
  accentColor,
}: {
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  accentColor: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <MacroBar
        label="Białko"
        current={protein}
        target={proteinTarget}
        color={accentColor}
        containerClass="bg-primary/10"
      />
      <MacroBar
        label="Węgle"
        current={carbs}
        target={carbsTarget}
        color="#625b73"
        containerClass="bg-secondary/10"
      />
      <MacroBar
        label="Tłuszcze"
        current={fat}
        target={fatTarget}
        color="#455f88"
        containerClass="bg-[#455f88]/10"
      />
    </div>
  );
}
