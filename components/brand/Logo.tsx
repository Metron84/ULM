import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showMark?: boolean;
  className?: string;
};

const sizeMap: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl sm:text-8xl",
};

export function Logo({ size = "lg", showMark = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {showMark && (
        <span
          aria-hidden="true"
          className={cn(
            "relative flex items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-glow",
            "transition-transform duration-500 hover:-rotate-2 hover:scale-[1.03]",
            size === "xl" && "h-20 w-20 sm:h-24 sm:w-24",
            size === "lg" && "h-16 w-16",
            size === "md" && "h-11 w-11",
            size === "sm" && "h-8 w-8",
          )}
        >
          <span
            className={cn(
              "font-heading font-semibold tracking-[-0.04em]",
              size === "xl" && "text-3xl sm:text-4xl",
              size === "lg" && "text-2xl",
              size === "md" && "text-lg",
              size === "sm" && "text-sm",
            )}
          >
            U
          </span>
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-reward ring-4 ring-background"
          />
        </span>
      )}
      <span
        className={cn(
          "font-heading font-semibold tracking-[-0.05em] text-primary",
          sizeMap[size],
        )}
      >
        ULM
      </span>
    </div>
  );
}

export default Logo;
