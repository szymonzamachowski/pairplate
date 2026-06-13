import { SelectProfileView } from "@/components/auth/select-profile-view";
import { getHouseholdContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function SelectProfilePage() {
  const { profiles } = await getHouseholdContext();

  if (profiles.length < 2) {
    redirect("/onboarding");
  }

  return <SelectProfileView profiles={profiles} />;
}
