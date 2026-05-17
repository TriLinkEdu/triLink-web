import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditionally compose class names + de-duplicate Tailwind class conflicts.
 * Standard shadcn/ui helper — used by every component primitive.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
