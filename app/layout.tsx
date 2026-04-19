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

export const metadata: Metadata = {
  title: "Ultimate League Manager",
  description:
    "Your game. Your assistant. Your moment. The calm, premium home for your football leagues.",
  applicationName: "Ultimate League Manager",
  authors: [{ name: "Ultimate League Manager" }],
  keywords: ["football", "league manager", "fantasy", "world cup", "roster"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#06281B" },
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
        <div className="sticky top-0 z-40 border-b border-sage/45 bg-sage/55 px-4 py-2 text-center text-xs font-medium tracking-wide text-forest">
          Interactive Demo - World Cup 2026
        </div>
        <div className="flex min-h-[calc(100vh-33px)] flex-col">{children}</div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
