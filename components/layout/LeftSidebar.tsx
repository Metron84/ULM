"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, layoutNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

type LeftSidebarProps = {
  className?: string;
};

export function LeftSidebar({ className }: LeftSidebarProps) {
  const pathname = usePathname();
  const primaryItems = layoutNavItems.filter(
    (item) => !["Rules", "FAQ", "Stats", "Settings"].includes(item.label),
  );
  const moreItems = layoutNavItems.filter((item) =>
    ["Rules", "FAQ", "Stats", "Settings"].includes(item.label),
  );

  return (
    <aside
      className={cn(
        "sticky top-[104px] h-[calc(100vh-124px)] rounded-3xl border border-border/70 bg-card/90 p-4 shadow-soft backdrop-blur",
        className,
      )}
    >
      <Link
        href="/home"
        className={cn(
          "mb-4 flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5",
          "transition-colors hover:bg-secondary/40",
        )}
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground">
          ULM
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Ultimate League Manager</p>
          <p className="text-xs text-muted-foreground">Your game. Your assistant.</p>
        </div>
      </Link>

      <nav aria-label="Desktop navigation">
        <ul className="space-y-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(pathname, item);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-soft"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5",
                      isActive ? "text-primary" : "text-foreground/70",
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            More
          </p>
          <ul className="mt-2 space-y-1.5">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-soft"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5",
                        isActive ? "text-primary" : "text-foreground/70",
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export default LeftSidebar;
