import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { SettingsProfileClient } from "@/components/settings/SettingsProfileClient";
import { getSettingsPageData } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Settings & Profile | Ultimate League Manager",
  description:
    "Manage profile details, assistant policy actions, account preferences, and support access.",
};

export default async function SettingsPage() {
  const data = await getSettingsPageData();
  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <SettingsProfileClient data={data} />
    </MainLayout>
  );
}
