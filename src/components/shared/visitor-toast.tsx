"use client"

import * as React from "react"
import { Users, X } from "lucide-react"

interface VisitorData {
  visitors: number
  members: number
  campaigns: number
  label: string
}

export function VisitorToast() {
  const [data, setData] = React.useState<VisitorData | null>(null)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (dismissed) return
    // Fetch once on mount; refresh every 60s
    const fetchVisitors = () => {
      fetch("/api/visitors")
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => {})
    }
    fetchVisitors()
    const interval = setInterval(fetchVisitors, 60000)
    return () => clearInterval(interval)
  }, [dismissed])

  // Don't show on dashboard (only on landing)
  const [isLanding, setIsLanding] = React.useState(true)
  React.useEffect(() => {
    const check = () => {
      const hash = window.location.hash
      const hasDashboard = hash === "#dashboard"
      // If there's a session cookie or dashboard hash, hide
      setIsLanding(!hasDashboard)
    }
    check()
    window.addEventListener("hashchange", check)
    return () => window.removeEventListener("hashchange", check)
  }, [])

  if (!data || dismissed || !isLanding) return null

  return (
    <div
      className="fixed bottom-4 left-4 z-40 pointer-events-auto select-none"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border px-3 py-2 shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs tabular text-foreground">
          {data.visitors.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">
          {data.label} this month
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
