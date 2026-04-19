import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type UpdateRulesPayload = {
  customRules?: string;
  leagueName?: string;
  mode?: "draft" | "open_selection";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leagueId: string }> },
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

  const { leagueId } = await context.params;
  if (!leagueId) {
    return NextResponse.json({ ok: false, error: "Missing league id." }, { status: 400 });
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

  const payload = (await request.json()) as UpdateRulesPayload;
  const customRules =
    typeof payload.customRules === "string" ? payload.customRules.trim() : undefined;
  const leagueName =
    typeof payload.leagueName === "string" ? payload.leagueName.trim() : undefined;
  const mode =
    payload.mode === "draft" || payload.mode === "open_selection" ? payload.mode : undefined;

  if (!customRules && !leagueName && !mode) {
    return NextResponse.json(
      { ok: false, error: "Provide at least one league setting to update." },
      { status: 400 },
    );
  }
  if (leagueName !== undefined && leagueName.length < 2) {
    return NextResponse.json(
      { ok: false, error: "League name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const service = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: league } = await service
    .from("leagues")
    .select("id,commissioner_id,scoring_rules")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league?.id) {
    return NextResponse.json({ ok: false, error: "League not found." }, { status: 404 });
  }
  if ((league.commissioner_id as string | null) !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Only league commissioner can update rules." },
      { status: 403 },
    );
  }

  const existingRules = (league.scoring_rules as Record<string, unknown> | null) ?? {};
  const updatePayload: {
    scoring_rules?: Record<string, unknown>;
    name?: string;
    mode?: "draft" | "open_selection";
  } = {};

  if (customRules !== undefined) {
    updatePayload.scoring_rules = {
      ...existingRules,
      custom_rules: customRules,
    };
  }
  if (leagueName) {
    updatePayload.name = leagueName;
  }
  if (mode) {
    updatePayload.mode = mode;
  }

  const { error } = await service.from("leagues").update(updatePayload).eq("id", leagueId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
