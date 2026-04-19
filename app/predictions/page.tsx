import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { PredictionsClient } from "@/components/predictions/PredictionsClient";
import { getPredictionsPageData } from "@/lib/predictions";

export default async function PredictionsPage() {
  const data = await getPredictionsPageData();

  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <PredictionsClient fixtures={data.fixtures} leaderboard={data.leaderboard} />
    </MainLayout>
  );
}
