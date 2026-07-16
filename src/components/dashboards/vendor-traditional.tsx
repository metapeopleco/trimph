"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  LayoutDashboard, Store, ScanLine, MessageSquare, Plus, X,
  Download, QrCode, Banknote, ArrowDownToLine, Trash2,
  CheckCircle2, AlertCircle, Search,
} from "lucide-react"
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboards/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CityCombobox } from "@/components/shared/city-combobox"
import { QrCodeSvg, exportQrPdf } from "@/components/shared/qr-code"
import { ChatWidget } from "@/components/chat/chat-widget"
import { useAuth } from "@/components/auth-provider"

type Tab = "overview" | "campaigns" | "verify" | "chat"

export function VendorTraditionalDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = React.useState<Tab>("overview")
  const [stats, setStats] = React.useState<any>(null)
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  const [showCreate, setShowCreate] = React.useState(false)
  const [activeCampaign, setActiveCampaign] = React.useState<any>(null)

  const load = React.useCallback(async () => {
    const [s, c] = await Promise.all([fetch("/api/stats"), fetch("/api/campaigns")])
    setStats((await s.json()).stats)
    setCampaigns((await c.json()).campaigns || [])
  }, [])

  React.useEffect(() => { load() }, [load])

  const nav = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "campaigns", label: "Take One", icon: <Store className="h-4 w-4" /> },
    { id: "verify", label: "Verify & redeem", icon: <ScanLine className="h-4 w-4" /> },
    { id: "chat", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  ]

  return (
    <DashboardShell
      title="Local business dashboard"
      subtitle={`Welcome, ${user?.name || user?.email}`}
      nav={nav}
      active={tab}
      onNav={(id) => setTab(id as Tab)}
      actions={
        <Button className="w-full" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Take One
        </Button>
      }
    >
      {tab === "overview" && <Overview stats={stats} campaigns={campaigns} onCreate={() => setShowCreate(true)} />}
      {tab === "campaigns" && (
        <CampaignsTab campaigns={campaigns} onOpen={(c) => setActiveCampaign(c)} onRefresh={load} />
      )}
      {tab === "verify" && <VerifyTab />}
      {tab === "chat" && (
        <div>
          <h2 className="font-headline text-xl mb-3">Group chats with affiliates</h2>
          <p className="text-sm text-muted-foreground mb-4">Coordinate with affiliates promoting your store.</p>
          <ChatWidget />
        </div>
      )}

      {showCreate && (
        <CreateTakeOneModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
      )}
      {activeCampaign && (
        <TakeOneDetailModal campaignId={activeCampaign.id} onClose={() => setActiveCampaign(null)} onChanged={load} />
      )}
    </DashboardShell>
  )
}

