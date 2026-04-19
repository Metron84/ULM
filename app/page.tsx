import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export default async function RootIndexPage() {
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

  if (!profile?.assistant_persona) {
    redirect("/onboarding/persona");
  }

  redirect("/home");
}
