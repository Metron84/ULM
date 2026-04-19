"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, Sparkles, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activePrefixes?: string[];
};

const items: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  {
    label: "My Leagues",
    href: "/leagues",
    icon: Trophy,
    activePrefixes: ["/leagues", "/predictions", "/trades"],
  },
  { label: "Roster", href: "/roster", icon: Users },
  { label: "Assistant", href: "/assistant", icon: Sparkles },
  { label: "World Cup", href: "/worldcup", icon: Globe },
];

type BottomNavProps = {
  className?: string;
};

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4",
        "pointer-events-none",
        className,
      )}
    >
      <ul
        className={cn(
          "pointer-events-auto mx-auto grid max-w-3xl grid-cols-5 items-stretch rounded-t-3xl border border-border/70 bg-card/90 p-2 shadow-[0_-14px_35px_-22px_rgba(10,61,42,0.35)] backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-card/80",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const prefixes = item.activePrefixes ?? [item.href];
          const isActive = prefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          );
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium",
                  "transition-all duration-300",
                  isActive
                    ? "bg-gold/20 text-gold"
                    : "text-charcoal/75 hover:bg-sage/30 hover:text-charcoal",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:-translate-y-0.5",
                    isActive && "text-gold",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </nav>
  );
}

export default BottomNav;
