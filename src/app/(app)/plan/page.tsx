import { PlanView } from "@/components/plan/plan-view";
import { requireProfiles } from "@/lib/auth/context";
import { getPlannedMeals } from "@/lib/actions/planning";
import { addDays, format } from "date-fns";

export default async function PlanPage() {
  const { household } = await requireProfiles();
  const fromDate = format(new Date(), "yyyy-MM-dd");
  const toDate = format(addDays(new Date(), 14), "yyyy-MM-dd");
  const initialMeals = await getPlannedMeals(household.id, fromDate, toDate);

  return <PlanView householdId={household.id} initialMeals={initialMeals} />;
}
