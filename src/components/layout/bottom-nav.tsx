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
  icon: typeof Home;
}> = [
  { href: "/today", label: "Dzisiaj", icon: Home },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/add", label: "Dodaj", icon: Plus },
  { href: "/recipes", label: "Przepisy", icon: BookOpen },
  { href: "/shopping", label: "Zakupy", icon: ShoppingBasket },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pp-glass fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border/30 pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -4px 20px rgba(25, 28, 29, 0.04)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-0.5 pb-1.5 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[9px] leading-none transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className="pp-label-caps max-w-full truncate font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
