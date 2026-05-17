"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Command — cmd-k palette primitives.
 *
 * This is the single feature that makes a modern app *feel* like Linear /
 * Raycast / Arc. Wire it once in the layout and let users navigate by
 * typing.
 */
export const Command = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
    <CommandPrimitive
        ref={ref}
        className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-lg bg-[var(--color-bg-elev)] text-[var(--color-fg)]",
            className,
        )}
        {...props}
    />
));
Command.displayName = "Command";

export interface CommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children?: React.ReactNode;
    /** ARIA label for the dialog (palettes don't need a visible title). */
    label?: string;
}

export function CommandDialog({ open, onOpenChange, children, label = "Command palette" }: CommandDialogProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-label={label}
                    className={cn(
                        "fixed left-1/2 top-[14vh] z-50 w-[min(640px,92vw)] -translate-x-1/2",
                        "overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]",
                        "shadow-[var(--shadow-lg)]",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
                    <Command
                        className="[&_[cmdk-input-wrapper]]:flex [&_[cmdk-input-wrapper]]:items-center [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-[var(--color-border)] [&_[cmdk-input-wrapper]]:px-3"
                    >
                        {children}
                    </Command>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export const CommandInput = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
    <div cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--color-fg-subtle)]" />
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                "flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-fg-subtle)] disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        />
    </div>
));
CommandInput.displayName = "CommandInput";

export const CommandList = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.List
        ref={ref}
        className={cn("max-h-[60vh] overflow-y-auto overflow-x-hidden p-1", className)}
        {...props}
    />
));
CommandList.displayName = "CommandList";

export const CommandEmpty = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Empty>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
    <CommandPrimitive.Empty
        ref={ref}
        className="py-10 text-center text-sm text-[var(--color-fg-subtle)]"
        {...props}
    />
));
CommandEmpty.displayName = "CommandEmpty";

export const CommandGroup = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Group>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Group
        ref={ref}
        className={cn(
            "overflow-hidden p-1 text-[var(--color-fg)]",
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5",
            "[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]",
            "[&_[cmdk-group-heading]]:text-[var(--color-fg-subtle)]",
            className,
        )}
        {...props}
    />
));
CommandGroup.displayName = "CommandGroup";

export const CommandSeparator = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 h-px bg-[var(--color-border)]", className)}
        {...props}
    />
));
CommandSeparator.displayName = "CommandSeparator";

export const CommandItem = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none",
            "data-[selected=true]:bg-[var(--color-muted)]",
            "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
            "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-[var(--color-fg-subtle)]",
            className,
        )}
        {...props}
    />
));
CommandItem.displayName = "CommandItem";

export const CommandShortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
    <span
        className={cn(
            "ml-auto text-[11px] tracking-widest text-[var(--color-fg-subtle)]",
            className,
        )}
        {...props}
    />
);
