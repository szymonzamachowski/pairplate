/** PairPlate design tokens */

export const brand = {
  primary: "#47645b",
  primaryContainer: "#d1f2e6",
  onPrimaryContainer: "#527066",
  secondary: "#625b73",
  secondaryContainer: "#e8defb",
  onSecondaryContainer: "#686179",
  tertiary: "#455f88",
  tertiaryContainer: "#e3ebff",
  surface: "#f8fafb",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f4f5",
  surfaceContainer: "#eceeef",
  onSurface: "#191c1d",
  onSurfaceVariant: "#414845",
  outline: "#727975",
  outlineVariant: "#c1c8c4",
} as const;

export const profileTheme = {
  profile1: {
    main: "#1A365D",
    container: "#E3EBFF",
    onContainer: "#455F88",
    glow: "rgba(26, 54, 93, 0.12)",
  },
  profile2: {
    main: "#805AD5",
    accent: "#D53F8C",
    container: "#E8DEFB",
    onContainer: "#686179",
    glow: "rgba(128, 90, 213, 0.14)",
  },
} as const;

export const shadows = {
  card: "0 4px 20px rgba(25, 28, 29, 0.04)",
  cardHover: "0 8px 28px rgba(25, 28, 29, 0.08)",
  nav: "0 -4px 20px rgba(25, 28, 29, 0.04)",
} as const;

export const radii = {
  card: "1rem",
  cardLg: "1.25rem",
  input: "0.75rem",
  pill: "9999px",
} as const;

export const mealChipColors: Record<
  string,
  { bg: string; text: string }
> = {
  breakfast: { bg: "#d1f2e6", text: "#527066" },
  second_breakfast: { bg: "#e3ebff", text: "#516a94" },
  lunch: { bg: "#d1f2e6", text: "#527066" },
  snack: { bg: "#e8defb", text: "#686179" },
  dinner: { bg: "#d1f2e6", text: "#527066" },
};
