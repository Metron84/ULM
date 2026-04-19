import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type ManageRosterPayload =
  | {
      action: "add_to_roster" | "add_to_bench";
      rosterId: string;
      playerId: string;
    }
  | {
      action: "swap_player" | "swap_with_starter";
      rosterId: string;
      incomingPlayerId: string;
      outgoingPlayerId: string;
      outgoingStarterPlayerId?: string;
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
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ManageRosterPayload;
  if (!body?.rosterId) {
    return NextResponse.json({ ok: false, error: "Missing roster id." }, { status: 400 });
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rosterContext } = await service
    .from("rosters")
    .select(
      "id,league_participant:league_participants(id,user_id,league:leagues(id,competition_id,competition:competitions(roster_size_max)))",
    )
    .eq("id", body.rosterId)
    .eq("is_active", true)
    .maybeSingle();

  const ownerId =
    ((rosterContext?.league_participant as {
      user_id?: string | null;
    } | null)?.user_id as string | undefined) ?? null;

  if (!rosterContext?.id || ownerId !== user.id) {
    return NextResponse.json({ ok: false, error: "Roster not found for user." }, { status: 404 });
  }

  const rosterSizeMax =
    ((rosterContext.league_participant as {
      league?: { competition?: { roster_size_max?: number | null } | null } | null;
    } | null)?.league?.competition?.roster_size_max as number | undefined) ?? 15;
  const benchCapacity = Math.max(0, Math.max(rosterSizeMax, 11) - 11);

  const { data: rosterPlayers } = await service
    .from("roster_players")
    .select("player_id,is_starting,captain,vice_captain")
    .eq("roster_id", body.rosterId);

  const rows = rosterPlayers ?? [];
  const totalCount = rows.length;
  const benchCount = rows.filter((row) => !row.is_starting).length;

  if (body.action === "add_to_roster" || body.action === "add_to_bench") {
    if (!body.playerId) {
      return NextResponse.json({ ok: false, error: "Missing player id." }, { status: 400 });
    }

    const exists = rows.some((row) => (row.player_id as string) === body.playerId);
    if (exists) {
      return NextResponse.json({ ok: false, error: "Player is already in your squad." }, { status: 400 });
    }
    if (totalCount >= rosterSizeMax) {
      return NextResponse.json(
        { ok: false, error: `Squad is full (${rosterSizeMax} players).` },
        { status: 400 },
      );
    }
    if (benchCount >= benchCapacity) {
      return NextResponse.json(
        { ok: false, error: `Bench is full (${benchCapacity} players).` },
        { status: 400 },
      );
    }

    const { data: player } = await service
      .from("players")
      .select("id")
      .eq("id", body.playerId)
      .eq("is_active", true)
      .maybeSingle();
    if (!player?.id) {
      return NextResponse.json({ ok: false, error: "Player is not available." }, { status: 400 });
    }

    const { error } = await service.from("roster_players").insert({
      roster_id: body.rosterId,
      player_id: body.playerId,
      is_starting: false,
      captain: false,
      vice_captain: false,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: body.action });
  }

  if (body.action === "swap_player" || body.action === "swap_with_starter") {
    const outgoingPlayerId = body.outgoingPlayerId || body.outgoingStarterPlayerId;
    if (!body.incomingPlayerId || !outgoingPlayerId) {
      return NextResponse.json({ ok: false, error: "Missing swap parameters." }, { status: 400 });
    }

    const outgoing = rows.find(
      (row) => (row.player_id as string) === outgoingPlayerId,
    );
    if (!outgoing) {
      return NextResponse.json(
        { ok: false, error: "Outgoing player must already be in your roster." },
        { status: 400 },
      );
    }

    const { data: incomingPlayer } = await service
      .from("players")
      .select("id")
      .eq("id", body.incomingPlayerId)
      .eq("is_active", true)
      .maybeSingle();
    if (!incomingPlayer?.id) {
      return NextResponse.json({ ok: false, error: "Incoming player is unavailable." }, { status: 400 });
    }

    const incomingExisting = rows.find((row) => (row.player_id as string) === body.incomingPlayerId);
    if (incomingExisting) {
      return NextResponse.json({ ok: false, error: "Incoming player is already in your roster." }, { status: 400 });
    }

    const { error: deleteError } = await service
      .from("roster_players")
      .delete()
      .eq("roster_id", body.rosterId)
      .eq("player_id", outgoingPlayerId);
    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

    const { error: insertError } = await service.from("roster_players").insert({
      roster_id: body.rosterId,
      player_id: body.incomingPlayerId,
      is_starting: Boolean(outgoing.is_starting),
      captain: false,
      vice_captain: false,
    });
    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: body.action });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
}
