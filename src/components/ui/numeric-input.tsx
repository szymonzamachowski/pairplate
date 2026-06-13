"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function parseNumericInput(raw: string): number | null {
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

type NumericInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "onChange" | "value"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  decimals?: number;
};

export function NumericInput({
  value,
  onValueChange,
  min,
  max,
  step = "any",
  decimals,
  className,
  ...props
}: NumericInputProps) {
  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => {
        const parsed = parseNumericInput(e.target.value);
        if (parsed === null) return;

        let next = parsed;
        if (decimals !== undefined) {
          const factor = 10 ** decimals;
          next = Math.round(next * factor) / factor;
        }
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        onValueChange(next);
      }}
      className={cn(className)}
    />
  );
}

type NumericFieldProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "onChange" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  decimals?: number;
};

/** String-backed numeric field (e.g. weight before blur/submit). */
export function NumericField({
  value,
  onValueChange,
  min,
  max,
  step = "any",
  decimals = 1,
  className,
  onBlur,
  ...props
}: NumericFieldProps) {
  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        if (raw === "") {
          onValueChange("");
          return;
        }
        if (!/^\d*\.?\d*$/.test(raw)) return;
        onValueChange(raw);
      }}
      onBlur={(e) => {
        const parsed = parseNumericInput(e.target.value);
        if (parsed !== null) {
          let next = parsed;
          const factor = 10 ** decimals;
          next = Math.round(next * factor) / factor;
          if (min !== undefined) next = Math.max(min, next);
          if (max !== undefined) next = Math.min(max, next);
          onValueChange(String(next));
        }
        onBlur?.(e);
      }}
      className={cn(className)}
    />
  );
}
