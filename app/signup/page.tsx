"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Account created", {
        description: "Now choose your assistant persona.",
      });
      router.push("/onboarding/persona");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign up.";
      toast.error("Sign up failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-pitch-gradient flex min-h-screen items-center justify-center px-6 py-10">
      <section
        className={cn(
          "w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-glow backdrop-blur",
          "sm:p-10",
        )}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="md" className="mb-4 justify-center" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build your league command center in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Manager Name"
              className={cn(
                "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@club.com"
              className={cn(
                "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className={cn(
                "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground",
              "shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow",
              "disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="my-6 h-px bg-border" />

        <SocialLoginButtons />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
