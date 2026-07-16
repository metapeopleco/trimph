"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { CheckCircle2, ShieldCheck, ArrowRight, Copy, Check } from "lucide-react"
import { LogoMark } from "@/components/shared/logo"
import { QrCodeSvg } from "@/components/shared/qr-code"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"

interface CampaignData {
  campaign: {
    id: string
    title: string
    description: string
    type: string
    targetUrl: string | null
    rewardType: string
    rewardAmount: number
    maxUses: number | null
    isSeeded: boolean
    vendor: { name: string | null }
  }
  affiliateId: string | null
  slug: string | null
  takeOneCode: string | null
}

export default function TrackingPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = React.use(params)
  const { theme } = useTheme()
  const [data, setData] = React.useState<CampaignData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<"verify" | "verified" | "redirect">("verify")
  const [email, setEmail] = React.useState("")
  const [showEmail, setShowEmail] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [conversionId, setConversionId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch(`/c/${campaignId}/data`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
          if (d.campaign.rewardType === "email") setShowEmail(true)
        }
      })
      .catch(() => setError("Failed to load campaign."))
      .finally(() => setLoading(false))
  }, [campaignId])

  // ---- Simple human-quiz: "Click the circle" ----
  const quizOptions = React.useMemo(() => {
    const shapes = [
      { id: "square", label: "Square", emoji: "■" },
      { id: "circle", label: "Circle", emoji: "●" },
      { id: "triangle", label: "Triangle", emoji: "▲" },
    ]
    // shuffle
    return [...shapes].sort(() => Math.random() - 0.5)
  }, [campaignId])
  const [quizAnswer, setQuizAnswer] = React.useState<string | null>(null)

  const handleQuiz = async (id: string) => {
    if (quizAnswer) return
    setQuizAnswer(id)
    if (id !== "circle") {
      setTimeout(() => setQuizAnswer(null), 800)
      return
    }
    // correct — register the click
    try {
      const res = await fetch("/api/tracker/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: data!.campaign.id,
          affiliateId: data!.affiliateId,
          slug: data!.slug,
          verified: true,
        }),
      })
      const json = await res.json()
      if (json.conversionId) setConversionId(json.conversionId)
      if (json.exhausted) {
        setError("This campaign has reached its maximum redemptions.")
        return
      }
      setStep("verified")
    } catch {
      setError("Verification failed. Please try again.")
    }
  }

  const submitEmail = async () => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversionId,
          campaignId: data!.campaign.id,
          affiliateId: data!.affiliateId,
          email,
        }),
      })
      const json = await res.json()
      if (json.exhausted) {
        setError("This campaign has reached its maximum redemptions.")
        return
      }
      setStep("redirect")
      // redirect after short delay
      if (data!.campaign.targetUrl) {
        setTimeout(() => {
          window.location.href = data!.campaign.targetUrl!
        }, 1200)
      }
    } catch {
      setError("Failed to capture email.")
    }
  }

  const skipToRedirect = async () => {
    setStep("redirect")
    if (data!.campaign.targetUrl) {
      setTimeout(() => {
        window.location.href = data!.campaign.targetUrl!
      }, 800)
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = data ? `${baseUrl}/c/${data.campaign.id}?aff=${data.affiliateId || ""}&s=${data.slug || ""}` : ""

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <LogoMark size={40} />
        <h1 className="font-headline text-2xl">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm">{error}</p>
        <Link href="/">
          <Button variant="outline">Back to Trim.ph</Button>
        </Link>
      </div>
    )
  }

  if (!data) return null
  const { campaign } = data

  // Take One campaigns — show the code + QR
  if (campaign.type === "take_one") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Link href="/" className="inline-flex items-center gap-2">
            <LogoMark size={26} />
            <span className="font-headline text-lg">Trim<span className="text-muted-foreground">.ph</span></span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs mb-6">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified offer
            </div>
            <h1 className="font-headline text-3xl mb-2">{campaign.title}</h1>
            <p className="text-muted-foreground mb-8">{campaign.description}</p>

            {data.takeOneCode ? (
              <div className="rounded-xl border-2 border-dashed border-border p-8 mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your code</p>
                <p className="font-headline text-4xl tracking-wider tabular">{data.takeOneCode}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Show this code in-store to redeem. One-time use only.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border p-8 mb-6 text-muted-foreground">
                All codes for this offer have been claimed.
              </div>
            )}

            {data.takeOneCode && (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border border-border p-3 bg-white">
                  <QrCodeSvg value={shareUrl || data.takeOneCode} size={180} />
                </div>
                <p className="text-xs text-muted-foreground">Scan to save this code</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard?.writeText(data.takeOneCode!)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied" : "Copy code"}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-8">
              Earn ₱{campaign.rewardAmount.toFixed(2)} for your referrer when you redeem in-store.
            </p>
          </div>
        </main>
        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Trim.ph</Link> — Free forever affiliate ecosystem
        </footer>
      </div>
    )
  }

  // Digital campaigns — human quiz → optional email → redirect
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="inline-flex items-center gap-2">
          <LogoMark size={26} />
          <span className="font-headline text-lg">Trim<span className="text-muted-foreground">.ph</span></span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8 text-xs">
            <span className={`flex items-center gap-1 ${step === "verify" ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${step === "verify" ? "border-foreground" : "border-border"}`}>1</span>
              Verify
            </span>
            <span className="h-px w-8 bg-border" />
            <span className={`flex items-center gap-1 ${step === "verified" ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${step === "verified" ? "border-foreground" : "border-border"}`}>2</span>
              {showEmail ? "Email" : "Confirm"}
            </span>
            <span className="h-px w-8 bg-border" />
            <span className={`flex items-center gap-1 ${step === "redirect" ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${step === "redirect" ? "border-foreground" : "border-border"}`}>3</span>
              Go
            </span>
          </div>

          {step === "verify" && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs mb-6">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure Click verification
              </div>
              <h1 className="font-headline text-3xl mb-2">{campaign.title}</h1>
              <p className="text-muted-foreground mb-8">{campaign.description}</p>

              <div className="rounded-xl border border-border p-6 mb-6">
                <p className="text-sm mb-4">Select the <strong>circle</strong> to continue</p>
                <div className="flex items-center justify-center gap-6">
                  {quizOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleQuiz(opt.id)}
                      disabled={!!quizAnswer}
                      className={`h-16 w-16 rounded-lg border-2 flex items-center justify-center text-3xl transition-all hover:scale-105 disabled:opacity-50 ${
                        quizAnswer === opt.id
                          ? opt.id === "circle"
                            ? "border-foreground bg-foreground/5"
                            : "border-destructive bg-destructive/5"
                          : "border-border"
                      }`}
                      aria-label={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
                {quizAnswer && quizAnswer !== "circle" && (
                  <p className="text-xs text-destructive mt-3">Not quite — try again.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Powered by Trim.ph Secure Click — protecting creators from bot fraud.
              </p>
            </>
          )}

          {step === "verified" && (
            <>
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-foreground text-background mb-6">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="font-headline text-3xl mb-2">You're verified!</h1>
              <p className="text-muted-foreground mb-8">
                {showEmail
                  ? "Enter your email to unlock this offer and support your referrer."
                  : "Taking you to your destination…"}
              </p>

              {showEmail ? (
                <div className="space-y-3 text-left">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
                  />
                  <Button className="w-full" onClick={submitEmail} disabled={!email}>
                    Unlock & continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <button
                    onClick={skipToRedirect}
                    className="w-full text-xs text-muted-foreground hover:text-foreground pt-2"
                  >
                    Skip email — just take me there
                  </button>
                </div>
              ) : (
                <Button className="w-full" onClick={skipToRedirect}>
                  Continue to {campaign.vendor.name || "offer"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </>
          )}

          {step === "redirect" && (
            <>
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-foreground text-background mb-6">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="font-headline text-3xl mb-2">Redirecting…</h1>
              <p className="text-muted-foreground mb-6">
                Taking you to <span className="text-foreground">{campaign.vendor.name || "the offer"}</span>.
              </p>
              <div className="flex items-center justify-center">
                <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground animate-[grow_1.2s_ease-in-out_forwards]" />
                </div>
              </div>
              {!campaign.targetUrl && (
                <p className="text-xs text-muted-foreground mt-6">No destination URL set for this campaign.</p>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trim.ph</Link> — Free forever affiliate ecosystem
      </footer>

      <style>{`@keyframes grow { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  )
}
