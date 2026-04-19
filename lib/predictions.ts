import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { ensureDemoRosterForUser } from "@/lib/roster";

export type FixturePredictionRow = {
  fixtureId: string;
  matchDate: string;
  status: "scheduled" | "live" | "finished";
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
  };
  prediction: {
    id: string;
    homeScore: number;
    awayScore: number;
    scorerId: string | null;
    scorerName: string | null;
    isNoScorer: boolean;
    pointsAwarded: number;
  } | null;
  scorerOptions: Array<{ id: string; name: string; teamShort: string }>;
};

export type PredictionLeaderboardRow = {
  participantId: string;
  rank: number;
  teamName: string;
  managerName: string;
  totalPoints: number;
  isCurrentUser: boolean;
};

export type PredictionsPageData = {
  leagueId: string;
  leagueParticipantId: string;
  fixtures: FixturePredictionRow[];
  leaderboard: PredictionLeaderboardRow[];
};

type ScorerRow = {
  id: string;
  name: string | null;
  real_team_id: string | null;
  real_team: { short_name?: string | null } | null;
};

const DEMO_PREDICTION_USERS = [
  {
    id: "00000000-0000-4000-8000-000000000221",
    email: "prediction.rival.one@ulm.demo",
    displayName: "Prediction Rival One",
    teamName: "Knockout Class",
  },
  {
    id: "00000000-0000-4000-8000-000000000222",
    email: "prediction.rival.two@ulm.demo",
    displayName: "Prediction Rival Two",
    teamName: "Final Whistle FC",
  },
] as const;

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureDemoPredictionData(
  currentUserId: string,
  leagueId: string,
  leagueParticipantId: string,
  competitionId: string,
) {
  const service = createServiceRoleClient();
  if (!service) return;

  for (const demoUser of DEMO_PREDICTION_USERS) {
    await service.from("users").upsert(
      {
        id: demoUser.id,
        email: demoUser.email,
        display_name: demoUser.displayName,
        assistant_persona: "analyst",
      },
      { onConflict: "id" },
    );
  }

  const participantIds: string[] = [leagueParticipantId];
  for (const [index, demoUser] of DEMO_PREDICTION_USERS.entries()) {
    const { data: participant } = await service
      .from("league_participants")
      .upsert(
        {
          league_id: leagueId,
          user_id: demoUser.id,
          team_name: demoUser.teamName,
          rank: index + 2,
          total_points: 250 - index * 9,
          draft_order: index + 3,
        },
        { onConflict: "league_id,user_id" },
      )
      .select("id")
      .maybeSingle();
    if (participant?.id) participantIds.push(participant.id as string);
  }

  let { data: finishedFixtures } = await service
    .from("fixtures")
    .select("id,home_team_id,away_team_id,status,score_home,score_away")
    .eq("competition_id", competitionId)
    .eq("status", "finished")
    .order("match_date", { ascending: true })
    .limit(3);

  if ((finishedFixtures?.length ?? 0) < 3) {
    const { data: allFixtures } = await service
      .from("fixtures")
      .select("id")
      .eq("competition_id", competitionId)
      .order("match_date", { ascending: true })
      .limit(3);
    for (const [index, fixture] of (allFixtures ?? []).entries()) {
      await service
        .from("fixtures")
        .update({
          status: "finished",
          score_home: index === 2 ? 1 : 2,
          score_away: index === 0 ? 0 : 1,
        })
        .eq("id", fixture.id as string);
    }
    const { data: refreshed } = await service
      .from("fixtures")
      .select("id,home_team_id,away_team_id,status,score_home,score_away")
      .eq("competition_id", competitionId)
      .eq("status", "finished")
      .order("match_date", { ascending: true })
      .limit(3);
    finishedFixtures = refreshed ?? [];
  }

  const teamIds = Array.from(
    new Set(
      (finishedFixtures ?? []).flatMap((fixture) => [
        fixture.home_team_id as string | null,
        fixture.away_team_id as string | null,
      ]),
    ),
  ).filter((id): id is string => Boolean(id));

  const { data: players } = await service
    .from("players")
    .select("id,real_team_id,position")
    .in("real_team_id", teamIds)
    .eq("is_active", true);

  const scorerByTeam = new Map<string, string>();
  (players ?? []).forEach((player) => {
    const teamId = player.real_team_id as string | null;
    if (!teamId || scorerByTeam.has(teamId)) return;
    scorerByTeam.set(teamId, player.id as string);
  });

  const finished = finishedFixtures ?? [];
  for (const [participantIndex, participantId] of participantIds.entries()) {
    for (const [fixtureIndex, fixture] of finished.entries()) {
      const fixtureId = fixture.id as string;
      const existing = await service
        .from("predictions")
        .select("id")
        .eq("league_participant_id", participantId)
        .eq("fixture_id", fixtureId)
        .maybeSingle();

      if (existing.data?.id) continue;

      const homeScore = participantIndex === 0 ? ((fixture.score_home as number | null) ?? 1) : 1;
      const awayScore = participantIndex === 1 ? ((fixture.score_away as number | null) ?? 1) : 0;
      const scorerId =
        fixtureIndex === 2 && homeScore === 0 && awayScore === 0
          ? null
          : scorerByTeam.get((fixture.home_team_id as string) ?? "") ?? null;

      await service.from("predictions").insert({
        league_id: leagueId,
        league_participant_id: participantId,
        fixture_id: fixtureId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        predicted_scorer_id: scorerId,
        is_no_scorer: homeScore === 0 && awayScore === 0,
        points_awarded: participantIndex === 0 ? 3 + (fixtureIndex % 2) : 1 + (participantIndex % 2),
      });
    }
  }

  for (const [index, participantId] of participantIds.entries()) {
    await service.from("prediction_standings").upsert(
      {
        league_id: leagueId,
        week_number: 1,
        league_participant_id: participantId,
        total_prediction_points: Math.max(6, 10 - index * 2),
        rank: index + 1,
      },
      { onConflict: "league_id,week_number,league_participant_id" },
    );
  }

  const currentRows = finished.slice(0, 3).length;
  if (currentRows === 0) return;

  const { data: currentPredictions } = await service
    .from("predictions")
    .select("id")
    .eq("league_participant_id", leagueParticipantId);
  if ((currentPredictions?.length ?? 0) < 2) {
    for (const fixture of finished.slice(0, 2)) {
      await service.from("predictions").upsert(
        {
          league_id: leagueId,
          league_participant_id: leagueParticipantId,
          fixture_id: fixture.id as string,
          predicted_home_score: (fixture.score_home as number | null) ?? 1,
          predicted_away_score: (fixture.score_away as number | null) ?? 0,
          predicted_scorer_id: scorerByTeam.get((fixture.home_team_id as string) ?? "") ?? null,
          is_no_scorer: false,
          points_awarded: 3,
        },
        { onConflict: "league_participant_id,fixture_id" },
      );
    }
  }
}

