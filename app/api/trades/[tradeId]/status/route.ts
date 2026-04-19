import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type StatusPayload = {
  action: "approve" | "reject";
  comment?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tradeId: string }> },
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { tradeId } = await context.params;
  if (!tradeId) {
    return NextResponse.json({ ok: false, error: "Missing trade id." }, { status: 400 });
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

  const body = (await request.json()) as StatusPayload;
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: trade } = await service
    .from("trades")
    .select("id,league_id,message")
    .eq("id", tradeId)
    .maybeSingle();

  if (!trade?.id || !trade.league_id) {
    return NextResponse.json({ ok: false, error: "Trade not found." }, { status: 404 });
  }

  const { data: league } = await service
    .from("leagues")
    .select("commissioner_id")
    .eq("id", trade.league_id as string)
    .maybeSingle();

  if ((league?.commissioner_id as string | null) !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Only commissioner can update this trade." },
      { status: 403 },
    );
  }

  const existingMessage = (trade.message as string | null) ?? "";
  const comment = (body.comment ?? "").trim();
  const status = body.action === "approve" ? "completed" : "rejected";
  const mergedMessage = comment
    ? `${existingMessage}${existingMessage ? "\n\n" : ""}Commissioner note: ${comment}`
    : existingMessage || null;

  const { error } = await service
    .from("trades")
    .update({ status, message: mergedMessage })
    .eq("id", tradeId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
