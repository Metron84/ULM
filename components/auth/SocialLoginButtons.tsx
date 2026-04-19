"use client";

import { toast } from "sonner";

import { cn } from "@/lib/utils";

type SocialLoginButtonsProps = {
  className?: string;
};

export function SocialLoginButtons({ className }: SocialLoginButtonsProps) {
  const handlePlaceholder = (provider: "Google" | "Apple") => {
    toast.message(`${provider} login is coming soon`, {
      description: "Email + password is fully ready now.",
    });
  };

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <button
        type="button"
        onClick={() => handlePlaceholder("Google")}
        className={cn(
          "inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground",
          "shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span aria-hidden="true" className="mr-2">
          G
        </span>
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => handlePlaceholder("Apple")}
        className={cn(
          "inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground",
          "shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span aria-hidden="true" className="mr-2">
          A
        </span>
        Continue with Apple
      </button>
    </div>
  );
}

export default SocialLoginButtons;
