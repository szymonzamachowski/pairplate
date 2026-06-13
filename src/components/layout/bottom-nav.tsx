"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Home,
  Plus,
  ShoppingBasket,
  User,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
}> = [
  { href: "/today", label: "Dzisiaj", shortLabel: "Dziś", icon: Home },
  { href: "/plan", label: "Plan", shortLabel: "Plan", icon: CalendarDays },
  { href: "/shopping", label: "Zakupy", shortLabel: "Zakupy", icon: ShoppingBasket },
  { href: "/profile", label: "Profil", shortLabel: "Profil", icon: User },
];

const addOptions = [
  {
    href: "/recipes",
    label: "Przepis",
    description: "Wybierz zapisany przepis lub dodaj nowy",
    icon: BookOpen,
  },
  {
    href: "/add",
    label: "Posiłek",
    description: "Dodaj produkty i składniki ręcznie",
    icon: UtensilsCrossed,
  },
] as const;

function NavTab({
  href,
  label,
  shortLabel,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1.5 px-0.5 py-2.5 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        strokeWidth={active ? 2.25 : 1.75}
      />
      <span className="w-full truncate text-center text-[10px] font-semibold leading-none tracking-tight">
        {shortLabel}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  const addActive =
    pathname.startsWith("/add") || pathname.startsWith("/recipes");

  function handleAddOption(href: string) {
    setAddOpen(false);
    router.push(href);
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
        <nav
          className="pp-glass pointer-events-auto w-full max-w-lg rounded-2xl border border-border/30"
          style={{ boxShadow: "0 4px 24px rgba(25, 28, 29, 0.08)" }}
          aria-label="Główne menu"
        >
          <div className="grid grid-cols-5">
            <NavTab
              {...navItems[0]}
              active={pathname.startsWith(navItems[0].href)}
            />
            <NavTab
              {...navItems[1]}
              active={pathname.startsWith(navItems[1].href)}
            />

            <button
              type="button"
              aria-label="Dodaj posiłek"
              aria-expanded={addOpen}
              aria-haspopup="dialog"
              onClick={() => setAddOpen(true)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 px-0.5 py-2.5 transition-colors",
                addActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus
                className="h-5 w-5 shrink-0"
                strokeWidth={addActive ? 2.25 : 1.75}
              />
              <span className="w-full truncate text-center text-[10px] font-semibold leading-none tracking-tight">
                Dodaj
              </span>
            </button>

            <NavTab
              {...navItems[2]}
              active={pathname.startsWith(navItems[2].href)}
            />
            <NavTab
              {...navItems[3]}
              active={pathname.startsWith(navItems[3].href)}
            />
          </div>
        </nav>
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-3xl px-4 pb-8"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Co dodajesz?</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {addOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.href}
                  type="button"
                  onClick={() => handleAddOption(option.href)}
                  className="pp-card flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
