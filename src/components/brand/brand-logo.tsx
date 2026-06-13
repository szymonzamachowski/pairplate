import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "icon" | "full" | "full-dark" | "wordmark";

const sources: Record<Exclude<LogoVariant, "full">, string> = {
  icon: "/brand/icon.png",
  "full-dark": "/brand/logo-full-dark.png",
  wordmark: "/brand/logo-wordmark.png",
};

const dimensions: Record<LogoVariant, { width: number; height: number }> = {
  icon: { width: 695, height: 514 },
  full: { width: 954, height: 220 },
  "full-dark": { width: 895, height: 192 },
  wordmark: { width: 678, height: 220 },
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
  if (variant === "full") {
    const light = dimensions.full;
    const dark = dimensions["full-dark"];

    return (
      <span className={cn("inline-flex items-center", className)}>
        <Image
          src="/brand/logo-full.png"
          alt="PairPlate"
          width={light.width}
          height={light.height}
          priority={priority}
          className="h-full w-auto object-contain dark:hidden"
        />
        <Image
          src={sources["full-dark"]}
          alt="PairPlate"
          width={dark.width}
          height={dark.height}
          priority={priority}
          className="hidden h-full w-auto object-contain dark:block"
        />
      </span>
    );
  }

  const { width, height } = dimensions[variant];

  return (
    <Image
      src={sources[variant]}
      alt="PairPlate"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
