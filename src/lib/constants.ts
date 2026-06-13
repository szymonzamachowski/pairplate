import type {
  ActivityLevel,
  Goal,
  Gender,
  MealType,
  ProductCategory,
} from "@/types/database";

export const APP_NAME = "PairPlate";
export const ACTIVE_PROFILE_KEY = "pairplate_active_profile_id";

export const GENDER_ACCENT_COLORS: Record<Gender, string> = {
  male: "#1A365D",
  female: "#805AD5",
};

/** @deprecated Use GENDER_ACCENT_COLORS[gender] */
export const PROFILE_COLORS = [GENDER_ACCENT_COLORS.male, GENDER_ACCENT_COLORS.female] as const;

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "Drugie śniadanie",
  lunch: "Obiad",
  snack: "Przekąska",
  dinner: "Kolacja",
};

export const MEAL_TYPES: MealType[] = [
  "breakfast",
  "second_breakfast",
  "lunch",
  "snack",
  "dinner",
];

export const GOAL_LABELS: Record<Goal, string> = {
  loss: "Redukcja",
  maintain: "Utrzymanie",
  gain: "Budowa masy",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Siedzący tryb życia",
  light: "Lekka aktywność",
  moderate: "Umiarkowana aktywność",
  active: "Aktywny tryb życia",
  very_active: "Bardzo aktywny",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Mężczyzna",
  female: "Kobieta",
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  dairy: "Nabiał",
  meat: "Mięso i ryby",
  dry_goods: "Produkty suche",
  produce: "Warzywa i owoce",
  other: "Inne",
};

export const WEEKDAY_LABELS = [
  "Nd",
  "Pn",
  "Wt",
  "Śr",
  "Cz",
  "Pt",
  "Sb",
] as const;

export const NAV_ITEMS = [
  { href: "/today", label: "Dzisiaj", icon: "Home" },
  { href: "/add", label: "Dodaj", icon: "PlusCircle" },
  { href: "/plan", label: "Plan", icon: "Calendar" },
  { href: "/shopping", label: "Zakupy", icon: "ShoppingCart" },
  { href: "/profile", label: "Profil", icon: "User" },
] as const;
