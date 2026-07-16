"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight, Search, MapPin, ShieldCheck, Link2,
  Store, Users, Check, QrCode, Download, Copy, Sparkles,
  MousePointerClick, Mail, Footprints,
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

  React.useEffect(() => {
    fetch("/api/seed", { method: "POST" }).catch(() => {})
  }, [])

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    programs.forEach((p) => p.category && set.add(p.category))
    return Array.from(set)
  }, [programs])

  const scrollToBrowse = () => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })
  const scrollToStart = () => document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConfettiCursor />

      {/* Header — full width */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-headline text-xl tracking-tight">
              Trim<span className="text-muted-foreground">.ph</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <button onClick={scrollToBrowse} className="text-muted-foreground hover:text-foreground transition-colors">Browse</button>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#fees" className="text-muted-foreground hover:text-foreground transition-colors">Free forever</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/#dashboard"><Button size="sm" className="h-9">My dashboard</Button></Link>
            ) : (
              <Button size="sm" variant="outline" className="h-9" onClick={scrollToStart}>Affiliate login</Button>
            )}
            <Button size="sm" className="h-9 hidden sm:inline-flex" onClick={scrollToStart}>Become an affiliate</Button>
          </div>
        </div>
      </header>

      {/* Hero — full width, two-column with featured offer card */}
      <section className="relative border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-16 sm:pt-24 sm:pb-20">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">
            {/* Left: headline + CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
                <span className="h-1.5 w-1.5 bg-foreground" />
                Free forever · No platform fees
              </div>
              <h1 className="font-headline text-6xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight">
                Your link,<br />
                your code,<br />
                <span className="italic text-muted-foreground">your cut.</span>
              </h1>
              <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Trim.ph is a free, community-driven affiliate network for the Philippines.
                Promote apps, share codes, drive walk-ins — and earn in ₱ on every verified result.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-14 px-10 text-base" onClick={scrollToBrowse}>
                  Browse offers <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base" onClick={scrollToStart}>
                  Sign up as affiliate
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Start in 30 seconds. No credit card. No fees. Ever.
              </p>
            </div>

            {/* Right: featured offer card with QR + live offer */}
            <FeaturedOfferCard programs={programs} />
          </div>
        </div>
      </section>

      {/* Start in 30 seconds — form section */}
      <section id="start" className="border-b border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: copy + steps */}
            <div>
              <h2 className="font-headline text-5xl sm:text-6xl leading-[0.95] tracking-tight">Start in 30 seconds.</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-md">
                No credit card. No fees. Pick a side and create your account.
              </p>
              <div className="mt-10 space-y-6">
                <Step
                  num="01"
                  icon={<Search className="h-5 w-5" />}
                  title="Browse programs"
                  desc="Filter the affiliate marketplace by city, category, or payout type."
                />
                <Step
                  num="02"
                  icon={<Link2 className="h-5 w-5" />}
                  title="Take a deal"
                  desc="Get your personalized tracking link or Take One code instantly."
                />
                <Step
                  num="03"
                  icon={<Check className="h-5 w-5" />}
                  title="Share & earn"
                  desc="Every verified click, email, or walk-in credits your balance in ₱."
                />
              </div>
            </div>
            {/* Right: the form */}
            <div className="lg:sticky lg:top-24 flex justify-center lg:justify-end">
              <AuthForm onDone={() => window.location.reload()} />
            </div>
          </div>
        </div>
      </section>

      {/* Browse programs — full width */}
      <section id="browse" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
          <div className="mb-10">
            <h2 className="font-headline text-5xl sm:text-6xl leading-[0.95] tracking-tight">Browse programs by city.</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Filter the affiliate marketplace — find offers to promote, by location, category, or type.
            </p>
          </div>

          {/* Filters */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border mb-8">
            <div className="border-b sm:border-b-0 sm:border-r border-border p-1">
              <CityCombobox value={city} onChange={setCity} placeholder="All cities" className="border-0 hover:bg-transparent" />
            </div>
            <div className="relative border-b sm:border-b-0 sm:border-r border-border">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search offers…"
                className="w-full h-11 bg-background pl-10 pr-3 text-sm outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 bg-background px-3 text-sm outline-none border-b sm:border-b-0 sm:border-r border-border"
            >
              <option value="">All categories</option>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 bg-background px-3 text-sm outline-none"
            >
              <option value="">All types</option>
              <option value="digital">Digital / links</option>
              <option value="take_one">In-store codes</option>
            </select>
          </div>

          {/* Program cards — 3 columns */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 border-r border-b border-border bg-card animate-pulse" />
              ))
            ) : programs.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground border-r border-b border-border">
                No programs found. Try adjusting your filters.
              </div>
            ) : (
              programs.map((p) => (<ProgramCard key={p.id} program={p} />))
            )}
          </div>
        </div>
      </section>

      {/* Three sides, one network */}
      <section id="how" className="border-b border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
          <h2 className="font-headline text-5xl sm:text-6xl leading-[0.95] tracking-tight mb-4">Three sides, one network.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mb-12">
            Whether you build apps, run a local shop, or have an audience — Trim.ph connects you to the others, free.
          </p>
          <div className="grid md:grid-cols-3 gap-0 border-l border-t border-border">
            <NetworkCard
              icon={<Link2 className="h-6 w-6" />}
              title="Campaigns"
              tag="App builders & digital vendors"
              points={[
                "Turn any URL into a tracked affiliate link",
                "Capture emails with a lead wall",
                "Pay only for verified clicks or signups",
                "Export leads & set max usage limits",
              ]}
            />
            <NetworkCard
              icon={<Users className="h-6 w-6" />}
              title="Programs"
              tag="Affiliates & promoters"
              points={[
                "Browse offers by city or category",
                "One-click Take deal to get your link",
                "Secure Click protection against bots",
                "Track clicks, emails & earnings live",
              ]}
            />
            <NetworkCard
              icon={<Store className="h-6 w-6" />}
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

      {/* Secure Click */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
                <ShieldCheck className="h-4 w-4" /> Secure Click
              </div>
              <h2 className="font-headline text-5xl sm:text-6xl leading-[0.95] tracking-tight">
                Humans only,<br />bots blocked.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                Every affiliate link passes through a lightweight human-verification interstitial
                before counting as a click. Protect your ad spend from programmatic fraud — without
                friction for real visitors.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "IP-based rate limiting for suspicious velocity",
                  "Human quiz gate before any click is counted",
                  "Optional email lead wall before redirection",
                  "Full audit trail of every conversion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-card p-10 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Platform fees</p>
              <p className="font-headline text-8xl sm:text-9xl leading-none tabular">₱0</p>
              <p className="text-sm text-muted-foreground mt-4 mb-8">Forever. No subscription, no transaction cut, no hidden costs.</p>
              <Button size="lg" className="h-12 px-8" onClick={scrollToStart}>Start free</Button>
            </div>
          </div>
        </div>
      </section>

      {/* No fees. No catch. Ever. */}
      <section id="fees" className="border-b border-border bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h2 className="font-headline text-5xl sm:text-7xl lg:text-8xl leading-[0.92] tracking-tight">
            No fees.<br />No catch.<br />
            <span className="italic text-background/60">Ever.</span>
          </h2>
          <p className="mt-8 text-lg sm:text-xl text-background/70 max-w-2xl mx-auto leading-relaxed">
            Trim.ph is built by the makers of JOph.app as a free, community-driven affiliate network.
            No subscriptions. No transaction cuts. No paywalls. Just creators, vendors, and affiliates growing together.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="outline" className="h-14 px-10 text-base border-background text-background hover:bg-background hover:text-foreground" onClick={scrollToStart}>
              Create your first campaign
            </Button>
            <Button size="lg" className="h-14 px-10 text-base bg-background text-foreground hover:bg-background/90" onClick={scrollToBrowse}>
              Browse the marketplace
            </Button>
          </div>
        </div>
      </section>

      {/* Footer — full width */}
      <footer className="mt-auto bg-background">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-10">
            <div>
              <LogoWord size={28} />
              <p className="text-sm text-muted-foreground max-w-xs mt-3">
                A free, community-driven affiliate network for the Philippines. Your link, your code, your cut.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Platform</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={scrollToBrowse} className="hover:text-foreground text-muted-foreground">Browse</button></li>
                <li><button onClick={scrollToStart} className="hover:text-foreground text-muted-foreground">Create</button></li>
                <li><a href="#how" className="hover:text-foreground text-muted-foreground">How it works</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">For</p>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">App builders</li>
                <li className="text-muted-foreground">Local businesses</li>
                <li className="text-muted-foreground">Affiliates</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Made with <span className="text-foreground">♥</span> by the makers of
              <span className="inline-flex items-center gap-1 ml-1">
                <LogoMark size={14} />
                <span className="font-headline">JOph.app</span>
              </span>
            </p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Trim.ph — Free forever</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeaturedOfferCard({ programs }: { programs: Program[] }) {
  const { user } = useAuth()
  const [copied, setCopied] = React.useState(false)
  // pick the highest-payout real (non-seeded) program, else the first seeded one
  const featured = React.useMemo(() => {
    if (programs.length === 0) return null
    const real = programs.filter((p) => !p.isSeeded)
    const pool = real.length > 0 ? real : programs
    return [...pool].sort((a, b) => b.rewardAmount - a.rewardAmount)[0]
  }, [programs])

  if (!featured) {
    return (
      <div className="border border-border bg-card p-8 lg:sticky lg:top-24">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Featured offer</span>
          <span className="h-2 w-2 bg-emerald-500 animate-pulse" />
        </div>
        <p className="font-headline text-3xl mb-2">Loading offers…</p>
        <p className="text-sm text-muted-foreground">Checking the live marketplace.</p>
      </div>
    )
  }

  const isTakeOne = featured.type === "take_one"
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${featured.id}?aff=${user?.id || ""}`
  const rewardLabel =
    featured.rewardType === "click" ? `/ click`
    : featured.rewardType === "email" ? `/ email`
    : `/ walk-in`

  return (
    <div className="border border-border bg-card p-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Featured offer</span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5", featured.vendor.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
          {featured.vendor.isOnline ? "vendor online" : "vendor offline"}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="font-headline text-2xl leading-tight mb-2">{featured.title}</h3>
          <p className="text-sm text-muted-foreground">{featured.description}</p>
        </div>
        <div className="border border-border p-2 bg-white shrink-0">
          <QrCodeSvg value={shareUrl} size={96} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {isTakeOne ? (
          <Badge variant="secondary" className="text-[10px]"><Store className="h-2.5 w-2.5 mr-1" /> In-store</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]"><Link2 className="h-2.5 w-2.5 mr-1" /> Digital</Badge>
        )}
        {featured.category && <Badge variant="outline" className="text-[10px]">{featured.category}</Badge>}
        {featured.city && <Badge variant="outline" className="text-[10px]"><MapPin className="h-2.5 w-2.5 mr-1" />{featured.city}</Badge>}
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Affiliate payout</p>
        <p className="font-headline text-4xl tabular">
          ₱{featured.rewardAmount.toFixed(2)}
          <span className="text-base text-muted-foreground ml-1.5">{rewardLabel}</span>
        </p>
      </div>

      {featured.isSeeded && (
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          Beta sample offer — real campaigns replace this after Aug 15, 2026.
        </p>
      )}

      <div className="mt-5 flex gap-0">
        <Button
          className="flex-1 h-11"
          onClick={() => {
            if (!user || user.role !== "affiliate") {
              document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })
              return
            }
            if (featured.isSeeded) {
              toast.warning("This is a seeded campaign for mockup", {
                description: "Please choose one of the real active campaigns. Admin will remove these seed campaigns at the end of Beta Test stage on Aug 15, 2026.",
                duration: 8000,
              })
              return
            }
            fetch("/api/links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ campaignId: featured.id }),
            }).then(() => {
              toast.success("Deal taken!", { description: "Your tracking link is ready." })
              window.location.hash = "#dashboard"
              window.location.reload()
            })
          }}
        >
          Take deal <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 border-l-0"
          onClick={() => {
            navigator.clipboard?.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Shareable link</p>
          <code className="text-[11px] text-muted-foreground truncate block max-w-[220px]">{shareUrl}</code>
        </div>
        <span className="text-[10px] text-muted-foreground">/{featured.id.slice(-6)}</span>
      </div>
    </div>
  )
}

function Step({ num, icon, title, desc }: { num: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0">
        <div className="h-12 w-12 border border-border flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-headline text-sm text-muted-foreground tabular">{num}</span>
          <h3 className="font-headline text-xl">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function NetworkCard({
  icon, title, tag, points,
}: {
  icon: React.ReactNode
  title: string
  tag: string
  points: string[]
}) {
  return (
    <div className="border-r border-b border-border bg-card p-8">
      <div className="inline-flex items-center justify-center h-12 w-12 border border-border mb-5">
        {icon}
      </div>
      <h3 className="font-headline text-2xl mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-5 uppercase tracking-wider">{tag}</p>
      <ul className="space-y-2.5">
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
    program.rewardType === "click" ? `₱${program.rewardAmount.toFixed(2)} / click`
    : program.rewardType === "email" ? `₱${program.rewardAmount.toFixed(2)} / email`
    : `₱${program.rewardAmount.toFixed(2)} / walk-in`

  const RewardIcon =
    program.rewardType === "click" ? MousePointerClick
    : program.rewardType === "email" ? Mail
    : Footprints

  const handleTake = async () => {
    if (!user || user.role !== "affiliate") {
      toast.info("Sign up as an affiliate to take this deal.", { description: "It's free and takes 30 seconds." })
      document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (program.isSeeded) {
      toast.warning("This is a seeded campaign for mockup", {
        description: "Please choose one of the real active campaigns. Admin will remove these seed campaigns at the end of Beta Test stage on Aug 15, 2026.",
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
      if (data.error) { toast.error(data.error); return }
      toast.success("Deal taken!", { description: "Your tracking link is ready in your dashboard." })
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
    <div className="border-r border-b border-border bg-card p-6 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {isTakeOne ? (
            <Badge variant="secondary" className="text-[10px]"><Store className="h-2.5 w-2.5 mr-1" /> In-store</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]"><Link2 className="h-2.5 w-2.5 mr-1" /> Digital</Badge>
          )}
          {program.category && <Badge variant="outline" className="text-[10px]">{program.category}</Badge>}
          {program.isSeeded && <Badge variant="outline" className="text-[10px] text-muted-foreground">Beta sample</Badge>}
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
          <span className={cn("h-1.5 w-1.5", program.vendor.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40")} />
          {program.vendor.isOnline ? "online" : "offline"}
        </span>
      </div>

      <h3 className="font-headline text-xl leading-tight mb-2">{program.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1">{program.description}</p>

      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Payout</p>
          <p className="font-headline text-2xl tabular flex items-center gap-1.5">
            <RewardIcon className="h-4 w-4 text-muted-foreground" />
            {rewardLabel}
          </p>
        </div>
        {program.city && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">City</p>
            <p className="text-sm flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" />{program.city}</p>
          </div>
        )}
      </div>

      {program.maxUses != null && (
        <p className="text-[11px] text-muted-foreground mb-3">Limit: {program.maxUses} redemptions</p>
      )}

      <div className="flex gap-0">
        <Button className="flex-1 h-11" onClick={handleTake} disabled={taking}>
          {taking ? "Taking…" : "Take deal"}
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 border-l-0" onClick={() => setShowQr((s) => !s)} aria-label="Show QR">
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      {showQr && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-2">
          <div className="border border-border p-2 bg-white">
            <QrCodeSvg value={shareUrl} size={140} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Scan to open offer page</p>
          <div className="flex gap-0 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-l-0"
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
