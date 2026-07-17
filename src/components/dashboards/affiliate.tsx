"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  LayoutDashboard, Search, Link2, Wallet, MessageSquare,
  Plus, Copy, Check, Download, QrCode, MapPin, Store, TrendingUp,
  Banknote, ArrowDownToLine, Trash2, Circle,
} from "lucide-react"
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboards/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CityCombobox } from "@/components/shared/city-combobox"
import { QrCodeSvg, exportQrPdf } from "@/components/shared/qr-code"
import { ChatWidget } from "@/components/chat/chat-widget"
import { useAuth } from "@/components/auth-provider"
import { cn, absoluteUrl } from "@/lib/utils"

type Tab = "overview" | "browse" | "links" | "earnings" | "wallet" | "chat"

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

interface Link {
  id: string
  uniqueSlug: string
  campaignId: string
  trackUrl: string
  campaign: {
    id: string
    title: string
    rewardAmount: number
    rewardType: string
    type: string
    city: string | null
    vendor: { name: string | null; isOnline: boolean }
  }
}

interface Stats {
  totalLinks: number
  totalClicks: number
  totalEmails: number
  totalWalkIns: number
  totalConversions: number
  totalOwed: number
  totalPaid: number
}

export function AffiliateDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = React.useState<Tab>("overview")
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [links, setLinks] = React.useState<Link[]>([])

  const loadData = React.useCallback(async () => {
    const [statsRes, linksRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/links"),
    ])
    const statsData = await statsRes.json()
    const linksData = await linksRes.json()
    setStats(statsData.stats)
    setLinks(linksData.links || [])
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const nav = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "browse", label: "Browse programs", icon: <Search className="h-4 w-4" /> },
    { id: "links", label: "My links", icon: <Link2 className="h-4 w-4" /> },
    { id: "earnings", label: "Earnings", icon: <Banknote className="h-4 w-4" /> },
    { id: "wallet", label: "Payout wallet", icon: <Wallet className="h-4 w-4" /> },
    { id: "chat", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  ]

  return (
    <DashboardShell
      title="Affiliate dashboard"
      subtitle={`Welcome back, ${user?.name || user?.email}`}
      nav={nav}
      active={tab}
      onNav={(id) => setTab(id as Tab)}
    >
      {tab === "overview" && (
        <OverviewTab stats={stats} links={links} onBrowse={() => setTab("browse")} />
      )}
      {tab === "browse" && <BrowseTab onTaken={loadData} />}
      {tab === "links" && <LinksTab links={links} onChange={loadData} />}
      {tab === "earnings" && <EarningsTab />}
      {tab === "wallet" && <WalletTab />}
      {tab === "chat" && (
        <div>
          <h2 className="font-headline text-xl mb-3">Group chats with vendors</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Discuss offers, ask questions, and see when vendors are online.
          </p>
          <ChatWidget />
        </div>
      )}
    </DashboardShell>
  )
}

