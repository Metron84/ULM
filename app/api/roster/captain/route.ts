import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type CaptainPayload = {
  rosterId: string;
  playerId: string;
  role: "captain" | "vice_captain";
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

  const body = (await request.json()) as CaptainPayload;
  if (!body?.rosterId || !body?.playerId) {
    return NextResponse.json({ ok: false, error: "Missing roster/player id." }, { status: 400 });
  }
  if (body.role !== "captain" && body.role !== "vice_captain") {
    return NextResponse.json({ ok: false, error: "Invalid role." }, { status: 400 });
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

  const { data: rosterContext } = await service
    .from("rosters")
    .select("id,league_participant:league_participants(user_id)")
    .eq("id", body.rosterId)
    .eq("is_active", true)
    .maybeSingle();
  const ownerId =
    ((rosterContext?.league_participant as { user_id?: string | null } | null)
      ?.user_id as string | undefined) ?? null;
  if (!rosterContext?.id || ownerId !== user.id) {
    return NextResponse.json({ ok: false, error: "Roster not found for user." }, { status: 404 });
  }

  const { data: playerRow } = await service
    .from("roster_players")
    .select("player_id,is_starting,captain,vice_captain")
    .eq("roster_id", body.rosterId)
    .eq("player_id", body.playerId)
    .maybeSingle();
  if (!playerRow?.player_id) {
    return NextResponse.json(
      { ok: false, error: "Selected player is not in your roster." },
      { status: 400 },
    );
  }

  if (body.role === "captain") {
    const { error: resetError } = await service
      .from("roster_players")
      .update({ captain: false })
      .eq("roster_id", body.rosterId)
      .eq("captain", true);
    if (resetError) {
      return NextResponse.json({ ok: false, error: resetError.message }, { status: 500 });
    }

    const { error: setError } = await service
      .from("roster_players")
      .update({ captain: true, vice_captain: false })
      .eq("roster_id", body.rosterId)
      .eq("player_id", body.playerId);
    if (setError) {
      return NextResponse.json({ ok: false, error: setError.message }, { status: 500 });
    }
  }

  if (body.role === "vice_captain") {
    const { error: resetError } = await service
      .from("roster_players")
      .update({ vice_captain: false })
      .eq("roster_id", body.rosterId)
      .eq("vice_captain", true);
    if (resetError) {
      return NextResponse.json({ ok: false, error: resetError.message }, { status: 500 });
    }

    const { error: setError } = await service
      .from("roster_players")
      .update({ vice_captain: true, captain: false })
      .eq("roster_id", body.rosterId)
      .eq("player_id", body.playerId);
    if (setError) {
      return NextResponse.json({ ok: false, error: setError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, role: body.role });
}
