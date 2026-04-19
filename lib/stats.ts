import { hasSupabaseEnv } from "@/lib/supabase";
import { ensureDemoRosterForUser } from "@/lib/roster";
import { createServerClient } from "@/lib/supabase/server";

export type LeaderMetric = "overall_points" | "goals" | "assists" | "bonus_points";

export type LeaderRow = {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  points: number;
  goals: number;
  assists: number;
  bonusPoints: number;
  averageRating: number;
  appearances: number;
};

export type TeamStatsSummary = {
  totalPoints: number;
  averageRating: number;
  topPerformer: string;
  topPerformerPoints: number;
  mostConsistent: string;
  mostConsistentRating: number;
};

export type WorldCupStatRow = {
  playerName: string;
  teamName: string;
  value: string;
};

export type RecentFormRow = {
  playerName: string;
  fixtureLabel: string;
  points: number;
  goals: number;
  assists: number;
  bonusPoints: number;
  rating: number;
};

export type StatsPageData = {
  leagueName: string;
  competitionName: string;
  currentTeamName: string;
  leaders: Record<LeaderMetric, LeaderRow[]>;
  teamStats: TeamStatsSummary;
  worldCupStats: {
    topScorers: WorldCupStatRow[];
    topRated: WorldCupStatRow[];
    bestDifferentials: WorldCupStatRow[];
  } | null;
  recentForm: RecentFormRow[];
};

type PlayerMapRow = {
  id: string;
  name: string | null;
  real_team: { name?: string | null } | null;
};

type PerformanceRow = {
  player_id: string;
  goals: number | null;
  assists: number | null;
  bonus_points: number | null;
  total_points: number | null;
  sofascore_rating: number | null;
  fixture:
    | {
        match_date?: string | null;
        home_team?: { short_name?: string | null } | null;
        away_team?: { short_name?: string | null } | null;
      }
    | null;
  player:
    | {
        name?: string | null;
      }
    | null;
};

type Aggregate = {
  playerId: string;
  playerName: string;
  teamName: string;
  points: number;
  goals: number;
  assists: number;
  bonusPoints: number;
  ratingTotal: number;
  ratingCount: number;
  averageRating: number;
  appearances: number;
};

function withFallbackRows(rows: LeaderRow[]): LeaderRow[] {
  if (rows.length >= 10) return rows.slice(0, 10);
  const seed: LeaderRow[] = [...rows];
  const filler = [
    "Tournament Tactician",
    "Golden Counter XI",
    "Sage Strikers",
    "Metro Midfield",
    "Knockout Motion",
    "Pace & Poise FC",
  ];

  let index = seed.length;
  while (seed.length < 10) {
    const points = Math.max(12, 70 - index * 4);
    const goals = Math.max(0, 8 - Math.floor(index / 2));
    const assists = Math.max(0, 6 - Math.floor(index / 3));
    const bonus = Math.max(0, 5 - Math.floor(index / 4));
    seed.push({
      rank: seed.length + 1,
      playerId: `demo-${index}`,
      playerName: filler[index % filler.length] ?? `Demo Player ${index + 1}`,
      teamName: "ULM Demo",
      points,
      goals,
      assists,
      bonusPoints: bonus,
      averageRating: Number((6.7 + ((index % 8) * 0.12)).toFixed(2)),
      appearances: 4 + (index % 3),
    });
    index += 1;
  }
  return seed.slice(0, 10);
}

function roundRating(value: number) {
  return Number(value.toFixed(2));
}

function buildLeaderboardRows(
  aggregates: Aggregate[],
  metric: LeaderMetric,
): LeaderRow[] {
  const sorted = [...aggregates].sort((a, b) => {
    if (metric === "goals") return b.goals - a.goals || b.points - a.points;
    if (metric === "assists") return b.assists - a.assists || b.points - a.points;
    if (metric === "bonus_points") return b.bonusPoints - a.bonusPoints || b.points - a.points;
    return b.points - a.points || b.goals - a.goals;
  });

  return sorted.slice(0, 10).map((row, index) => ({
    rank: index + 1,
    playerId: row.playerId,
    playerName: row.playerName,
    teamName: row.teamName,
    points: row.points,
    goals: row.goals,
    assists: row.assists,
    bonusPoints: row.bonusPoints,
    averageRating: row.averageRating,
    appearances: row.appearances,
  }));
}

