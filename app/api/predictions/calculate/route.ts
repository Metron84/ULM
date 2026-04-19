import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function outcome(scoreA: number, scoreB: number) {
  if (scoreA > scoreB) return "home";
  if (scoreA < scoreB) return "away";
  return "draw";
}

export async function POST() {
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

  if (!participant?.league_id) {
    return NextResponse.json({ ok: false, error: "League participant not found." }, { status: 404 });
  }

  const leagueId = participant.league_id as string;

  const { data: leagueParticipants } = await service
    .from("league_participants")
    .select("id")
    .eq("league_id", leagueId);

  const participantIds = (leagueParticipants ?? []).map((p) => p.id as string);
  if (participantIds.length === 0) {
    return NextResponse.json({ ok: false, error: "No participants available." }, { status: 400 });
  }

  const { data: predictions } = await service
    .from("predictions")
    .select(
      "id,league_participant_id,fixture_id,predicted_home_score,predicted_away_score,predicted_scorer_id,is_no_scorer",
    )
    .eq("league_id", leagueId)
    .in("league_participant_id", participantIds);

  if (!predictions || predictions.length === 0) {
    return NextResponse.json({ ok: false, error: "No predictions to score yet." }, { status: 400 });
  }

  const fixtureIds = Array.from(new Set(predictions.map((p) => p.fixture_id as string)));

  const { data: fixtures } = await service
    .from("fixtures")
    .select("id,status,score_home,score_away")
    .in("id", fixtureIds)
    .eq("status", "finished");

  if (!fixtures || fixtures.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No finished fixtures yet. Finish a fixture first." },
      { status: 400 },
    );
  }

  const finishedFixtureIds = fixtures.map((fixture) => fixture.id as string);
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id as string, fixture]));

  const { data: scorers } = await service
    .from("player_performances")
    .select("fixture_id,player_id,goals")
    .in("fixture_id", finishedFixtureIds)
    .gt("goals", 0);

  const scorerByFixture = new Map<string, string>();
  (scorers ?? []).forEach((row) => {
    const fixtureId = row.fixture_id as string;
    if (!scorerByFixture.has(fixtureId)) {
      scorerByFixture.set(fixtureId, row.player_id as string);
    }
  });

  const predictionUpdates: Array<{ id: string; points_awarded: number }> = [];
  const totalByParticipant = new Map<string, number>();

  predictions.forEach((prediction) => {
    const fixture = fixtureMap.get(prediction.fixture_id as string);
    if (!fixture) return;

    const actualHome = (fixture.score_home as number | null) ?? 0;
    const actualAway = (fixture.score_away as number | null) ?? 0;
    const predictedHome = (prediction.predicted_home_score as number) ?? 0;
    const predictedAway = (prediction.predicted_away_score as number) ?? 0;

    let points = 0;
    if (predictedHome === actualHome && predictedAway === actualAway) {
      points += 3;
    } else if (outcome(predictedHome, predictedAway) === outcome(actualHome, actualAway)) {
      points += 1;
    }

    const actualScorerId = scorerByFixture.get(prediction.fixture_id as string);
    if (actualScorerId) {
      if ((prediction.predicted_scorer_id as string | null) === actualScorerId) {
        points += 2;
      }
    } else if (actualHome === 0 && actualAway === 0 && prediction.is_no_scorer) {
      points += 2;
    }

    predictionUpdates.push({ id: prediction.id as string, points_awarded: points });
    const participantId = prediction.league_participant_id as string;
    totalByParticipant.set(participantId, (totalByParticipant.get(participantId) ?? 0) + points);
  });

  for (const update of predictionUpdates) {
    await service
      .from("predictions")
      .update({ points_awarded: update.points_awarded })
      .eq("id", update.id);
  }

  const standings = Array.from(totalByParticipant.entries())
    .map(([participantId, total]) => ({ participantId, total }))
    .sort((a, b) => b.total - a.total);

  let rank = 0;
  let prevScore: number | null = null;
  const standingsPayload = standings.map((entry, index) => {
    if (prevScore === null || entry.total < prevScore) {
      rank = index + 1;
      prevScore = entry.total;
    }
    return {
      league_id: leagueId,
      week_number: 1,
      league_participant_id: entry.participantId,
      total_prediction_points: entry.total,
      rank,
    };
  });

  if (standingsPayload.length > 0) {
    await service.from("prediction_standings").upsert(standingsPayload, {
      onConflict: "league_id,week_number,league_participant_id",
    });
  }

  return NextResponse.json({
    ok: true,
    scoredFixtures: finishedFixtureIds.length,
    participants: standingsPayload.length,
  });
}
