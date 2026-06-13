"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  accentColor?: string;
  centerValue?: number;
  centerLabel?: string;
}

export function CalorieRing({
  consumed,
  target,
  accentColor = "#47645b",
  centerValue,
  centerLabel = "kcal pozostało",
}: CalorieRingProps) {
  const displayValue = centerValue ?? Math.max(0, target - consumed);
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center py-2">
      <svg className="-rotate-90" width="176" height="176" viewBox="0 0 176 176">
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth="12"
          strokeOpacity={0.15}
        />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="text-[2rem] font-semibold leading-none tracking-[0.02em]"
          style={{ color: accentColor }}
        >
          {displayValue.toLocaleString("pl-PL")}
        </span>
        <span className="pp-label-caps mt-2 text-[10px] text-muted-foreground">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
