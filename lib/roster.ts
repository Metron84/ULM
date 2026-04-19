import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { AssistantPersona } from "@/lib/persona";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export type RosterPlayer = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photoUrl: string;
  nationality: string | null;
  countryFlag: string;
  leagueCode: string | null;
  leagueAccent: "premier" | "bundesliga" | "laliga" | "seriea" | "ligue1" | "worldcup";
  isWorldCup: boolean;
  competitionName: string;
  rating: number;
  recentForm: string;
  isStarting: boolean;
  captain: boolean;
  viceCaptain: boolean;
  pointsBreakdown: {
    goals: number;
    assists: number;
    bonusPoints: number;
    totalPoints: number;
    averageRating: number;
    appearances: number;
  };
};

export type RosterPoolPlayer = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photoUrl: string;
  nationality: string | null;
  countryFlag: string;
  leagueCode: string | null;
  leagueAccent: "premier" | "bundesliga" | "laliga" | "seriea" | "ligue1" | "worldcup";
  isWorldCup: boolean;
  competitionName: string;
  rating: number;
  recentForm: string;
  totalPoints: number;
  inRoster: boolean;
  inStarting: boolean;
};

export type RosterPageData = {
  persona: AssistantPersona;
  rosterId: string;
  leagueName: string;
  competitionName: string;
  squadSize: number;
  benchCapacity: number;
  totalTeamPoints: number;
  projectedPointsThisMatchday: number;
  startingPlayers: RosterPlayer[];
  benchPlayers: RosterPlayer[];
  availablePlayers: RosterPoolPlayer[];
};

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeRecentForm(rating: number) {
  const r1 = Math.max(6, Math.min(9.4, rating - 0.3));
  const r2 = Math.max(6, Math.min(9.4, rating + 0.1));
  const r3 = Math.max(6, Math.min(9.4, rating - 0.1));
  return `${r1.toFixed(1)} • ${r2.toFixed(1)} • ${r3.toFixed(1)}`;
}

