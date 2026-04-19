import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { AssistantPersona } from "@/lib/persona";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export type RosterPlayer = {
  id: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photoUrl: string;
  rating: number;
  recentForm: string;
  isStarting: boolean;
  captain: boolean;
  viceCaptain: boolean;
};

export type RosterPageData = {
  persona: AssistantPersona;
  leagueName: string;
  competitionName: string;
  projectedPoints: number;
  startingPlayers: RosterPlayer[];
  benchPlayers: RosterPlayer[];
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
    .select("id,team_name,league:leagues(name,competition:competitions(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!participant?.id) return null;

  const { data: roster } = await supabase
    .from("rosters")
    .select(
      "id, roster_players(player_id,is_starting,captain,vice_captain, player:players(id,name,position,photo_url,current_club))",
    )
    .eq("league_participant_id", participant.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!roster?.id || !Array.isArray(roster.roster_players)) return null;

  const playerIds = roster.roster_players
    .map((row) => row.player_id as string | null)
    .filter((id): id is string => Boolean(id));

  const ratingMap = new Map<string, number>();
  if (playerIds.length > 0) {
    const { data: performances } = await supabase
      .from("player_performances")
      .select("player_id,sofascore_rating,updated_at")
      .in("player_id", playerIds)
      .order("updated_at", { ascending: false });

    performances?.forEach((perf) => {
      const pid = perf.player_id as string;
      if (!ratingMap.has(pid) && typeof perf.sofascore_rating === "number") {
        ratingMap.set(pid, Number(perf.sofascore_rating));
      }
    });
  }

  const mappedPlayers = roster.roster_players
    .map((row) => {
      const player = row.player as {
        id?: string;
        name?: string;
        position?: "GK" | "DEF" | "MID" | "FWD";
        photo_url?: string | null;
      } | null;
      if (!player?.id || !player.name || !player.position) return null;

      const rating = ratingMap.get(player.id) ?? 6.9;
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        photoUrl: player.photo_url || fallbackPhoto(player.name),
        rating,
        recentForm: normalizeRecentForm(rating),
        isStarting: Boolean(row.is_starting),
        captain: Boolean(row.captain),
        viceCaptain: Boolean(row.vice_captain),
      } satisfies RosterPlayer;
    })
    .filter((player): player is RosterPlayer => Boolean(player));

  const startingPlayers = mappedPlayers
    .filter((player) => player.isStarting)
    .slice(0, 11);
  const benchPlayers = mappedPlayers
    .filter((player) => !player.isStarting)
    .slice(0, 4);

  const leagueName =
    (participant.league as { name?: string | null } | null)?.name ?? "ULM Demo League";
  const competitionName =
    (
      (participant.league as {
        competition?: { name?: string | null } | null;
      } | null)?.competition ?? null
    )?.name ?? "World Cup 2026";

  return {
    persona,
    leagueName,
    competitionName,
    projectedPoints: 87,
    startingPlayers,
    benchPlayers,
  };
}
