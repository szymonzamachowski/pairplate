import { RecipesView } from "@/components/recipes/recipes-view";
import { requireProfiles } from "@/lib/auth/context";
import { getRecipesWithNutrition } from "@/lib/actions/recipes";

export default async function RecipesPage() {
  const { household } = await requireProfiles();
  const recipes = await getRecipesWithNutrition(household.id);

  return <RecipesView householdId={household.id} initialRecipes={recipes} />;
}
