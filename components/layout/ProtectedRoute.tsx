import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

type ProtectedMode = "auth" | "persona-required" | "persona-missing";

type ProtectedRouteProps = {
  children: React.ReactNode;
  mode?: ProtectedMode;
};

export async function ProtectedRoute({
  children,
  mode = "auth",
}: ProtectedRouteProps) {
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

  const { data: profile, error } = await supabase
    .from("users")
    .select("assistant_persona")
    .eq("id", user.id)
    .maybeSingle();

  const hasPersona = Boolean(profile?.assistant_persona) && !error;

  if (mode === "persona-required" && !hasPersona) {
    redirect("/onboarding/persona");
  }

  if (mode === "persona-missing" && hasPersona) {
    redirect("/home");
  }

  return <>{children}</>;
}

export default ProtectedRoute;
