"use client";

import {
  getProfileAvatarMeta,
  PROFILE_AVATARS,
  type ProfileSlot,
} from "@/lib/profile-avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import Image from "next/image";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

interface ProfileAvatarProps {
  profile?: Profile | null;
  slot?: ProfileSlot;
  profiles?: Profile[];
  size?: keyof typeof sizeClasses;
  className?: string;
  showBorder?: boolean;
  priority?: boolean;
}

export function ProfileAvatar({
  profile,
  slot,
  profiles,
  size = "md",
  className,
  showBorder = true,
  priority = false,
}: ProfileAvatarProps) {
  const meta = slot
    ? PROFILE_AVATARS[slot]
    : profile
      ? getProfileAvatarMeta(profile, profiles)
      : PROFILE_AVATARS.profile1;

  const borderColor = profile?.accent_color
    ? `${profile.accent_color}33`
    : "var(--border)";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        showBorder && "border-2",
        sizeClasses[size],
        className
      )}
      style={showBorder ? { borderColor } : undefined}
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
