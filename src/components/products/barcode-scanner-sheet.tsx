"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Keyboard } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerSheet({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerSheetProps) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("camera");

  useEffect(() => {
    if (!open || mode !== "camera") return;

    let active = true;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    async function start() {
      setError(null);
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 140 },
            aspectRatio: 1.777,
          },
          (decoded) => {
            onScan(decoded);
            onOpenChange(false);
          },
          () => {}
        );
      } catch {
        if (active) {
          setError("Brak dostępu do kamery. Wpisz kod ręcznie.");
          setMode("manual");
        }
      }
    }

    start();

    return () => {
      active = false;
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
          scannerRef.current = null;
        });
    };
  }, [open, mode, onOpenChange, onScan, regionId]);

  function submitManual() {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setManualCode("");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Skanuj kod kreskowy</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant={mode === "camera" ? "default" : "outline"}
            className="flex-1 rounded-xl"
            onClick={() => setMode("camera")}
          >
            <Camera className="mr-2 h-4 w-4" />
            Kamera
          </Button>
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            className="flex-1 rounded-xl"
            onClick={() => setMode("manual")}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Wpisz kod
          </Button>
        </div>

        {mode === "camera" ? (
          <div className="mt-4 space-y-3">
            <div
              id={regionId}
              className={cn(
                "overflow-hidden rounded-2xl bg-black/90",
                error && "hidden"
              )}
            />
            {error && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Ustaw kod kreskowy w ramce. Produkt zostanie pobrany z Open Food
              Facts.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="np. 5901234123457"
              inputMode="numeric"
              className="h-14 w-full rounded-xl border border-border bg-muted/60 px-4 text-lg"
            />
            <Button className="w-full rounded-xl" onClick={submitManual}>
              Szukaj produktu
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
