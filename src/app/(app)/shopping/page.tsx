import { ShoppingView } from "@/components/shopping/shopping-view";
import { requireProfiles } from "@/lib/auth/context";
import { getShoppingList, regenerateShoppingList } from "@/lib/actions/planning";

export default async function ShoppingPage() {
  const { household } = await requireProfiles();
  await regenerateShoppingList(household.id);
  const initialItems = await getShoppingList(household.id);

  return <ShoppingView householdId={household.id} initialItems={initialItems} />;
}
