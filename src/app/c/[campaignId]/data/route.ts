import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Resolve campaign + affiliate slug for the tracking interstitial page
export async function GET(req: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params
  const { searchParams } = new URL(req.url)
  const aff = searchParams.get("aff")
  const s = searchParams.get("s")

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      targetUrl: true,
      rewardType: true,
      rewardAmount: true,
      maxUses: true,
      isActive: true,
      isSeeded: true,
      vendor: { select: { name: true } },
    },
  })

  if (!campaign || !campaign.isActive) {
    return NextResponse.json({ error: "Campaign not found or inactive." }, { status: 404 })
  }

  // For take_one campaigns, assign an unredeemed code to show this visitor.
  let takeOneCode: string | null = null
  if (campaign.type === "take_one") {
    const codes = await db.takeOneCode.findMany({
      where: { campaignId, isRedeemed: false },
      take: 1,
    })
    takeOneCode = codes[0]?.code || null
  }

  return NextResponse.json({
    campaign,
    affiliateId: aff,
    slug: s,
    takeOneCode,
  })
}
