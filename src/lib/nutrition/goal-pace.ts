import type { Gender, Goal, GoalPace } from "@/types/database";

/** ~7700 kcal ≈ 1 kg masy ciała (tłuszcz + woda + glikogen) */
export const KCAL_PER_KG_BODY = 7700;

export const GOAL_PACE_OPTIONS: Record<
  GoalPace,
  {
    kgPerWeek: number;
    label: string;
    shortLabel: string;
    description: string;
    badge?: string;
  }
> = {
  slow: {
    kgPerWeek: 0.25,
    label: "Wolno — ok. 0,25 kg / tydzień",
    shortLabel: "0,25 kg/tyg.",
    description:
      "Najłagodniejsze tempo. Mniejszy deficyt/nadwyżka — łatwiejsze utrzymanie i mniejsze ryzyko utraty mięśni.",
    badge: "Najbezpieczniejsze",
  },
  moderate: {
    kgPerWeek: 0.5,
    label: "Umiarkowanie — ok. 0,5 kg / tydzień",
    shortLabel: "0,5 kg/tyg.",
    description:
      "Standardowe tempo zalecane przez dietetyków. Dobry balans między efektem a samopoczuciem.",
    badge: "Rekomendowane",
  },
  fast: {
    kgPerWeek: 1,
    label: "Szybko — ok. 1 kg / tydzień",
    shortLabel: "1 kg/tyg.",
    description:
      "Agresywne tempo. Aplikacja ograniczy deficyt/nadwyżkę do bezpiecznych limitów — realne tempo może być niższe.",
    badge: "Wymaga uwagi",
  },
};

export function kcalAdjustmentForPace(kgPerWeek: number): number {
  return Math.round((kgPerWeek * KCAL_PER_KG_BODY) / 7);
}

export function kgPerWeekFromKcalAdjustment(kcalPerDay: number): number {
  return Math.round(((kcalPerDay * 7) / KCAL_PER_KG_BODY) * 100) / 100;
}

export function minimumDailyCalories(gender: Gender): number {
  return gender === "male" ? 1500 : 1200;
}

export function goalPaceApplies(goal: Goal): boolean {
  return goal === "loss" || goal === "gain";
}

export function goalPaceDisclaimer(goal: Goal): string | null {
  if (goal === "loss") {
    return "Redukcja szybsza niż ~1 kg/tyg. bez opieki specjalisty nie jest zalecana. PairPlate stosuje limity bezpieczeństwa.";
  }
  if (goal === "gain") {
    return "Przy szybkim tempie większość przyrostu to tłuszcz. Dla masy mięśniowej lepsze jest tempo umiarkowane (+ trening siłowy).";
  }
  return null;
}
