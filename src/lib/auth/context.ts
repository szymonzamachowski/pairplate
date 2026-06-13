import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { redirect } from "next/navigation";

export async function getHouseholdContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!household) {
    redirect("/onboarding");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: true });

  return {
    supabase,
    user,
    household,
    profiles: (profiles ?? []) as Profile[],
  };
}

export async function requireProfiles(): Promise<{
  household: Awaited<ReturnType<typeof getHouseholdContext>>["household"];
  profiles: Profile[];
  supabase: Awaited<ReturnType<typeof getHouseholdContext>>["supabase"];
}> {
  const { household, profiles, supabase } = await getHouseholdContext();

  if (profiles.length < 2) {
    redirect("/onboarding");
  }

  return { household, profiles, supabase };
}
