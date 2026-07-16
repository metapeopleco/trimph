"use client"

import * as React from "react"
import { SessionProvider } from "next-auth/react"

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session")
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name ?? null,
          role: data.user.role,
          city: data.user.city ?? null,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    setUser(null)
    window.location.href = "/"
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SessionProvider>
      <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
