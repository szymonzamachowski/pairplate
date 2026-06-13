"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { profileTheme } from "@/lib/design-system";
import { ACTIVE_PROFILE_KEY } from "@/lib/constants";
import type { Profile } from "@/types/database";
import { useRouter } from "next/navigation";

const profileMeta = [
  { tagline: "Kuchenny mistrz", theme: profileTheme.profile1 },
  { tagline: "Esteta smaku", theme: profileTheme.profile2 },
] as const;

export function SelectProfileView({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();

  function choose(profileId: string) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    router.push("/today");
  }

  return (
    <div className="pp-gradient-bg mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 py-12">
      <header className="mb-10 text-center">
        <BrandLogo variant="full" className="mx-auto h-10" priority />
        <p className="mt-3 text-lg font-medium text-foreground">
          Kto dzisiaj gotuje?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Wybierz profil</p>
      </header>

      <div className="grid w-full max-w-sm gap-6">
        {profiles.map((profile, index) => {
          const meta = profileMeta[index] ?? profileMeta[0];
          const color = profile.accent_color || meta.theme.main;

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => choose(profile.id)}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/40 bg-card transition-all hover:-translate-y-1 active:scale-[0.98]"
              style={{ boxShadow: "0 20px 40px rgba(25, 28, 29, 0.04)" }}
            >
              <div className="flex h-full flex-col items-center justify-center p-8">
                <ProfileAvatar
                  profile={profile}
                  profiles={profiles}
                  size="xl"
                  className="mb-4 ring-4 ring-background/80"
                  priority={index === 0}
                />
                <p className="text-xl font-semibold text-foreground">{profile.name}</p>
                <p
                  className="pp-label-caps mt-2 text-[11px] tracking-[0.14em]"
                  style={{ color }}
                >
                  {meta.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm italic text-muted-foreground">
        Twoje wspólne menu czeka.
      </p>
    </div>
  );
}
