"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  LayoutDashboard, Megaphone, Users, MessageSquare, Plus, X,
  Copy, Check, Download, QrCode, Mail, TrendingUp, Banknote,
  ArrowDownToLine, Trash2, Wallet, Circle, ExternalLink,
} from "lucide-react"
import { DashboardShell, StatCard, EmptyState } from "@/components/dashboards/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CityCombobox } from "@/components/shared/city-combobox"
import { QrCodeSvg, exportQrPdf } from "@/components/shared/qr-code"
import { ChatWidget } from "@/components/chat/chat-widget"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

type Tab = "overview" | "campaigns" | "leads" | "payouts" | "chat"

export function VendorDigitalDashboard() {
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

  React.useEffect(() => {
    load()
  }, [load])

  const nav = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "campaigns", label: "Campaigns", icon: <Megaphone className="h-4 w-4" /> },
    { id: "leads", label: "Leads", icon: <Mail className="h-4 w-4" /> },
    { id: "payouts", label: "Payouts & affiliates", icon: <Users className="h-4 w-4" /> },
    { id: "chat", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  ]

  return (
    <DashboardShell
      title="App builder dashboard"
      subtitle={`Welcome, ${user?.name || user?.email}`}
      nav={nav}
      active={tab}
      onNav={(id) => setTab(id as Tab)}
      actions={
        <Button className="w-full" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New campaign
        </Button>
      }
    >
      {tab === "overview" && <Overview stats={stats} campaigns={campaigns} onCreate={() => setShowCreate(true)} />}
      {tab === "campaigns" && (
        <CampaignsTab
          campaigns={campaigns}
          onOpen={(c) => setActiveCampaign(c)}
          onRefresh={load}
        />
      )}
      {tab === "leads" && <LeadsTab />}
      {tab === "payouts" && <PayoutsTab />}
      {tab === "chat" && (
        <div>
          <h2 className="font-headline text-xl mb-3">Group chats with affiliates</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Answer questions from affiliates promoting your campaigns.
          </p>
          <ChatWidget />
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
          type="digital"
        />
      )}
      {activeCampaign && (
        <CampaignDetailModal
          campaignId={activeCampaign.id}
          onClose={() => setActiveCampaign(null)}
          onChanged={load}
        />
      )}
    </DashboardShell>
  )
}

