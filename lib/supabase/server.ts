import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabaseEnv } from "@/lib/supabase";

export async function createServerClient() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();

  return createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes can fail in Server Components during static render.
          // Middleware handles refresh cookie persistence.
        }
      },
    },
  });
}
