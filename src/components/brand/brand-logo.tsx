import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "icon" | "full" | "full-dark" | "wordmark";

const sources: Record<LogoVariant, string> = {
  icon: "/brand/icon.svg",
  full: "/brand/logo-full.svg",
  "full-dark": "/brand/logo-dark.svg",
  wordmark: "/brand/logo-full.svg",
};

interface BrandLogoProps {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "full",
  className,
  priority = false,
}: BrandLogoProps) {
  const isIcon = variant === "icon";
  const width = isIcon ? 40 : variant === "wordmark" ? 140 : 180;
  const height = isIcon ? 40 : 40;

  return (
    <Image
      src={sources[variant]}
      alt="PairPlate"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );
}
