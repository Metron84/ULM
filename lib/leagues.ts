import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export type LeagueCardRow = {
  leagueId: string;
  leagueName: string;
  competitionName: string;
  mode: "draft" | "open_selection";
  type: "private" | "public";
  rank: number | null;
  totalPoints: number;
  inviteCode: string | null;
  isCommissioner: boolean;
};

export type CompetitionOption = {
  id: string;
  name: string;
  type: "main_season" | "tournament";
};

export type MyLeaguesPageData = {
  currentUserId: string;
  leagues: LeagueCardRow[];
  competitions: CompetitionOption[];
};

export type CommissionerTradeRow = {
  id: string;
  proposerTeam: string;
  receiverTeam: string;
  status: "proposed" | "accepted" | "rejected" | "commissioner_pending" | "completed";
  message: string | null;
  offering: string[];
  requesting: string[];
};

export type CommissionerParticipantRow = {
  id: string;
  teamName: string;
  managerName: string;
  rank: number | null;
  totalPoints: number;
  isCurrentUser: boolean;
};

export type CommissionerPortalData = {
  leagueId: string;
  leagueName: string;
  leagueMode: "draft" | "open_selection";
  inviteCode: string | null;
  customRules: string;
  participants: CommissionerParticipantRow[];
  pendingTrades: CommissionerTradeRow[];
};

export type LeagueDetailParticipantRow = {
  id: string;
  teamName: string;
  managerName: string;
  rank: number;
  totalPoints: number;
  thisWeekPoints: number;
  isCurrentUser: boolean;
};

export type LeagueDetailPageData = {
  leagueId: string;
  leagueName: string;
  competitionName: string;
  mode: "draft" | "open_selection";
  isCommissioner: boolean;
  participants: LeagueDetailParticipantRow[];
  leagueAveragePoints: number;
  topPerformerTeam: string;
  topPerformerPoints: number;
};

export async function getMyLeaguesPageData(): Promise<MyLeaguesPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: participantRows } = await supabase
    .from("league_participants")
    .select(
      "id,league_id,rank,total_points,league:leagues(id,name,mode,type,invite_code,commissioner_id,competition:competitions(name))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const leagues: LeagueCardRow[] = (participantRows ?? [])
    .map((row) => {
      const league = row.league as
        | {
            id?: string | null;
            name?: string | null;
            mode?: "draft" | "open_selection" | null;
            type?: "private" | "public" | null;
            invite_code?: string | null;
            commissioner_id?: string | null;
            competition?: { name?: string | null } | null;
          }
        | null;
      if (!league?.id || !league.name || !league.mode || !league.type) return null;

      return {
        leagueId: league.id,
        leagueName: league.name,
        competitionName: league.competition?.name ?? "Competition",
        mode: league.mode,
        type: league.type,
        rank: (row.rank as number | null) ?? null,
        totalPoints: (row.total_points as number | null) ?? 0,
        inviteCode: league.invite_code ?? null,
        isCommissioner: (league.commissioner_id ?? null) === user.id,
      } satisfies LeagueCardRow;
    })
    .filter((row): row is LeagueCardRow => Boolean(row));

  const { data: competitionsRows } = await supabase
    .from("competitions")
    .select("id,name,type")
    .order("start_date", { ascending: false });

  const competitions: CompetitionOption[] = (competitionsRows ?? [])
    .map((row) => {
      const id = row.id as string | null;
      const name = row.name as string | null;
      const type = row.type as "main_season" | "tournament" | null;
      if (!id || !name || !type) return null;
      return { id, name, type } satisfies CompetitionOption;
    })
    .filter((row): row is CompetitionOption => Boolean(row));

  return {
    currentUserId: user.id,
    leagues,
    competitions,
  };
}

