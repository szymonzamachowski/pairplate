"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Home,
  Plus,
  ShoppingBasket,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items: Array<{
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
}> = [
  { href: "/today", label: "Dzisiaj", shortLabel: "Dziś", icon: Home },
  { href: "/plan", label: "Plan", shortLabel: "Plan", icon: CalendarDays },
  { href: "/add", label: "Dodaj", shortLabel: "Dodaj", icon: Plus },
  { href: "/recipes", label: "Przepisy", shortLabel: "Przep.", icon: BookOpen },
  { href: "/shopping", label: "Zakupy", shortLabel: "Zak.", icon: ShoppingBasket },
  { href: "/profile", label: "Profil", shortLabel: "Prof.", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center"
      aria-label="Główne menu"
    >
      <div
        className="pp-glass w-full max-w-lg overflow-hidden rounded-t-2xl border-t border-border/30 pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -4px 20px rgba(25, 28, 29, 0.04)" }}
      >
        <div className="grid grid-cols-6 gap-0 px-0.5 pb-1 pt-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0 py-1 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    active && "bg-primary/15 ring-1 ring-primary/40"
                  )}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    "h-2.5 max-w-full truncate text-[8px] font-semibold uppercase leading-none tracking-wide",
                    active ? "text-primary" : "invisible"
                  )}
                  aria-hidden={!active}
                >
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
