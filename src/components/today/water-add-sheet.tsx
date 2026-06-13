"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { addWaterIntake } from "@/lib/actions/water";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_AMOUNTS = [200, 250, 330, 500] as const;

export function WaterAddSheet({
  open,
  onOpenChange,
  profileId,
  logDate,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  logDate: string;
  onAdded?: () => void;
}) {
  const [customAmount, setCustomAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(amountMl: number) {
    startTransition(async () => {
      const result = await addWaterIntake(profileId, amountMl, logDate);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Dodano ${amountMl} ml wody`);
      setCustomAmount("");
      onOpenChange(false);
      onAdded?.();
    });
  }

  function handleCustomAdd() {
    const amount = Number(customAmount.replace(",", "."));
    if (!amount) {
      toast.error("Podaj ilość w ml");
      return;
    }
    handleAdd(Math.round(amount));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Dodaj wodę</SheetTitle>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleAdd(amount)}
              className="h-14 rounded-2xl text-base font-semibold"
            >
              {amount} ml
            </Button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <label className="pp-label-caps block text-[10px] text-muted-foreground">
            Inna ilość (ml)
          </label>
          <div className="flex gap-2">
            <Input
              inputMode="decimal"
              placeholder="np. 750"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button
              type="button"
              disabled={isPending || !customAmount.trim()}
              onClick={handleCustomAdd}
              className="h-12 shrink-0 rounded-xl px-5"
            >
              Dodaj
            </Button>
          </div>
        </div>

        <p className={cn("mt-4 text-xs text-muted-foreground")}>
          Woda liczy się osobno — nie dodajesz jej jako posiłku.
        </p>
      </SheetContent>
    </Sheet>
  );
}