function OverviewTab({
  stats, links, onBrowse,
}: {
  stats: Stats | null
  links: Link[]
  onBrowse: () => void
}) {
  if (!stats) return <div className="text-sm text-muted-foreground">Loading…</div>
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active links" value={stats.totalLinks} icon={<Link2 className="h-4 w-4" />} />
        <StatCard label="Verified clicks" value={stats.totalClicks} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Est. earnings" value={`₱${stats.totalOwed.toFixed(2)}`} hint="Pending payout" icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Total paid" value={`₱${stats.totalPaid.toFixed(2)}`} hint="Received" icon={<ArrowDownToLine className="h-4 w-4" />} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-xl">Your top links</h2>
          <Button variant="outline" size="sm" onClick={onBrowse}>Browse more</Button>
        </div>
        {links.length === 0 ? (
          <EmptyState
            title="No links yet"
            description="Browse programs and take a deal to get your first tracking link."
            action={<Button onClick={onBrowse}>Browse programs</Button>}
          />
        ) : (
          <div className="space-y-2">
            {links.slice(0, 5).map((l) => (
              <div key={l.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{l.campaign.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.campaign.type === "take_one" ? "In-store" : "Digital"} · ₱{l.campaign.rewardAmount.toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{l.campaign.vendor.name || "Vendor"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BrowseTab({ onTaken }: { onTaken: () => void }) {
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [loading, setLoading] = React.useState(true)
  const [city, setCity] = React.useState("")
  const [q, setQ] = React.useState("")
  const [type, setType] = React.useState("")

  const fetchPrograms = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (city) params.set("city", city)
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
  }, [city, q, type])

  React.useEffect(() => {
    const t = setTimeout(fetchPrograms, 250)
    return () => clearTimeout(t)
  }, [fetchPrograms])

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <CityCombobox value={city} onChange={setCity} placeholder="All cities" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
        >
          <option value="">All types</option>
          <option value="digital">Digital</option>
          <option value="take_one">In-store</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
            ))
          : programs.map((p) => (
              <AffiliateProgramCard key={p.id} program={p} onTaken={onTaken} />
            ))}
      </div>
      {!loading && programs.length === 0 && (
        <EmptyState title="No programs found" description="Try adjusting your filters." />
      )}
    </div>
  )
}

function AffiliateProgramCard({ program, onTaken }: { program: Program; onTaken: () => void }) {
  const [taking, setTaking] = React.useState(false)
  const isTakeOne = program.type === "take_one"
  const rewardLabel =
    program.rewardType === "click"
      ? `₱${program.rewardAmount.toFixed(2)} / click`
      : program.rewardType === "email"
      ? `₱${program.rewardAmount.toFixed(2)} / email`
      : `₱${program.rewardAmount.toFixed(2)} / walk-in`

  const take = async () => {
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
      toast.success("Deal taken!", { description: "Your tracking link is ready." })
      onTaken()
    } catch {
      toast.error("Failed to take deal.")
    } finally {
      setTaking(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
      <div className="flex items-center gap-1.5 mb-3">
        {isTakeOne ? (
          <Badge variant="secondary" className="text-[10px]"><Store className="h-2.5 w-2.5 mr-1" /> In-store</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]"><Link2 className="h-2.5 w-2.5 mr-1" /> Digital</Badge>
        )}
        {program.category && <Badge variant="outline" className="text-[10px]">{program.category}</Badge>}
        {program.isSeeded && <Badge variant="outline" className="text-[10px] text-muted-foreground">Beta sample</Badge>}
      </div>
      <h3 className="font-headline text-lg mb-1">{program.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{program.description}</p>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Payout</p>
          <p className="font-headline text-lg tabular">{rewardLabel}</p>
        </div>
        {program.city && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">City</p>
            <p className="text-xs flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" />{program.city}</p>
          </div>
        )}
      </div>
      <Button className="w-full h-10" onClick={take} disabled={taking}>
        {taking ? "Taking…" : "Take deal"}
      </Button>
    </div>
  )
}

function LinksTab({ links, onChange }: { links: Link[]; onChange: () => void }) {
  const [showQr, setShowQr] = React.useState<Record<string, boolean>>({})
  const [copied, setCopied] = React.useState<string | null>(null)

  const copy = (id: string, url: string) => {
    navigator.clipboard?.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const exportAll = () => {
    exportQrPdf(
      links.map((l) => ({
        title: l.campaign.title,
        subtitle: l.campaign.vendor.name || undefined,
        url: absoluteUrl(l.trackUrl),
      }))
    )
  }

  if (links.length === 0) {
    return (
      <EmptyState
        title="No tracking links yet"
        description="Take deals from the Browse tab to generate your personalized tracking links."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{links.length} active links</p>
        <Button variant="outline" size="sm" onClick={exportAll}>
          <Download className="h-4 w-4 mr-2" /> Export all QR (PDF)
        </Button>
      </div>
      <div className="grid gap-3">
        {links.map((l) => (
          <div key={l.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-headline text-lg">{l.campaign.title}</h3>
                  {l.campaign.type === "take_one" ? (
                    <Badge variant="secondary" className="text-[10px]">In-store</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Digital</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {l.campaign.vendor.name || "Vendor"} · ₱{l.campaign.rewardAmount.toFixed(2)} / {l.campaign.rewardType.replace("_", "-")}
                  {l.campaign.city && ` · ${l.campaign.city}`}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                <Circle className={cn("h-1.5 w-1.5 fill-current", l.campaign.vendor.isOnline ? "text-emerald-500" : "text-muted-foreground/40")} />
                {l.campaign.vendor.isOnline ? "online" : "offline"}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 mb-3">
              <code className="text-xs flex-1 truncate text-muted-foreground">{absoluteUrl(l.trackUrl)}</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(l.id, absoluteUrl(l.trackUrl))}>
                {copied === l.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowQr((s) => ({ ...s, [l.id]: !s[l.id] }))}>
                <QrCode className="h-3.5 w-3.5 mr-1.5" /> {showQr[l.id] ? "Hide QR" : "Show QR"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportQrPdf([{ title: l.campaign.title, subtitle: l.campaign.vendor.name || undefined, url: absoluteUrl(l.trackUrl) }])}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
              </Button>
              <a href={l.trackUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">Open link</Button>
              </a>
            </div>

            {showQr[l.id] && (
              <div className="mt-3 flex flex-col items-center gap-2 pt-3 border-t border-border">
                <div className="rounded-lg border border-border p-2 bg-white">
                  <QrCodeSvg value={absoluteUrl(l.trackUrl)} size={180} />
                </div>
                <p className="text-[10px] text-muted-foreground">High-res printable QR — scan to open offer</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EarningsTab() {
  const [data, setData] = React.useState<any>(null)
  React.useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setData)
  }, [])
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>
  const stats = data.stats
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total clicks" value={stats.totalClicks} />
        <StatCard label="Emails captured" value={stats.totalEmails} />
        <StatCard label="Walk-ins" value={stats.totalWalkIns} />
        <StatCard label="Total conversions" value={stats.totalConversions} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <StatCard label="Pending payout" value={`₱${stats.totalOwed.toFixed(2)}`} hint="Awaiting vendor payment" />
        <StatCard label="Total received" value={`₱${stats.totalPaid.toFixed(2)}`} hint="Lifetime payouts" />
      </div>

      <div>
        <h2 className="font-headline text-xl mb-3">Per-campaign breakdown</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-normal">Campaign</th>
                <th className="text-left px-4 py-2 font-normal hidden sm:table-cell">Type</th>
                <th className="text-right px-4 py-2 font-normal">Conversions</th>
                <th className="text-right px-4 py-2 font-normal">Reward</th>
              </tr>
            </thead>
            <tbody>
              {data.links?.map((l: any) => {
                const convs = (data.conversions || []).filter((c: any) => c.campaignId === l.campaignId)
                return (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3">{l.campaign.title}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{l.campaign.type === "take_one" ? "In-store" : "Digital"}</td>
                    <td className="px-4 py-3 text-right tabular">{convs.length}</td>
                    <td className="px-4 py-3 text-right tabular">₱{(convs.length * l.campaign.rewardAmount).toFixed(2)}</td>
                  </tr>
                )
              })}
              {(!data.links || data.links.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface WalletEntry { name: string; value: string }
function WalletTab() {
  const [entries, setEntries] = React.useState<WalletEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/wallet")
      const data = await res.json()
      setEntries(data.wallet?.entries || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await fetch("/api/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      })
      toast.success("Payout info saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const presets = ["GCash", "Maya", "BDO", "BPI", "Metrobank", "Bank transfer", "PayPal"]

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-headline text-xl mb-1">Payout wallet</h2>
        <p className="text-sm text-muted-foreground">
          Add your GCash, bank, or any custom payout details. Vendors will see this when paying you.
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-start">
            <input
              value={e.name}
              onChange={(ev) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))}
              placeholder="e.g. GCash"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            />
            <input
              value={e.value}
              onChange={(ev) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, value: ev.target.value } : x)))}
              placeholder="Account number / details"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            />
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setEntries((arr) => arr.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p}
            variant="outline"
            size="sm"
            onClick={() => setEntries((arr) => [...arr, { name: p, value: "" }])}
          >
            <Plus className="h-3 w-3 mr-1" /> {p}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setEntries((arr) => [...arr, { name: "", value: "" }])}>
          <Plus className="h-3 w-3 mr-1" /> Custom
        </Button>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save payout info"}
      </Button>
    </div>
  )
}
