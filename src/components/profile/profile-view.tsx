"use client";

import { StitchHeader, StitchPage } from "@/components/layout/stitch-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericField, parseNumericInput } from "@/components/ui/numeric-input";
import { Switch } from "@/components/ui/switch";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import { GOAL_LABELS, WEEKDAY_LABELS } from "@/lib/constants";
import { WeightGoalChart } from "@/components/profile/weight-goal-chart";
import {
  addWeightLog,
  getWeightHistory,
  updateWeightReminder,
} from "@/lib/actions/weight";
import type { DailyLog, Profile, WeightLog, WeightReminderSettings } from "@/types/database";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Activity, Bell, Plus, Target } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ProfilePageProps {
  initialWeightByProfile: Record<string, WeightLog[]>;
  initialReminderByProfile: Record<string, WeightReminderSettings | null>;
  initialHistoryByProfile: Record<string, DailyLog[]>;
}

function ProfileViewContent({
  profile,
  initialWeightLogs,
  initialReminder,
  initialDayHistory,
}: {
  profile: Profile;
  initialWeightLogs: WeightLog[];
  initialReminder: WeightReminderSettings | null;
  initialDayHistory: DailyLog[];
}) {
  const [isPending, startTransition] = useTransition();
  const [weightInput, setWeightInput] = useState("");
  const [previewWeightKg, setPreviewWeightKg] = useState<number | null>(null);
  const [weightDate, setWeightDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightLogs, setWeightLogs] = useState(initialWeightLogs);
  const [reminder, setReminder] = useState(initialReminder);
  const [dayHistory] = useState(initialDayHistory);

  const startWeight = weightLogs[0]?.weight_kg;
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight_kg;
  const prevWeight = weightLogs[weightLogs.length - 2]?.weight_kg;
  const diffPrev =
    lastWeight && prevWeight ? Number(lastWeight) - Number(prevWeight) : null;
  const diffStart =
    lastWeight && startWeight ? Number(lastWeight) - Number(startWeight) : null;

  const referenceWeightKg =
    previewWeightKg ??
    (lastWeight ? Number(lastWeight) : Number(profile.current_weight_kg));
  const targetWeightKg = profile.target_weight_kg
    ? Number(profile.target_weight_kg)
    : null;

  const today = new Date().getDay();
  const showWeightReminder =
    reminder?.enabled && reminder.days_of_week.includes(today);

  function handleWeightPreviewBlur() {
    const parsed = parseNumericInput(weightInput);
    setPreviewWeightKg(parsed !== null && parsed > 0 ? parsed : null);
  }

  async function handleAddWeight() {
    const weight = parseNumericInput(weightInput);
    if (weight === null || weight <= 0) {
      toast.error("Podaj wagę");
      return;
    }

    startTransition(async () => {
      const result = await addWeightLog(profile.id, weight, weightDate);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Zapisano wagę");
        const history = await getWeightHistory(profile.id);
        setWeightLogs(history as WeightLog[]);
        setWeightInput("");
        setPreviewWeightKg(null);
      }
    });
  }

  async function toggleReminderDay(day: number) {
    const days = reminder?.days_of_week ?? [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    const result = await updateWeightReminder(profile.id, next, reminder?.enabled ?? true);
    if (result.success) {
      setReminder((r) => ({ ...(r as WeightReminderSettings), days_of_week: next }));
    } else if (result.error) {
      toast.error(result.error);
    }
  }

  return (
    <>
      {showWeightReminder && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          Dziś zaplanowany pomiar wagi dla {profile.name}.
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3">
        <div
          className="col-span-2 rounded-2xl border border-border/40 bg-card p-5"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <WeightGoalChart
            weightLogs={weightLogs}
            goal={profile.goal}
            targetWeightKg={targetWeightKg}
            referenceWeightKg={referenceWeightKg}
            fallbackStartKg={Number(profile.current_weight_kg)}
            accentColor={profile.accent_color || "#47645b"}
            isPreview={previewWeightKg !== null}
          />
          {!targetWeightKg && diffStart !== null && (
            <div className="mt-3 flex justify-end">
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {diffStart > 0 ? "+" : ""}
                {diffStart.toFixed(1)} kg od startu
              </span>
            </div>
          )}
        </div>
        <div
          className="rounded-2xl border border-border/40 bg-card p-4"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <Target className="mb-2 h-5 w-5 text-secondary" />
          <p className="pp-label-caps text-[10px] text-muted-foreground">Cel</p>
          <p className="font-medium">{GOAL_LABELS[profile.goal]}</p>
        </div>
        <div
          className="rounded-2xl border border-border/40 bg-card p-4"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <Activity className="mb-2 h-5 w-5 text-[#455f88]" />
          <p className="pp-label-caps text-[10px] text-muted-foreground">Kalorie</p>
          <p className="font-medium">{profile.daily_calories} kcal</p>
        </div>
      </section>

      <section
        className="mb-6 overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
        style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
      >
        <h3 className="mb-4 text-base font-medium">Dodaj pomiar wagi</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Waga (kg)</Label>
            <NumericField
              value={weightInput}
              onValueChange={(value) => {
                setWeightInput(value);
                setPreviewWeightKg(null);
              }}
              onBlur={handleWeightPreviewBlur}
              min={30}
              max={300}
              step={0.1}
              decimals={1}
              className="rounded-2xl"
              placeholder="np. 75.0"
            />
          </div>
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={weightDate}
              onChange={(e) => setWeightDate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
        </div>
        <Button
          className="mt-4 w-full rounded-2xl"
          disabled={isPending}
          onClick={handleAddWeight}
        >
          <Plus className="mr-2 h-4 w-4" />
          Zapisz pomiar
        </Button>

        {(diffPrev !== null || diffStart !== null) && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {diffPrev !== null && (
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-muted-foreground">Od poprzedniego</p>
                <p className="font-semibold">
                  {diffPrev > 0 ? "+" : ""}
                  {diffPrev.toFixed(1)} kg
                </p>
              </div>
            )}
            {diffStart !== null && (
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-muted-foreground">Od startu</p>
                <p className="font-semibold">
                  {diffStart > 0 ? "+" : ""}
                  {diffStart.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className="mb-6 overflow-hidden rounded-2xl border border-border/40 bg-card"
        style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
      >
        <div className="flex items-center justify-between border-b border-border/40 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
              <Bell className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium">Przypomnienia o wadze</p>
              <p className="text-sm text-muted-foreground">Wybierz dni tygodnia</p>
            </div>
          </div>
          <Switch
            checked={reminder?.enabled ?? false}
            onCheckedChange={(enabled) =>
              startTransition(async () => {
                const result = await updateWeightReminder(
                  profile.id,
                  reminder?.days_of_week ?? [1],
                  enabled
                );
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                setReminder((r) => ({
                  id: r?.id ?? "",
                  profile_id: profile.id,
                  days_of_week: r?.days_of_week ?? [1],
                  enabled,
                  push_enabled: false,
                }));
              })
            }
          />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, index) => (
              <Button
                key={label}
                size="sm"
                variant={
                  reminder?.days_of_week.includes(index) ? "default" : "outline"
                }
                className="rounded-full"
                onClick={() => toggleReminderDay(index)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 space-y-2">
        <h3 className="pp-label-caps px-1 text-[11px] tracking-[0.12em] text-muted-foreground">
          Historia dni
        </h3>
        {dayHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak historii</p>
        ) : (
          dayHistory.map((day) => (
            <div
              key={day.id}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3 text-sm"
            >
              <span>
                {format(new Date(day.log_date), "d MMM yyyy", { locale: pl })}
              </span>
              <span className="font-medium">
                {Math.round(Number(day.total_kcal))} kcal
              </span>
            </div>
          ))
        )}
      </section>
    </>
  );
}

export function ProfileView({
  initialWeightByProfile,
  initialReminderByProfile,
  initialHistoryByProfile,
}: ProfilePageProps) {
  const { activeProfile } = useActiveProfile();
  const profile = activeProfile as Profile | undefined;

  if (!profile) {
    return <div className="p-6 text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <>
      <StitchHeader
        variant="split"
        title="Mój Profil"
        settingsHref="/profile/settings"
      />
      <StitchPage>
        <ProfileViewContent
          key={profile.id}
          profile={profile}
          initialWeightLogs={initialWeightByProfile[profile.id] ?? []}
          initialReminder={initialReminderByProfile[profile.id] ?? null}
          initialDayHistory={initialHistoryByProfile[profile.id] ?? []}
        />
      </StitchPage>
    </>
  );
}
