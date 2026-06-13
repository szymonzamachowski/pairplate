"use client";

import { MealChip } from "@/components/ui/meal-chip";
import { deleteMealEntry } from "@/lib/actions/meals";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import type { MealEntry, MealType } from "@/types/database";
import { ChevronRight, Share2, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface MealSectionProps {
  mealType: MealType;
  entries: MealEntry[];
  profileId: string;
  logDate: string;
}

export function MealSection({
  mealType,
  entries,
  profileId,
  logDate,
}: MealSectionProps) {
  const sectionTotal = entries.reduce(
    (sum, entry) => sum + Number(entry.total_kcal),
    0
  );

  async function handleDelete(entryId: string) {
    await deleteMealEntry(entryId, profileId, logDate);
    toast.success("Usunięto posiłek");
  }

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MealChip mealType={mealType} />
          {entries.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {Math.round(sectionTotal)} kcal
            </span>
          )}
        </div>
        <Link
          href={`/add?meal=${mealType}`}
          className="pp-label-caps inline-flex items-center gap-1 text-[11px] text-primary"
        >
          + Dodaj
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-4 py-10 text-muted-foreground">
          <UtensilsCrossed className="mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">Brak zaplanowanego posiłku</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-4 rounded-2xl border border-border/40 bg-card p-4"
              style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-container/30">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-snug">
                      {entry.name ?? MEAL_TYPE_LABELS[entry.meal_type]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Math.round(Number(entry.total_kcal))} kcal · B{" "}
                      {Math.round(Number(entry.total_protein_g))} · W{" "}
                      {Math.round(Number(entry.total_carbs_g))} · Bl{" "}
                      {Math.round(Number(entry.total_fiber_g ?? 0))}
                    </p>
                    {entry.is_shared && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-secondary">
                        <Share2 className="h-3 w-3" />
                        Posiłek wspólny
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2 space-y-0.5">
                  {(entry.meal_items ?? []).slice(0, 2).map((item) => (
                    <p key={item.id} className="truncate text-xs text-muted-foreground">
                      {item.product_name} · {Math.round(Number(item.grams))} g
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
