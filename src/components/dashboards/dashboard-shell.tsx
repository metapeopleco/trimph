"use client"

import * as React from "react"
import Link from "next/link"
import { LogOut, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  title: string
  subtitle?: string
  nav: { id: string; label: string; icon?: React.ReactNode }[]
  active: string
  onNav: (id: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
}

const ROLE_LABELS: Record<string, string> = {
  vendor_digital: "App Builder",
  vendor_traditional: "Local Business",
  affiliate: "Affiliate",
}

export function DashboardShell({
  title, subtitle, nav, active, onNav, actions, children,
}: DashboardShellProps) {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-headline text-lg tracking-tight">
              Trim<span className="text-muted-foreground">.ph</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" /> View site
            </Link>
            <ThemeToggle />
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-xs">{user?.name || user?.email}</span>
              <span className="text-[10px] text-muted-foreground">
                {user && ROLE_LABELS[user.role]}
              </span>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <h1 className="font-headline text-2xl mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors text-left",
                    active === item.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            {actions && <div className="mt-4 hidden lg:block">{actions}</div>}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {actions && <div className="lg:hidden mb-4">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  )
}

// Stat card
export function StatCard({
  label, value, hint, icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="font-headline text-3xl tabular">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

// Empty state
export function EmptyState({
  title, description, action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="font-headline text-lg mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>}
      {action}
    </div>
  )
}
