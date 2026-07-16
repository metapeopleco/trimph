"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { LandingPage } from "@/components/landing/landing-page"
import { VendorDigitalDashboard } from "@/components/dashboards/vendor-digital"
import { VendorTraditionalDashboard } from "@/components/dashboards/vendor-traditional"
import { AffiliateDashboard } from "@/components/dashboards/affiliate"

export function DashboardRouter() {
  const { user, loading } = useAuth()

  // Heartbeat to keep online status fresh while in dashboard
  React.useEffect(() => {
    if (!user) return
    const beat = () => fetch("/api/online", { method: "POST" }).catch(() => {})
    beat()
    const interval = setInterval(beat, 30000)
    const onUnload = () => {
      // best-effort offline signal
      navigator.sendBeacon?.("/api/online?method=DELETE")
    }
    window.addEventListener("beforeunload", onUnload)
    return () => {
      clearInterval(interval)
      window.removeEventListener("beforeunload", onUnload)
      fetch("/api/online", { method: "DELETE" }).catch(() => {})
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) return <LandingPage />

  if (user.role === "vendor_digital") return <VendorDigitalDashboard />
  if (user.role === "vendor_traditional") return <VendorTraditionalDashboard />
  if (user.role === "affiliate") return <AffiliateDashboard />

  return <LandingPage />
}