export async function getCommissionerPortalData(
  leagueId: string,
): Promise<CommissionerPortalData | "FORBIDDEN" | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,mode,invite_code,commissioner_id,scoring_rules")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league?.id) return null;
  if ((league.commissioner_id as string | null) !== user.id) return "FORBIDDEN";

  const scoringRules = (league.scoring_rules as Record<string, unknown> | null) ?? {};
  const customRules =
    typeof scoringRules.custom_rules === "string" ? scoringRules.custom_rules : "";

  const { data: participantsRows } = await supabase
    .from("league_participants")
    .select("id,user_id,team_name,rank,total_points,user:users(display_name)")
    .eq("league_id", leagueId)
    .order("rank", { ascending: true, nullsFirst: false });

  const participants: CommissionerParticipantRow[] = (participantsRows ?? []).map((row) => ({
    id: row.id as string,
    teamName: (row.team_name as string | null) ?? "Manager XI",
    managerName:
      ((row.user as { display_name?: string | null } | null)?.display_name as string | undefined) ??
      "Manager",
    rank: (row.rank as number | null) ?? null,
    totalPoints: (row.total_points as number | null) ?? 0,
    isCurrentUser: (row.user_id as string) === user.id,
  }));

  const participantByUserId = new Map(
    (participantsRows ?? []).map((row) => [
      row.user_id as string,
      (row.team_name as string | null) ?? "Manager XI",
    ]),
  );

  const { data: tradesRows } = await supabase
    .from("trades")
    .select(
      "id,proposer_id,receiver_id,status,message,trade_items(id,direction,item_type,description,player:players(name))",
    )
    .eq("league_id", leagueId)
    .in("status", ["proposed", "commissioner_pending"])
    .order("created_at", { ascending: false });

  const pendingTrades: CommissionerTradeRow[] = (tradesRows ?? []).map((row) => {
    const allItems =
      ((row.trade_items as Array<{
        direction?: "offering" | "requesting" | null;
        item_type?: "player" | "captaincy_right" | "physical_item" | null;
        description?: string | null;
        player?: { name?: string | null } | null;
      }> | null) ?? []);

    const formatTradeItem = (item: {
      item_type?: "player" | "captaincy_right" | "physical_item" | null;
      description?: string | null;
      player?: { name?: string | null } | null;
    }) => {
      if (item.item_type === "player") return item.player?.name ?? "Player";
      if (item.item_type === "captaincy_right") return "Captaincy Right";
      return item.description ?? "Football Item";
    };

    return {
      id: row.id as string,
      proposerTeam: participantByUserId.get((row.proposer_id as string) ?? "") ?? "Unknown Team",
      receiverTeam: participantByUserId.get((row.receiver_id as string) ?? "") ?? "Unknown Team",
      status:
        (row.status as
          | "proposed"
          | "accepted"
          | "rejected"
          | "commissioner_pending"
          | "completed") ?? "proposed",
      message: (row.message as string | null) ?? null,
      offering: allItems
        .filter((item) => item.direction === "offering")
        .map((item) => formatTradeItem(item)),
      requesting: allItems
        .filter((item) => item.direction === "requesting")
        .map((item) => formatTradeItem(item)),
    };
  });

  return {
    leagueId,
    leagueName: (league.name as string | null) ?? "League",
    leagueMode: ((league.mode as "draft" | "open_selection" | null) ?? "draft"),
    inviteCode: (league.invite_code as string | null) ?? null,
    customRules,
    participants,
    pendingTrades,
  };
}

type LeaguePerformanceRow = {
  player_id: string | null;
  total_points: number | null;
  fixture: {
    match_date?: string | null;
  } | null;
};