function Overview({ stats, campaigns, onCreate }: any) {
  if (!stats) return <div className="text-sm text-muted-foreground">Loading…</div>
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Take One campaigns" value={stats.totalCampaigns} icon={<Store className="h-4 w-4" />} />
        <StatCard label="Walk-ins redeemed" value={stats.totalWalkIns} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Est. owed" value={`₱${stats.totalOwed.toFixed(2)}`} hint="To affiliates" icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Total paid" value={`₱${stats.totalPaid.toFixed(2)}`} hint="To affiliates" icon={<ArrowDownToLine className="h-4 w-4" />} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-xl">Recent Take One campaigns</h2>
          <Button variant="outline" size="sm" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> New</Button>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState title="No Take One campaigns yet" description="Create your first offline offer to drive foot traffic." action={<Button onClick={onCreate}>Create Take One</Button>} />
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c: any) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">₱{c.rewardAmount.toFixed(2)} / walk-in · {c._count?.takeOneCodes || 0} codes</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.city || "Any"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignsTab({ campaigns, onOpen, onRefresh }: any) {
  if (campaigns.length === 0) {
    return <EmptyState title="No Take One campaigns" description="Create your first offline offer with TRIM codes." />
  }
  return (
    <div className="space-y-3">
      {campaigns.map((c: any) => (
        <div key={c.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline text-lg">{c.title}</h3>
                <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">{c.isActive ? "Active" : "Paused"}</Badge>
                {c.city && <Badge variant="outline" className="text-[10px]">{c.city}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
            </div>
            <p className="font-headline text-lg shrink-0">₱{c.rewardAmount.toFixed(2)}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {c._count?.takeOneCodes || 0} codes · {c._count?.conversions || 0} redeemed{c.maxUses ? ` · max ${c.maxUses}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onOpen(c)}>View codes</Button>
            <Button variant="outline" size="sm" onClick={async () => {
              if (!confirm("Delete this campaign?")) return
              await fetch(`/api/campaigns/${c.id}`, { method: "DELETE" })
              toast.success("Campaign deleted")
              onRefresh()
            }}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CreateTakeOneModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [rewardAmount, setRewardAmount] = React.useState("")
  const [maxUses, setMaxUses] = React.useState("")
  const [city, setCity] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [codeCount, setCodeCount] = React.useState("20")
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!title || !description || !rewardAmount) { toast.error("Fill in all required fields"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, type: "take_one",
          rewardType: "walk_in",
          rewardAmount: Number(rewardAmount),
          maxUses: maxUses ? Number(maxUses) : null,
          city: city || null, category: category || null,
          takeOneCount: Number(codeCount),
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success(`Created with ${codeCount} TRIM codes`)
      onCreated()
    } catch { toast.error("Failed to create") } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl">New Take One campaign</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Offer title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" placeholder="e.g. 10% off Latte & Free Pastry" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-[70px] rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-foreground" placeholder="What's the in-store offer?" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Reward per walk-in (₱) *</label>
              <input type="number" step="0.01" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" placeholder="25.00" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Max redemptions</label>
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" placeholder="Unlimited" /></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Number of TRIM codes *</label>
            <input type="number" min="1" max="500" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
            <p className="text-[10px] text-muted-foreground mt-1">Each code starts with <code>TRIM-</code> (e.g. TRIM-CAFE-XYZ7)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">City</label>
              <CityCombobox value={city} onChange={setCity} placeholder="Any city" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" placeholder="Food, Retail…" /></div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create campaign"}</Button>
        </div>
      </div>
    </div>
  )
}

function TakeOneDetailModal({ campaignId, onClose, onChanged }: { campaignId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = React.useState<any>(null)
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    setData((await res.json()).campaign)
  }, [campaignId])
  React.useEffect(() => { load() }, [load])

  if (!data) return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-8" onClick={(e) => e.stopPropagation()}>Loading…</div>
    </div>
  )

  const codes = data.takeOneCodes || []
  const filtered = search ? codes.filter((c: any) => c.code.toLowerCase().includes(search.toLowerCase())) : codes
  const redeemed = codes.filter((c: any) => c.isRedeemed)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl">{data.title}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Total codes</p><p className="font-headline text-2xl tabular">{codes.length}</p></div>
          <div className="rounded-lg border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Redeemed</p><p className="font-headline text-2xl tabular">{redeemed.length}</p></div>
          <div className="rounded-lg border border-border p-3 text-center"><p className="text-xs text-muted-foreground">Remaining</p><p className="font-headline text-2xl tabular">{codes.length - redeemed.length}</p></div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => exportQrPdf(codes.map((c: any) => ({ title: data.title, subtitle: c.code, code: c.code, url: `${baseUrl}/c/${data.id}` })))}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export all QR (PDF)
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search codes…" className="w-full h-10 rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-foreground" />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto scrollbar-thin">
          {filtered.map((c: any) => (
            <div key={c.id} className={`rounded-lg border p-2.5 flex items-center justify-between ${c.isRedeemed ? "border-border bg-secondary/40 opacity-60" : "border-border"}`}>
              <div>
                <p className="text-sm tabular font-medium">{c.code}</p>
                {c.isRedeemed && c.redeemedAt && <p className="text-[10px] text-muted-foreground">Redeemed {new Date(c.redeemedAt).toLocaleDateString()}</p>}
              </div>
              {c.isRedeemed ? <Badge variant="secondary" className="text-[10px]">Used</Badge> : <Badge className="text-[10px]">Available</Badge>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VerifyTab() {
  const [code, setCode] = React.useState("")
  const [result, setResult] = React.useState<any>(null)
  const [verifying, setVerifying] = React.useState(false)

  const verify = async () => {
    if (!code.trim()) return
    setVerifying(true)
    setResult(null)
    try {
      const res = await fetch("/api/verify/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      setResult(data)
      if (data.ok) {
        toast.success(`Redeemed! ₱${data.reward.toFixed(2)} credited to affiliate`)
        setCode("")
      } else if (data.alreadyRedeemed) {
        toast.error("Code already redeemed")
      } else if (data.exhausted) {
        toast.error("Campaign max redemptions reached")
      }
    } catch {
      toast.error("Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-headline text-xl mb-1">Verify & redeem</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enter the customer's TRIM code to verify and redeem it at the counter.
      </p>
      <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
        <ScanLine className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          placeholder="TRIM-XXXXXX"
          className="w-full max-w-xs mx-auto h-16 rounded-xl border-2 border-border bg-background px-4 text-center font-headline text-2xl tracking-widest tabular outline-none focus:border-foreground uppercase"
          autoFocus
        />
        <Button className="mt-5 h-12 px-10 text-base" onClick={verify} disabled={verifying || !code.trim()}>
          {verifying ? "Verifying…" : "Verify & redeem"}
        </Button>
      </div>

      {result && (
        <div className={`mt-4 rounded-xl border p-4 ${result.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
          {result.ok ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">Code verified & redeemed successfully</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Campaign: {result.campaign.title} · ₱{result.reward.toFixed(2)} credited to affiliate
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm">{result.error || "Invalid code"}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        <p>All codes start with <code className="px-1 py-0.5 rounded bg-secondary">TRIM</code>. Codes are single-use only.</p>
      </div>
    </div>
  )
}