function demoStatsData(): StatsPageData {
  const demoLeaders = withFallbackRows([]);
  const worldCupRows: WorldCupStatRow[] = demoLeaders.slice(0, 5).map((row) => ({
    playerName: row.playerName,
    teamName: row.teamName,
    value: String(row.goals),
  }));

  return {
    leagueName: "Ultimate Demo League",
    competitionName: "World Cup 2026",
    currentTeamName: "Manager XI",
    leaders: {
      overall_points: demoLeaders,
      goals: [...demoLeaders].sort((a, b) => b.goals - a.goals),
      assists: [...demoLeaders].sort((a, b) => b.assists - a.assists),
      bonus_points: [...demoLeaders].sort((a, b) => b.bonusPoints - a.bonusPoints),
    },
    teamStats: {
      totalPoints: 184,
      averageRating: 7.12,
      topPerformer: "Tournament Tactician",
      topPerformerPoints: 24,
      mostConsistent: "Golden Counter XI",
      mostConsistentRating: 7.45,
    },
    worldCupStats: {
      topScorers: worldCupRows,
      topRated: demoLeaders.slice(0, 5).map((row) => ({
        playerName: row.playerName,
        teamName: row.teamName,
        value: row.averageRating.toFixed(2),
      })),
      bestDifferentials: demoLeaders.slice(0, 5).map((row, index) => ({
        playerName: row.playerName,
        teamName: row.teamName,
        value: `+${Math.max(2, 9 - index)}`,
      })),
    },
    recentForm: [
      {
        playerName: "Tournament Tactician",
        fixtureLabel: "FRA vs BRA",
        points: 8,
        goals: 1,
        assists: 1,
        bonusPoints: 2,
        rating: 7.8,
      },
      {
        playerName: "Golden Counter XI",
        fixtureLabel: "ESP vs ENG",
        points: 5,
        goals: 1,
        assists: 0,
        bonusPoints: 1,
        rating: 7.2,
      },
      {
        playerName: "Sage Strikers",
        fixtureLabel: "ARG vs POR",
        points: 4,
        goals: 0,
        assists: 1,
        bonusPoints: 1,
        rating: 7.1,
      },
    ],
  };
}

