import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { hasSupabaseEnv } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import "../styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Ultimate League Manager",
  description:
    "Your game. Your assistant. Your moment. The calm, premium home for your football leagues.",
  applicationName: "Ultimate League Manager",
  authors: [{ name: "Ultimate League Manager" }],
  keywords: ["football", "league manager", "fantasy", "world cup", "roster"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let authState: "guest" | "authenticated" = "guest";
  if (hasSupabaseEnv()) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authState = user ? "authenticated" : "guest";
  }

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body
        className="min-h-full bg-background text-foreground antialiased font-sans"
        data-auth-state={authState}
      >
        <div className="sticky top-0 z-40 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-foreground/80">
          Interactive Demo - World Cup 2026
        </div>
        <div className="flex min-h-[calc(100vh-29px)] flex-col">{children}</div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
