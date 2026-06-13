"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { GoalPaceSelector, GoalTabs } from "@/components/profile/goal-pace-selector";
import { GoalTargetWeightSelector } from "@/components/profile/goal-target-weight";
import { StitchHeader, StitchPage } from "@/components/layout/stitch-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import { ACTIVITY_LABELS, GENDER_LABELS } from "@/lib/constants";
import { applyGoalChange } from "@/lib/nutrition/target-weight";
import { signOut, updateProfile, type ProfileInput } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

function profileToForm(profile: Profile): ProfileInput {
  return {
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    height_cm: Number(profile.height_cm),
    current_weight_kg: Number(profile.current_weight_kg),
    goal: profile.goal,
    goal_pace: profile.goal_pace ?? "moderate",
    target_weight_kg: profile.target_weight_kg
      ? Number(profile.target_weight_kg)
      : null,
    activity_level: profile.activity_level,
  };
}

function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProfileInput>(() => profileToForm(profile));

  async function handleSaveProfile() {
    startTransition(async () => {
      const result = await updateProfile(profile.id, form);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Zapisano ustawienia");
        router.push("/profile");
      }
    });
  }

  return (
    <>
      <section className="mb-6 space-y-3">
          <h3 className="pp-label-caps px-1 text-[11px] tracking-[0.12em] text-muted-foreground">
            Twoje cele
          </h3>
          <GoalTabs
            goal={form.goal}
            onChange={(goal) =>
              setForm({
                ...form,
                ...applyGoalChange(
                  goal,
                  form.height_cm,
                  form.current_weight_kg,
                  goal === form.goal ? form.target_weight_kg : null
                ),
              })
            }
          />
          <GoalTargetWeightSelector
            goal={form.goal}
            heightCm={form.height_cm}
            referenceWeightKg={form.current_weight_kg}
            targetWeightKg={form.target_weight_kg}
            onChange={(target_weight_kg) =>
              setForm({ ...form, target_weight_kg })
            }
          />
          <GoalPaceSelector
            profile={form}
            onChange={(goal_pace) => setForm({ ...form, goal_pace })}
          />
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
                    <SelectValue placeholder="Wybierz płeć">
                      {GENDER_LABELS[form.gender]}
                    </SelectValue>
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
                <NumericInput
                  value={form.age}
                  onValueChange={(age) => setForm({ ...form, age })}
                  min={13}
                  max={120}
                  step={1}
                  decimals={0}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Wzrost (cm)</Label>
                <NumericInput
                  value={form.height_cm}
                  onValueChange={(height_cm) => setForm({ ...form, height_cm })}
                  min={100}
                  max={250}
                  step={1}
                  decimals={0}
                  className="rounded-2xl"
                />
              </div>
              <div>
                <Label>Waga bazowa (kg)</Label>
                <NumericInput
                  value={form.current_weight_kg}
                  onValueChange={(current_weight_kg) =>
                    setForm({ ...form, current_weight_kg })
                  }
                  min={30}
                  max={300}
                  step={0.1}
                  decimals={1}
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
                  <SelectValue placeholder="Wybierz aktywność">
                    {ACTIVITY_LABELS[form.activity_level]}
                  </SelectValue>
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
              <p className="mt-2 text-xs text-muted-foreground">
                Zapisz ustawienia po zmianie danych lub tempa celu.
              </p>
            </div>

            <Button
              className="w-full rounded-2xl"
              disabled={isPending}
              onClick={handleSaveProfile}
            >
              Zapisz ustawienia
            </Button>
          </div>
        </section>

        <section
          className="mb-6 overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <h3 className="mb-4 text-base font-medium">Wygląd</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Motyw aplikacji</p>
              <p className="text-sm text-muted-foreground">
                {theme === "dark" ? "Ciemny" : "Jasny"}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
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
    </>
  );
}

export function ProfileSettingsView() {
  const { activeProfile } = useActiveProfile();
  const profile = activeProfile as Profile | undefined;

  if (!profile) {
    return <div className="p-6 text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <>
      <StitchHeader
        variant="title"
        title="Ustawienia"
        backHref="/profile"
        showSwap={false}
      />
      <StitchPage>
        <ProfileSettingsForm key={profile.id} profile={profile} />
      </StitchPage>
    </>
  );
}
