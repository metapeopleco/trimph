"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { ArrowRight, Loader2, Store, User as UserIcon, Globe, Building2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

type Role = "affiliate" | "vendor_digital" | "vendor_traditional"

export function AuthForm({ onDone }: { onDone?: () => void }) {
  const { refresh } = useAuth()
  const [tab, setTab] = React.useState<"vendor" | "affiliate">("affiliate")
  const [vendorType, setVendorType] = React.useState<"digital" | "traditional">("digital")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const role: Role = tab === "affiliate" ? "affiliate" : vendorType === "digital" ? "vendor_digital" : "vendor_traditional"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })
      if (!res.ok) {
        const json = await res.json()
        // If account exists, proceed to login instead of erroring
        if (res.status !== 409) {
          toast.error(json.error || "Sign up failed.")
          setLoading(false)
          return
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        toast.error("Invalid credentials.")
        setLoading(false)
        return
      }
      await refresh()
      toast.success("Welcome to Trim.ph!")
      onDone?.()
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border bg-card p-6 sm:p-8 w-full max-w-md">
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-headline text-2xl sm:text-3xl leading-tight">
            {tab === "affiliate" ? "Become an affiliate" : "Become a vendor"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Log in or sign up — track your earnings in ₱
          </p>
        </div>
        <span className="font-headline text-2xl text-muted-foreground/50 tabular">01</span>
      </div>

      {/* Toggle: vendor / affiliate */}
      <div className="grid grid-cols-2 gap-0 border border-border mb-1">
        <button
          type="button"
          onClick={() => setTab("vendor")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-left border-r border-border transition-colors",
            tab === "vendor" ? "bg-foreground text-background" : "bg-background hover:bg-accent/50"
          )}
        >
          <Store className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">I&apos;m a vendor</p>
            <p className={cn("text-xs", tab === "vendor" ? "text-background/70" : "text-muted-foreground")}>Create campaigns</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTab("affiliate")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-left transition-colors",
            tab === "affiliate" ? "bg-foreground text-background" : "bg-background hover:bg-accent/50"
          )}
        >
          <UserIcon className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">I&apos;m an affiliate</p>
            <p className={cn("text-xs", tab === "affiliate" ? "text-background/70" : "text-muted-foreground")}>Promote &amp; earn</p>
          </div>
        </button>
      </div>

      {/* Vendor sub-type */}
      {tab === "vendor" && (
        <div className="grid grid-cols-2 gap-0 border-x border-b border-border mb-6">
          <button
            type="button"
            onClick={() => setVendorType("digital")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-left text-sm border-r border-border transition-colors",
              vendorType === "digital" ? "bg-foreground/10 text-foreground" : "hover:bg-accent/50"
            )}
          >
            <Globe className="h-4 w-4 shrink-0" /> App / website
          </button>
          <button
            type="button"
            onClick={() => setVendorType("traditional")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
              vendorType === "traditional" ? "bg-foreground/10 text-foreground" : "hover:bg-accent/50"
            )}
          >
            <Building2 className="h-4 w-4 shrink-0" /> Physical store
          </button>
        </div>
      )}

      {tab === "affiliate" && <div className="h-6" />}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-12 border border-border bg-background px-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full h-12 border border-border bg-background px-3 text-sm outline-none focus:border-foreground transition-colors"
          />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          {tab === "affiliate" ? (
            <>How affiliates earn: browse programs, take a deal, share your link. You earn <span className="text-foreground">₱</span> on every verified click, email, or walk-in. No platform cut.</>
          ) : (
            <>How vendors earn: create campaigns, generate tracking links or Take One codes, pay only for verified results. <span className="text-foreground">₱0</span> platform fees.</>
          )}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Please wait…" : "Sign up / Log in"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Existing {tab === "affiliate" ? "affiliate" : "vendor"}? Use the same email to log back in.
        </p>
      </form>
    </div>
  )
}
