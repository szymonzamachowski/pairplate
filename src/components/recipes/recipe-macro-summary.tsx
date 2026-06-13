import type { NutritionTotals } from "@/types/database";
import { formatMacroSummary } from "@/lib/recipes/nutrition";

export function RecipeMacroSummary({
  nutrition,
  className,
}: {
  nutrition: NutritionTotals;
  className?: string;
}) {
  return (
    <p className={className ?? "text-sm text-muted-foreground"}>
      {formatMacroSummary(nutrition)}
    </p>
  );
}
