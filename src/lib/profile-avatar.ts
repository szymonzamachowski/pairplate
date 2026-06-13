import type { Gender, Profile } from "@/types/database";

export const PROFILE_AVATARS: Record<
  Gender,
  { src: string; alt: string }
> = {
  male: {
    src: "/avatars/profile-male.png",
    alt: "Awatar profilu męskiego",
  },
  female: {
    src: "/avatars/profile-female.png",
    alt: "Awatar profilu damskiego",
  },
};

export function resolveProfileGender(
  profile?: Profile | null,
  gender?: Gender
): Gender {
  return gender ?? profile?.gender ?? "male";
}

export function getProfileAvatarMeta(gender: Gender) {
  return PROFILE_AVATARS[gender];
}
