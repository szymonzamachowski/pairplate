"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useActiveProfile } from "@/components/providers/active-profile-provider";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

type StitchHeaderVariant = "brand" | "title" | "split";

interface StitchHeaderProps {
  variant?: StitchHeaderVariant;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  onSwap?: () => void;
  showSwap?: boolean;
  className?: string;
}

export function StitchHeader({
  variant = "brand",
  title,
  backHref,
  onBack,
  onSwap,
  showSwap = true,
  className,
}: StitchHeaderProps) {
  const { activeProfile, partnerProfile, profiles, setActiveProfileId } = useActiveProfile();

  function handleSwap() {
    if (onSwap) {
      onSwap();
      return;
    }
    if (partnerProfile && activeProfile) {
      setActiveProfileId(partnerProfile.id);
    }
  }

  return (
    <header
      className={cn(
        "pp-glass sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/30 px-5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {(backHref || onBack) &&
          (onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href={backHref!}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ))}

        {variant === "brand" && (
          <BrandLogo variant="full" className="h-8" priority />
        )}

        {(variant === "title" || variant === "split") && (
          <>
            {!backHref && activeProfile && (
              <ProfileAvatar
                profile={activeProfile}
                profiles={profiles}
                size="md"
              />
            )}
            <h1
              className={cn(
                "truncate font-semibold tracking-[0.02em] text-primary",
                variant === "split" ? "text-xl" : "text-lg text-foreground"
              )}
            >
              {title}
            </h1>
          </>
        )}
      </div>

      {showSwap && (
        <button
          type="button"
          onClick={handleSwap}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-opacity hover:opacity-70"
          aria-label="Przełącz profil"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>
      )}
    </header>
  );
}

export function StitchPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("px-5 pb-28 pt-5", className)}>{children}</main>
  );
}

export function StitchSectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="pp-label-caps text-[11px] tracking-[0.12em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function StitchFab({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform active:scale-90"
    >
      <span className="text-3xl leading-none">+</span>
    </Link>
  );
}
