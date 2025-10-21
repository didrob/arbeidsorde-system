// Radix Tooltip shim to avoid runtime hook issues while keeping API compatible
import * as React from "react";

export type TooltipProps = React.HTMLAttributes<HTMLDivElement> & { open?: boolean };
export type TooltipProviderProps = { children?: React.ReactNode };
export type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

export const TooltipTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )
);
TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} role="tooltip" {...props}>{children}</div>
  )
);
TooltipContent.displayName = "TooltipContent";
