import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CircleHelp,
  Globe,
  Home,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export type LayoutNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  activePrefixes?: string[];
};

export const layoutNavItems: LayoutNavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Leagues", href: "/leagues", icon: Trophy },
  { label: "Draft", href: "/draft", icon: ClipboardList },
  { label: "Roster", href: "/roster", icon: Users },
  { label: "Assistant", href: "/assistant", icon: Sparkles },
  { label: "Predictions", href: "/predictions", icon: Target },
  { label: "Trades", href: "/trades", icon: Repeat },
  { label: "Rules", href: "/rules", icon: BookOpen },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
  { label: "Stats", href: "/stats", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  {
    label: "World Cup",
    href: "/worldcup",
    icon: Globe,
    activePrefixes: ["/worldcup", "/world-cup"],
  },
];

export function isNavItemActive(pathname: string, item: LayoutNavItem) {
  const prefixes = item.activePrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
