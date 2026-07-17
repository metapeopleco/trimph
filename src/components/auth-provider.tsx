"use client"

import * as React from "react"
import { SessionProvider, useSession } from "next-auth/react"

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: "vendor_digital" | "vendor_traditional" | "affiliate"
  city: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | null>(null)

function AuthInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = React.useState<AuthUser | null>(null)

  // Sync the NextAuth session into our typed user object.
  React.useEffect(() => {
    if (status === "loading") return
    if (session?.user) {
      const u = session.user as any
      setUser({
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        role: u.role,
        city: u.city ?? null,
      })
    } else {
      setUser(null)
    }
  }, [session, status])

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session")
      const data = await res.json()
      if (data?.user) {
        const u = data.user
        setUser({
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          role: u.role,
          city: u.city ?? null,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    // Clear local state immediately for instant UI feedback
    setUser(null)
    // Call NextAuth signout (handles cookie clearing server-side)
    try {
      await fetch("/api/auth/signout", { method: "POST" })
    } catch {
      // ignore — we still redirect
    }
    // Hard redirect to clear any cached client state
    window.location.href = "/"
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthInner>{children}</AuthInner>
    </SessionProvider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
