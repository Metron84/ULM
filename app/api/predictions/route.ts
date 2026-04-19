import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type PredictionPayload = {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  scorerId: string | null;
};

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
      setAll() {
        // no-op in route
      },
    },
  });

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PredictionPayload;
  const fixtureId = body.fixtureId;
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  const scorerId = body.scorerId || null;

  if (!fixtureId || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return NextResponse.json({ ok: false, error: "Invalid prediction payload." }, { status: 400 });
  }
  if (homeScore < 0 || homeScore > 5 || awayScore < 0 || awayScore > 5) {
    return NextResponse.json({ ok: false, error: "Scores must be between 0 and 5." }, { status: 400 });
  }

  const isNoScorer = homeScore === 0 && awayScore === 0;
  if (!isNoScorer && !scorerId) {
    return NextResponse.json(
      { ok: false, error: "A goal scorer is required unless prediction is 0-0." },
      { status: 400 },
    );
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: participant } = await service
    .from("league_participants")
    .select("id,league_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!participant?.id || !participant.league_id) {
    return NextResponse.json({ ok: false, error: "League participant not found." }, { status: 404 });
  }

  const { data: fixture } = await service
    .from("fixtures")
    .select("home_team_id,away_team_id")
    .eq("id", fixtureId)
    .maybeSingle();

  if (!fixture?.home_team_id || !fixture.away_team_id) {
    return NextResponse.json({ ok: false, error: "Fixture not found." }, { status: 404 });
  }

  if (!isNoScorer && scorerId) {
    const { data: scorer } = await service
      .from("players")
      .select("id")
      .eq("id", scorerId)
      .in("real_team_id", [fixture.home_team_id as string, fixture.away_team_id as string])
      .maybeSingle();

    if (!scorer?.id) {
      return NextResponse.json(
        { ok: false, error: "Selected scorer is not part of this fixture." },
        { status: 400 },
      );
    }
  }

  const { error } = await service.from("predictions").upsert(
    {
      league_id: participant.league_id,
      league_participant_id: participant.id,
      fixture_id: fixtureId,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      predicted_scorer_id: isNoScorer ? null : scorerId,
      is_no_scorer: isNoScorer,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "league_participant_id,fixture_id" },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
