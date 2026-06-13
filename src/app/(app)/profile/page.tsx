import { ProfileView } from "@/components/profile/profile-view";
import { requireProfiles } from "@/lib/auth/context";
import { getDayHistory } from "@/lib/actions/meals";
import { getWeightHistory, getWeightReminder } from "@/lib/actions/weight";

export default async function ProfilePage() {
  const { profiles } = await requireProfiles();

  const initialWeightByProfile: Record<string, Awaited<ReturnType<typeof getWeightHistory>>> = {};
  const initialReminderByProfile: Record<
    string,
    Awaited<ReturnType<typeof getWeightReminder>>
  > = {};
  const initialHistoryByProfile: Record<
    string,
    Awaited<ReturnType<typeof getDayHistory>>
  > = {};

  await Promise.all(
    profiles.map(async (profile) => {
      initialWeightByProfile[profile.id] = await getWeightHistory(profile.id);
      initialReminderByProfile[profile.id] = await getWeightReminder(profile.id);
      initialHistoryByProfile[profile.id] = await getDayHistory(profile.id);
    })
  );

  return (
    <ProfileView
      initialWeightByProfile={initialWeightByProfile}
      initialReminderByProfile={initialReminderByProfile}
      initialHistoryByProfile={initialHistoryByProfile}
    />
  );
}
