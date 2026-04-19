"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, layoutNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  className?: string;
};

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4 lg:hidden",
        "pointer-events-none",
        className,
      )}
    >
      <ul
        className={cn(
          "pointer-events-auto mx-auto flex max-w-5xl items-stretch gap-1 overflow-x-auto rounded-t-3xl border border-border/70 bg-card/90 p-2 shadow-[0_-14px_35px_-22px_rgba(30,58,138,0.35)] backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-card/80",
        )}
      >
        {layoutNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);
          return (
            <li key={item.href} className="min-w-[74px] flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium",
                  "transition-all duration-300",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:-translate-y-0.5",
                    isActive && "text-primary",
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
