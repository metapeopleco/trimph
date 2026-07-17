import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve a relative URL (e.g. "/c/abc?aff=xyz") to an absolute URL using the
 * current window origin. This is used when displaying/copying/encoding tracking
 * links so the stored value stays relative but the user sees a full URL.
 */
export function absoluteUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`
  }
  return path
}