function Overview({ stats, campaigns, onCreate }: any) {
  if (!stats) return <div className="text-sm text-muted-foreground">Loading…</div>
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Campaigns" value={stats.totalCampaigns} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="Verified clicks" value={stats.totalClicks} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Est. owed" value={`₱${stats.totalOwed.toFixed(2)}`} hint="To affiliates" icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Total paid" value={`₱${stats.totalPaid.toFixed(2)}`} hint="To affiliates" icon={<ArrowDownToLine className="h-4 w-4" />} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-xl">Recent campaigns</h2>
          <Button variant="outline" size="sm" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> New</Button>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Create your first campaign to start acquiring users." action={<Button onClick={onCreate}>Create campaign</Button>} />
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c: any) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">₱{c.rewardAmount.toFixed(2)} / {c.rewardType} · {c._count?.conversions || 0} conversions</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{c.rewardType}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignsTab({ campaigns, onOpen, onRefresh }: any) {
  const [copied, setCopied] = React.useState<string | null>(null)
  if (campaigns.length === 0) {
    return <EmptyState title="No campaigns yet" description="Create your first campaign to generate tracking links." />
  }
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  return (
    <div className="space-y-3">
      {campaigns.map((c: any) => {
        const url = `${baseUrl}/c/${c.id}`
        return (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-headline text-lg">{c.title}</h3>
                  <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">{c.isActive ? "Active" : "Paused"}</Badge>
                  <Badge variant="outline" className="text-[10px]">{c.rewardType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
              </div>
              <p className="font-headline text-lg shrink-0">₱{c.rewardAmount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 mb-3">
              <code className="text-xs flex-1 truncate text-muted-foreground">{url}?aff=[affiliate]</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { navigator.clipboard?.writeText(`${url}?aff=[affiliate]`); setCopied(c.id); setTimeout(() => setCopied(null), 1500) }}>
                {copied === c.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onOpen(c)}>View details</Button>
              <Button variant="outline" size="sm" onClick={() => exportQrPdf([{ title: c.title, url }])}>
                <Download className="h-3.5 w-3.5 mr-1" /> QR PDF
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CreateCampaignModal({ onClose, onCreated, type }: { onClose: () => void; onCreated: () => void; type: "digital" | "take_one" }) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [targetUrl, setTargetUrl] = React.useState("")
  const [rewardType, setRewardType] = React.useState(type === "take_one" ? "walk_in" : "click")
  const [rewardAmount, setRewardAmount] = React.useState("")
  const [maxUses, setMaxUses] = React.useState("")
  const [city, setCity] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [takeOneCount, setTakeOneCount] = React.useState("10")
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    if (!title || !description || !rewardAmount) {
      toast.error("Fill in all required fields")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, type,
          targetUrl: type === "digital" ? targetUrl : null,
          rewardType: type === "take_one" ? "walk_in" : rewardType,
          rewardAmount: Number(rewardAmount),
          maxUses: maxUses ? Number(maxUses) : null,
          city: city || null,
          category: category || null,
          takeOneCount: type === "take_one" ? Number(takeOneCount) : null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      toast.success(type === "take_one" ? "Take One campaign created with TRIM codes" : "Campaign created")
      onCreated()
    } catch {
      toast.error("Failed to create campaign")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl">{type === "take_one" ? "New Take One campaign" : "New campaign"}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-3">
          <Field label="Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="inp" placeholder="e.g. Free 14-day trial" />
          </Field>
          <Field label="Description *">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="inp min-h-[70px]" placeholder="What's the offer?" />
          </Field>
          {type === "digital" && (
            <Field label="Destination URL">
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="inp" placeholder="https://yourapp.com/signup" />
            </Field>
          )}
          {type === "digital" && (
            <Field label="Reward type">
              <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} className="inp">
                <option value="click">Per verified click</option>
                <option value="email">Per email captured</option>
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reward amount (₱) *">
              <input type="number" step="0.01" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} className="inp" placeholder="0.50" />
            </Field>
            <Field label="Max redemptions">
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="inp" placeholder="Unlimited" />
            </Field>
          </div>
          {type === "take_one" && (
            <Field label="Number of TRIM codes to generate">
              <input type="number" value={takeOneCount} onChange={(e) => setTakeOneCount(e.target.value)} className="inp" min="1" max="500" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="City (optional)">
              <CityCombobox value={city} onChange={setCity} placeholder="Any city" />
            </Field>
            <Field label="Category (optional)">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="inp" placeholder="SaaS, Food, etc." />
            </Field>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
        </div>
        <style>{`.inp{width:100%;height:2.5rem;border-radius:0.5rem;border:1px solid var(--border);background:var(--background);padding:0 0.75rem;font-size:0.875rem;outline:none}.inp:focus{border-color:var(--foreground)}.inp[min-height]{height:auto;padding:0.5rem 0.75rem}`}</style>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function CampaignDetailModal({ campaignId, onClose, onChanged }: { campaignId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = React.useState<any>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [selectedConv, setSelectedConv] = React.useState<string[]>([])
  const [paying, setPaying] = React.useState(false)

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    const d = await res.json()
    setData(d.campaign)
  }, [campaignId])

  React.useEffect(() => {
    load()
  }, [load])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const toggleConv = (id: string) => {
    setSelectedConv((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }

  const markPaid = async (affiliateId: string) => {
    const convs = (data.conversions || []).filter((c: any) => c.status === "verified" && c.affiliateId === affiliateId && selectedConv.includes(c.id))
    if (convs.length === 0) {
      toast.error("Select verified conversions to mark as paid")
      return
    }
    const amount = convs.length * data.rewardAmount
    setPaying(true)
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId,
          campaignId: data.id,
          conversionIds: convs.map((c: any) => c.id),
          amount,
        }),
      })
      const json = await res.json()
      if (json.error) { toast.error(json.error); return }
      toast.success(`Marked ₱${amount.toFixed(2)} as paid`)
      setSelectedConv([])
      load()
      onChanged()
    } catch {
      toast.error("Failed to log payout")
    } finally {
      setPaying(false)
    }
  }

  if (!data) return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-8" onClick={(e) => e.stopPropagation()}>Loading…</div>
    </div>
  )

  const verifiedConvs = (data.conversions || []).filter((c: any) => c.status === "verified")
  const paidConvs = (data.conversions || []).filter((c: any) => c.status === "paid")
  const emails = (data.conversions || []).filter((c: any) => c.capturedEmail)

  // group conversions by affiliate
  const byAffiliate = new Map<string, any>()
  for (const c of data.conversions || []) {
    if (!c.affiliateId) continue
    if (!byAffiliate.has(c.affiliateId)) byAffiliate.set(c.affiliateId, { affiliate: c.affiliate, convs: [] })
    byAffiliate.get(c.affiliateId).convs.push(c)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl">{data.title}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>

        {/* Shareable link + QR */}
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Shareable tracking link</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <code className="text-xs flex-1 truncate text-muted-foreground">{baseUrl}/c/{data.id}?aff=[affiliate]</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { navigator.clipboard?.writeText(`${baseUrl}/c/${data.id}?aff=[affiliate]`); setCopied("link"); setTimeout(() => setCopied(null), 1500) }}>
                {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-border p-1.5 bg-white"><QrCodeSvg value={`${baseUrl}/c/${data.id}`} size={90} /></div>
          </div>
        </div>

        {/* Funnel stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Clicks</p>
            <p className="font-headline text-2xl tabular">{(data.conversions || []).filter((c: any) => !c.capturedEmail).length}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Emails</p>
            <p className="font-headline text-2xl tabular">{emails.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Conv. rate</p>
            <p className="font-headline text-2xl tabular">{(data.conversions || []).length > 0 ? Math.round((emails.length / (data.conversions || []).length) * 100) : 0}%</p>
          </div>
        </div>

        {data.maxUses != null && (
          <p className="text-xs text-muted-foreground mb-3">Max redemptions: {data.maxUses} · Used: {(data.conversions || []).length}</p>
        )}

        {/* Affiliate payouts */}
        <h3 className="font-headline text-lg mb-2">Affiliates & payouts</h3>
        {byAffiliate.size === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">No affiliates have driven conversions yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {Array.from(byAffiliate.values()).map(({ affiliate, convs }: any) => {
              const verified = convs.filter((c: any) => c.status === "verified")
              const paid = convs.filter((c: any) => c.status === "paid")
              return (
                <div key={affiliate?.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm">{affiliate?.name || affiliate?.email}</p>
                      <p className="text-xs text-muted-foreground">{verified.length} verified · {paid.length} paid · {affiliate?.city || "no city"}</p>
                    </div>
                    <AffiliateWalletButton affiliateId={affiliate?.id} />
                  </div>
                  {verified.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {verified.map((c: any) => (
                        <label key={c.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-accent/40 cursor-pointer">
                          <input type="checkbox" checked={selectedConv.includes(c.id)} onChange={() => toggleConv(c.id)} />
                          <span className="flex-1">{c.capturedEmail || c.offlineCode || "click"}</span>
                          <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                          <span>₱{data.rewardAmount.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <Button size="sm" disabled={selectedConv.filter((id) => verified.some((c: any) => c.id === id)).length === 0 || paying} onClick={() => markPaid(affiliate?.id)}>
                    Mark {selectedConv.filter((id) => verified.some((c: any) => c.id === id)).length} as paid (₱{(selectedConv.filter((id) => verified.some((c: any) => c.id === id)).length * data.rewardAmount).toFixed(2)})
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportQrPdf([{ title: data.title, url: `${baseUrl}/c/${data.id}` }])}>
            <Download className="h-3.5 w-3.5 mr-1" /> QR PDF
          </Button>
        </div>
      </div>
    </div>
  )
}

function AffiliateWalletButton({ affiliateId }: { affiliateId: string }) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<any>(null)
  React.useEffect(() => {
    if (open && affiliateId) {
      fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: affiliateId }),
      }).then((r) => r.json()).then(setData)
    }
  }, [open, affiliateId])
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Wallet className="h-3.5 w-3.5 mr-1" /> Payout info
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline text-lg mb-1">Payout details</h3>
            <p className="text-xs text-muted-foreground mb-4">{data?.affiliate?.name || data?.affiliate?.email}</p>
            {data?.wallet?.entries?.length ? (
              <div className="space-y-2">
                {data.wallet.entries.map((e: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border p-2.5">
                    <p className="text-xs text-muted-foreground">{e.name}</p>
                    <p className="text-sm tabular break-all">{e.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payout info provided yet.</p>
            )}
            <Button className="w-full mt-4" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  )
}

function LeadsTab() {
  const [data, setData] = React.useState<any>(null)
  React.useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setData) }, [])
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>
  const leads = data.leads || []
  const csv = [
    "email,campaign_id,date",
    ...leads.map((l: any) => `${l.capturedEmail},${l.campaignId},${new Date(l.createdAt).toISOString()}`),
  ].join("\n")
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-xl">Captured leads</h2>
          <p className="text-sm text-muted-foreground">{leads.length} emails captured across all campaigns</p>
        </div>
        {leads.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => {
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "trimph-leads.csv"
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        )}
      </div>
      {leads.length === 0 ? (
        <EmptyState title="No leads yet" description="Email leads from your campaigns will appear here." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr><th className="text-left px-4 py-2 font-normal">Email</th><th className="text-left px-4 py-2 font-normal hidden sm:table-cell">Campaign</th><th className="text-right px-4 py-2 font-normal">Date</th></tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.capturedEmail + l.campaignId} className="border-t border-border">
                  <td className="px-4 py-2.5">{l.capturedEmail}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{data.campaigns?.find((c: any) => c.id === l.campaignId)?.title || "—"}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PayoutsTab() {
  const [payouts, setPayouts] = React.useState<any[]>([])
  React.useEffect(() => { fetch("/api/payouts").then((r) => r.json()).then((d) => setPayouts(d.payouts || [])) }, [])
  const total = payouts.reduce((a, b) => a + b.amount, 0)
  return (
    <div className="space-y-4">
      <StatCard label="Total paid out" value={`₱${total.toFixed(2)}`} hint={`${payouts.length} payouts`} />
      {payouts.length === 0 ? (
        <EmptyState title="No payouts logged" description="Mark affiliate conversions as paid from a campaign's detail view." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr><th className="text-left px-4 py-2 font-normal">Affiliate</th><th className="text-right px-4 py-2 font-normal">Amount</th><th className="text-right px-4 py-2 font-normal hidden sm:table-cell">Date</th></tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2.5">{p.affiliate.name || p.affiliate.email}</td>
                  <td className="px-4 py-2.5 text-right tabular">₱{p.amount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
