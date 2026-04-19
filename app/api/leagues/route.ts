import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type CreateLeaguePayload = {
  name: string;
  competitionId: string;
  competitionName: string;
  mode: "draft" | "open_selection";
  leagueType: "private" | "public";
  big5Selection: "all" | "custom";
  selectedBig5Leagues: string[];
  commissionerMode: "self" | "later";
};

function makeInviteCode(input: string) {
  const token = input.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${token || "ULM"}${suffix}`;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const authClient = createSsrServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as CreateLeaguePayload;
  const name = (payload.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "League name is required." }, { status: 400 });
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await service.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      display_name:
        (typeof user.user_metadata?.display_name === "string" &&
          user.user_metadata.display_name.trim()) ||
        user.email?.split("@")[0] ||
        "Manager",
    },
    { onConflict: "id" },
  );

  let competitionId = payload.competitionId;
  if (!competitionId && payload.competitionName) {
    const competitionName = payload.competitionName.trim();
    const competitionType = competitionName.toLowerCase().includes("world cup")
      ? "tournament"
      : "main_season";

    const { data: ensuredCompetition } = await service
      .from("competitions")
      .upsert(
        {
          name: competitionName,
          type: competitionType,
          start_date: "2026-08-01",
          end_date: "2027-05-25",
          status: "upcoming",
          roster_size_min: 11,
          roster_size_max: 15,
          scoring_rules: {},
        },
        { onConflict: "name,type,start_date" },
      )
      .select("id")
      .maybeSingle();

    competitionId = (ensuredCompetition?.id as string | undefined) ?? "";
  }

  if (!competitionId) {
    return NextResponse.json(
      { ok: false, error: "Competition is required to create a league." },
      { status: 400 },
    );
  }

  const inviteCode = makeInviteCode(name);
  const scoringRules = {
    competition_scope:
      payload.competitionName === "Big 5 Leagues Season"
        ? {
            big5Selection: payload.big5Selection,
            selectedLeagues:
              payload.big5Selection === "all"
                ? ["Premier League", "Bundesliga", "La Liga", "Serie A", "Ligue 1"]
                : payload.selectedBig5Leagues,
          }
        : null,
  };

  const { data: league, error: leagueError } = await service
    .from("leagues")
    .insert({
      competition_id: competitionId,
      name,
      mode: payload.mode ?? "draft",
      type: payload.leagueType ?? "private",
      commissioner_id: user.id,
      max_teams: 12,
      invite_code: inviteCode,
      allow_physical_trades: true,
      scoring_rules: scoringRules,
    })
    .select("id")
    .maybeSingle();

  if (leagueError || !league?.id) {
    return NextResponse.json(
      { ok: false, error: leagueError?.message ?? "Could not create league." },
      { status: 500 },
    );
  }

  const { data: participant, error: participantError } = await service
    .from("league_participants")
    .insert({
      league_id: league.id,
      user_id: user.id,
      team_name: `${name} XI`,
      rank: 1,
      total_points: 0,
      draft_order: 1,
    })
    .select("id")
    .maybeSingle();

  if (participantError || !participant?.id) {
    return NextResponse.json(
      { ok: false, error: participantError?.message ?? "Could not add participant." },
      { status: 500 },
    );
  }

  await service.from("rosters").insert({
    league_participant_id: participant.id,
    is_active: true,
  });

  return NextResponse.json({
    ok: true,
    leagueId: league.id,
    commissionerMode: payload.commissionerMode ?? "self",
  });
}
