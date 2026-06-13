-- Tempo celu (redukcja / masa) + usunięcie niebezpiecznej polityki cache OFF

CREATE TYPE goal_pace_type AS ENUM ('slow', 'moderate', 'fast');

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_pace goal_pace_type NOT NULL DEFAULT 'moderate';

DROP POLICY IF EXISTS products_insert_global_off ON products;
