import Link from "next/link";

import { BottomNav } from "@/components/layout/BottomNav";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { personaEmoji, personaLabel, type AssistantPersona } from "@/lib/persona";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
};

export async function MainLayout({ children }: MainLayoutProps) {
  let displayName = "Manager";
  let persona: AssistantPersona = "analyst";

  if (hasSupabaseEnv()) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, assistant_persona")
        .eq("id", user.id)
        .maybeSingle();

      displayName =
        profile?.display_name ??
        (typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null) ??
        user.email?.split("@")[0] ??
        "Manager";

      if (
        profile?.assistant_persona === "analyst" ||
        profile?.assistant_persona === "diehard_fan" ||
        profile?.assistant_persona === "fantasy_veteran"
      ) {
        persona = profile.assistant_persona;
      }
    }
  }

  return (
    <ProtectedRoute mode="persona-required">
      <div className="min-h-screen bg-offwhite pb-28 demo-fade-in">
        <header className="sticky top-[33px] z-30 border-b border-border/70 bg-offwhite/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/60">
                Ultimate League Manager
              </p>
              <h1 className="mt-1 text-base font-semibold text-forest sm:text-lg">
                {displayName}
              </h1>
            </div>

            <Link
              href="/assistant"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft",
                "transition-all duration-200 hover:-translate-y-0.5 hover:bg-sage/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {personaEmoji(persona)}
              </span>
              <Badge variant="outline" className="rounded-xl border-border text-xs text-forest">
                {personaLabel(persona)}
              </Badge>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-6 py-6 sm:px-8 sm:py-8">{children}</main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}

export default MainLayout;
