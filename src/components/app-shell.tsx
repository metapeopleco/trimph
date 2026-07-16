"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { LandingPage } from "@/components/landing/landing-page"
import { DashboardRouter } from "@/components/dashboards/dashboard-router"
import { LogoMark } from "@/components/shared/logo"

export function AppShell() {
  const { user, loading } = useAuth()
  const [hash, setHash] = React.useState<string>(
    typeof window !== "undefined" ? window.location.hash : ""
  )

  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <LogoMark size={48} className="animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading Trim.ph…</p>
      </div>
    )
  }

  // If logged in OR hash points to dashboard, show dashboard router
  if (user || hash === "#dashboard") {
    return <DashboardRouter />
  }

  return <LandingPage />
}
