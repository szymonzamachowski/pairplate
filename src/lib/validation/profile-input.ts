import type { ProfileInput } from "@/lib/actions/auth";

export function validateProfileInput(input: ProfileInput): { error?: string } {
  const name = input.name.trim();
  if (!name) return { error: "Imię jest wymagane" };
  if (name.length > 80) return { error: "Imię jest zbyt długie" };

  if (!Number.isFinite(input.age) || input.age < 13 || input.age > 120) {
    return { error: "Wiek musi być między 13 a 120 lat" };
  }

  if (!Number.isFinite(input.height_cm) || input.height_cm < 100 || input.height_cm > 250) {
    return { error: "Wzrost musi być między 100 a 250 cm" };
  }

  if (
    !Number.isFinite(input.current_weight_kg) ||
    input.current_weight_kg < 30 ||
    input.current_weight_kg > 300
  ) {
    return { error: "Waga musi być między 30 a 300 kg" };
  }

  if (input.goal !== "maintain") {
    if (input.target_weight_kg === null || !Number.isFinite(input.target_weight_kg)) {
      return { error: "Ustaw wagę docelową" };
    }
    if (input.target_weight_kg < 30 || input.target_weight_kg > 300) {
      return { error: "Waga docelowa musi być między 30 a 300 kg" };
    }
  }

  return {};
}

export function validateWeightKg(weightKg: number): { error?: string } {
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
    return { error: "Waga musi być między 30 a 300 kg" };
  }
  return {};
}
