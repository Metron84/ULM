import Link from "next/link";

import { BottomNav } from "@/components/layout/BottomNav";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
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
      <div className="min-h-screen bg-background pb-28 demo-fade-in lg:pb-8">
        <header className="sticky top-[29px] z-30 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Ultimate League Manager
              </p>
              <h1 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                {displayName}
              </h1>
            </div>

            <Link
              href="/assistant"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft",
                "transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {personaEmoji(persona)}
              </span>
              <Badge variant="outline" className="rounded-xl border-border text-xs text-foreground">
                {personaLabel(persona)}
              </Badge>
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
            <LeftSidebar className="hidden lg:block" />
            <main className="min-w-0">{children}</main>
          </div>
        </div>

        <footer className="mx-auto w-full max-w-[1320px] px-4 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <div className="rounded-3xl border border-border/70 bg-card/85 p-4 text-center text-sm text-muted-foreground shadow-soft">
            Need help?{" "}
            <a
              href="mailto:info@metronventures.com"
              className="font-semibold text-primary underline decoration-primary/60 underline-offset-4"
            >
              info@metronventures.com
            </a>
          </div>
        </footer>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}

export default MainLayout;
