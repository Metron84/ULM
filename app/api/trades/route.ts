import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isFootballRelatedItem } from "@/lib/trade-validation";

export const runtime = "nodejs";

type CreateTradePayload = {
  leagueId: string;
  receiverParticipantId: string;
  offeringPlayerIds: string[];
  requestingPlayerIds: string[];
  offeringFootballItem: string;
  requestingFootballItem: string;
  message: string;
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

  const body = (await request.json()) as CreateTradePayload;
  const leagueId = body.leagueId;
  const receiverParticipantId = body.receiverParticipantId;
  const offeringPlayerIds = Array.isArray(body.offeringPlayerIds) ? body.offeringPlayerIds : [];
  const requestingPlayerIds = Array.isArray(body.requestingPlayerIds)
    ? body.requestingPlayerIds
    : [];
  const offeringFootballItem = (body.offeringFootballItem ?? "").trim();
  const requestingFootballItem = (body.requestingFootballItem ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!leagueId || !receiverParticipantId) {
    return NextResponse.json({ ok: false, error: "Missing trade parameters." }, { status: 400 });
  }
  if (
    offeringPlayerIds.length === 0 &&
    requestingPlayerIds.length === 0 &&
    !offeringFootballItem &&
    !requestingFootballItem
  ) {
    return NextResponse.json(
      { ok: false, error: "Add at least one trade item before sending." },
      { status: 400 },
    );
  }
  if (
    (offeringFootballItem && !isFootballRelatedItem(offeringFootballItem)) ||
    (requestingFootballItem && !isFootballRelatedItem(requestingFootballItem))
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Only football-related items allowed (jerseys, tickets, memorabilia ✓)",
      },
      { status: 400 },
    );
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: proposerParticipant } = await service
    .from("league_participants")
    .select("id,user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!proposerParticipant?.id) {
    return NextResponse.json(
      { ok: false, error: "Current user is not in this league." },
      { status: 404 },
    );
  }

  const { data: receiverParticipant } = await service
    .from("league_participants")
    .select("id,user_id")
    .eq("league_id", leagueId)
    .eq("id", receiverParticipantId)
    .maybeSingle();

  if (!receiverParticipant?.user_id) {
    return NextResponse.json(
      { ok: false, error: "Trade receiver not found in this league." },
      { status: 404 },
    );
  }
  if ((receiverParticipant.user_id as string) === user.id) {
    return NextResponse.json(
      { ok: false, error: "Cannot send a trade to yourself." },
      { status: 400 },
    );
  }

  const { data: league } = await service
    .from("leagues")
    .select("commissioner_id")
    .eq("id", leagueId)
    .maybeSingle();

  const { data: trade, error: tradeError } = await service
    .from("trades")
    .insert({
      league_id: leagueId,
      proposer_id: user.id,
      receiver_id: receiverParticipant.user_id as string,
      status: "commissioner_pending",
      commissioner_id: (league?.commissioner_id as string | null) ?? null,
      message: message || null,
    })
    .select("id")
    .maybeSingle();

  if (tradeError || !trade?.id) {
    return NextResponse.json(
      { ok: false, error: tradeError?.message ?? "Could not create trade." },
      { status: 500 },
    );
  }

  const tradeItems: Array<{
    trade_id: string;
    item_type: "player" | "physical_item";
    player_id: string | null;
    description: string | null;
    direction: "offering" | "requesting";
  }> = [
    ...offeringPlayerIds.map((playerId) => ({
      trade_id: trade.id,
      item_type: "player" as const,
      player_id: playerId,
      description: null,
      direction: "offering" as const,
    })),
    ...requestingPlayerIds.map((playerId) => ({
      trade_id: trade.id,
      item_type: "player" as const,
      player_id: playerId,
      description: null,
      direction: "requesting" as const,
    })),
  ];

  if (offeringFootballItem) {
    tradeItems.push({
      trade_id: trade.id,
      item_type: "physical_item",
      player_id: null,
      description: offeringFootballItem,
      direction: "offering",
    });
  }

  if (requestingFootballItem) {
    tradeItems.push({
      trade_id: trade.id,
      item_type: "physical_item",
      player_id: null,
      description: requestingFootballItem,
      direction: "requesting",
    });
  }

  if (tradeItems.length > 0) {
    const { error: itemsError } = await service.from("trade_items").insert(tradeItems);
    if (itemsError) {
      return NextResponse.json({ ok: false, error: itemsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, tradeId: trade.id });
}
