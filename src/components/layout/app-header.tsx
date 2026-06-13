"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  showLogo = true,
  rightSlot,
  className,
}: {
  title?: string;
  showLogo?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "pp-glass sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 px-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showLogo && <BrandLogo variant="icon" className="h-9 w-9" />}
        {title ? (
          <h1 className="text-lg font-semibold tracking-[0.02em] text-primary">
            {title}
          </h1>
        ) : (
          <BrandLogo variant="wordmark" className="h-8" />
        )}
      </div>
      {rightSlot}
    </header>
  );
}
