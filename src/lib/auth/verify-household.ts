import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function requireAuthenticatedHousehold(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  householdId: string;
  profiles: Profile[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: household } = await supabase
    .from("households")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!household) {
    throw new Error("NO_HOUSEHOLD");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: true });

  return {
    supabase,
    householdId: household.id,
    profiles: (profiles ?? []) as Profile[],
  };
}

export function findOwnedProfile(
  profiles: Profile[],
  profileId: string
): Profile | undefined {
  return profiles.find((profile) => profile.id === profileId);
}
