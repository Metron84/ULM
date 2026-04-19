import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { WorldCupHubClient } from "@/components/worldcup/WorldCupHubClient";
import { getWorldCupHubData } from "@/lib/worldcup";

export default async function WorldCupHubPage() {
  const data = await getWorldCupHubData();
  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <WorldCupHubClient
        globalRank={data.globalRank}
        globalTotal={data.globalTotal}
        leaderboard={data.leaderboard}
      />
    </MainLayout>
  );
}
