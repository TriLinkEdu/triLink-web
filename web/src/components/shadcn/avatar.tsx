"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
    xl: "h-16 w-16 text-xl",
} as const;
type AvatarSize = keyof typeof sizes;

export interface AvatarProps
    extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
    size?: AvatarSize;
    src?: string;
    alt?: string;
    initials?: string;
}

/**
 * Avatar — image with a deterministic fallback initials chip. Uses Radix
 * Avatar so the fallback only renders if the image fails to load.
 */
export const Avatar = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    AvatarProps
>(({ className, size = "md", src, alt, initials, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn(
            "relative inline-flex shrink-0 overflow-hidden rounded-full",
            "bg-[var(--color-muted)] text-[var(--color-fg-muted)]",
            "ring-1 ring-[var(--color-border)]",
            sizes[size],
            className,
        )}
        {...props}
    >
        {src ? (
            <AvatarPrimitive.Image
                src={src}
                alt={alt ?? ""}
                className="h-full w-full object-cover"
            />
        ) : null}
        <AvatarPrimitive.Fallback
            delayMs={src ? 350 : 0}
            className="flex h-full w-full items-center justify-center font-medium uppercase"
        >
            {initials ?? "·"}
        </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
));
Avatar.displayName = "Avatar";
