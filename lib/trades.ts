import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { ensureDemoRosterForUser } from "@/lib/roster";

export type TradeStatus = "proposed" | "commissioner_pending" | "completed" | "rejected" | "accepted";

export type TradeItemView = {
  id: string;
  direction: "offering" | "requesting";
  itemType: "player" | "captaincy_right" | "physical_item";
  playerId: string | null;
  playerName: string | null;
  description: string | null;
};

export type TradeCardView = {
  id: string;
  status: TradeStatus;
  proposerId: string;
  receiverId: string;
  proposerTeamName: string;
  receiverTeamName: string;
  message: string | null;
  createdAt: string;
  offering: TradeItemView[];
  requesting: TradeItemView[];
};

export type ManagerTradeTarget = {
  participantId: string;
  userId: string;
  teamName: string;
  managerName: string;
  players: Array<{ id: string; name: string; position: "GK" | "DEF" | "MID" | "FWD" }>;
};

export type TradesPageData = {
  leagueId: string;
  leagueName: string;
  competitionName: string;
  currentUserId: string;
  currentParticipantId: string;
  currentTeamName: string;
  currentRosterPlayers: Array<{ id: string; name: string; position: "GK" | "DEF" | "MID" | "FWD" }>;
  managerTargets: ManagerTradeTarget[];
  trades: TradeCardView[];
  isCommissioner: boolean;
};

const DEMO_RIVAL_USER_ID = "00000000-0000-4000-8000-000000000111";
const DEMO_RIVAL_USER_EMAIL = "rival.manager@ulm.demo";

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureDemoTradeData(currentUserId: string) {
  const service = createServiceRoleClient();
  if (!service) return;

  await ensureDemoRosterForUser(currentUserId);

  const { data: currentParticipant } = await service
    .from("league_participants")
    .select("id,league_id")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!currentParticipant?.id || !currentParticipant.league_id) return;
  const leagueId = currentParticipant.league_id as string;

  const { data: league } = await service
    .from("leagues")
    .select("competition_id,commissioner_id")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league?.competition_id) return;

  await service.from("users").upsert(
    {
      id: DEMO_RIVAL_USER_ID,
      email: DEMO_RIVAL_USER_EMAIL,
      display_name: "Rival Manager",
      assistant_persona: "fantasy_veteran",
    },
    { onConflict: "id" },
  );

  const { data: rivalParticipant } = await service
    .from("league_participants")
    .upsert(
      {
        league_id: leagueId,
        user_id: DEMO_RIVAL_USER_ID,
        team_name: "Stadium Kings",
        rank: 7,
        total_points: 301,
        draft_order: 6,
      },
      { onConflict: "league_id,user_id" },
    )
    .select("id")
    .maybeSingle();

  if (!rivalParticipant?.id) return;

  let { data: rivalRoster } = await service
    .from("rosters")
    .select("id")
    .eq("league_participant_id", rivalParticipant.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!rivalRoster?.id) {
    const { data: inserted } = await service
      .from("rosters")
      .insert({ league_participant_id: rivalParticipant.id, is_active: true })
      .select("id")
      .maybeSingle();
    rivalRoster = inserted ?? null;
  }
  if (!rivalRoster?.id) return;

  const { data: existingRivalPlayers } = await service
    .from("roster_players")
    .select("player_id")
    .eq("roster_id", rivalRoster.id);

  if ((existingRivalPlayers?.length ?? 0) < 15) {
    const { data: players } = await service
      .from("players")
      .select("id,name")
      .eq("competition_id", league.competition_id as string)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(15, 29);

    if (players && players.length > 0) {
      const payload = players.map((player, index) => ({
        roster_id: rivalRoster.id,
        player_id: player.id as string,
        is_starting: index < 11,
        captain: index === 0,
        vice_captain: index === 1,
      }));
      await service
        .from("roster_players")
        .upsert(payload, { onConflict: "roster_id,player_id" });
    }
  }

  const { data: existingTrades } = await service
    .from("trades")
    .select("id")
    .eq("league_id", leagueId)
    .limit(1);

  if ((existingTrades?.length ?? 0) > 0) return;

  const { data: myRoster } = await service
    .from("rosters")
    .select("id, roster_players(player_id, player:players(name))")
    .eq("league_participant_id", currentParticipant.id)
    .eq("is_active", true)
    .maybeSingle();
  const { data: rivalRosterWithPlayers } = await service
    .from("rosters")
    .select("id, roster_players(player_id, player:players(name))")
    .eq("league_participant_id", rivalParticipant.id)
    .eq("is_active", true)
    .maybeSingle();

  const myPlayerId = (myRoster?.roster_players?.[0]?.player_id as string | undefined) ?? null;
  const rivalPlayerId =
    (rivalRosterWithPlayers?.roster_players?.[0]?.player_id as string | undefined) ?? null;

  const { data: trade } = await service
    .from("trades")
    .insert({
      league_id: leagueId,
      proposer_id: DEMO_RIVAL_USER_ID,
      receiver_id: currentUserId,
      status: "proposed",
      commissioner_id: (league.commissioner_id as string) ?? currentUserId,
      message: "Open to a swap before next kickoff?",
    })
    .select("id")
    .maybeSingle();

  if (!trade?.id) return;

  const items = [];
  if (rivalPlayerId) {
    items.push({
      trade_id: trade.id,
      item_type: "player",
      player_id: rivalPlayerId,
      description: null,
      direction: "offering",
    });
  }
  if (myPlayerId) {
    items.push({
      trade_id: trade.id,
      item_type: "player",
      player_id: myPlayerId,
      description: null,
      direction: "requesting",
    });
  }
  items.push({
    trade_id: trade.id,
    item_type: "physical_item",
    player_id: null,
    description: "Signed Mbappé jersey",
    direction: "offering",
  });

  await service.from("trade_items").insert(items);
}

