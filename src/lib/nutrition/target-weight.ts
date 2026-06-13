import type { Goal } from "@/types/database";

export const HEALTHY_BMI_MIN = 20;
export const HEALTHY_BMI_MAX = 24;

export function weightForBmi(bmi: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round(bmi * heightM * heightM * 10) / 10;
}

export function bmiForWeight(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function suggestTargetWeight(
  goal: Goal,
  heightCm: number,
  referenceWeightKg: number
): number | null {
  if (goal === "maintain" || heightCm <= 0 || referenceWeightKg <= 0) {
    return null;
  }

  const floor = weightForBmi(HEALTHY_BMI_MIN, heightCm);
  const ceiling = weightForBmi(HEALTHY_BMI_MAX, heightCm);

  if (goal === "loss") {
    if (referenceWeightKg <= floor) return floor;
    if (referenceWeightKg > ceiling) return ceiling;
    const modest = Math.round(referenceWeightKg * 0.95 * 10) / 10;
    return Math.max(floor, modest);
  }

  if (referenceWeightKg >= ceiling) return referenceWeightKg;
  if (referenceWeightKg < floor) return floor;
  const modest =
    Math.round((referenceWeightKg + Math.min(5, (ceiling - referenceWeightKg) * 0.5)) * 10) /
    10;
  return Math.min(ceiling, modest);
}

export function targetWeightBounds(
  goal: Goal,
  heightCm: number,
  referenceWeightKg: number
): { min: number; max: number; suggested: number } | null {
  if (goal === "maintain" || heightCm <= 0 || referenceWeightKg <= 0) {
    return null;
  }

  const floor = weightForBmi(HEALTHY_BMI_MIN, heightCm);
  const ceiling = weightForBmi(HEALTHY_BMI_MAX, heightCm);
  const suggested =
    suggestTargetWeight(goal, heightCm, referenceWeightKg) ?? referenceWeightKg;

  if (goal === "loss") {
    return {
      min: floor,
      max: Math.max(floor, referenceWeightKg),
      suggested: Math.min(Math.max(suggested, floor), referenceWeightKg),
    };
  }

  if (referenceWeightKg >= ceiling) {
    return {
      min: referenceWeightKg,
      max: referenceWeightKg,
      suggested: referenceWeightKg,
    };
  }

  return {
    min: referenceWeightKg,
    max: ceiling,
    suggested: Math.min(Math.max(suggested, referenceWeightKg), ceiling),
  };
}

export function clampTargetWeight(
  goal: Goal,
  heightCm: number,
  referenceWeightKg: number,
  targetWeightKg: number | null
): number | null {
  const bounds = targetWeightBounds(goal, heightCm, referenceWeightKg);
  if (!bounds) return null;
  if (targetWeightKg === null) return bounds.suggested;

  return (
    Math.round(
      Math.min(bounds.max, Math.max(bounds.min, targetWeightKg)) * 10
    ) / 10
  );
}

export function remainingToTarget(
  goal: Goal,
  referenceWeightKg: number,
  targetWeightKg: number | null
): number | null {
  if (!targetWeightKg || goal === "maintain") return null;

  if (goal === "loss") {
    return Math.round(Math.max(0, referenceWeightKg - targetWeightKg) * 10) / 10;
  }

  return Math.round(Math.max(0, targetWeightKg - referenceWeightKg) * 10) / 10;
}

export function applyGoalChange(
  goal: Goal,
  heightCm: number,
  referenceWeightKg: number,
  currentTarget: number | null
): { goal: Goal; target_weight_kg: number | null } {
  if (goal === "maintain") {
    return { goal, target_weight_kg: null };
  }

  return {
    goal,
    target_weight_kg:
      currentTarget ??
      suggestTargetWeight(goal, heightCm, referenceWeightKg),
  };
}

export function goalReached(
  goal: Goal,
  referenceWeightKg: number,
  targetWeightKg: number | null
): boolean {
  if (!targetWeightKg || goal === "maintain") return false;

  if (goal === "loss") return referenceWeightKg <= targetWeightKg;
  return referenceWeightKg >= targetWeightKg;
}