export async function getStatsPageData(): Promise<StatsPageData | null> {
  if (!hasSupabaseEnv()) return demoStatsData();

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDemoRosterForUser(user.id);

  const { data: participant } = await supabase
    .from("league_participants")
    .select("id,team_name,league_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!participant?.id || !participant.league_id) return demoStatsData();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,competition_id,competition:competitions(name)")
    .eq("id", participant.league_id as string)
    .maybeSingle();
  if (!league?.competition_id) return demoStatsData();

  const competitionId = league.competition_id as string;

  const { data: players } = await supabase
    .from("players")
    .select("id,name,real_team:real_teams(name)")
    .eq("competition_id", competitionId)
    .eq("is_active", true);

  const playerMap = new Map<string, PlayerMapRow>();
  (players ?? []).forEach((row) => {
    playerMap.set(row.id as string, {
      id: row.id as string,
      name: (row.name as string | null) ?? "Player",
      real_team: (row.real_team as { name?: string | null } | null) ?? null,
    });
  });
  const playerIds = Array.from(playerMap.keys());
  if (playerIds.length === 0) return demoStatsData();

  const { data: performances } = await supabase
    .from("player_performances")
    .select(
      "player_id,goals,assists,bonus_points,total_points,sofascore_rating,created_at,fixture:fixtures(match_date,home_team:real_teams!fixtures_home_team_id_fkey(short_name),away_team:real_teams!fixtures_away_team_id_fkey(short_name)),player:players(name)",
    )
    .in("player_id", playerIds)
    .order("created_at", { ascending: false });

  const aggregateMap = new Map<string, Aggregate>();
  (performances as PerformanceRow[] | null)?.forEach((row) => {
    const playerId = row.player_id;
    const player = playerMap.get(playerId);
    if (!player) return;

    const existing = aggregateMap.get(playerId) ?? {
      playerId,
      playerName: player.name ?? "Player",
      teamName: player.real_team?.name ?? "Club",
      points: 0,
      goals: 0,
      assists: 0,
      bonusPoints: 0,
      ratingTotal: 0,
      ratingCount: 0,
      averageRating: 0,
      appearances: 0,
    };

    const goals = row.goals ?? 0;
    const assists = row.assists ?? 0;
    const bonus = row.bonus_points ?? 0;
    const points = row.total_points ?? 0;
    const rating = row.sofascore_rating ?? null;

    existing.goals += goals;
    existing.assists += assists;
    existing.bonusPoints += bonus;
    existing.points += points;
    existing.appearances += 1;
    if (rating !== null) {
      existing.ratingTotal += rating;
      existing.ratingCount += 1;
    }
    existing.averageRating =
      existing.ratingCount > 0 ? roundRating(existing.ratingTotal / existing.ratingCount) : 0;

    aggregateMap.set(playerId, existing);
  });

  const aggregates = Array.from(aggregateMap.values());
  const leaders = {
    overall_points: withFallbackRows(buildLeaderboardRows(aggregates, "overall_points")),
    goals: withFallbackRows(buildLeaderboardRows(aggregates, "goals")),
    assists: withFallbackRows(buildLeaderboardRows(aggregates, "assists")),
    bonus_points: withFallbackRows(buildLeaderboardRows(aggregates, "bonus_points")),
  };

  const { data: roster } = await supabase
    .from("rosters")
    .select("id,roster_players(player_id)")
    .eq("league_participant_id", participant.id as string)
    .eq("is_active", true)
    .maybeSingle();

  const rosterPlayerIds =
    (roster?.roster_players ?? [])
      .map((row) => row.player_id as string | null)
      .filter((id): id is string => Boolean(id)) ?? [];
  const rosterAggregates = aggregates.filter((row) => rosterPlayerIds.includes(row.playerId));

  const teamTotalPoints = rosterAggregates.reduce((sum, row) => sum + row.points, 0);
  const teamAvgRatingBase = rosterAggregates.filter((row) => row.averageRating > 0);
  const teamAverageRating =
    teamAvgRatingBase.length > 0
      ? roundRating(
          teamAvgRatingBase.reduce((sum, row) => sum + row.averageRating, 0) /
            teamAvgRatingBase.length,
        )
      : 0;

  const topPerformer = [...rosterAggregates].sort((a, b) => b.points - a.points)[0];
  const mostConsistent = [...rosterAggregates]
    .filter((row) => row.appearances > 0)
    .sort((a, b) => b.averageRating - a.averageRating)[0];

  const teamStats: TeamStatsSummary = {
    totalPoints: teamTotalPoints,
    averageRating: teamAverageRating,
    topPerformer: topPerformer?.playerName ?? "No data yet",
    topPerformerPoints: topPerformer?.points ?? 0,
    mostConsistent: mostConsistent?.playerName ?? "No data yet",
    mostConsistentRating: mostConsistent?.averageRating ?? 0,
  };

  const recentFormRaw =
    ((performances as PerformanceRow[] | null) ?? [])
      .filter((row) => rosterPlayerIds.includes(row.player_id))
      .slice(0, 8);

  const recentForm: RecentFormRow[] = recentFormRaw.map((row) => ({
    playerName: row.player?.name ?? "Player",
    fixtureLabel: `${row.fixture?.home_team?.short_name ?? "HOME"} vs ${row.fixture?.away_team?.short_name ?? "AWAY"}`,
    points: row.total_points ?? 0,
    goals: row.goals ?? 0,
    assists: row.assists ?? 0,
    bonusPoints: row.bonus_points ?? 0,
    rating: row.sofascore_rating ?? 0,
  }));

  const competitionName =
    ((league.competition as { name?: string | null } | null)?.name as string | undefined) ??
    "World Cup 2026";
  const isWorldCup = competitionName.toLowerCase().includes("world cup");

  const worldCupStats = isWorldCup
    ? {
        topScorers: [...aggregates]
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 5)
          .map((row) => ({
            playerName: row.playerName,
            teamName: row.teamName,
            value: String(row.goals),
          })),
        topRated: [...aggregates]
          .filter((row) => row.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 5)
          .map((row) => ({
            playerName: row.playerName,
            teamName: row.teamName,
            value: row.averageRating.toFixed(2),
          })),
        bestDifferentials: [...aggregates]
          .sort(
            (a, b) =>
              b.points - Math.round(b.appearances * 1.5) -
              (a.points - Math.round(a.appearances * 1.5)),
          )
          .slice(0, 5)
          .map((row) => ({
            playerName: row.playerName,
            teamName: row.teamName,
            value: `+${Math.max(0, row.points - Math.round(row.appearances * 1.5))}`,
          })),
      }
    : null;

  return {
    leagueName: (league.name as string | null) ?? "ULM League",
    competitionName,
    currentTeamName: (participant.team_name as string | null) ?? "Manager XI",
    leaders,
    teamStats,
    worldCupStats,
    recentForm: recentForm.length > 0 ? recentForm : demoStatsData().recentForm,
  };
}
