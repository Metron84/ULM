import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export type DraftPlayer = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photoUrl: string;
  rating: number;
  projectedPoints: number;
};

export type DraftBoardData = {
  leagueId: string;
  leagueName: string;
  competitionName: string;
  draftPosition: number;
  totalTeams: number;
  totalRounds: number;
  players: DraftPlayer[];
};

function fallbackPhoto(name: string) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=A8CABA&color=0A3D2A&size=128`;
}

export async function getDraftBoardData(): Promise<DraftBoardData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: participants } = await supabase
    .from("league_participants")
    .select(
      "id,draft_order,league:leagues(id,name,max_teams,mode,competition:competitions(id,name,roster_size_max))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const draftParticipant = (participants ?? []).find((participant) => {
    const mode = (participant.league as { mode?: string | null } | null)?.mode;
    return mode === "draft";
  });

  if (!draftParticipant) return null;

  const league = draftParticipant.league as
    | {
        id?: string | null;
        name?: string | null;
        max_teams?: number | null;
        competition?: { id?: string | null; name?: string | null; roster_size_max?: number | null } | null;
      }
    | null;

  const competitionId = league?.competition?.id ?? null;
  if (!competitionId || !league?.id) return null;

  const { data: playersRows } = await supabase
    .from("players")
    .select("id,name,position,photo_url")
    .eq("competition_id", competitionId)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(220);

  const playerIds = (playersRows ?? [])
    .map((player) => player.id as string | null)
    .filter((id): id is string => Boolean(id));

  const ratingMap = new Map<string, number>();
  if (playerIds.length > 0) {
    const { data: performanceRows } = await supabase
      .from("player_performances")
      .select("player_id,sofascore_rating,updated_at")
      .in("player_id", playerIds)
      .order("updated_at", { ascending: false });

    (performanceRows ?? []).forEach((row) => {
      const playerId = row.player_id as string | null;
      if (!playerId || ratingMap.has(playerId)) return;
      if (typeof row.sofascore_rating === "number") {
        ratingMap.set(playerId, Number(row.sofascore_rating));
      }
    });
  }

  const players: DraftPlayer[] = (playersRows ?? [])
    .map((row) => {
      const id = row.id as string | null;
      const name = row.name as string | null;
      const position = row.position as "GK" | "DEF" | "MID" | "FWD" | null;
      if (!id || !name || !position) return null;
      const rating = ratingMap.get(id) ?? 6.8;
      return {
        id,
        name,
        position,
        photoUrl: (row.photo_url as string | null) ?? fallbackPhoto(name),
        rating,
        projectedPoints: Math.round(rating * 2),
      } satisfies DraftPlayer;
    })
    .filter((player): player is DraftPlayer => Boolean(player));

  return {
    leagueId: league.id,
    leagueName: league.name ?? "Draft League",
    competitionName: league.competition?.name ?? "Competition",
    draftPosition: Number(draftParticipant.draft_order ?? 1),
    totalTeams: Math.max(2, Number(league.max_teams ?? 8)),
    totalRounds: Math.max(5, Number(league.competition?.roster_size_max ?? 15)),
    players,
  };
}
