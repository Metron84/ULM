import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const authRoutes = new Set(["/login", "/signup"]);
const protectedPrefixes = [
  "/home",
  "/onboarding",
  "/predictions",
  "/trades",
  "/leagues",
  "/roster",
  "/assistant",
  "/worldcup",
  "/world-cup",
];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.has(pathname);

  let hasPersona = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("assistant_persona")
      .eq("id", user.id)
      .maybeSingle();
    hasPersona = Boolean(profile?.assistant_persona);
  }

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasPersona ? "/home" : "/onboarding/persona";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasPersona ? "/home" : "/onboarding/persona";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
