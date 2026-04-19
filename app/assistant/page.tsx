import { redirect } from "next/navigation";

import { AssistantManagerClient } from "@/components/assistant/AssistantManagerClient";
import { MainLayout } from "@/components/layout/MainLayout";
import type { AssistantPersona } from "@/lib/persona";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("assistant_persona")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.assistant_persona !== "analyst" &&
    profile?.assistant_persona !== "diehard_fan" &&
    profile?.assistant_persona !== "fantasy_veteran"
  ) {
    redirect("/onboarding/persona");
  }

  const persona = profile.assistant_persona as AssistantPersona;

  return (
    <MainLayout>
      <AssistantManagerClient persona={persona} />
    </MainLayout>
  );
}
