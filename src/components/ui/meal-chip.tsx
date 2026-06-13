import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { mealChipColors } from "@/lib/design-system";
import type { MealType } from "@/types/database";
import { cn } from "@/lib/utils";

export function MealChip({
  mealType,
  className,
}: {
  mealType: MealType;
  className?: string;
}) {
  const colors = mealChipColors[mealType] ?? mealChipColors.breakfast;

  return (
    <span
      className={cn(
        "pp-label-caps inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {MEAL_TYPE_LABELS[mealType]}
    </span>
  );
}