function fallbackPhoto(name: string) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=A8CABA&color=0A3D2A&size=128`;
}

function flagFromNationality(nationality: string | null) {
  const map: Record<string, string> = {
    france: "🇫🇷",
    england: "🏴",
    argentina: "🇦🇷",
    brazil: "🇧🇷",
    portugal: "🇵🇹",
    spain: "🇪🇸",
    norway: "🇳🇴",
    egypt: "🇪🇬",
    italy: "🇮🇹",
    germany: "🇩🇪",
  };
  if (!nationality) return "🏳️";
  return map[nationality.toLowerCase()] ?? "🏳️";
}

function resolveLeagueAccent(
  leagueCode: string | null,
  competitionType: string | null,
): "premier" | "bundesliga" | "laliga" | "seriea" | "ligue1" | "worldcup" {
  const code = (leagueCode ?? "").toUpperCase();
  if (code === "EPL" || code === "PL") return "premier";
  if (code === "BUNDESLIGA" || code === "BUN" || code === "BL1") return "bundesliga";
  if (code === "LALIGA" || code === "LL" || code === "LIGA") return "laliga";
  if (code === "SERIEA" || code === "SA") return "seriea";
  if (code === "LIGUE1" || code === "L1") return "ligue1";
  if (competitionType === "tournament") return "worldcup";
  return "worldcup";
}

export async function ensureDemoRosterForUser(userId: string) {
  const service = createServiceRoleClient();
  if (!service) return;

  const { data: worldCup } = await service
    .from("competitions")
    .select("id,name")
    .eq("name", "World Cup 2026")
    .maybeSingle();

  if (!worldCup?.id) return;

  const { data: league } = await service
    .from("leagues")
    .upsert(
      {
        competition_id: worldCup.id,
        name: "ULM Demo League",
        mode: "draft",
        type: "private",
        commissioner_id: userId,
        max_teams: 12,
        invite_code: `ULM${userId.slice(0, 6).toUpperCase()}`,
        allow_physical_trades: false,
      },
      { onConflict: "competition_id,name" },
    )
    .select("id")
    .maybeSingle();

  if (!league?.id) return;

  const { data: participant } = await service
    .from("league_participants")
    .upsert(
      {
        league_id: league.id,
        user_id: userId,
        team_name: "ULM XI",
        rank: 184,
        total_points: 324,
        draft_order: 4,
      },
      { onConflict: "league_id,user_id" },
    )
    .select("id")
    .maybeSingle();

  if (!participant?.id) return;

  let { data: roster } = await service
    .from("rosters")
    .select("id")
    .eq("league_participant_id", participant.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!roster?.id) {
    const { data: insertedRoster } = await service
      .from("rosters")
      .insert({
        league_participant_id: participant.id,
        is_active: true,
      })
      .select("id")
      .maybeSingle();
    roster = insertedRoster ?? null;
  }

  if (!roster?.id) return;

  const { data: existingRosterPlayers } = await service
    .from("roster_players")
    .select("player_id")
    .eq("roster_id", roster.id);

  if ((existingRosterPlayers?.length ?? 0) >= 15) return;

  const { data: players } = await service
    .from("players")
    .select("id,name,position")
    .eq("competition_id", worldCup.id)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("name", { ascending: true })
    .limit(15);

  if (!players || players.length < 15) return;

  const captainId =
    players.find((player) => player.name.toLowerCase().includes("mbappe"))?.id ??
    players[0]!.id;
  const viceId =
    players.find((player) => player.name.toLowerCase().includes("salah"))?.id ??
    players[1]!.id;

  const payload = players.map((player, index) => ({
    roster_id: roster.id,
    player_id: player.id as string,
    is_starting: index < 11,
    captain: player.id === captainId,
    vice_captain: player.id === viceId,
  }));

  await service.from("roster_players").upsert(payload, {
    onConflict: "roster_id,player_id",
  });
}

export async function getRosterPageData(): Promise<RosterPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("assistant_persona")
    .eq("id", user.id)
    .maybeSingle();

  const persona = profile?.assistant_persona;
  if (
    persona !== "analyst" &&
    persona !== "diehard_fan" &&
    persona !== "fantasy_veteran"
  ) {
    return null;
  }

  await ensureDemoRosterForUser(user.id);

  const { data: participant } = await supabase
    .from("league_participants")
    .select(
      "id,team_name,league:leagues(name,competition:competitions(id,name,roster_size_max,roster_size_min))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!participant?.id) return null;

  const { data: roster } = await supabase
    .from("rosters")
    .select(
      "id, roster_players(player_id,is_starting,captain,vice_captain, player:players(id,name,position,photo_url,current_club,nationality,competition:competitions(name,type),real_team:real_teams(league_code)))",
    )
    .eq("league_participant_id", participant.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!roster?.id || !Array.isArray(roster.roster_players)) return null;

  const competition = (
    (participant.league as {
      competition?: { id?: string | null; name?: string | null; roster_size_max?: number | null } | null;
    } | null)?.competition ?? null
  ) as { id?: string | null; name?: string | null; roster_size_max?: number | null } | null;
  const competitionId = competition?.id ?? null;
  if (!competitionId) return null;

  const { data: competitionPlayers } = await supabase
    .from("players")
    .select(
      "id,name,position,photo_url,nationality,is_active,competition:competitions(name,type),real_team:real_teams(league_code)",
    )
    .eq("is_active", true)
    .order("name", { ascending: true });
  const competitionPlayerIds = (competitionPlayers ?? [])
    .map((player) => player.id as string | null)
    .filter((id): id is string => Boolean(id));

  const performanceMap = new Map<
    string,
    {
      goals: number;
      assists: number;
      bonusPoints: number;
      totalPoints: number;
      ratings: number[];
      appearances: number;
    }
  >();
  if (competitionPlayerIds.length > 0) {
    const { data: performances } = await supabase
      .from("player_performances")
      .select("player_id,goals,assists,bonus_points,total_points,sofascore_rating,updated_at")
      .in("player_id", competitionPlayerIds)
      .order("updated_at", { ascending: false });

    performances?.forEach((perf) => {
      const pid = perf.player_id as string | null;
      if (!pid) return;
      const base = performanceMap.get(pid) ?? {
        goals: 0,
        assists: 0,
        bonusPoints: 0,
        totalPoints: 0,
        ratings: [],
        appearances: 0,
      };
      base.goals += Number(perf.goals ?? 0);
      base.assists += Number(perf.assists ?? 0);
      base.bonusPoints += Number(perf.bonus_points ?? 0);
      base.totalPoints += Number(perf.total_points ?? 0);
      if (typeof perf.sofascore_rating === "number") {
        base.ratings.push(Number(perf.sofascore_rating));
      }
      base.appearances += 1;
      performanceMap.set(pid, base);
    });
  }

  const mappedPlayers = roster.roster_players
    .map((row) => {
      const player = row.player as {
        id?: string;
        name?: string;
        position?: "GK" | "DEF" | "MID" | "FWD";
        photo_url?: string | null;
        nationality?: string | null;
        competition?: { name?: string | null; type?: string | null } | null;
        real_team?: { league_code?: string | null } | null;
      } | null;
      if (!player?.id || !player.name || !player.position) return null;

      const perf = performanceMap.get(player.id);
      const latestRating = perf?.ratings[0] ?? 6.9;
      const recentRatings = (perf?.ratings ?? []).slice(0, 3);
      const averageRating =
        recentRatings.length > 0
          ? recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length
          : latestRating;
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        photoUrl: player.photo_url || fallbackPhoto(player.name),
        nationality: player.nationality ?? null,
        countryFlag: flagFromNationality(player.nationality ?? null),
        leagueCode: player.real_team?.league_code ?? null,
        leagueAccent: resolveLeagueAccent(
          player.real_team?.league_code ?? null,
          player.competition?.type ?? null,
        ),
        isWorldCup: (player.competition?.type ?? null) === "tournament",
        competitionName: player.competition?.name ?? "Competition",
        rating: latestRating,
        recentForm:
          recentRatings.length > 0
            ? recentRatings.map((rating) => rating.toFixed(1)).join(" • ")
            : normalizeRecentForm(latestRating),
        isStarting: Boolean(row.is_starting),
        captain: Boolean(row.captain),
        viceCaptain: Boolean(row.vice_captain),
        pointsBreakdown: {
          goals: perf?.goals ?? 0,
          assists: perf?.assists ?? 0,
          bonusPoints: perf?.bonusPoints ?? 0,
          totalPoints: perf?.totalPoints ?? 0,
          averageRating,
          appearances: perf?.appearances ?? 0,
        },
      } satisfies RosterPlayer;
    })
    .filter((player): player is RosterPlayer => Boolean(player));

  const rosterMembership = new Map(
    mappedPlayers.map((player) => [player.id, { inRoster: true, inStarting: player.isStarting }]),
  );

  const availablePlayers: RosterPoolPlayer[] = (competitionPlayers ?? [])
    .map((player) => {
      const id = player.id as string | null;
      const name = player.name as string | null;
      const position = player.position as "GK" | "DEF" | "MID" | "FWD" | null;
      if (!id || !name || !position) return null;

      const perf = performanceMap.get(id);
      const latestRating = perf?.ratings[0] ?? 6.8;
      const recentRatings = (perf?.ratings ?? []).slice(0, 3);
      const membership = rosterMembership.get(id);
      const competitionMeta = player.competition as { name?: string | null; type?: string | null } | null;
      const realTeamMeta = player.real_team as { league_code?: string | null } | null;

      return {
        id,
        name,
        position,
        photoUrl: (player.photo_url as string | null) || fallbackPhoto(name),
        nationality: (player.nationality as string | null) ?? null,
        countryFlag: flagFromNationality((player.nationality as string | null) ?? null),
        leagueCode: realTeamMeta?.league_code ?? null,
        leagueAccent: resolveLeagueAccent(realTeamMeta?.league_code ?? null, competitionMeta?.type ?? null),
        isWorldCup: (competitionMeta?.type ?? null) === "tournament",
        competitionName: competitionMeta?.name ?? "Competition",
        rating: latestRating,
        recentForm:
          recentRatings.length > 0
            ? recentRatings.map((rating) => rating.toFixed(1)).join(" • ")
            : normalizeRecentForm(latestRating),
        totalPoints: perf?.totalPoints ?? 0,
        inRoster: Boolean(membership?.inRoster),
        inStarting: Boolean(membership?.inStarting),
      } satisfies RosterPoolPlayer;
    })
    .filter((player): player is RosterPoolPlayer => Boolean(player));

  const startingPlayers = mappedPlayers
    .filter((player) => player.isStarting)
    .slice(0, 11);
  const squadSize = Math.max(
    11,
    Number((competition?.roster_size_max as number | null) ?? mappedPlayers.length ?? 15),
  );
  const benchCapacity = Math.max(0, squadSize - 11);
  const benchPlayers = mappedPlayers
    .filter((player) => !player.isStarting)
    .slice(0, benchCapacity);
  const totalTeamPoints = mappedPlayers.reduce(
    (sum, player) => sum + player.pointsBreakdown.totalPoints,
    0,
  );
  const projectedPointsThisMatchday = Math.round(
    startingPlayers.reduce((sum, player) => sum + player.rating * 1.8, 0),
  );

  const leagueName =
    (participant.league as { name?: string | null } | null)?.name ?? "ULM Demo League";
  const competitionName =
    competition?.name ?? "World Cup 2026";

  return {
    persona,
    rosterId: roster.id as string,
    leagueName,
    competitionName,
    squadSize,
    benchCapacity,
    totalTeamPoints,
    projectedPointsThisMatchday,
    startingPlayers,
    benchPlayers,
    availablePlayers,
  };
}