export async function getLeagueDetailPageData(
  leagueId: string,
): Promise<LeagueDetailPageData | "FORBIDDEN" | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,mode,commissioner_id,competition:competitions(name)")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league?.id) return null;

  const { data: participantsRows } = await supabase
    .from("league_participants")
    .select("id,user_id,team_name,rank,total_points,user:users(display_name)")
    .eq("league_id", leagueId);
  const participantsSeed = participantsRows ?? [];
  const isMember = participantsSeed.some((row) => (row.user_id as string | null) === user.id);
  const isCommissioner = (league.commissioner_id as string | null) === user.id;
  if (!isMember && !isCommissioner) return "FORBIDDEN";

  const participantIds = participantsSeed.map((row) => row.id as string);
  const { data: rostersRows } = await supabase
    .from("rosters")
    .select("id,league_participant_id,roster_players(player_id)")
    .in("league_participant_id", participantIds)
    .eq("is_active", true);

  const playerIdsByParticipant = new Map<string, string[]>();
  const allPlayerIds = new Set<string>();
  (rostersRows ?? []).forEach((roster) => {
    const participantId = roster.league_participant_id as string | null;
    if (!participantId) return;
    const playerIds =
      (roster.roster_players ?? [])
        .map((row) => row.player_id as string | null)
        .filter((id): id is string => Boolean(id)) ?? [];
    playerIdsByParticipant.set(participantId, playerIds);
    playerIds.forEach((id) => allPlayerIds.add(id));
  });

  let thisWeekPointsByPlayer = new Map<string, number>();
  if (allPlayerIds.size > 0) {
    const { data: performancesRows } = await supabase
      .from("player_performances")
      .select("player_id,total_points,fixture:fixtures(match_date)")
      .in("player_id", Array.from(allPlayerIds));

    const performances = (performancesRows as LeaguePerformanceRow[] | null) ?? [];
    const dated = performances
      .map((row) => ({
        playerId: row.player_id,
        points: row.total_points ?? 0,
        date: row.fixture?.match_date ? new Date(row.fixture.match_date) : null,
      }))
      .filter((row) => row.playerId && row.date);

    if (dated.length > 0) {
      const latestDate = new Date(
        Math.max(...dated.map((row) => (row.date ? row.date.getTime() : 0))),
      );
      const weekStart = new Date(latestDate);
      weekStart.setDate(weekStart.getDate() - 7);

      thisWeekPointsByPlayer = dated.reduce((acc, row) => {
        if (!row.date || row.date < weekStart || row.date > latestDate || !row.playerId) {
          return acc;
        }
        acc.set(row.playerId, (acc.get(row.playerId) ?? 0) + row.points);
        return acc;
      }, new Map<string, number>());
    }
  }

  const participants = [...participantsSeed]
    .map((row, index) => {
      const participantId = row.id as string;
      const totalPoints = (row.total_points as number | null) ?? 0;
      const rankFromDb = row.rank as number | null;
      const thisWeekPoints = (playerIdsByParticipant.get(participantId) ?? []).reduce(
        (sum, playerId) => sum + (thisWeekPointsByPlayer.get(playerId) ?? 0),
        0,
      );

      return {
        id: participantId,
        teamName: (row.team_name as string | null) ?? "Manager XI",
        managerName:
          ((row.user as { display_name?: string | null } | null)?.display_name as
            | string
            | undefined) ?? "Manager",
        rank: rankFromDb ?? index + 1,
        totalPoints,
        thisWeekPoints,
        isCurrentUser: (row.user_id as string | null) === user.id,
      } satisfies LeagueDetailParticipantRow;
    })
    .sort((a, b) => a.rank - b.rank || b.totalPoints - a.totalPoints)
    .map((row, index) => ({ ...row, rank: row.rank || index + 1 }));

  const leagueAveragePoints =
    participants.length > 0
      ? Number(
          (
            participants.reduce((sum, row) => sum + row.totalPoints, 0) / participants.length
          ).toFixed(1),
        )
      : 0;

  const topPerformer = [...participants].sort((a, b) => b.totalPoints - a.totalPoints)[0];

  return {
    leagueId,
    leagueName: (league.name as string | null) ?? "League",
    competitionName:
      ((league.competition as { name?: string | null } | null)?.name as string | undefined) ??
      "Competition",
    mode: ((league.mode as "draft" | "open_selection" | null) ?? "draft"),
    isCommissioner,
    participants,
    leagueAveragePoints,
    topPerformerTeam: topPerformer?.teamName ?? "N/A",
    topPerformerPoints: topPerformer?.totalPoints ?? 0,
  };
}
