import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { CommissionerPortalClient } from "@/components/leagues/CommissionerPortalClient";
import { getCommissionerPortalData } from "@/lib/leagues";

export default async function CommissionerPortalPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const data = await getCommissionerPortalData(leagueId);

  if (!data) {
    redirect("/leagues");
  }
  if (data === "FORBIDDEN") {
    redirect("/leagues");
  }

  return (
    <MainLayout>
      <CommissionerPortalClient data={data} />
    </MainLayout>
  );
}
