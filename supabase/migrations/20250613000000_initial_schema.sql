-- PairPlate initial schema

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE goal_type AS ENUM ('loss', 'maintain', 'gain');
CREATE TYPE activity_level_type AS ENUM (
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
);
CREATE TYPE meal_type AS ENUM (
  'breakfast',
  'second_breakfast',
  'lunch',
  'snack',
  'dinner'
);
CREATE TYPE product_source_type AS ENUM (
  'local',
  'custom',
  'open_food_facts',
  'external_api',
  'ai_generated'
);
CREATE TYPE product_category_type AS ENUM (
  'dairy',
  'meat',
  'dry_goods',
  'produce',
  'other'
);

-- Household (pair space)
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'PairPlate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Profiles (two per household)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender gender_type NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 14 AND age <= 120),
  height_cm NUMERIC(5, 1) NOT NULL CHECK (height_cm > 0),
  current_weight_kg NUMERIC(5, 2) NOT NULL CHECK (current_weight_kg > 0),
  goal goal_type NOT NULL DEFAULT 'maintain',
  activity_level activity_level_type NOT NULL DEFAULT 'moderate',
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  daily_protein_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  daily_fat_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  daily_carbs_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  accent_color TEXT NOT NULL DEFAULT '#007AFF',
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_household ON profiles(household_id);

-- Products (global seed + custom per household)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  source product_source_type NOT NULL DEFAULT 'local',
  category product_category_type NOT NULL DEFAULT 'other',
  kcal_per_100g NUMERIC(7, 2) NOT NULL CHECK (kcal_per_100g >= 0),
  protein_per_100g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(6, 2) NOT NULL DEFAULT 0,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(brand, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_household ON products(household_id);
CREATE INDEX idx_products_search ON products USING GIN (search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Shared meals (split by weight)
CREATE TABLE shared_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  name TEXT,
  total_weight_g NUMERIC(8, 2) NOT NULL CHECK (total_weight_g > 0),
  profile_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_a_grams NUMERIC(8, 2) NOT NULL CHECK (profile_a_grams >= 0),
  profile_b_grams NUMERIC(8, 2) NOT NULL CHECK (profile_b_grams >= 0),
  total_kcal NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_meals_household_date ON shared_meals(household_id, log_date);

-- Meal entries (daily log per profile)
CREATE TABLE meal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  name TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_meal_id UUID REFERENCES shared_meals(id) ON DELETE SET NULL,
  total_kcal NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_entries_profile_date ON meal_entries(profile_id, log_date);
CREATE INDEX idx_meal_entries_household_date ON meal_entries(household_id, log_date);

-- Meal items
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_entry_id UUID NOT NULL REFERENCES meal_entries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  grams NUMERIC(8, 2) NOT NULL CHECK (grams > 0),
  kcal NUMERIC(8, 2) NOT NULL DEFAULT 0,
  protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_items_entry ON meal_items(meal_entry_id);

-- Daily aggregated logs
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  total_kcal NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, log_date)
);

CREATE INDEX idx_daily_logs_profile_date ON daily_logs(profile_id, log_date DESC);

-- Weight tracking
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
  logged_at DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weight_logs_profile ON weight_logs(profile_id, logged_at DESC);

CREATE TABLE weight_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  days_of_week SMALLINT[] NOT NULL DEFAULT ARRAY[1]::SMALLINT[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Favorites & usage stats
CREATE TABLE favorite_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);

CREATE TABLE product_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);

CREATE INDEX idx_product_usage_profile ON product_usage_stats(profile_id, use_count DESC, last_used_at DESC);

-- Saved recipes / meals
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE saved_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES saved_recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  grams NUMERIC(8, 2) NOT NULL CHECK (grams > 0),
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- Meal planning
CREATE TABLE planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  name TEXT NOT NULL,
  saved_recipe_id UUID REFERENCES saved_recipes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planned_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_meal_id UUID NOT NULL REFERENCES planned_meals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  grams NUMERIC(8, 2) NOT NULL CHECK (grams > 0),
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_planned_meals_household_date ON planned_meals(household_id, plan_date);

-- Shopping list
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  grams NUMERIC(8, 2),
  category product_category_type NOT NULL DEFAULT 'other',
  is_checked BOOLEAN NOT NULL DEFAULT false,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  planned_meal_id UUID REFERENCES planned_meals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_list_household ON shopping_list_items(household_id, is_checked);

-- Future AI hooks (placeholder tables)
CREATE TABLE ai_meal_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image')),
  input_payload JSONB NOT NULL DEFAULT '{}',
  result_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: household access
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM households WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_meal_analyses ENABLE ROW LEVEL SECURITY;

-- Household policies
CREATE POLICY households_select ON households FOR SELECT USING (user_id = auth.uid());
CREATE POLICY households_insert ON households FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY households_update ON households FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY households_delete ON households FOR DELETE USING (user_id = auth.uid());

