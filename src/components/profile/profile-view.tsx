"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { StitchHeader, StitchPage } from "@/components/layout/stitch-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import {
  ACTIVITY_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/constants";
import { signOut, updateProfile, type ProfileInput } from "@/lib/actions/auth";
import {
  addWeightLog,
  getWeightHistory,
  updateWeightReminder,
} from "@/lib/actions/weight";
import type { DailyLog, Profile, WeightLog, WeightReminderSettings } from "@/types/database";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Activity, Bell, Moon, Plus, Sun, Target } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

interface ProfilePageProps {
  initialWeightByProfile: Record<string, WeightLog[]>;
  initialReminderByProfile: Record<string, WeightReminderSettings | null>;
  initialHistoryByProfile: Record<string, DailyLog[]>;
}

export function ProfileView({
  initialWeightByProfile,
  initialReminderByProfile,
  initialHistoryByProfile,
}: ProfilePageProps) {
  const { activeProfile, setActiveProfileId } = useActiveProfile();
  const profile = activeProfile as Profile | undefined;
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<ProfileInput | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [reminder, setReminder] = useState<WeightReminderSettings | null>(null);
  const [dayHistory, setDayHistory] = useState<DailyLog[]>([]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      height_cm: Number(profile.height_cm),
      current_weight_kg: Number(profile.current_weight_kg),
      goal: profile.goal,
      activity_level: profile.activity_level,
    });
    setWeightLogs(initialWeightByProfile[profile.id] ?? []);
    setReminder(initialReminderByProfile[profile.id] ?? null);
    setDayHistory(initialHistoryByProfile[profile.id] ?? []);
  }, [profile, initialWeightByProfile, initialReminderByProfile, initialHistoryByProfile]);

  if (!profile || !form) {
    return <div className="p-6 text-muted-foreground">Ładowanie...</div>;
  }

  const startWeight = weightLogs[0]?.weight_kg;
  const lastWeight = weightLogs[weightLogs.length - 1]?.weight_kg;
  const prevWeight = weightLogs[weightLogs.length - 2]?.weight_kg;
  const diffPrev =
    lastWeight && prevWeight ? Number(lastWeight) - Number(prevWeight) : null;
  const diffStart =
    lastWeight && startWeight ? Number(lastWeight) - Number(startWeight) : null;

  const today = new Date().getDay();
  const showWeightReminder =
    reminder?.enabled && reminder.days_of_week.includes(today);

  async function handleSaveProfile() {
    startTransition(async () => {
      const result = await updateProfile(profile!.id, form!);
      if (result.error) toast.error(result.error);
      else toast.success("Zapisano profil");
    });
  }

  async function handleAddWeight() {
    const weight = Number(weightInput);
    if (!weight) {
      toast.error("Podaj wagę");
      return;
    }
    startTransition(async () => {
      const result = await addWeightLog(profile!.id, weight, weightDate);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Zapisano wagę");
        const history = await getWeightHistory(profile!.id);
        setWeightLogs(history as WeightLog[]);
        setWeightInput("");
      }
    });
  }

  async function toggleReminderDay(day: number) {
    const days = reminder?.days_of_week ?? [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    const result = await updateWeightReminder(profile!.id, next, reminder?.enabled ?? true);
    if (result.success) {
      setReminder((r) => ({ ...(r as WeightReminderSettings), days_of_week: next }));
    }
  }

  return (
    <>
      <StitchHeader variant="split" title="Mój Profil" />
      <StitchPage>
        <div className="mb-2 flex justify-end">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {showWeightReminder && (
          <div
            className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"
          >
            Dziś zaplanowany pomiar wagi dla {profile.name}.
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-3">
          <div
            className="col-span-2 rounded-2xl border border-border/40 bg-card p-5"
            style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="pp-label-caps text-[11px] text-muted-foreground">
                  Aktualna waga
                </p>
                <h2 className="text-3xl font-semibold">
                  {lastWeight ? Number(lastWeight).toFixed(1) : "—"}
                  <span className="ml-1 text-lg text-muted-foreground">kg</span>
                </h2>
              </div>
              {diffStart !== null && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                  {diffStart > 0 ? "+" : ""}
                  {diffStart.toFixed(1)} kg
                </span>
              )}
            </div>
            {weightLogs.length > 1 && (
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightLogs.map((w) => ({
                      date: format(new Date(w.logged_at), "d MMM", { locale: pl }),
                      weight: Number(w.weight_kg),
                    }))}
                  >
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={profile.accent_color || "#47645b"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
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

        <section className="mb-6 space-y-2">
          <h3 className="pp-label-caps px-1 text-[11px] tracking-[0.12em] text-muted-foreground">
            Twoje cele
          </h3>
          <div className="flex rounded-xl bg-muted p-1">
            {Object.entries(GOAL_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, goal: key as ProfileInput["goal"] })}
                className={cn(
                  "flex-1 rounded-lg py-3 text-sm transition-all",
                  form.goal === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="mb-6 overflow-hidden rounded-2xl border border-border/40 bg-card"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <div className="space-y-4 p-5">
            <h3 className="text-base font-medium">Dane profilu</h3>
          <div>
            <Label>Imię</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-2xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Płeć</Label>
              <Select
                value={form.gender}
                onValueChange={(v) =>
                  setForm({ ...form, gender: v as ProfileInput["gender"] })
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Wiek</Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="rounded-2xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Wzrost (cm)</Label>
              <Input
                type="number"
                value={form.height_cm}
                onChange={(e) =>
                  setForm({ ...form, height_cm: Number(e.target.value) })
                }
                className="rounded-2xl"
              />
            </div>
            <div>
              <Label>Waga (kg)</Label>
              <Input
                type="number"
                value={form.current_weight_kg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    current_weight_kg: Number(e.target.value),
                  })
                }
                className="rounded-2xl"
              />
            </div>
          </div>
          <div>
            <Label>Aktywność</Label>
            <Select
              value={form.activity_level}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  activity_level: v as ProfileInput["activity_level"],
                })
              }
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 text-sm">
            <p className="font-medium">Obliczone cele</p>
            <p className="text-muted-foreground">
              {profile.daily_calories} kcal · B {profile.daily_protein_g} g · W{" "}
              {profile.daily_carbs_g} g · T {profile.daily_fat_g} g
            </p>
          </div>

          <Button
            className="w-full rounded-2xl"
            disabled={isPending}
            onClick={handleSaveProfile}
          >
            Zapisz profil
          </Button>
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
              <Input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="rounded-2xl"
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
          <Button className="mt-4 w-full rounded-2xl" onClick={handleAddWeight}>
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
                <p className="text-sm text-muted-foreground">
                  {ACTIVITY_LABELS[profile.activity_level]}
                </p>
              </div>
            </div>
            <Switch
              checked={reminder?.enabled ?? false}
              onCheckedChange={(enabled) =>
                startTransition(async () => {
                  await updateWeightReminder(
                    profile.id,
                    reminder?.days_of_week ?? [1],
                    enabled
                  );
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

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-card p-6 text-center">
          <BrandLogo variant="icon" className="h-12 w-12" />
          <BrandLogo variant="wordmark" className="h-7" />
          <p className="text-sm text-muted-foreground">
            PairPlate — wspólne liczenie kalorii dla dwojga
          </p>
        </div>

        <Button
          variant="outline"
          className="mt-6 w-full rounded-2xl"
          onClick={() => signOut()}
        >
          Wyloguj
        </Button>
      </StitchPage>
    </>
  );
}
