import { PROFILE_COLORS } from "@/lib/constants";
import type { Profile } from "@/types/database";

export type ProfileSlot = "profile1" | "profile2";

export const PROFILE_AVATARS: Record<
  ProfileSlot,
  { src: string; alt: string }
> = {
  profile1: {
    src: "/avatars/profile-male.png",
    alt: "Awatar profilu męskiego",
  },
  profile2: {
    src: "/avatars/profile-female.png",
    alt: "Awatar profilu damskiego",
  },
};

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}

export function getProfileSlot(
  profile: Profile,
  profiles?: Profile[]
): ProfileSlot {
  if (profiles?.length) {
    const index = profiles.findIndex((entry) => entry.id === profile.id);
    if (index === 1) return "profile2";
    if (index === 0) return "profile1";
  }

  const accent = normalizeColor(profile.accent_color ?? "");
  if (
    accent === normalizeColor(PROFILE_COLORS[1]) ||
    accent === "#ff6b6b" ||
    accent === "#d53f8c"
  ) {
    return "profile2";
  }

  return "profile1";
}

export function getProfileAvatarMeta(
  profile: Profile,
  profiles?: Profile[]
) {
  return PROFILE_AVATARS[getProfileSlot(profile, profiles)];
}
