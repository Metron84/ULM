import type { Metadata } from "next";

import { MainLayout } from "@/components/layout/MainLayout";
import { HomeDashboardClient } from "@/components/home/HomeDashboardClient";
import {
  postMatchReviewFallbacks,
  type AssistantPersona,
} from "@/lib/persona";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { getWorldCupHubData } from "@/lib/worldcup";

export const metadata: Metadata = {
  title: "Home | Ultimate League Manager",
  description:
    "Track your fantasy momentum with assistant briefings, predictions, and matchday decisions in one calm dashboard.",
  openGraph: {
    title: "Ultimate League Manager - Home",
    description:
      "Your premium football command center for rankings, assistant insights, and next matchday actions.",
    type: "website",
    url: "/home",
    siteName: "Ultimate League Manager",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "Ultimate League Manager" }],
  },
};

export default async function HomePage() {
  let displayName = "Manager";
  let persona: AssistantPersona = "analyst";
  let briefing = postMatchReviewFallbacks.analyst[0];
  let worldCupRank = 184;
  let worldCupTotal = 1247893;
  let leagueLabel = "Your Primary League";
  let leagueRank = 7;
  let leagueTotalPoints = 324;
  let leagueMovement = 1;
  let predictionsCompleted = 3;
  let predictionsTotal = 5;
  let nextMatchLabel = "France vs England • Sat, Jun 13";
  let nextMatchIso: string | null = null;
  const tickerEntries: string[] = [
    "Points being tabulated this matchday",
    "Mbappé 7.9 • +2 bonus • 14 pts this week",
    "Salah form watch • 3 returns in last 4",
  ];

  if (hasSupabaseEnv()) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, assistant_persona")
        .eq("id", user.id)
        .maybeSingle();

      displayName =
        profile?.display_name ??
        (typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null) ??
        user.email?.split("@")[0] ??
        "Manager";

      if (
        profile?.assistant_persona === "analyst" ||
        profile?.assistant_persona === "diehard_fan" ||
        profile?.assistant_persona === "fantasy_veteran"
      ) {
        persona = profile.assistant_persona;
      }

      const { data: reviewTemplates } = await supabase
        .from("assistant_templates")
        .select("template_text")
        .eq("persona", persona)
        .in("function_type", ["post_match_review", "roster_health"])
        .limit(6);

      const reviewPool =
        reviewTemplates?.map((template) => template.template_text).filter(Boolean) ??
        postMatchReviewFallbacks[persona];

      if (reviewPool.length > 0) {
        const hash = user.id
          .split("")
          .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
        briefing = reviewPool[hash % reviewPool.length]!;
      }

      const { data: participant } = await supabase
        .from("league_participants")
        .select("id,rank,total_points,league_id,league:leagues(name,competition_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (participant?.id) {
        leagueLabel =
          (participant.league as { name?: string | null } | null)?.name ?? "Your League";
        leagueRank = (participant.rank as number | null) ?? 7;
        leagueTotalPoints = (participant.total_points as number | null) ?? 324;

        const { data: weeklyStanding } = await supabase
          .from("prediction_standings")
          .select("rank,total_prediction_points")
          .eq("league_participant_id", participant.id)
          .eq("week_number", 1)
          .maybeSingle();

        if (weeklyStanding?.rank) {
          const standingRank = weeklyStanding.rank as number;
          leagueMovement = Math.max(-3, Math.min(3, leagueRank - standingRank));
        } else {
          leagueMovement = leagueRank <= 5 ? 1 : -1;
        }

        const competitionId =
          (participant.league as { competition_id?: string | null } | null)?.competition_id ?? null;

        if (competitionId) {
          const { count: scheduledCount } = await supabase
            .from("fixtures")
            .select("id", { count: "exact", head: true })
            .eq("competition_id", competitionId)
            .eq("status", "scheduled");

          const { count: predictionCount } = await supabase
            .from("predictions")
            .select("id", { count: "exact", head: true })
            .eq("league_participant_id", participant.id);

          predictionsTotal = Math.max(1, Math.min(5, Number(scheduledCount ?? 5)));
          predictionsCompleted = Math.min(
            predictionsTotal,
            Number(predictionCount ?? predictionsCompleted),
          );
        }
      }

      const { data: topPerformers } = await supabase
        .from("player_performances")
        .select("total_points,bonus_points,player:players(name)")
        .order("total_points", { ascending: false })
        .limit(3);

      const performerTicker = (topPerformers ?? [])
        .map((row) => {
          const name =
            ((row.player as { name?: string | null } | null)?.name as string | undefined) ??
            "Top performer";
          const total = Number(row.total_points ?? 0);
          const bonus = Number(row.bonus_points ?? 0);
          return `${name} • ${total} pts • +${bonus} bonus`;
        })
        .filter(Boolean);

      if (performerTicker.length > 0) {
        tickerEntries.unshift(...performerTicker);
      }

      const { data: nextFixture } = await supabase
        .from("fixtures")
        .select(
          "id,match_date,home_team:real_teams!fixtures_home_team_id_fkey(short_name,name),away_team:real_teams!fixtures_away_team_id_fkey(short_name,name)",
        )
        .eq("status", "scheduled")
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextFixture?.id) {
        const home =
          (nextFixture.home_team as { short_name?: string | null; name?: string | null } | null)
            ?.short_name ??
          (nextFixture.home_team as { name?: string | null } | null)?.name ??
          "Home";
        const away =
          (nextFixture.away_team as { short_name?: string | null; name?: string | null } | null)
            ?.short_name ??
          (nextFixture.away_team as { name?: string | null } | null)?.name ??
          "Away";
        const matchDate = nextFixture.match_date
          ? new Date(nextFixture.match_date as string)
          : null;
        nextMatchLabel = `${home} vs ${away}${
          matchDate
            ? ` • ${matchDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}`
            : ""
        }`;
        nextMatchIso = (nextFixture.match_date as string | null) ?? null;
      }

      const worldCup = await getWorldCupHubData();
      if (worldCup) {
        worldCupRank = worldCup.globalRank;
        worldCupTotal = worldCup.globalTotal;
      }
    }
  }

  return (
    <MainLayout>
      <HomeDashboardClient
        displayName={displayName}
        persona={persona}
        briefing={briefing}
        liveTickerEntries={tickerEntries}
        worldCupRank={worldCupRank}
        worldCupTotal={worldCupTotal}
        leagueLabel={leagueLabel}
        leagueRank={leagueRank}
        leagueTotalPoints={leagueTotalPoints}
        leagueMovement={leagueMovement}
        nextMatchLabel={nextMatchLabel}
        nextMatchIso={nextMatchIso}
        predictionsCompleted={predictionsCompleted}
        predictionsTotal={predictionsTotal}
      />
    </MainLayout>
  );
}
