"use client";

import { BarcodeScannerSheet } from "@/components/products/barcode-scanner-sheet";
import {
  StitchHeader,
  StitchPage,
  StitchSectionLabel,
} from "@/components/layout/stitch-header";
import { StitchMacroSummaryBar } from "@/components/layout/stitch-macro";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import {
  RecipePickerSheet,
} from "@/components/recipes/recipe-picker-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MealChip } from "@/components/ui/meal-chip";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
} from "@/lib/constants";
import {
  addSharedMeal,
  addSoloMeal,
} from "@/lib/actions/meals";
import type { MealItemInput } from "@/lib/meals/utils";
import {
  createCustomProduct,
  importOffProduct,
  lookupProductByBarcode,
  searchProducts,
} from "@/lib/actions/products";
import { resolveRecipeDraftItems, saveRecipe } from "@/lib/actions/recipes";
import { calculateProductNutrition, sumNutrition } from "@/lib/nutrition/calculator";
import type { RecipeWithNutrition } from "@/lib/recipes/nutrition";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { getProfileThemeByGender } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { MealType, Product, Profile } from "@/types/database";
import {
  CheckCircle2,
  CirclePlus,
  Egg,
  Heart,
  Leaf,
  Plus,
  ScanLine,
  Search,
  Trash2,
  Users,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface DraftItem {
  product: Product;
  grams: number;
}

type SearchTab = "recent" | "favorites" | "recipes";
type Phase = "search" | "builder" | "split";

const productIcons = [Egg, Leaf, Heart] as const;

export function AddMealView({
  householdId,
  shortcuts,
}: {
  householdId: string;
  shortcuts: {
    favorites: Product[];
    recent: Product[];
    frequent: Product[];
    savedRecipes: RecipeWithNutrition[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMeal = (searchParams.get("meal") as MealType) || "lunch";
  const { activeProfile, partnerProfile } = useActiveProfile();

  const [phase, setPhase] = useState<Phase>("search");
  const [searchTab, setSearchTab] = useState<SearchTab>("recent");
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [gramsInput, setGramsInput] = useState("100");
  const [mode, setMode] = useState<"solo" | "shared">("solo");
  const [totalWeightG, setTotalWeightG] = useState("");
  const [activeGrams, setActiveGrams] = useState("");
  const [partnerGrams, setPartnerGrams] = useState("");
  const [mealName, setMealName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProduct, setCustomProduct] = useState({
    name: "",
    kcal: "",
    protein: "",
    fat: "",
    carbs: "",
    brand: "",
    barcode: "",
  });
  const [isPending, startTransition] = useTransition();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchProducts(trimmedQuery, householdId);
      if (!cancelled) {
        setResults(data as Product[]);
        setIsSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, householdId]);

  const trimmedQuery = query.trim();
  const visibleResults = trimmedQuery ? results : [];
  const showSearching = trimmedQuery.length > 0 && isSearching;

  const draftTotals = sumNutrition(
    draftItems.map((item) => calculateProductNutrition(item.product, item.grams))
  );

  const kcalPer100g =
    draftTotals.kcal > 0
      ? (draftTotals.kcal /
          draftItems.reduce((sum, item) => sum + item.grams, 0)) *
        100
      : 0;

  const activeKcal = useMemo(() => {
    const total = Number(totalWeightG);
    const grams = Number(activeGrams);
    if (!total || !grams || !draftTotals.kcal) return 0;
    return Math.round((draftTotals.kcal / total) * grams);
  }, [totalWeightG, activeGrams, draftTotals.kcal]);

  const partnerKcal = useMemo(() => {
    const total = Number(totalWeightG);
    const grams = Number(partnerGrams);
    if (!total || !grams || !draftTotals.kcal) return 0;
    return Math.round((draftTotals.kcal / total) * grams);
  }, [totalWeightG, partnerGrams, draftTotals.kcal]);

  const splitPercentActive = useMemo(() => {
    const a = Number(activeGrams);
    const b = Number(partnerGrams);
    const sum = a + b;
    if (!sum) return 50;
    return Math.round((a / sum) * 100);
  }, [activeGrams, partnerGrams]);

  const tabProducts = useMemo(() => {
    if (searchTab === "favorites") return shortcuts.favorites;
    if (searchTab === "recent") return shortcuts.recent;
    return shortcuts.frequent;
  }, [searchTab, shortcuts]);

  function addDraftItem(product: Product) {
    const grams = Number(gramsInput) || 100;
    setDraftItems((prev) => [...prev, { product, grams }]);
    setQuery("");
    setPhase("builder");
    toast.success(`Dodano ${product.name}`);
  }

  function selectProduct(product: Product) {
    if (product.id.startsWith("off-") && product.barcode) {
      startTransition(async () => {
        const result = await importOffProduct(product.barcode!, householdId);
        if (result.error || !result.product) {
          toast.error(result.error ?? "Nie udało się pobrać produktu");
          return;
        }
        addDraftItem(result.product as Product);
      });
      return;
    }
    addDraftItem(product);
  }

  function handleBarcodeScan(raw: string) {
    startTransition(async () => {
      const result = await lookupProductByBarcode(raw, householdId);
      if (result.error || !result.product) {
        toast.error(result.error ?? "Nie znaleziono produktu");
        return;
      }
      addDraftItem(result.product as Product);
    });
  }

  function handleModeChange(next: "solo" | "shared") {
    setMode(next);
    if (next === "shared") {
      const totalGrams = draftItems.reduce((sum, item) => sum + item.grams, 0);
      setTotalWeightG(String(totalGrams || ""));
      setActiveGrams(String(Math.round(totalGrams / 2)));
      setPartnerGrams(String(Math.round(totalGrams / 2)));
      setPhase("split");
    }
  }

  async function handleSaveMeal() {
    if (!activeProfile || draftItems.length === 0) {
      toast.error("Dodaj co najmniej jeden produkt");
      return;
    }

    const items: MealItemInput[] = draftItems.map((item) => {
      const nutrition = calculateProductNutrition(item.product, item.grams);
      return {
        product_id: item.product.id,
        product_name: item.product.name,
        grams: item.grams,
        kcal: nutrition.kcal,
        protein_g: nutrition.protein_g,
        fat_g: nutrition.fat_g,
        carbs_g: nutrition.carbs_g,
      };
    });

    startTransition(async () => {
      if (mode === "shared") {
        if (!partnerProfile) {
          toast.error("Brak drugiego profilu");
          return;
        }
        const totalW = Number(totalWeightG);
        const aGrams = Number(activeGrams);
        const bGrams = Number(partnerGrams);
        if (!totalW || !aGrams || !bGrams) {
          toast.error("Uzupełnij gramaturę wspólnego posiłku");
          return;
        }
        const result = await addSharedMeal({
          householdId,
          activeProfileId: activeProfile.id,
          partnerProfileId: partnerProfile.id,
          mealType,
          name: mealName || undefined,
          items,
          totalWeightG: totalW,
          activeProfileGrams: aGrams,
          partnerProfileGrams: bGrams,
        });
        if (result.error) toast.error(result.error);
        else {
          toast.success("Zapisano wspólny posiłek");
          router.push("/today");
        }
      } else {
        const result = await addSoloMeal({
          householdId,
          profileId: activeProfile.id,
          mealType,
          name: mealName || undefined,
          items,
        });
        if (result.error) toast.error(result.error);
        else {
          toast.success("Zapisano posiłek");
          router.push("/today");
        }
      }
    });
  }

  async function handleCreateCustomProduct() {
    const result = await createCustomProduct({
      householdId,
      name: customProduct.name,
      kcal_per_100g: Number(customProduct.kcal),
      protein_per_100g: Number(customProduct.protein),
      fat_per_100g: Number(customProduct.fat),
      carbs_per_100g: Number(customProduct.carbs),
      brand: customProduct.brand || undefined,
      barcode: customProduct.barcode || undefined,
    });
    if (result.error) toast.error(result.error);
    else if (result.product) {
      addDraftItem(result.product as Product);
      setShowCustomForm(false);
      setCustomProduct({
        name: "",
        kcal: "",
        protein: "",
        fat: "",
        carbs: "",
        brand: "",
        barcode: "",
      });
    }
  }

  async function handleSaveRecipe() {
    if (!mealName || draftItems.length === 0) {
      toast.error("Podaj nazwę i produkty przepisu");
      return;
    }
    await saveRecipe({
      householdId,
      name: mealName,
      items: draftItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        grams: item.grams,
      })),
    });
    toast.success("Zapisano przepis");
  }

  async function handleSelectRecipe(recipeId: string, portion: number) {
    const resolved = await resolveRecipeDraftItems(recipeId, portion);
    if ("error" in resolved) {
      toast.error(resolved.error);
      return;
    }
    setDraftItems(resolved.items);
    setMealName(resolved.recipe.name);
    setPhase("builder");
  }

  if (phase === "search") {
    return (
      <>
        <StitchHeader
          variant="title"
          title="Dodaj produkt"
          backHref="/today"
        />
        <StitchPage className="pb-32">
          <div className="relative mb-6">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj składników..."
              className="h-14 rounded-xl border-none bg-muted/60 pl-12 pr-14 text-base shadow-sm"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/10"
              aria-label="Skanuj kod kreskowy"
            >
              <ScanLine className="h-5 w-5" />
            </button>
          </div>

          {query.length >= 2 && (
            <p className="mb-4 text-xs text-muted-foreground">
              {showSearching
                ? "Szukam w lokalnej bazie i Open Food Facts…"
                : "Wyniki z lokalnej bazy + Open Food Facts (ponad 3 mln produktów)"}
            </p>
          )}

          <div className="mb-6 flex rounded-xl bg-muted p-1">
            {(
              [
                ["recent", "Ostatnie"],
                ["favorites", "Ulubione"],
                ["recipes", "Moje dania"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSearchTab(key);
                  if (key === "recipes") setRecipePickerOpen(true);
                }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm transition-all",
                  searchTab === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-end gap-3">
            <div className="flex-1">
              <label className="pp-label-caps mb-1 block text-[11px] text-muted-foreground">
                Gramatura domyślna
              </label>
              <Input
                type="number"
                value={gramsInput}
                onChange={(e) => setGramsInput(e.target.value)}
                className="h-11 rounded-xl bg-muted/60"
              />
            </div>
          </div>

          {query.length > 0 ? (
            <ProductList
              products={visibleResults}
              onSelect={selectProduct}
              loading={showSearching}
            />
          ) : (
            <>
              <StitchSectionLabel>
                {searchTab === "favorites"
                  ? "Ulubione"
                  : searchTab === "recent"
                    ? "Ostatnio używane"
                    : "Najczęściej używane"}
              </StitchSectionLabel>
              <ProductList products={tabProducts} onSelect={selectProduct} />

              {searchTab === "favorites" && shortcuts.favorites.length > 0 && (
                <div className="-mx-5 mt-8 flex gap-3 overflow-x-auto px-5 pb-2">
                  {shortcuts.favorites.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectProduct(product as Product)}
                      className="flex min-w-[140px] flex-col items-center rounded-2xl border border-border/40 bg-card p-4 text-center shadow-sm"
                    >
                      <Heart className="mb-2 h-5 w-5 fill-primary text-primary" />
                      <p className="line-clamp-1 text-sm">{product.name}</p>
                      <p className="pp-label-caps mt-1 text-[11px] text-secondary">
                        {product.kcal_per_100g} kcal
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="pp-label-caps mt-8 w-full rounded-xl border border-dashed border-border py-4 text-sm text-primary"
          >
            + Utwórz własny produkt
          </button>

          {showCustomForm && (
            <div className="mt-4 space-y-3 rounded-2xl border border-border/40 bg-card p-4">
              <Input
                placeholder="Nazwa produktu"
                value={customProduct.name}
                onChange={(e) =>
                  setCustomProduct((p) => ({ ...p, name: e.target.value }))
                }
                className="rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                {(["kcal", "protein", "fat", "carbs"] as const).map((field) => (
                  <Input
                    key={field}
                    placeholder={
                      field === "kcal"
                        ? "kcal / 100g"
                        : field === "protein"
                          ? "Białko"
                          : field === "fat"
                            ? "Tłuszcz"
                            : "Węgle"
                    }
                    value={customProduct[field]}
                    onChange={(e) =>
                      setCustomProduct((p) => ({ ...p, [field]: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                ))}
              </div>
              <Button
                className="w-full rounded-2xl"
                onClick={handleCreateCustomProduct}
              >
                Zapisz produkt i dodaj
              </Button>
            </div>
          )}

          <Link
            href="/recipes"
            className="mt-6 block text-center text-sm text-primary"
          >
            Przejdź do przepisów →
          </Link>
        </StitchPage>

        <RecipePickerSheet
          open={recipePickerOpen}
          onOpenChange={setRecipePickerOpen}
          householdId={householdId}
          profileId={activeProfile?.id ?? ""}
          recipes={shortcuts.savedRecipes}
          defaultMealType={mealType}
          mode="load"
          onSelectRecipe={handleSelectRecipe}
        />

        <BarcodeScannerSheet
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />
      </>
    );
  }

  if (phase === "split") {
    const activeColor =
      activeProfile?.accent_color ??
      getProfileThemeByGender(activeProfile?.gender ?? "male").main;
    const partnerColor =
      partnerProfile?.accent_color ??
      getProfileThemeByGender(partnerProfile?.gender ?? "female").main;

    return (
      <>
        <StitchHeader
          variant="split"
          title="Podział posiłku"
          onBack={() => setPhase("builder")}
          showSwap={false}
        />
        <StitchPage>
          <div
            className="overflow-hidden rounded-2xl border border-border/40 bg-card p-6"
            style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <MealChip mealType={mealType} />
                <h2 className="mt-2 text-xl font-medium">
                  {mealName || MEAL_TYPE_LABELS[mealType]}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Baza (100g):</p>
                <p className="text-lg font-semibold text-primary">
                  {Math.round(kcalPer100g)} kcal
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="pp-label-caps mb-2 block text-[11px] text-muted-foreground">
                Waga całkowita potrawy (g)
              </label>
              <Input
                type="number"
                value={totalWeightG}
                onChange={(e) => setTotalWeightG(e.target.value)}
                className="h-14 rounded-xl border-none bg-muted text-center text-2xl font-semibold"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between px-1">
              <span className="pp-label-caps text-[11px] text-muted-foreground">
                Porcja {activeProfile?.name}
              </span>
              <span className="pp-label-caps text-[11px] text-muted-foreground">
                Porcja {partnerProfile?.name}
              </span>
            </div>
            <div className="flex h-10 overflow-hidden rounded-full border border-border/40 bg-muted p-1">
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold text-white transition-all duration-500"
                style={{
                  width: `${splitPercentActive}%`,
                  backgroundColor: activeColor,
                }}
              >
                {splitPercentActive}%
              </div>
              <div className="w-px bg-card" />
              <div
                className="flex flex-1 items-center justify-center rounded-full text-xs font-bold text-white transition-all duration-500"
                style={{ backgroundColor: partnerColor }}
              >
                {100 - splitPercentActive}%
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <SplitPortionCard
              profile={activeProfile}
              name={activeProfile?.name ?? "Profil 1"}
              color={activeColor}
              grams={activeGrams}
              kcal={activeKcal}
              onChange={setActiveGrams}
            />
            <SplitPortionCard
              profile={partnerProfile}
              name={partnerProfile?.name ?? "Profil 2"}
              color={partnerColor}
              grams={partnerGrams}
              kcal={partnerKcal}
              onChange={setPartnerGrams}
            />
          </div>

          <StitchMacroSummaryBar
            protein={draftTotals.protein_g}
            proteinTarget={draftTotals.protein_g}
            carbs={draftTotals.carbs_g}
            carbsTarget={draftTotals.carbs_g}
            fat={draftTotals.fat_g}
            fatTarget={draftTotals.fat_g}
          />

          <Button
            className="mt-6 h-14 w-full rounded-2xl text-base"
            disabled={isPending}
            onClick={handleSaveMeal}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Zatwierdź podział
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode("solo");
              setPhase("builder");
            }}
            className="mt-3 w-full text-center text-sm text-muted-foreground"
          >
            Wróć do edycji składników
          </button>
        </StitchPage>
      </>
    );
  }

  const goalProgress =
    activeProfile && activeProfile.daily_calories > 0
      ? Math.min(draftTotals.kcal / activeProfile.daily_calories, 1)
      : 0;

  return (
    <>
      <StitchHeader
        variant="title"
        title="Składanie posiłku"
        onBack={() => setPhase("search")}
      />
      <StitchPage className="pb-44">
        <section
          className="overflow-hidden rounded-2xl border border-border/40 bg-card p-5"
          style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
        >
          <div className="flex items-end justify-between">
            <div>
              <span className="pp-label-caps text-[11px] text-muted-foreground">
                Suma kalorii
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-primary">
                  {Math.round(draftTotals.kcal)}
                </span>
                <span className="text-sm text-muted-foreground">kcal</span>
              </div>
            </div>
            <div className="text-right">
              <span className="pp-label-caps text-[11px] text-muted-foreground">
                Postęp celu
              </span>
              <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${goalProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
          <StitchMacroPillsInline totals={draftTotals} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-medium">Składniki</h2>
            <button
              type="button"
              onClick={() => setPhase("search")}
              className="pp-label-caps inline-flex items-center gap-1 text-[11px] text-primary"
            >
              <Plus className="h-3 w-3" />
              Dodaj więcej
            </button>
          </div>

          {draftItems.map((item, index) => {
            const Icon = productIcons[index % productIcons.length];
            return (
              <div
                key={`${item.product.id}-${index}`}
                className="group flex items-center justify-between rounded-xl border border-transparent bg-card p-4 transition-colors hover:border-primary/20"
                style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.kcal_per_100g} kcal / 100g
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      value={item.grams}
                      onChange={(e) => {
                        const grams = Number(e.target.value) || 0;
                        setDraftItems((prev) =>
                          prev.map((d, i) => (i === index ? { ...d, grams } : d))
                        );
                      }}
                      className="h-10 w-20 rounded-lg border-none bg-muted pr-7 text-right"
                    />
                    <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
                      g
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="rounded-full p-1 text-muted-foreground opacity-70 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Typ posiłku</h2>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  mealType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <Input
            placeholder="Nazwa posiłku (opcjonalnie)"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="h-12 rounded-xl bg-muted/60"
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Tryb zapisu</h2>
          <div className="relative flex h-14 items-center rounded-xl bg-muted p-1">
            <div
              className={cn(
                "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-card shadow transition-transform duration-300",
                mode === "shared" && "translate-x-full"
              )}
            />
            <button
              type="button"
              onClick={() => setMode("solo")}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-2 pp-label-caps text-[11px]",
                mode === "solo" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <UserRound className="h-4 w-4" />
              Solo
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("shared")}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-2 pp-label-caps text-[11px]",
                mode === "shared" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Wspólny posiłek
            </button>
          </div>
        </section>
      </StitchPage>

      <footer
        className="pp-glass fixed inset-x-0 bottom-[88px] z-40 rounded-t-3xl border-t border-border/30 px-5 pt-4 pb-4"
        style={{ boxShadow: "0 -10px 30px rgba(25, 28, 29, 0.03)" }}
      >
        <div className="mx-auto max-w-lg space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{MEAL_TYPE_LABELS[mealType]}</span>
            <span>Profil: {activeProfile?.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-14 rounded-2xl"
              onClick={() => router.push("/today")}
            >
              Anuluj
            </Button>
            <Button
              className="h-14 rounded-2xl"
              disabled={isPending}
              onClick={() =>
                mode === "shared" ? setPhase("split") : handleSaveMeal()
              }
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Zapisz
            </Button>
          </div>
          <button
            type="button"
            onClick={handleSaveRecipe}
            className="w-full text-center text-sm text-primary"
          >
            Zapisz jako przepis
          </button>
        </div>
      </footer>
    </>
  );
}

function ProductList({
  products,
  onSelect,
  loading = false,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Wyszukiwanie…
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Brak produktów w tej sekcji
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {products.map((product, index) => {
        const Icon = productIcons[index % productIcons.length];
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product as Product)}
            className="group flex w-full items-center rounded-xl bg-card p-4 text-left transition-all active:scale-[0.98] hover:bg-muted/40"
            style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
          >
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {product.kcal_per_100g} kcal / 100g
                {product.brand ? ` · ${product.brand}` : ""}
              </p>
              {(product.source === "open_food_facts" ||
                product.id.startsWith("off-")) && (
                <span className="pp-label-caps mt-1 inline-block text-[10px] text-primary">
                  Open Food Facts
                </span>
              )}
            </div>
            <CirclePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </button>
        );
      })}
    </div>
  );
}

function SplitPortionCard({
  profile,
  name,
  color,
  grams,
  kcal,
  onChange,
}: {
  profile?: Profile | null;
  name: string;
  color: string;
  grams: string;
  kcal: number;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="rounded-2xl border border-border/40 bg-card p-5"
      style={{
        boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)",
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        {profile ? (
          <ProfileAvatar profile={profile} size="md" />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {name.charAt(0)}
          </div>
        )}
        <h3 className="text-lg font-medium">Porcja {name}</h3>
      </div>
      <label className="pp-label-caps mb-1 block text-[11px] text-muted-foreground">
        Waga (g)
      </label>
      <Input
        type="number"
        value={grams}
        onChange={(e) => onChange(e.target.value)}
        className="mb-4 h-12 rounded-lg border-none bg-muted text-lg font-medium"
      />
      <div
        className="flex items-center justify-between rounded-lg p-3"
        style={{ backgroundColor: `${color}18` }}
      >
        <span className="text-sm">Energia</span>
        <span className="text-lg font-bold" style={{ color }}>
          {kcal} kcal
        </span>
      </div>
    </div>
  );
}

function StitchMacroPillsInline({
  totals,
}: {
  totals: { protein_g: number; carbs_g: number; fat_g: number };
}) {
  const items = [
    { label: "Białko", value: totals.protein_g, color: "#47645b" },
    { label: "Węgle", value: totals.carbs_g, color: "#625b73" },
    { label: "Tłuszcz", value: totals.fat_g, color: "#455f88" },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/40 pt-4">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <span className="pp-label-caps text-[10px] text-muted-foreground">
            {item.label}
          </span>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{Math.round(item.value)}g</span>
          </div>
        </div>
      ))}
    </div>
  );
}
