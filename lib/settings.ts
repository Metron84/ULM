import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import type { AssistantPersona } from "@/lib/persona";

export type SettingsPageData = {
  userId: string;
  displayName: string;
  email: string;
  assistantPersona: AssistantPersona;
};

export async function getSettingsPageData(): Promise<SettingsPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name,email,assistant_persona")
    .eq("id", user.id)
    .maybeSingle();

  const persona = profile?.assistant_persona;
  const assistantPersona: AssistantPersona =
    persona === "analyst" || persona === "diehard_fan" || persona === "fantasy_veteran"
      ? persona
      : "analyst";

  return {
    userId: user.id,
    displayName:
      (profile?.display_name as string | null) ??
      (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null) ??
      user.email?.split("@")[0] ??
      "Manager",
    email: (profile?.email as string | null) ?? user.email ?? "manager@ulm.local",
    assistantPersona,
  };
}
