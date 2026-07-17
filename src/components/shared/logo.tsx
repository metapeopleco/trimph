import * as React from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  /** size in px */
  size?: number
}

/**
 * Trim.ph logo mark — uses currentColor so it adapts to light/dark theme automatically.
 * The SVG is inlined for crisp rendering at any size.
 */
export function LogoMark({ className, size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 679 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M635.995 641.802C596.743 641.802 559.099 626.209 531.343 598.453L390.785 457.896L458.731 389.95L678.182 609.402L678.227 641.802H635.995Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M230.855 639.415C178.044 692.227 92.4198 692.227 39.6085 639.415C-13.2028 586.604 -13.2028 500.98 39.6085 448.169C80.4552 407.322 140.931 398.068 190.672 420.407L271.984 339.095L191.507 258.617C141.766 280.956 81.2905 271.702 40.4439 230.855C-12.3674 178.044 -12.3674 92.4198 40.4439 39.6085C93.2552 -13.2028 178.879 -13.2028 231.691 39.6085C272.537 80.4553 281.791 140.931 259.453 190.672L339.93 271.149L530.508 80.5708C558.263 52.8154 595.908 37.2226 635.16 37.2226H677.392L677.436 69.5328L258.617 488.352C280.956 538.093 271.702 598.569 230.855 639.415ZM183.724 592.284C210.505 565.503 210.505 522.082 183.724 495.3C156.942 468.519 113.521 468.519 86.7402 495.3C59.959 522.082 59.959 565.503 86.7402 592.284C113.521 619.065 156.942 619.065 183.724 592.284ZM87.5754 183.724C114.357 210.505 157.778 210.505 184.559 183.724C211.34 156.942 211.34 113.522 184.559 86.7403C157.778 59.959 114.357 59.959 87.5754 86.7403C60.7941 113.522 60.7941 156.942 87.5754 183.724Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LogoWord({ className, size = 28 }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-headline text-xl leading-none tracking-tight">
        Trim<span className="text-muted-foreground">.ph</span>
      </span>
    </span>
  )
}
