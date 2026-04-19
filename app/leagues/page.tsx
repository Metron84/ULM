import { redirect } from "next/navigation";

import { MainLayout } from "@/components/layout/MainLayout";
import { MyLeaguesClient } from "@/components/leagues/MyLeaguesClient";
import { getMyLeaguesPageData } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function MyLeaguesPage() {
  const data = await getMyLeaguesPageData();
  if (!data) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <MyLeaguesClient competitions={data.competitions} leagues={data.leagues} />
    </MainLayout>
  );
}
