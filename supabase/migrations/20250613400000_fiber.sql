-- Daily fiber targets and tracking across products, meals, and logs

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_fiber_g NUMERIC(6, 1) NOT NULL DEFAULT 25;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS fiber_per_100g NUMERIC(6, 2) NOT NULL DEFAULT 0;

ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(8, 2) NOT NULL DEFAULT 0;

ALTER TABLE meal_entries
  ADD COLUMN IF NOT EXISTS total_fiber_g NUMERIC(8, 2) NOT NULL DEFAULT 0;

ALTER TABLE shared_meals
  ADD COLUMN IF NOT EXISTS total_fiber_g NUMERIC(8, 2) NOT NULL DEFAULT 0;

ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS total_fiber_g NUMERIC(8, 2) NOT NULL DEFAULT 0;

UPDATE profiles
SET daily_fiber_g = GREATEST(
  CASE WHEN gender = 'male' THEN 30 ELSE 25 END,
  ROUND(daily_calories / 1000.0 * 14, 1)
);
