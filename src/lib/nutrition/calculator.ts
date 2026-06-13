import type {
  ActivityLevel,
  Gender,
  Goal,
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

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  loss: -500,
  maintain: 0,
  gain: 300,
};

export interface ProfileNutritionInput {
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal: Goal;
  activity_level: ActivityLevel;
}

export interface CalculatedTargets extends NutritionTotals {
  daily_calories: number;
  bmr: number;
  tdee: number;
}

export function calculateBmr(input: ProfileNutritionInput): number {
  const { gender, age, height_cm, current_weight_kg } = input;
  const base =
    10 * current_weight_kg + 6.25 * height_cm - 5 * age;

  return gender === "male" ? base + 5 : base - 161;
}

export function calculateTdee(input: ProfileNutritionInput): number {
  const bmr = calculateBmr(input);
  return bmr * ACTIVITY_MULTIPLIERS[input.activity_level];
}

export function calculateDailyTargets(
  input: ProfileNutritionInput
): CalculatedTargets {
  const bmr = calculateBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activity_level];
  const daily_calories = Math.max(
    1200,
    Math.round(tdee + GOAL_ADJUSTMENTS[input.goal])
  );

  const proteinPerKg = input.goal === "gain" ? 2 : 1.8;
  const protein_g = Math.round(input.current_weight_kg * proteinPerKg * 10) / 10;
  const fatCalories = daily_calories * 0.25;
  const fat_g = Math.round((fatCalories / 9) * 10) / 10;
  const proteinCalories = protein_g * 4;
  const carbsCalories = Math.max(0, daily_calories - proteinCalories - fatCalories);
  const carbs_g = Math.round((carbsCalories / 4) * 10) / 10;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    daily_calories,
    kcal: daily_calories,
    protein_g,
    fat_g,
    carbs_g,
  };
}

export function calculateProductNutrition(
  product: Pick<
    Product,
    "kcal_per_100g" | "protein_per_100g" | "fat_per_100g" | "carbs_per_100g"
  >,
  grams: number
): NutritionTotals {
  const ratio = grams / 100;
  return {
    kcal: round(product.kcal_per_100g * ratio),
    protein_g: round(product.protein_per_100g * ratio),
    fat_g: round(product.fat_per_100g * ratio),
    carbs_g: round(product.carbs_per_100g * ratio),
  };
}

export function sumNutrition(items: NutritionTotals[]): NutritionTotals {
  return items.reduce(
    (acc, item) => ({
      kcal: round(acc.kcal + item.kcal),
      protein_g: round(acc.protein_g + item.protein_g),
      fat_g: round(acc.fat_g + item.fat_g),
      carbs_g: round(acc.carbs_g + item.carbs_g),
    }),
    { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  );
}

export function splitNutritionByRatio(
  totals: NutritionTotals,
  portionGrams: number,
  totalWeightGrams: number
): NutritionTotals {
  if (totalWeightGrams <= 0) {
    return { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 };
  }

  const ratio = portionGrams / totalWeightGrams;
  return {
    kcal: round(totals.kcal * ratio),
    protein_g: round(totals.protein_g * ratio),
    fat_g: round(totals.fat_g * ratio),
    carbs_g: round(totals.carbs_g * ratio),
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
