"use client";

import {
  StitchHeader,
  StitchPage,
} from "@/components/layout/stitch-header";
import { MealChip } from "@/components/ui/meal-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import { MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/constants";
import {
  addPlannedMeal,
  deletePlannedMeal,
  movePlannedMealToDiary,
} from "@/lib/actions/planning";
import { cn } from "@/lib/utils";
import type { MealType } from "@/types/database";
import { addDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Moon,
  Plus,
  Sun,
  Sunrise,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface PlannedMealRow {
  id: string;
  plan_date: string;
  meal_type: MealType;
  name: string;
  profile_id: string;
  profiles?: { name: string; accent_color: string } | null;
  planned_meal_items?: Array<{
    id: string;
    product_name: string;
    grams: number;
  }>;
}

const mealIcons: Partial<Record<MealType, typeof Sunrise>> = {
  breakfast: Sunrise,
  second_breakfast: Sun,
  lunch: UtensilsCrossed,
  snack: Sun,
  dinner: Moon,
};

export function PlanView({
  householdId,
  initialMeals,
}: {
  householdId: string;
  initialMeals: PlannedMealRow[];
}) {
  const { profiles, activeProfile } = useActiveProfile();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [profileId, setProfileId] = useState(activeProfile?.id ?? profiles[0]?.id ?? "");
  const [mealName, setMealName] = useState("");
  const [meals, setMeals] = useState(initialMeals);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd")
  );

  const dayMeals = meals.filter((m) => m.plan_date === selectedDate);

  const mealsByType = MEAL_TYPES.reduce(
    (acc, type) => {
      acc[type] = dayMeals.filter((m) => m.meal_type === type);
      return acc;
    },
    {} as Record<MealType, PlannedMealRow[]>
  );

  async function handleAddPlan() {
    if (!mealName.trim()) {
      toast.error("Podaj nazwę posiłku");
      return;
    }
    startTransition(async () => {
      const result = await addPlannedMeal({
        householdId,
        profileId,
        planDate: selectedDate,
        mealType,
        name: mealName,
        items: [],
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Dodano do planu");
        setMealName("");
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <StitchHeader variant="brand" />
      <StitchPage>
        <section className="space-y-1">
          <h2 className="text-2xl font-medium tracking-[0.01em]">
            Planer posiłków
          </h2>
          <p className="text-sm text-muted-foreground">Zaplanuj wspólny tydzień</p>
        </section>

        <section className="-mx-5">
          <div className="flex gap-3 overflow-x-auto px-5 pb-1">
            {weekDays.map((day) => {
              const active = selectedDate === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex h-20 w-14 shrink-0 flex-col items-center justify-center rounded-xl transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="pp-label-caps text-[10px] opacity-80">
                    {format(new Date(day), "EEE", { locale: pl })}
                  </span>
                  <span className="text-lg font-medium">
                    {format(new Date(day), "d")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          {MEAL_TYPES.map((type) => {
            const Icon = mealIcons[type] ?? UtensilsCrossed;
            const entries = mealsByType[type] ?? [];

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="pp-label-caps text-[11px] tracking-[0.12em] text-muted-foreground">
                      {MEAL_TYPE_LABELS[type]}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMealType(type);
                      setShowAddForm(true);
                    }}
                    className="pp-label-caps inline-flex items-center gap-1 text-[11px] text-primary"
                  >
                    <Plus className="h-3 w-3" />
                    Dodaj
                  </button>
                </div>

                {entries.length === 0 ? (
                  <Link
                    href={`/add?meal=${type}`}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 px-4 py-8 text-muted-foreground transition-colors hover:bg-muted/40"
                  >
                    <Plus className="h-8 w-8 opacity-50" />
                    <span className="text-sm">Dodaj posiłek</span>
                  </Link>
                ) : (
                  entries.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex gap-4 rounded-xl border border-border/40 bg-card p-4"
                      style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
                    >
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <UtensilsCrossed className="h-7 w-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{meal.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {meal.profiles?.name}
                            </p>
                          </div>
                          <MealChip mealType={meal.meal_type} />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-xs"
                            onClick={() =>
                              startTransition(async () => {
                                await movePlannedMealToDiary(meal.id, meal.profile_id);
                                toast.success("Przeniesiono do dziennika");
                              })
                            }
                          >
                            Do dziennika
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full"
                            onClick={() =>
                              startTransition(async () => {
                                await deletePlannedMeal(meal.id, householdId);
                                setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                                toast.success("Usunięto");
                                router.refresh();
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </section>

        {showAddForm && (
          <div
            className="fixed inset-x-0 bottom-[88px] z-40 rounded-t-3xl border-t border-border/30 bg-card/95 px-5 pt-5 pb-6 backdrop-blur-md"
            style={{ boxShadow: "0 -10px 30px rgba(25, 28, 29, 0.03)" }}
          >
            <h3 className="mb-4 text-lg font-medium">Nowy posiłek w planie</h3>
            <div className="space-y-3">
              <Select
                value={profileId}
                onValueChange={(value) => value && setProfileId(value)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Nazwa posiłku, np. Owsianka"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="rounded-xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setShowAddForm(false)}
                >
                  Anuluj
                </Button>
                <Button
                  className="rounded-2xl"
                  disabled={isPending}
                  onClick={handleAddPlan}
                >
                  Dodaj do planu
                </Button>
              </div>
            </div>
          </div>
        )}
      </StitchPage>
    </>
  );
}
