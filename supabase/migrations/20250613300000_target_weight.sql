-- Docelowa waga profilu (redukcja / budowa masy)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5, 2)
  CHECK (target_weight_kg IS NULL OR target_weight_kg > 0);
