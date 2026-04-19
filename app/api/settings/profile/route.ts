import { NextResponse } from "next/server";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { AssistantPersona } from "@/lib/persona";

export const runtime = "nodejs";

type SettingsPayload = {
  displayName?: string;
  assistantPersona?: AssistantPersona;
};

export async function PATCH(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as SettingsPayload;
  const nextDisplayName = body.displayName?.trim();
  const nextPersona = body.assistantPersona;
  const validPersona =
    nextPersona === "analyst" ||
    nextPersona === "diehard_fan" ||
    nextPersona === "fantasy_veteran";

  if (!nextDisplayName && !validPersona) {
    return NextResponse.json(
      { ok: false, error: "Provide display name or assistant persona." },
      { status: 400 },
    );
  }

  if (nextDisplayName && nextDisplayName.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Display name must be at least 2 characters." },
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

  const updatePayload: { display_name?: string; assistant_persona?: AssistantPersona } = {};
  if (nextDisplayName) updatePayload.display_name = nextDisplayName;
  if (validPersona) updatePayload.assistant_persona = nextPersona;

  const { error } = await service.from("users").update(updatePayload).eq("id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    displayName: nextDisplayName ?? null,
    assistantPersona: validPersona ? nextPersona : null,
  });
}
