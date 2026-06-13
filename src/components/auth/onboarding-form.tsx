"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
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
import { GoalPaceSelector, GoalTabs } from "@/components/profile/goal-pace-selector";
import { GoalTargetWeightSelector } from "@/components/profile/goal-target-weight";
import { ACTIVITY_LABELS, GENDER_LABELS } from "@/lib/constants";
import { applyGoalChange } from "@/lib/nutrition/target-weight";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getProfileThemeByGender } from "@/lib/design-system";
import { createProfiles, type ProfileInput } from "@/lib/actions/auth";
import type { GoalPace } from "@/types/database";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const defaultProfile = (): ProfileInput => ({
  name: "",
  gender: "female",
  age: 30,
  height_cm: 170,
  current_weight_kg: 70,
  goal: "maintain",
  goal_pace: "moderate",
  target_weight_kg: null,
  activity_level: "moderate",
});

function ProfileForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ProfileInput;
  onChange: (value: ProfileInput) => void;
}) {
  const theme = getProfileThemeByGender(value.gender);

  return (
    <div
      className="pp-card p-5"
      style={{
        backgroundColor: theme.container,
        boxShadow: `0 4px 20px ${theme.glow}`,
        border: `1px solid ${theme.main}22`,
      }}
    >
      <div className="mb-4 flex items-center gap-4">
        <ProfileAvatar gender={value.gender} size="lg" />
        <h3 className="text-base font-medium" style={{ color: theme.main }}>
          {title}
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Imię</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="pp-input mt-1.5"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Płeć</Label>
            <Select
              value={value.gender}
              onValueChange={(v) =>
                v && onChange({ ...value, gender: v as ProfileInput["gender"] })
              }
            >
              <SelectTrigger className="pp-input mt-1.5">
                <SelectValue placeholder="Wybierz płeć">
                  {GENDER_LABELS[value.gender]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GENDER_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Wiek</Label>
            <Input
              type="number"
              value={value.age}
              onChange={(e) => onChange({ ...value, age: Number(e.target.value) })}
              className="pp-input mt-1.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Wzrost (cm)</Label>
            <Input
              type="number"
              value={value.height_cm}
              onChange={(e) =>
                onChange({ ...value, height_cm: Number(e.target.value) })
              }
              className="pp-input mt-1.5"
            />
          </div>
          <div>
            <Label>Waga (kg)</Label>
            <Input
              type="number"
              value={value.current_weight_kg}
              onChange={(e) =>
                onChange({
                  ...value,
                  current_weight_kg: Number(e.target.value),
                })
              }
              className="pp-input mt-1.5"
            />
          </div>
        </div>
        <div>
          <Label>Cel</Label>
          <div className="mt-1.5">
            <GoalTabs
              goal={value.goal}
              onChange={(goal) =>
                onChange({
                  ...value,
                  ...applyGoalChange(
                    goal,
                    value.height_cm,
                    value.current_weight_kg,
                    goal === value.goal ? value.target_weight_kg : null
                  ),
                })
              }
            />
          </div>
        </div>

        <GoalTargetWeightSelector
          goal={value.goal}
          heightCm={value.height_cm}
          referenceWeightKg={value.current_weight_kg}
          targetWeightKg={value.target_weight_kg}
          onChange={(target_weight_kg) =>
            onChange({ ...value, target_weight_kg })
          }
          compact
        />

        <GoalPaceSelector
          profile={value}
          onChange={(goal_pace: GoalPace) => onChange({ ...value, goal_pace })}
        />

        <div>
          <Label>Aktywność</Label>
          <Select
            value={value.activity_level}
            onValueChange={(v) =>
              v &&
              onChange({
                ...value,
                activity_level: v as ProfileInput["activity_level"],
              })
            }
          >
            <SelectTrigger className="pp-input mt-1.5">
              <SelectValue placeholder="Wybierz aktywność">
                {ACTIVITY_LABELS[value.activity_level]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function OnboardingForm() {
  const [profileA, setProfileA] = useState<ProfileInput>({
    ...defaultProfile(),
    name: "Osoba A",
  });
  const [profileB, setProfileB] = useState<ProfileInput>({
    ...defaultProfile(),
    name: "Osoba B",
    gender: "male",
  });
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!profileA.name.trim() || !profileB.name.trim()) {
      toast.error("Podaj imiona obu profili");
      return;
    }
    startTransition(async () => {
      const result = await createProfiles(profileA, profileB);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="pp-gradient-bg mx-auto max-w-lg space-y-6 px-5 py-10">
      <div className="text-center">
        <BrandLogo variant="full" className="mx-auto mb-4 h-9" />
        <h1 className="text-2xl font-semibold tracking-[0.02em] text-primary">
          Skonfiguruj parę
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aplikacja automatycznie obliczy cele kaloryczne i makroskładniki
        </p>
      </div>

      <ProfileForm
        title="Profil 1"
        value={profileA}
        onChange={setProfileA}
      />
      <ProfileForm
        title="Profil 2"
        value={profileB}
        onChange={setProfileB}
      />

      <Button className="pp-btn-primary w-full" disabled={isPending} onClick={handleSubmit}>
        Zapisz i kontynuuj
      </Button>
    </div>
  );
}
