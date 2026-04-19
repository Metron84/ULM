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
