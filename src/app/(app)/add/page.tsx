import { AddMealView } from "@/components/meals/add-meal-view";
import { requireProfiles } from "@/lib/auth/context";
import { getProductShortcuts } from "@/lib/actions/products";
import { Suspense } from "react";

export default async function AddPage() {
  const { household, profiles, supabase } = await requireProfiles();
  const activeProfile = profiles[0];

  const shortcuts = await getProductShortcuts(activeProfile.id, household.id);

  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Ładowanie...</div>}>
      <AddMealView householdId={household.id} shortcuts={shortcuts} />
    </Suspense>
  );
}
