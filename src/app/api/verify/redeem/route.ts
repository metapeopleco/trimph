import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"

// POST — vendor verifies & redeems an offline TRIM code
// body: { code }
export async function POST(req: Request) {
  const { user, error } = await requireRole(["vendor_traditional", "vendor_digital"])
  if (!user) return NextResponse.json({ error }, { status: 401 })

  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: "Code required." }, { status: 400 })

    const normalized = code.trim().toUpperCase()
    if (!normalized.startsWith("TRIM")) {
      return NextResponse.json(
        { error: "Invalid code. All codes must start with TRIM." },
        { status: 400 }
      )
    }

    const takeOne = await db.takeOneCode.findUnique({
      where: { code: normalized },
      include: {
        campaign: true,
      },
    })

    if (!takeOne) {
      return NextResponse.json({ error: "Code not found." }, { status: 404 })
    }

    // Only the campaign's vendor can redeem
    if (takeOne.campaign.vendorId !== user.id) {
      return NextResponse.json(
        { error: "This code belongs to a different vendor." },
        { status: 403 }
      )
    }

    if (takeOne.isRedeemed) {
      return NextResponse.json(
        { error: "This code has already been redeemed.", alreadyRedeemed: true },
        { status: 409 }
      )
    }

    // Enforce campaign maxUses
    if (takeOne.campaign.maxUses != null) {
      const used = await db.conversion.count({
        where: { campaignId: takeOne.campaignId, status: { in: ["verified", "paid"] } },
      })
      if (used >= takeOne.campaign.maxUses) {
        return NextResponse.json(
          { error: "This campaign has reached its maximum redemptions.", exhausted: true },
          { status: 410 }
        )
      }
    }

    // Mark code redeemed
    await db.takeOneCode.update({
      where: { id: takeOne.id },
      data: { isRedeemed: true, redeemedAt: new Date() },
    })

    // Find the affiliate associated with this code's campaign tracking link
    // (Take-one codes are distributed via tracking links; we credit the affiliate who owns the link)
    const trackingLink = await db.trackingLink.findFirst({
      where: { campaignId: takeOne.campaignId },
    })

    // Create a verified walk-in conversion
    const conversion = await db.conversion.create({
      data: {
        campaignId: takeOne.campaignId,
        trackingLinkId: trackingLink?.id || null,
        affiliateId: trackingLink?.affiliateId || null,
        offlineCode: normalized,
        status: "verified",
        redeemedAt: new Date(),
      },
    })

    return NextResponse.json({
      ok: true,
      conversion,
      campaign: { id: takeOne.campaign.id, title: takeOne.campaign.title },
      reward: takeOne.campaign.rewardAmount,
    })
  } catch (e: any) {
    console.error("redeem error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
