"use client";

import { getProfileThemeByGender } from "@/lib/design-system";
import {
  getProfileAvatarMeta,
  resolveProfileGender,
} from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";
import type { Gender, Profile } from "@/types/database";
import Image from "next/image";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

interface ProfileAvatarProps {
  profile?: Profile | null;
  gender?: Gender;
  size?: keyof typeof sizeClasses;
  className?: string;
  showBorder?: boolean;
  priority?: boolean;
}

export function ProfileAvatar({
  profile,
  gender,
  size = "md",
  className,
  showBorder = true,
  priority = false,
}: ProfileAvatarProps) {
  const resolvedGender = resolveProfileGender(profile, gender);
  const meta = getProfileAvatarMeta(resolvedGender);
  const theme = getProfileThemeByGender(resolvedGender);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        showBorder && "border-2",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: theme.container,
        ...(showBorder ? { borderColor: `${theme.main}44` } : undefined),
      }}
    >
      <Image
        src={meta.src}
        alt={meta.alt}
        fill
        priority={priority}
        sizes={
          size === "xl"
            ? "96px"
            : size === "lg"
              ? "64px"
              : size === "md"
                ? "40px"
                : "32px"
        }
        className="object-cover"
      />
    </div>
  );
}
