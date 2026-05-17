import * as React from "react";
import { cn } from "@/lib/cn";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
    ({ className, orientation = "horizontal", ...props }, ref) => (
        <div
            ref={ref}
            role="separator"
            aria-orientation={orientation}
            className={cn(
                "shrink-0 bg-[var(--color-border)]",
                orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
                className,
            )}
            {...props}
        />
    ),
);
Separator.displayName = "Separator";
