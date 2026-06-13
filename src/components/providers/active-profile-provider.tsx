"use client";

import { ACTIVE_PROFILE_KEY } from "@/lib/constants";
import type { Profile } from "@/types/database";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ActiveProfileContextValue {
  activeProfile: Profile | null;
  partnerProfile: Profile | null;
  profiles: Profile[];
  setActiveProfileId: (id: string) => void;
  isReady: boolean;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(null);

export function ActiveProfileProvider({
  profiles,
  children,
}: {
  profiles: Profile[];
  children: React.ReactNode;
}) {
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const valid = profiles.find((p) => p.id === stored);
    // Hydrate persisted profile selection after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage read
    setActiveProfileIdState(valid?.id ?? profiles[0]?.id ?? null);
    setIsReady(true);
  }, [profiles]);

  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  }, []);

  const value = useMemo(() => {
    const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;
    const partnerProfile =
      profiles.find((p) => p.id !== activeProfileId) ?? null;

    return {
      activeProfile,
      partnerProfile,
      profiles,
      setActiveProfileId,
      isReady,
    };
  }, [profiles, activeProfileId, setActiveProfileId, isReady]);

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) {
    throw new Error("useActiveProfile must be used within ActiveProfileProvider");
  }
  return context;
}
