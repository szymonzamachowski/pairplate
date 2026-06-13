export type Gender = "male" | "female";
export type Goal = "loss" | "maintain" | "gain";
export type GoalPace = "slow" | "moderate" | "fast";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type MealType =
  | "breakfast"
  | "second_breakfast"
  | "lunch"
  | "snack"
  | "dinner";
export type ProductSource =
  | "local"
  | "custom"
  | "open_food_facts"
  | "external_api"
  | "ai_generated";
export type ProductCategory =
  | "dairy"
  | "meat"
  | "dry_goods"
  | "produce"
  | "other";

export interface Household {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  household_id: string;
  name: string;
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  goal: Goal;
  goal_pace: GoalPace;
  target_weight_kg: number | null;
  activity_level: ActivityLevel;
  daily_calories: number;
  daily_protein_g: number;
  daily_fat_g: number;
  daily_carbs_g: number;
  daily_fiber_g: number;
  daily_water_ml: number;
  accent_color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  household_id: string | null;
  name: string;
  brand: string | null;
  barcode: string | null;
  source: ProductSource;
  category: ProductCategory;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  meal_entry_id: string;
  product_id: string | null;
  product_name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  sort_order: number;
}

export interface MealEntry {
  id: string;
  household_id: string;
  profile_id: string;
  log_date: string;
  meal_type: MealType;
  name: string | null;
  is_shared: boolean;
  shared_meal_id: string | null;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  total_fiber_g: number;
  created_at: string;
  meal_items?: MealItem[];
}

export interface SharedMeal {
  id: string;
  household_id: string;
  log_date: string;
  meal_type: MealType;
  name: string | null;
  total_weight_g: number;
  profile_a_id: string;
  profile_b_id: string;
  profile_a_grams: number;
  profile_b_grams: number;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  total_fiber_g: number;
  created_at: string;
}

export interface DailyLog {
  id: string;
  profile_id: string;
  log_date: string;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  total_fiber_g: number;
  total_water_ml: number;
}

export interface WaterLog {
  id: string;
  profile_id: string;
  log_date: string;
  amount_ml: number;
  created_at: string;
}

export interface WeightLog {
  id: string;
  profile_id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
  created_at: string;
}

export interface WeightReminderSettings {
  id: string;
  profile_id: string;
  days_of_week: number[];
  enabled: boolean;
  push_enabled: boolean;
}

export interface SavedRecipe {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  saved_recipe_items?: SavedRecipeItem[];
}

export interface SavedRecipeItem {
  id: string;
  recipe_id: string;
  product_id: string | null;
  product_name: string;
  grams: number;
  sort_order: number;
}

export interface PlannedMeal {
  id: string;
  household_id: string;
  profile_id: string;
  plan_date: string;
  meal_type: MealType;
  name: string;
  saved_recipe_id: string | null;
  notes: string | null;
  planned_meal_items?: PlannedMealItem[];
}

export interface PlannedMealItem {
  id: string;
  planned_meal_id: string;
  product_id: string | null;
  product_name: string;
  grams: number;
  sort_order: number;
}

export interface ShoppingListItem {
  id: string;
  household_id: string;
  product_id: string | null;
  product_name: string;
  grams: number | null;
  category: ProductCategory;
  is_checked: boolean;
  is_manual: boolean;
  planned_meal_id: string | null;
}

export interface NutritionTotals {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export interface DraftMealItem {
  product: Product;
  grams: number;
  nutrition: NutritionTotals;
}
