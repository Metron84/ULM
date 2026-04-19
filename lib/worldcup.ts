import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { ensureDemoRosterForUser } from "@/lib/roster";

export type WorldCupLeaderboardEntry = {
  rank: number;
  teamName: string;
  managerName: string;
  totalPoints: number;
  isCurrentUser: boolean;
};

export type WorldCupHubData = {
  globalRank: number;
  globalTotal: number;
  leaderboard: WorldCupLeaderboardEntry[];
};

export async function getWorldCupHubData(): Promise<WorldCupHubData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDemoRosterForUser(user.id);

  const { data: participant } = await supabase
    .from("league_participants")
    .select("league_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!participant?.league_id) return null;

  const { data: participants } = await supabase
    .from("league_participants")
    .select("id,team_name,total_points,user_id,user:users(display_name)")
    .eq("league_id", participant.league_id as string)
    .order("total_points", { ascending: false });

  const leaderboardBase: WorldCupLeaderboardEntry[] = (participants ?? []).map((row, index) => ({
    rank: index + 1,
    teamName: (row.team_name as string | null) ?? "Manager XI",
    managerName:
      ((row.user as { display_name?: string | null } | null)?.display_name as string) ?? "Manager",
    totalPoints: (row.total_points as number | null) ?? 0,
    isCurrentUser: (row.user_id as string | null) === user.id,
  }));

  const filler = [
    "Knockout Nomads",
    "Atlas United",
    "Penalty Poets",
    "Emerald XI",
    "Final Whistle FC",
    "Golden Boots Club",
    "Stadium Scholars",
    "Sage Counterattack",
  ];
  let seedPoints = 354;
  while (leaderboardBase.length < 24) {
    const i = leaderboardBase.length;
    leaderboardBase.push({
      rank: i + 1,
      teamName: filler[i % filler.length]!,
      managerName: `Manager ${i + 1}`,
      totalPoints: seedPoints,
      isCurrentUser: false,
    });
    seedPoints -= 3;
  }

  leaderboardBase.sort((a, b) => b.totalPoints - a.totalPoints);
  const ranked = leaderboardBase.map((entry, index) => ({ ...entry, rank: index + 1 }));
  const current = ranked.find((entry) => entry.isCurrentUser);

  return {
    globalRank: current?.rank ?? 184,
    globalTotal: 1247893,
    leaderboard: ranked,
  };
}
