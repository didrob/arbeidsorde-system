import * as React from "react";
import { cn } from "@/lib/utils";

// Lightweight no-op Tooltip implementation to avoid invalid hook calls
// while keeping the component API stable.

type TooltipCommonProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  hidden?: boolean;
};

export function TooltipProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipCommonProps>(
  ({ children, className, asChild, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);
TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipCommonProps>(
  ({ children, className, side, align, hidden, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(hidden ? "sr-only" : "", className)}
      aria-hidden={hidden}
      {...props}
    >
      {children}
    </div>
  )
);
TooltipContent.displayName = "TooltipContent";

