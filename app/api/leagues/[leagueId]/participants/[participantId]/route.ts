import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ leagueId: string; participantId: string }> },
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

  const { leagueId, participantId } = await context.params;
  if (!leagueId || !participantId) {
    return NextResponse.json(
      { ok: false, error: "Missing league or participant id." },
      { status: 400 },
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

  const { data: league } = await service
    .from("leagues")
    .select("id,commissioner_id")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league?.id) {
    return NextResponse.json({ ok: false, error: "League not found." }, { status: 404 });
  }
  if ((league.commissioner_id as string | null) !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Only league commissioner can manage participants." },
      { status: 403 },
    );
  }

  const { data: participant } = await service
    .from("league_participants")
    .select("id,user_id")
    .eq("id", participantId)
    .eq("league_id", leagueId)
    .maybeSingle();
  if (!participant?.id) {
    return NextResponse.json({ ok: false, error: "Participant not found." }, { status: 404 });
  }
  if ((participant.user_id as string | null) === user.id) {
    return NextResponse.json(
      { ok: false, error: "Commissioner cannot remove themselves." },
      { status: 400 },
    );
  }

  const { error } = await service
    .from("league_participants")
    .delete()
    .eq("id", participantId)
    .eq("league_id", leagueId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