-- Profiles policies
CREATE POLICY profiles_all ON profiles FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

-- Products: global (household_id IS NULL) readable by all authenticated; custom editable by owner
CREATE POLICY products_select ON products FOR SELECT TO authenticated
  USING (household_id IS NULL OR household_id = get_user_household_id());
CREATE POLICY products_insert ON products FOR INSERT TO authenticated
  WITH CHECK (household_id = get_user_household_id());
CREATE POLICY products_update ON products FOR UPDATE TO authenticated
  USING (household_id = get_user_household_id());
CREATE POLICY products_delete ON products FOR DELETE TO authenticated
  USING (household_id = get_user_household_id());

-- Generic household-scoped policies
CREATE POLICY shared_meals_all ON shared_meals FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY meal_entries_all ON meal_entries FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY meal_items_all ON meal_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meal_entries me
      WHERE me.id = meal_items.meal_entry_id
        AND me.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_entries me
      WHERE me.id = meal_items.meal_entry_id
        AND me.household_id = get_user_household_id()
    )
  );

CREATE POLICY daily_logs_all ON daily_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = daily_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = daily_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

CREATE POLICY weight_logs_all ON weight_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = weight_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = weight_logs.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

CREATE POLICY weight_reminder_all ON weight_reminder_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = weight_reminder_settings.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = weight_reminder_settings.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

CREATE POLICY favorite_products_all ON favorite_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = favorite_products.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = favorite_products.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

CREATE POLICY product_usage_all ON product_usage_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = product_usage_stats.profile_id
        AND p.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = product_usage_stats.profile_id
        AND p.household_id = get_user_household_id()
    )
  );

CREATE POLICY saved_recipes_all ON saved_recipes FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY saved_recipe_items_all ON saved_recipe_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saved_recipes sr
      WHERE sr.id = saved_recipe_items.recipe_id
        AND sr.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_recipes sr
      WHERE sr.id = saved_recipe_items.recipe_id
        AND sr.household_id = get_user_household_id()
    )
  );

CREATE POLICY planned_meals_all ON planned_meals FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY planned_meal_items_all ON planned_meal_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM planned_meals pm
      WHERE pm.id = planned_meal_items.planned_meal_id
        AND pm.household_id = get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planned_meals pm
      WHERE pm.id = planned_meal_items.planned_meal_id
        AND pm.household_id = get_user_household_id()
    )
  );

CREATE POLICY shopping_list_all ON shopping_list_items FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

CREATE POLICY ai_meal_analyses_all ON ai_meal_analyses FOR ALL
  USING (household_id = get_user_household_id())
  WITH CHECK (household_id = get_user_household_id());

-- Seed global products
INSERT INTO products (name, source, category, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g) VALUES
  ('Pierś z kurczaka', 'local', 'meat', 165, 31, 3.6, 0),
  ('Ryż biały', 'local', 'dry_goods', 130, 2.7, 0.3, 28),
  ('Ryż basmati', 'local', 'dry_goods', 121, 3.5, 0.4, 25),
  ('Makaron', 'local', 'dry_goods', 131, 5, 1.1, 25),
  ('Jajko', 'local', 'dairy', 155, 13, 11, 1.1),
  ('Mleko 2%', 'local', 'dairy', 50, 3.3, 2, 4.8),
  ('Jogurt naturalny', 'local', 'dairy', 59, 10, 0.4, 3.6),
  ('Płatki owsiane', 'local', 'dry_goods', 389, 16.9, 6.9, 66.3),
  ('Chleb pszenny', 'local', 'dry_goods', 265, 9, 3.2, 49),
  ('Masło', 'local', 'dairy', 717, 0.9, 81, 0.1),
  ('Oliwa', 'local', 'other', 884, 0, 100, 0),
  ('Banan', 'local', 'produce', 89, 1.1, 0.3, 23),
  ('Jabłko', 'local', 'produce', 52, 0.3, 0.2, 14),
  ('Twaróg półtłusty', 'local', 'dairy', 98, 18, 2, 3.5),
  ('Ser żółty', 'local', 'dairy', 402, 25, 33, 1.3),
  ('Łosoś', 'local', 'meat', 208, 20, 13, 0),
  ('Tuńczyk w wodzie', 'local', 'meat', 116, 26, 1, 0),
  ('Ziemniaki', 'local', 'produce', 77, 2, 0.1, 17),
  ('Marchew', 'local', 'produce', 41, 0.9, 0.2, 10),
  ('Brokuł', 'local', 'produce', 34, 2.8, 0.4, 7),
  ('Pomidor', 'local', 'produce', 18, 0.9, 0.2, 3.9),
  ('Ogórek', 'local', 'produce', 15, 0.7, 0.1, 3.6),
  ('Cebula', 'local', 'produce', 40, 1.1, 0.1, 9.3),
  ('Papryka', 'local', 'produce', 31, 1, 0.3, 6);

-- Trigger: update household updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER daily_logs_updated_at BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
