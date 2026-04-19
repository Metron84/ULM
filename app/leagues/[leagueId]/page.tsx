import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { LeagueDetailClient } from "@/components/leagues/LeagueDetailClient";
import { getLeagueDetailPageData } from "@/lib/leagues";

export const metadata: Metadata = {
  title: "League Detail | Ultimate League Manager",
  description:
    "View standings, performance insights, and league actions for your selected competition.",
};

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const data = await getLeagueDetailPageData(leagueId);

  if (!data || data === "FORBIDDEN") {
    redirect("/leagues");
  }

  return (
    <MainLayout>
      <LeagueDetailClient data={data} />
    </MainLayout>
  );
}
