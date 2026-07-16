"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight, Search, Tag, MapPin, ShieldCheck, Gift, Link2,
  Store, Users, Sparkles, Check, QrCode, Download, Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogoMark, LogoWord } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { ConfettiCursor } from "@/components/shared/confetti-cursor"
import { CityCombobox } from "@/components/shared/city-combobox"
import { AuthForm } from "@/components/shared/auth-form"
import { QrCodeSvg, exportQrPdf } from "@/components/shared/qr-code"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

interface Program {
  id: string
  title: string
  description: string
  type: string
  rewardType: string
  rewardAmount: number
  city: string | null
  category: string | null
  maxUses: number | null
  isSeeded: boolean
  vendor: { name: string | null; email: string; isOnline: boolean }
  _count?: { trackingLinks: number }
}

export function LandingPage() {
  const { user } = useAuth()
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)
  const [city, setCity] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [q, setQ] = React.useState("")
  const [type, setType] = React.useState<string>("")

  const fetchPrograms = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (city) params.set("city", city)
    if (category) params.set("category", category)
    if (q) params.set("q", q)
    if (type) params.set("type", type)
    try {
      const res = await fetch(`/api/programs?${params}`)
      const data = await res.json()
      setPrograms(data.programs || [])
    } catch {
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }, [city, category, q, type])

  React.useEffect(() => {
    const t = setTimeout(fetchPrograms, 250)
    return () => clearTimeout(t)
  }, [fetchPrograms])

  // ensure seeded sample campaigns exist so the marketplace isn't empty
  React.useEffect(() => {
    fetch("/api/seed", { method: "POST" }).catch(() => {})
  }, [])

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    programs.forEach((p) => p.category && set.add(p.category))
    return Array.from(set)
  }, [programs])

  const scrollToBrowse = () => {
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConfettiCursor />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={30} />
            <span className="font-headline text-xl tracking-tight">
              Trim<span className="text-muted-foreground">.ph</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={scrollToBrowse} className="text-muted-foreground hover:text-foreground transition-colors">Browse</button>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Free forever</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href="/#dashboard">
                <Button size="sm" className="h-9">My dashboard</Button>
              </Link>
            ) : (
              <a href="#start">
                <Button size="sm" variant="outline" className="h-9">Log in</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <Badge variant="outline" className="mb-6 rounded-full px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1.5" /> Free forever — $0 platform fees
              </Badge>
              <h1 className="font-headline text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                Your link,<br />
                your code,<br />
                <span className="italic text-muted-foreground">your cut.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md">
                The open affiliate ecosystem for app builders, local businesses, and creators.
                Launch campaigns, share links, drive foot traffic — and keep every peso you earn.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12 px-8 text-base" onClick={scrollToBrowse}>
                  Browse offers <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <a href="#start" className="inline-flex">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Sign up as affiliate
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Start in 30 seconds. No credit card. No fees. Ever.
              </p>
            </div>

            {/* Sign-up form card */}
            <div id="start" className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-headline text-2xl">Get started</h2>
                  <span className="text-xs text-muted-foreground">It's free</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Create your account and start earning in under a minute.
                </p>
                <AuthForm defaultRole="affiliate" />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                By signing up you agree to Trim.ph's community guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse programs */}
      <section id="browse" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-headline text-3xl sm:text-4xl">Browse programs by city</h2>
              <p className="text-muted-foreground mt-2">Find offers to promote — filter by city, category, or search.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <CityCombobox value={city} onChange={setCity} placeholder="All cities" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search offers…"
                className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            >
              <option value="">All types</option>
              <option value="digital">Digital / links</option>
              <option value="take_one">In-store codes</option>
            </select>
          </div>

          {/* Program cards — 3 columns on desktop */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl border border-border bg-card animate-pulse" />
              ))
            ) : programs.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No programs found. Try adjusting your filters.
              </div>
            ) : (
              programs.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* How it works / Network overview */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-headline text-3xl sm:text-4xl text-center mb-2">One platform, three ways to grow</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Whether you build apps, run a local shop, or have an audience — Trim.ph connects you to the others, free.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Link2 className="h-5 w-5" />}
              title="Campaigns"
              tag="App builders & digital vendors"
              points={[
                "Turn any URL into a tracked affiliate link",
                "Capture emails with a lead wall",
                "Pay only for verified clicks or signups",
                "Export leads & set max usage limits",
              ]}
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Programs"
              tag="Affiliates & promoters"
              points={[
                "Browse offers by city or category",
                "One-click “Take deal” to get your link",
                "Secure Click protection against bots",
                "Track clicks, emails & earnings live",
              ]}
            />
            <FeatureCard
              icon={<Store className="h-5 w-5" />}
              title="Take One"
              tag="Local & brick-and-mortar"
              points={[
                "Generate TRIM-prefixed offline codes",
                "Affiliates share QR codes & vouchers",
                "Verify & redeem at the counter in seconds",
                "No APIs, no pixels, no complexity",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 rounded-full">
                <ShieldCheck className="h-3 w-3 mr-1.5" /> Secure Click
              </Badge>
              <h2 className="font-headline text-3xl sm:text-4xl mb-4">Bot-proof clicks. Real earnings.</h2>
              <p className="text-muted-foreground mb-6">
                Every affiliate link passes through a lightweight human-verification interstitial
                before counting as a click. Protect your ad spend from programmatic fraud — without
                friction for real visitors.
              </p>
              <ul className="space-y-2.5">
                {[
                  "IP-based rate limiting for suspicious velocity",
                  "Human quiz gate before any click is counted",
                  "Optional email lead wall before redirection",
                  "Full audit trail of every conversion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-foreground text-background mb-4">
                <Gift className="h-7 w-7" />
              </div>
              <p className="font-headline text-4xl mb-1">₱0.00</p>
              <p className="text-sm text-muted-foreground mb-6">Platform fees, forever</p>
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Subscription</p>
                  <p className="text-sm mt-1">Never</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Transaction cut</p>
                  <p className="text-sm mt-1">Zero</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Hidden fees</p>
                  <p className="text-sm mt-1">None</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <LogoWord size={28} />
              <p className="text-xs text-muted-foreground max-w-xs text-center sm:text-left">
                Free forever affiliate ecosystem for the Philippines.
              </p>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={scrollToBrowse} className="hover:text-foreground">Browse</button>
              <a href="#how" className="hover:text-foreground">How it works</a>
              <a href="#security" className="hover:text-foreground">Free forever</a>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Made with <span className="text-foreground">♥</span> by the makers of
              <span className="inline-flex items-center gap-1 ml-1">
                <LogoMark size={14} />
                <span className="font-headline">JOph.app</span>
              </span>
            </p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Trim.ph</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon, title, tag, points,
}: {
  icon: React.ReactNode
  title: string
  tag: string
  points: string[]
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-foreground text-background mb-4">
        {icon}
      </div>
      <h3 className="font-headline text-xl mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{tag}</p>
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /> {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProgramCard({ program }: { program: Program }) {
  const { user } = useAuth()
  const [showQr, setShowQr] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [taking, setTaking] = React.useState(false)

  const isTakeOne = program.type === "take_one"
  const rewardLabel =
    program.rewardType === "click"
      ? `₱${program.rewardAmount.toFixed(2)} / click`
      : program.rewardType === "email"
      ? `₱${program.rewardAmount.toFixed(2)} / email`
      : `₱${program.rewardAmount.toFixed(2)} / walk-in`

  const handleTake = async () => {
    if (!user || user.role !== "affiliate") {
      toast.info("Sign up as an affiliate to take this deal.", {
        description: "It's free and takes 30 seconds.",
      })
      document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (program.isSeeded) {
      toast.warning("This is a seeded campaign for mockup", {
        description:
          "Please choose one of the real active campaigns. Admin will remove these seed campaigns at the end of Beta Test stage on Aug 15, 2026.",
        duration: 8000,
      })
      return
    }
    setTaking(true)
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: program.id }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      toast.success("Deal taken!", {
        description: "Your tracking link is ready in your dashboard.",
      })
      window.location.hash = "#dashboard"
      window.location.reload()
    } catch {
      toast.error("Failed to take deal.")
    } finally {
      setTaking(false)
    }
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${program.id}?aff=${user?.id || ""}`

  return (
    <div className="group rounded-xl border border-border bg-card p-5 flex flex-col hover:border-foreground/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {isTakeOne ? (
            <Badge variant="secondary" className="text-[10px]"><Store className="h-2.5 w-2.5 mr-1" /> In-store</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]"><Link2 className="h-2.5 w-2.5 mr-1" /> Digital</Badge>
          )}
          {program.category && (
            <Badge variant="outline" className="text-[10px]">{program.category}</Badge>
          )}
          {program.isSeeded && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">Beta sample</Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", program.vendor.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
          {program.vendor.isOnline ? "online" : "offline"}
        </span>
      </div>

      <h3 className="font-headline text-lg leading-tight mb-1">{program.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{program.description}</p>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Payout</p>
          <p className="font-headline text-xl tabular">{rewardLabel}</p>
        </div>
        {program.city && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">City</p>
            <p className="text-sm flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" />{program.city}</p>
          </div>
        )}
      </div>

      {program.maxUses != null && (
        <p className="text-[11px] text-muted-foreground mb-3">Limit: {program.maxUses} redemptions</p>
      )}

      <div className="flex gap-2">
        <Button className="flex-1 h-10" onClick={handleTake} disabled={taking}>
          {taking ? "Taking…" : "Take deal"}
        </Button>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setShowQr((s) => !s)} aria-label="Show QR">
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      {showQr && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col items-center gap-2">
          <div className="rounded-lg border border-border p-2 bg-white">
            <QrCodeSvg value={shareUrl} size={140} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Scan to open offer page</p>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => exportQrPdf([{ title: program.title, subtitle: program.city || undefined, url: shareUrl }])}
            >
              <Download className="h-3 w-3 mr-1" /> PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
