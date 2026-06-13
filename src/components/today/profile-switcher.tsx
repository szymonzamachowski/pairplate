"use client";

import { getProfileThemeByGender } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfileId: string;
  onChange: (profileId: string) => void;
}

function getProfileStyle(profile: Profile, active: boolean) {
  const theme = getProfileThemeByGender(profile.gender);
  const color = profile.accent_color || theme.main;

  if (!active) {
    return { color: undefined, boxShadow: undefined, borderColor: undefined };
  }

  return {
    color,
    boxShadow: `0 0 0 1px ${color}22, 0 8px 24px ${theme.glow}`,
    borderColor: `${color}33`,
  };
}

export function ProfileSwitcher({
  profiles,
  activeProfileId,
  onChange,
}: ProfileSwitcherProps) {
  return (
    <div className="flex gap-2 rounded-2xl bg-muted/70 p-1.5">
      {profiles.map((profile) => {
        const active = profile.id === activeProfileId;
        const style = getProfileStyle(profile, active);

        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(profile.id)}
            className={cn(
              "flex-1 rounded-xl border border-transparent px-4 py-3 text-sm font-medium transition-all",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={
              active
                ? {
                    boxShadow: style.boxShadow,
                    borderColor: style.borderColor,
                  }
                : undefined
            }
          >
            <span style={active ? { color: style.color } : undefined}>
              {profile.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
