"use client";

import {
  StitchHeader,
  StitchPage,
} from "@/components/layout/stitch-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/lib/constants";
import {
  addManualShoppingItem,
  deleteShoppingItem,
  toggleShoppingItem,
} from "@/lib/actions/planning";
import { cn } from "@/lib/utils";
import type { ProductCategory, ShoppingListItem } from "@/types/database";
import { Egg, Leaf, Plus, ShoppingBasket, Trash2, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

const categoryIcons: Partial<Record<ProductCategory, typeof Leaf>> = {
  produce: Leaf,
  dairy: Egg,
  meat: UtensilsCrossed,
  other: ShoppingBasket,
};

export function ShoppingView({
  householdId,
  initialItems,
}: {
  householdId: string;
  initialItems: ShoppingListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [category, setCategory] = useState<ProductCategory>("other");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const grouped = useMemo(() => {
    const map = new Map<ProductCategory, ShoppingListItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const uncheckedCount = items.filter((i) => !i.is_checked).length;

  async function handleAddManual() {
    if (!newItem.trim()) return;
    startTransition(async () => {
      const result = await addManualShoppingItem(householdId, newItem.trim(), category);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.item) {
        setItems((prev) => [...prev, result.item as ShoppingListItem]);
      }
      toast.success("Dodano do listy");
      setNewItem("");
      setShowAddForm(false);
      router.refresh();
    });
  }

  async function handleToggle(item: ShoppingListItem) {
    const checked = !item.is_checked;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: checked } : i))
    );
    await toggleShoppingItem(item.id, checked);
  }

  return (
    <>
      <StitchHeader variant="brand" />
      <StitchPage>
        <header className="mb-6 space-y-1">
          <h2 className="text-2xl font-medium tracking-[0.01em]">
            Lista zakupów
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length > 0
              ? `Przygotowane na ten tydzień (${uncheckedCount} pozostało)`
              : "Wspólna lista z planu posiłków"}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-4 py-16 text-muted-foreground">
            <ShoppingBasket className="mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">Lista jest pusta</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([cat, catItems]) => {
              const Icon = categoryIcons[cat] ?? ShoppingBasket;
              const remaining = catItems.filter((i) => !i.is_checked).length;

              return (
                <section key={cat}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">{CATEGORY_LABELS[cat]}</h3>
                    <span className="pp-label-caps ml-auto rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">
                      {remaining}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {catItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggle(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left transition-transform active:scale-[0.98]",
                          item.is_checked && "opacity-60"
                        )}
                        style={{ boxShadow: "0 4px 20px rgba(25, 28, 29, 0.04)" }}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            item.is_checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          )}
                        >
                          {item.is_checked && (
                            <span className="text-sm leading-none">✓</span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-medium",
                              item.is_checked && "line-through text-muted-foreground"
                            )}
                          >
                            {item.product_name}
                          </p>
                          {item.grams ? (
                            <p className="text-sm text-muted-foreground">
                              {Math.round(Number(item.grams))} g
                            </p>
                          ) : null}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            startTransition(async () => {
                              await deleteShoppingItem(item.id);
                              setItems((prev) => prev.filter((i) => i.id !== item.id));
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="relative mt-10 overflow-hidden rounded-3xl bg-primary/10 p-6">
          <h4 className="text-lg font-medium text-primary">Czegoś brakuje?</h4>
          <p className="mt-1 max-w-[75%] text-sm text-muted-foreground">
            Dodaj własne produkty lub zsynchronizuj z zaplanowanymi posiłkami.
          </p>
          <Button
            className="mt-4 rounded-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj produkt
          </Button>
          <ShoppingBasket className="pointer-events-none absolute -right-4 -bottom-4 h-28 w-28 rotate-12 text-primary/10" />
        </section>

        {showAddForm && (
          <div
            className="fixed inset-x-0 bottom-[72px] z-40 rounded-t-3xl border-t border-border/30 bg-card/95 px-5 pt-5 pb-6 backdrop-blur-md"
            style={{ boxShadow: "0 -10px 30px rgba(25, 28, 29, 0.03)" }}
          >
            <h3 className="mb-4 text-lg font-medium">Dodaj ręcznie</h3>
            <div className="space-y-3">
              <Input
                placeholder="Nazwa produktu"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="rounded-xl"
              />
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ProductCategory)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Wybierz kategorię">
                    {CATEGORY_LABELS[category]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setShowAddForm(false)}
                >
                  Anuluj
                </Button>
                <Button
                  className="rounded-2xl"
                  disabled={isPending}
                  onClick={handleAddManual}
                >
                  Dodaj
                </Button>
              </div>
            </div>
          </div>
        )}
      </StitchPage>
    </>
  );
}
