import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { TradesClient } from "@/components/trades/TradesClient";
import { getTradesPageData } from "@/lib/trades";

export default async function TradesPage() {
  const data = await getTradesPageData();
  if (!data) {
    redirect("/onboarding/persona");
  }

  return (
    <MainLayout>
      <TradesClient data={data} />
    </MainLayout>
  );
}
