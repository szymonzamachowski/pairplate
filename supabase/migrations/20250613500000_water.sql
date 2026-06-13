-- Water intake tracking (separate from meals)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_water_ml INTEGER NOT NULL DEFAULT 2000;

ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS total_water_ml INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_profile_date
  ON water_logs(profile_id, log_date DESC);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY water_logs_all ON water_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = water_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = water_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

UPDATE profiles
SET daily_water_ml = ROUND(
  (
    GREATEST(
      CASE WHEN gender = 'male' THEN 2500 ELSE 2000 END,
      ROUND(current_weight_kg * 33)::integer
    ) + CASE activity_level
      WHEN 'sedentary' THEN 0
      WHEN 'light' THEN 250
      WHEN 'moderate' THEN 500
      WHEN 'active' THEN 750
      WHEN 'very_active' THEN 1000
    END
  )::numeric / 100
) * 100;
