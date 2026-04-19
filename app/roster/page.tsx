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
        rosterId={data.rosterId}
        leagueName={data.leagueName}
        competitionName={data.competitionName}
        squadSize={data.squadSize}
        benchCapacity={data.benchCapacity}
        totalTeamPoints={data.totalTeamPoints}
        projectedPointsThisMatchday={data.projectedPointsThisMatchday}
        startingPlayers={data.startingPlayers}
        benchPlayers={data.benchPlayers}
        availablePlayers={data.availablePlayers}
      />
    </MainLayout>
  );
}
