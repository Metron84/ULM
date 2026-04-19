import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { WorldCupHubClient } from "@/components/worldcup/WorldCupHubClient";
import { getWorldCupHubData } from "@/lib/worldcup";

export const metadata: Metadata = {
  title: "World Cup Hub | Ultimate League Manager",
  description:
    "Follow knockout momentum, global leaderboard position, and bracket race in the World Cup Hub.",
  openGraph: {
    title: "World Cup Hub - Ultimate League Manager",
    description:
      "Live the knockout journey with global ranks, league standings, and bracket pulse in one premium view.",
    type: "website",
    url: "/worldcup",
    siteName: "Ultimate League Manager",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "World Cup Hub" }],
  },
};

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
