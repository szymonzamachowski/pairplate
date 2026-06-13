import {
  GOAL_PACE_OPTIONS,
  KCAL_PER_KG_BODY,
  kcalAdjustmentForPace,
  kgPerWeekFromKcalAdjustment,
  minimumDailyCalories,
} from "@/lib/nutrition/goal-pace";
import type {
  ActivityLevel,
  Gender,
  Goal,
  GoalPace,
  NutritionTotals,
  Product,
} from "@/types/database";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export interface ProfileNutritionInput {
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal: Goal;
  goal_pace: GoalPace;
  activity_level: ActivityLevel;
}

export interface CalculatedTargets extends NutritionTotals {
  daily_calories: number;
  daily_water_ml: number;
  bmr: number;
  tdee: number;
  calorie_adjustment: number;
  requested_kg_per_week: number;
  effective_kg_per_week: number;
  warnings: string[];
}

export function calculateBmr(input: ProfileNutritionInput): number {
  const { gender, age, height_cm, current_weight_kg } = input;
  const base = 10 * current_weight_kg + 6.25 * height_cm - 5 * age;

  return gender === "male" ? base + 5 : base - 161;
}

export function calculateTdee(input: ProfileNutritionInput): number {
  const bmr = calculateBmr(input);
  return bmr * ACTIVITY_MULTIPLIERS[input.activity_level];
}

/** EFSA: min. 25 g (K) / 30 g (M); dodatkowo ~14 g na 1000 kcal (wytyczne żywieniowe). */
export function calculateDailyFiber(
  gender: Gender,
  daily_calories: number
): number {
  const genderMin = gender === "male" ? 30 : 25;
  const calorieBased = Math.round((daily_calories / 1000) * 14);
  return Math.max(genderMin, calorieBased);
}

const WATER_ACTIVITY_BONUS_ML: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  very_active: 1000,
};

/** EFSA AI 2.0 L (K) / 2.5 L (M) + 33 ml/kg masy ciała + bonus aktywności. */
export function calculateDailyWaterMl(
  input: Pick<ProfileNutritionInput, "gender" | "current_weight_kg" | "activity_level">
): number {
  const genderMin = input.gender === "male" ? 2500 : 2000;
  const weightBased = Math.round(input.current_weight_kg * 33);
  const raw =
    Math.max(weightBased, genderMin) +
    WATER_ACTIVITY_BONUS_ML[input.activity_level];

  return Math.round(raw / 100) * 100;
}

export function calculateDailyTargets(
  input: ProfileNutritionInput
): CalculatedTargets {
  const bmr = calculateBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activity_level];
  const warnings: string[] = [];
  const minCalories = minimumDailyCalories(input.gender);

  let daily_calories = Math.round(tdee);
  let calorie_adjustment = 0;
  let requestedKg = 0;
  let effectiveKg = 0;

  if (input.goal === "maintain") {
    daily_calories = Math.round(tdee);
  } else {
    requestedKg = GOAL_PACE_OPTIONS[input.goal_pace].kgPerWeek;
    const requestedKcal = kcalAdjustmentForPace(requestedKg);

    if (input.goal === "loss") {
      const maxDeficit = Math.min(Math.round(tdee * 0.3), 1100);
      const deficit = Math.min(requestedKcal, maxDeficit);

      if (requestedKcal > maxDeficit) {
        warnings.push(
          `Deficyt ograniczony do ${maxDeficit} kcal/d (maks. 30% TDEE lub 1100 kcal) — bezpieczniejsza redukcja.`
        );
      }

      daily_calories = Math.max(minCalories, Math.round(tdee - deficit));
      calorie_adjustment = daily_calories - Math.round(tdee);

      if (Math.round(tdee - deficit) < minCalories) {
        warnings.push(
          `Ze względu na minimum ${minCalories} kcal/d tempo będzie wolniejsze niż wybrane.`
        );
      }

      if (input.goal_pace === "fast") {
        warnings.push(
          "Tempo 1 kg/tyg. jest agresywne. Przy długotrwałej redukcji rozważ konsultację z dietetykiem."
        );
      }
    } else {
      const maxSurplus =
        input.goal_pace === "fast"
          ? Math.min(Math.round(tdee * 0.15), 750)
          : Math.min(Math.round(tdee * 0.12), 550);

      const surplus = Math.min(requestedKcal, maxSurplus);

      if (requestedKcal > maxSurplus) {
        warnings.push(
          `Nadwyżka ograniczona do ${maxSurplus} kcal/d — zdrowszy przyrost masy mięśniowej.`
        );
      }

      daily_calories = Math.round(tdee + surplus);
      calorie_adjustment = surplus;

      if (input.goal_pace === "fast") {
        warnings.push(
          "Przy 1 kg/tyg. znaczna część to tłuszcz. Dla masy mięśniowej lepsze tempo umiarkowane + trening siłowy."
        );
      }
    }

    effectiveKg = kgPerWeekFromKcalAdjustment(Math.abs(calorie_adjustment));
  }

  const proteinPerKg =
    input.goal === "gain" ? 2 : input.goal === "loss" ? 2 : 1.8;
  const protein_g =
    Math.round(input.current_weight_kg * proteinPerKg * 10) / 10;
  const fatCalories = daily_calories * 0.25;
  const fat_g = Math.round((fatCalories / 9) * 10) / 10;
  const proteinCalories = protein_g * 4;
  const carbsCalories = Math.max(
    0,
    daily_calories - proteinCalories - fatCalories
  );
  const carbs_g = Math.round((carbsCalories / 4) * 10) / 10;
  const fiber_g = calculateDailyFiber(input.gender, daily_calories);
  const daily_water_ml = calculateDailyWaterMl(input);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    daily_calories,
    daily_water_ml,
    kcal: daily_calories,
    protein_g,
    fat_g,
    carbs_g,
    fiber_g,
    calorie_adjustment,
    requested_kg_per_week: requestedKg,
    effective_kg_per_week: effectiveKg,
    warnings,
  };
}

export function calculateProductNutrition(
  product: Pick<
    Product,
    | "kcal_per_100g"
    | "protein_per_100g"
    | "fat_per_100g"
    | "carbs_per_100g"
    | "fiber_per_100g"
  >,
  grams: number
): NutritionTotals {
  const ratio = grams / 100;
  return {
    kcal: round(product.kcal_per_100g * ratio),
    protein_g: round(product.protein_per_100g * ratio),
    fat_g: round(product.fat_per_100g * ratio),
    carbs_g: round(product.carbs_per_100g * ratio),
    fiber_g: round(product.fiber_per_100g * ratio),
  };
}

export function sumNutrition(items: NutritionTotals[]): NutritionTotals {
  return items.reduce(
    (acc, item) => ({
      kcal: round(acc.kcal + item.kcal),
      protein_g: round(acc.protein_g + item.protein_g),
      fat_g: round(acc.fat_g + item.fat_g),
      carbs_g: round(acc.carbs_g + item.carbs_g),
      fiber_g: round(acc.fiber_g + item.fiber_g),
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0 }
  );
}

export function splitNutritionByRatio(
  totals: NutritionTotals,
  portionGrams: number,
  totalWeightGrams: number
): NutritionTotals {
  if (totalWeightGrams <= 0) {
    return { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0 };
  }

  const ratio = portionGrams / totalWeightGrams;
  return {
    kcal: round(totals.kcal * ratio),
    protein_g: round(totals.protein_g * ratio),
    fat_g: round(totals.fat_g * ratio),
    carbs_g: round(totals.carbs_g * ratio),
    fiber_g: round(totals.fiber_g * ratio),
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export { KCAL_PER_KG_BODY };
