import { BottomNav } from "@/components/layout/bottom-nav";
import { AppShell } from "@/components/layout/app-shell";
import { ActiveProfileProvider } from "@/components/providers/active-profile-provider";
import { requireProfiles } from "@/lib/auth/context";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profiles } = await requireProfiles();

  if (profiles.length === 0) {
    redirect("/onboarding");
  }

  return (
    <ActiveProfileProvider profiles={profiles}>
      <AppShell>{children}</AppShell>
      <BottomNav />
    </ActiveProfileProvider>
  );
}