export async function getPredictionsPageData(): Promise<PredictionsPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await ensureDemoRosterForUser(user.id);

  const { data: participant } = await supabase
    .from("league_participants")
    .select("id,league_id,team_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!participant?.id || !participant.league_id) return null;

  const leagueParticipantId = participant.id as string;
  const leagueId = participant.league_id as string;

  const { data: league } = await supabase
    .from("leagues")
    .select("competition_id")
    .eq("id", leagueId)
    .maybeSingle();

  if (!league?.competition_id) return null;
  const competitionId = league.competition_id as string;

  await ensureDemoPredictionData(user.id, leagueId, leagueParticipantId, competitionId);

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select(
      "id,match_date,status,home_team_id,away_team_id,home_team:real_teams!fixtures_home_team_id_fkey(id,name,short_name,logo_url),away_team:real_teams!fixtures_away_team_id_fkey(id,name,short_name,logo_url)",
    )
    .eq("competition_id", competitionId)
    .order("match_date", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("id,fixture_id,predicted_home_score,predicted_away_score,predicted_scorer_id,is_no_scorer,points_awarded")
    .eq("league_participant_id", leagueParticipantId);

  const predictedScorerIds = (predictions ?? [])
    .map((prediction) => prediction.predicted_scorer_id as string | null)
    .filter((id): id is string => Boolean(id));

  let scorerNameById = new Map<string, string>();
  if (predictedScorerIds.length > 0) {
    const { data: scorerRows } = await supabase
      .from("players")
      .select("id,name")
      .in("id", predictedScorerIds);
    scorerNameById = new Map(
      (scorerRows ?? []).map((row) => [row.id as string, (row.name as string) ?? "Scorer"]),
    );
  }

  const teamIds = Array.from(
    new Set(
      (fixtures ?? []).flatMap((fixture) => [
        fixture.home_team_id as string | null,
        fixture.away_team_id as string | null,
      ]),
    ),
  ).filter((id): id is string => Boolean(id));

  let players: ScorerRow[] = [];
  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("players")
      .select("id,name,real_team_id,real_team:real_teams(id,short_name)")
      .in("real_team_id", teamIds)
      .eq("is_active", true);
    players = (data as ScorerRow[] | null) ?? [];
  }

  const playersByTeam = new Map<string, Array<{ id: string; name: string; teamShort: string }>>();
  players.forEach((player) => {
    const teamId = player.real_team_id;
    if (!teamId) return;
    const existing = playersByTeam.get(teamId) ?? [];
    existing.push({
      id: player.id,
      name: player.name ?? "Player",
      teamShort: player.real_team?.short_name ?? "",
    });
    playersByTeam.set(teamId, existing);
  });

  const predictionByFixture = new Map(
    (predictions ?? []).map((prediction) => [prediction.fixture_id as string, prediction]),
  );

  const fixtureRows: FixturePredictionRow[] = (fixtures ?? []).map((fixture) => {
    const prediction = predictionByFixture.get(fixture.id as string);
    const home = fixture.home_team as
      | { id?: string; name?: string; short_name?: string; logo_url?: string | null }
      | null;
    const away = fixture.away_team as
      | { id?: string; name?: string; short_name?: string; logo_url?: string | null }
      | null;

    const scorerOptions = [
      ...(playersByTeam.get((fixture.home_team_id as string) ?? "") ?? []),
      ...(playersByTeam.get((fixture.away_team_id as string) ?? "") ?? []),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return {
      fixtureId: fixture.id as string,
      matchDate: (fixture.match_date as string) ?? new Date().toISOString(),
      status: ((fixture.status as string) ?? "scheduled") as
        | "scheduled"
        | "live"
        | "finished",
      homeTeam: {
        id: (home?.id as string) ?? (fixture.home_team_id as string),
        name: (home?.name as string) ?? "Home Team",
        shortName: (home?.short_name as string) ?? (home?.name as string) ?? "HOME",
        logoUrl: (home?.logo_url as string | null) ?? null,
      },
      awayTeam: {
        id: (away?.id as string) ?? (fixture.away_team_id as string),
        name: (away?.name as string) ?? "Away Team",
        shortName: (away?.short_name as string) ?? (away?.name as string) ?? "AWAY",
        logoUrl: (away?.logo_url as string | null) ?? null,
      },
      prediction: prediction
        ? {
            id: prediction.id as string,
            homeScore: (prediction.predicted_home_score as number) ?? 0,
            awayScore: (prediction.predicted_away_score as number) ?? 0,
            scorerId: (prediction.predicted_scorer_id as string | null) ?? null,
            scorerName:
              scorerNameById.get((prediction.predicted_scorer_id as string) ?? "") ?? null,
            isNoScorer: Boolean(prediction.is_no_scorer),
            pointsAwarded: (prediction.points_awarded as number) ?? 0,
          }
        : null,
      scorerOptions,
    };
  });

  const { data: standings } = await supabase
    .from("prediction_standings")
    .select("league_participant_id,total_prediction_points,rank")
    .eq("league_id", leagueId)
    .eq("week_number", 1)
    .order("rank", { ascending: true })
    .limit(5);

  let leaderboard: PredictionLeaderboardRow[] = [];
  if (standings && standings.length > 0) {
    const participantIds = standings.map((row) => row.league_participant_id as string);
    const { data: participants } = await supabase
      .from("league_participants")
      .select("id,team_name,user_id,user:users(display_name)")
      .in("id", participantIds);

    const participantMap = new Map(
      (participants ?? []).map((row) => [row.id as string, row]),
    );

    leaderboard = standings.map((row, index) => {
      const p = participantMap.get(row.league_participant_id as string) as
        | {
            id?: string;
            team_name?: string | null;
            user_id?: string | null;
            user?: { display_name?: string | null } | null;
          }
        | undefined;

      return {
        participantId: (row.league_participant_id as string) ?? `p-${index}`,
        rank: (row.rank as number | null) ?? index + 1,
        teamName: p?.team_name ?? "Manager XI",
        managerName: p?.user?.display_name ?? "Manager",
        totalPoints: (row.total_prediction_points as number) ?? 0,
        isCurrentUser: (p?.user_id ?? "") === user.id,
      };
    });
  } else {
    const { data: participantRows } = await supabase
      .from("league_participants")
      .select("id,team_name,total_points,user_id,user:users(display_name)")
      .eq("league_id", leagueId)
      .order("total_points", { ascending: false })
      .limit(5);

    leaderboard = (participantRows ?? []).map((row, index) => ({
      participantId: row.id as string,
      rank: index + 1,
      teamName: (row.team_name as string) ?? "Manager XI",
      managerName:
        ((row.user as { display_name?: string | null } | null)?.display_name as string) ??
        "Manager",
      totalPoints: 0,
      isCurrentUser: (row.user_id as string) === user.id,
    }));
  }

  return {
    leagueId,
    leagueParticipantId,
    fixtures: fixtureRows,
    leaderboard,
  };
}
