import { cn } from "@/lib/utils";

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
      bg: "bg-primary-container/40",
      text: "text-primary",
    },
    {
      label: "Węgle",
      value: carbs,
      target: carbsTarget,
      bg: "bg-secondary-container/40",
      text: "text-secondary",
    },
    {
      label: "Tłuszcze",
      value: fat,
      target: fatTarget,
      bg: "bg-[#e3ebff]/80",
      text: "text-[#455f88]",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col items-center rounded-xl px-2 py-3",
            item.bg
          )}
        >
          <span className={cn("pp-label-caps text-[10px]", item.text)}>
            {item.label}
          </span>
          <span className={cn("mt-1 text-lg font-medium", item.text)}>
            {Math.round(item.value)}g
          </span>
          {item.target !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              / {Math.round(item.target)}g
            </span>
          )}
        </div>
      ))}
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
