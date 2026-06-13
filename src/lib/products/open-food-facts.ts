import type { ProductCategory } from "@/types/database";

const OFF_BASE = "https://world.openfoodfacts.org";
const USER_AGENT =
  "PairPlate/0.1 (nutrition app) - https://github.com/szymonzamachowski/pairplate";

export interface OffNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal"?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
}

export interface OffProductPayload {
  code: string;
  product_name?: string;
  product_name_pl?: string;
  generic_name?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: OffNutriments;
}

export interface OffSearchHit {
  code: string;
  product_name?: string;
  product_name_pl?: string;
  brands?: string;
  nutriments?: OffNutriments;
  categories_tags?: string[];
}

export interface MappedOffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  category: ProductCategory;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
}

function offHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
}

export function normalizeBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) return null;
  return digits;
}

export function mapOffProduct(payload: OffProductPayload): MappedOffProduct | null {
  const barcode = normalizeBarcode(payload.code);
  if (!barcode) return null;

  const name =
    payload.product_name_pl?.trim() ||
    payload.product_name?.trim() ||
    payload.generic_name?.trim();
  if (!name) return null;

  const n = payload.nutriments ?? {};
  const kcal =
    n["energy-kcal_100g"] ??
    (n["energy-kcal"] != null ? n["energy-kcal"] / 100 : undefined);

  if (kcal == null || Number.isNaN(kcal)) return null;

  return {
    barcode,
    name,
    brand: payload.brands?.split(",")[0]?.trim() || null,
    category: mapOffCategory(payload.categories_tags),
    kcal_per_100g: round2(kcal),
    protein_per_100g: round2(n.proteins_100g ?? 0),
    fat_per_100g: round2(n.fat_100g ?? 0),
    carbs_per_100g: round2(n.carbohydrates_100g ?? 0),
  };
}

function mapOffCategory(tags: string[] | undefined): ProductCategory {
  const joined = (tags ?? []).join(" ").toLowerCase();
  if (/meat|fish|seafood|poultry|wurst|ham/.test(joined)) return "meat";
  if (/milk|cheese|yogurt|dairy|egg/.test(joined)) return "dairy";
  if (/fruit|vegetable|produce|legume|salad/.test(joined)) return "produce";
  if (/pasta|rice|bread|cereal|grain|dry/.test(joined)) return "dry_goods";
  return "other";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function fetchOffProductByBarcode(
  barcode: string
): Promise<MappedOffProduct | null> {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return null;

  const res = await fetch(`${OFF_BASE}/api/v2/product/${normalized}.json`, {
    headers: offHeaders(),
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: number;
    product?: OffProductPayload;
  };

  if (json.status !== 1 || !json.product) return null;
  return mapOffProduct({ ...json.product, code: normalized });
}

export async function searchOffProducts(
  query: string,
  limit = 15
): Promise<MappedOffProduct[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    search_terms: trimmed,
    page_size: String(limit),
    fields: "code,product_name,product_name_pl,brands,nutriments,categories_tags",
    lc: "pl",
    countries_tags_en: "poland",
  });

  const res = await fetch(`${OFF_BASE}/api/v2/search?${params}`, {
    headers: offHeaders(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { products?: OffSearchHit[] };
  const mapped: MappedOffProduct[] = [];

  for (const hit of json.products ?? []) {
    const product = mapOffProduct({
      code: hit.code,
      product_name: hit.product_name,
      product_name_pl: hit.product_name_pl,
      brands: hit.brands,
      nutriments: hit.nutriments,
      categories_tags: hit.categories_tags,
    });
    if (product) mapped.push(product);
  }

  return mapped;
}
