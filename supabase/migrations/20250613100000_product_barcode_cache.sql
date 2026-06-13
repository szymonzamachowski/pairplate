-- Barcode lookup + Open Food Facts cache per household

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_household_barcode
  ON products (household_id, barcode)
  WHERE barcode IS NOT NULL AND household_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_barcode_lookup
  ON products (barcode)
  WHERE barcode IS NOT NULL;

-- Prevent duplicate global OFF entries (race-safe upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_global_barcode
  ON products (barcode)
  WHERE household_id IS NULL AND barcode IS NOT NULL;

-- Global OFF cache writes: tylko service role (patrz src/lib/supabase/admin.ts)
-- NIE dodawaj polityki INSERT dla authenticated + household_id IS NULL
