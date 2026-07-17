import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser, requireRole } from "@/lib/session"

// GET — list campaigns for the logged-in vendor (or links for affiliate)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (user.role === "vendor_digital" || user.role === "vendor_traditional") {
    const campaigns = await db.campaign.findMany({
      where: { vendorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trackingLinks: true, conversions: true, takeOneCodes: true } },
      },
    })
    return NextResponse.json({ campaigns })
  }

  if (user.role === "affiliate") {
    const links = await db.trackingLink.findMany({
      where: { affiliateId: user.id },
      include: { campaign: { include: { vendor: { select: { name: true, email: true, isOnline: true } } } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ links })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// POST — create a campaign (vendor only)
export async function POST(req: Request) {
  const { user, error } = await requireRole(["vendor_digital", "vendor_traditional"])
  if (!user) return NextResponse.json({ error }, { status: 401 })

  try {
    const body = await req.json()
    const {
      title,
      description,
      type,
      targetUrl,
      rewardType,
      rewardAmount,
      maxUses,
      city,
      category,
      takeOneCount,
    } = body

    if (!title || !description || !type || !rewardType || rewardAmount == null) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    const isTakeOne = type === "take_one"
    const expectedRewardType = isTakeOne ? "walk_in" : rewardType

    // Normalize target URL — ensure it has a protocol so redirects go to the
    // vendor's external domain, not a relative path on trim.ph.
    let normalizedTargetUrl: string | null = null
    if (!isTakeOne && targetUrl) {
      const trimmed = targetUrl.trim()
      if (trimmed) {
        normalizedTargetUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      }
    }

    const campaign = await db.campaign.create({
      data: {
        vendorId: user.id,
        title: title.trim(),
        description: description.trim(),
        type: isTakeOne ? "take_one" : "digital",
        targetUrl: normalizedTargetUrl,
        rewardType: expectedRewardType,
        rewardAmount: Number(rewardAmount),
        maxUses: maxUses ? Number(maxUses) : null,
        city: city?.trim() || null,
        category: category?.trim() || null,
        isActive: true,
        isSeeded: false,
      },
    })

    // For take_one campaigns, generate TRIM codes
    if (isTakeOne) {
      const count = Math.min(Math.max(Number(takeOneCount) || 10, 1), 500)
      const codes: string[] = []
      const seen = new Set<string>()
      while (codes.length < count) {
        const code = genTrimCode(6)
        if (seen.has(code)) continue
        seen.add(code)
        codes.push(code)
      }
      await db.takeOneCode.createMany({
        data: codes.map((code) => ({ campaignId: campaign.id, code })),
      })
    }

    return NextResponse.json({ campaign })
  } catch (e: any) {
    console.error("create campaign error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

function genTrimCode(suffix = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = "TRIM-"
  for (let i = 0; i < suffix; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}
