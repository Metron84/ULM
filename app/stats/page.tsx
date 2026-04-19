import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { StatsClient } from "@/components/stats/StatsClient";
import { getStatsPageData } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Stats & Leaders | Ultimate League Manager",
  description:
    "Track player performance, league leaders, recent form, and World Cup tournament insights in one premium dashboard.",
};

export default async function StatsPage() {
  const data = await getStatsPageData();
  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <StatsClient data={data} />
    </MainLayout>
  );
}
