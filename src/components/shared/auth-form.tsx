"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CityCombobox } from "@/components/shared/city-combobox"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

type Role = "affiliate" | "vendor_digital" | "vendor_traditional"

const ROLE_LABELS: Record<Role, string> = {
  affiliate: "Affiliate — promote & earn",
  vendor_digital: "App builder — digital campaigns",
  vendor_traditional: "Local business — in-store codes",
}

interface AuthFormProps {
  defaultRole?: Role
  compact?: boolean
  onDone?: () => void
}

export function AuthForm({ defaultRole = "affiliate", compact = false, onDone }: AuthFormProps) {
  const { refresh } = useAuth()
  const [mode, setMode] = React.useState<"signup" | "signin">("signup")
  const [role, setRole] = React.useState<Role>(defaultRole)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [city, setCity] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      if (mode === "signup") {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role, name, city }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error || "Sign up failed.")
          setLoading(false)
          return
        }
      }
      // sign in via NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Invalid credentials.")
        setLoading(false)
        return
      }
      await refresh()
      toast.success(mode === "signup" ? "Welcome to Trim.ph!" : "Welcome back!")
      onDone?.()
    } catch (e: any) {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className={cn("space-y-3", compact && "space-y-2.5")}>
      {!compact && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">I want to…</label>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "text-left text-sm rounded-lg border px-3 py-2 transition-colors",
                  role === r
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:bg-accent/50"
                )}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "signup" && !compact && (
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name (optional)"
            className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-foreground"
          />
        </div>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-foreground"
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-foreground"
        />
      </div>

      {mode === "signup" && (
        <CityCombobox value={city} onChange={setCity} placeholder="Your city (for local offers)" />
      )}

      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        {mode === "signup" ? "Create account & start" : "Log in"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-1">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => setMode("signin")} className="text-foreground underline underline-offset-2">
              Log in
            </button>
          </>
        ) : (
          <>
            New to Trim.ph?{" "}
            <button type="button" onClick={() => setMode("signup")} className="text-foreground underline underline-offset-2">
              Create account
            </button>
          </>
        )}
      </div>
    </form>
  )
}
