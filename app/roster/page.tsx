import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { RosterManagerClient } from "@/components/roster/RosterManagerClient";
import { getRosterPageData } from "@/lib/roster";

export default async function RosterPage() {
  const data = await getRosterPageData();

  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <RosterManagerClient
        persona={data.persona}
        leagueName={data.leagueName}
        competitionName={data.competitionName}
        projectedPoints={data.projectedPoints}
        startingPlayers={data.startingPlayers}
        benchPlayers={data.benchPlayers}
      />
    </MainLayout>
  );
}