export async function getTradesPageData(): Promise<TradesPageData | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDemoTradeData(user.id);

  const { data: participant } = await supabase
    .from("league_participants")
    .select("id,team_name,league_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!participant?.id || !participant.league_id) return null;

  const leagueId = participant.league_id as string;
  const currentParticipantId = participant.id as string;
  const currentTeamName = (participant.team_name as string | null) ?? "ULM XI";

  const { data: league } = await supabase
    .from("leagues")
    .select("name,commissioner_id,competition:competitions(name)")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league) return null;

  const leagueName = (league.name as string | null) ?? "ULM Demo League";
  const competitionName =
    ((league.competition as { name?: string | null } | null)?.name as string | undefined) ??
    "World Cup 2026";
  const isCommissioner = (league.commissioner_id as string | null) === user.id;

  const { data: allParticipants } = await supabase
    .from("league_participants")
    .select("id,user_id,team_name,user:users(display_name)")
    .eq("league_id", leagueId);

  const participantByUserId = new Map<
    string,
    { id: string; teamName: string; managerName: string }
  >();
  (allParticipants ?? []).forEach((row) => {
    participantByUserId.set((row.user_id as string) ?? "", {
      id: row.id as string,
      teamName: (row.team_name as string | null) ?? "Manager XI",
      managerName:
        ((row.user as { display_name?: string | null } | null)?.display_name as string) ??
        "Manager",
    });
  });

  const { data: currentRoster } = await supabase
    .from("rosters")
    .select("id, roster_players(player_id, player:players(id,name,position))")
    .eq("league_participant_id", currentParticipantId)
    .eq("is_active", true)
    .maybeSingle();

  const currentRosterPlayers =
    (currentRoster?.roster_players ?? [])
      .map((row) => row.player as { id?: string; name?: string; position?: string } | null)
      .filter((player): player is { id: string; name: string; position: "GK" | "DEF" | "MID" | "FWD" } =>
        Boolean(
          player?.id &&
            player?.name &&
            (player.position === "GK" ||
              player.position === "DEF" ||
              player.position === "MID" ||
              player.position === "FWD"),
        ),
      ) ?? [];

  const managerTargets: ManagerTradeTarget[] = [];
  for (const row of allParticipants ?? []) {
    if ((row.id as string) === currentParticipantId) continue;
    const participantId = row.id as string;
    const userId = row.user_id as string;
    const teamName = (row.team_name as string | null) ?? "Manager XI";
    const managerName =
      ((row.user as { display_name?: string | null } | null)?.display_name as string) ??
      "Manager";

    const { data: roster } = await supabase
      .from("rosters")
      .select("id, roster_players(player_id, player:players(id,name,position))")
      .eq("league_participant_id", participantId)
      .eq("is_active", true)
      .maybeSingle();

    const players =
      (roster?.roster_players ?? [])
        .map((r) => r.player as { id?: string; name?: string; position?: string } | null)
        .filter((player): player is { id: string; name: string; position: "GK" | "DEF" | "MID" | "FWD" } =>
          Boolean(
            player?.id &&
              player?.name &&
              (player.position === "GK" ||
                player.position === "DEF" ||
                player.position === "MID" ||
                player.position === "FWD"),
          ),
        ) ?? [];

    managerTargets.push({ participantId, userId, teamName, managerName, players });
  }

  const { data: trades } = await supabase
    .from("trades")
    .select("id,proposer_id,receiver_id,status,message,created_at,trade_items(id,direction,item_type,player_id,description,player:players(name))")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  const tradeCards: TradeCardView[] = (trades ?? []).map((trade) => {
    const proposer = participantByUserId.get((trade.proposer_id as string) ?? "");
    const receiver = participantByUserId.get((trade.receiver_id as string) ?? "");

    const items: TradeItemView[] = (trade.trade_items ?? []).map((item) => ({
      id: item.id as string,
      direction: (item.direction as "offering" | "requesting") ?? "offering",
      itemType:
        (item.item_type as "player" | "captaincy_right" | "physical_item") ?? "physical_item",
      playerId: (item.player_id as string | null) ?? null,
      playerName:
        ((item.player as { name?: string | null } | null)?.name as string | undefined) ?? null,
      description: (item.description as string | null) ?? null,
    }));

    return {
      id: trade.id as string,
      status: (trade.status as TradeStatus) ?? "proposed",
      proposerId: (trade.proposer_id as string) ?? "",
      receiverId: (trade.receiver_id as string) ?? "",
      proposerTeamName: proposer?.teamName ?? "Manager XI",
      receiverTeamName: receiver?.teamName ?? "Manager XI",
      message: (trade.message as string | null) ?? null,
      createdAt: (trade.created_at as string) ?? new Date().toISOString(),
      offering: items.filter((item) => item.direction === "offering"),
      requesting: items.filter((item) => item.direction === "requesting"),
    };
  });

  return {
    leagueId,
    leagueName,
    competitionName,
    currentUserId: user.id,
    currentParticipantId,
    currentTeamName,
    currentRosterPlayers,
    managerTargets,
    trades: tradeCards,
    isCommissioner,
  };
}
