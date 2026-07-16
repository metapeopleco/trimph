import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

// GET — stats for the current user based on role
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (user.role === "vendor_digital" || user.role === "vendor_traditional") {
    // Vendor stats: across all their campaigns
    const campaigns = await db.campaign.findMany({
      where: { vendorId: user.id },
      select: { id: true, type: true, title: true, rewardType: true, rewardAmount: true, maxUses: true, isSeeded: true },
    })
    const campaignIds = campaigns.map((c) => c.id)

    const conversions = await db.conversion.findMany({
      where: { campaignId: { in: campaignIds } },
      select: { id: true, status: true, capturedEmail: true, offlineCode: true, campaignId: true, affiliateId: true, createdAt: true, redeemedAt: true, paidAt: true },
    })

    const totalClicks = conversions.filter((c) => !c.capturedEmail && !c.offlineCode).length
    const totalEmails = conversions.filter((c) => !!c.capturedEmail).length
    const totalWalkIns = conversions.filter((c) => !!c.offlineCode).length

    // estimated earnings owed (verified, not paid) — sum of rewardAmount per conversion
    const owedConversions = conversions.filter((c) => c.status === "verified")
    const paidConversions = conversions.filter((c) => c.status === "paid")

    const owedByCampaign = new Map<string, number>()
    for (const c of owedConversions) {
      const camp = campaigns.find((cm) => cm.id === c.campaignId)
      if (camp) owedByCampaign.set(camp.id, (owedByCampaign.get(camp.id) || 0) + camp.rewardAmount)
    }
    const totalOwed = Array.from(owedByCampaign.values()).reduce((a, b) => a + b, 0)

    // total paid — sum from payouts
    const payouts = await db.payout.findMany({
      where: { vendorId: user.id },
      select: { amount: true },
    })
    const totalPaid = payouts.reduce((a, b) => a + b.amount, 0)

    // leads by campaign
    const leads = await db.conversion.findMany({
      where: { campaignId: { in: campaignIds }, capturedEmail: { not: null } },
      select: { capturedEmail: true, campaignId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      role: user.role,
      campaigns,
      stats: {
        totalCampaigns: campaigns.length,
        totalClicks,
        totalEmails,
        totalWalkIns,
        totalConversions: conversions.length,
        totalOwed,
        totalPaid,
      },
      leads,
      conversions,
    })
  }

  // Affiliate stats
  const links = await db.trackingLink.findMany({
    where: { affiliateId: user.id },
    select: { id: true, campaignId: true, uniqueSlug: true, campaign: { select: { title: true, rewardAmount: true, rewardType: true, type: true, vendor: { select: { name: true } } } } },
  })
  const linkIds = links.map((l) => l.id)
  const campaignIds = Array.from(new Set(links.map((l) => l.campaignId)))

  const conversions = await db.conversion.findMany({
    where: { affiliateId: user.id },
    select: { id: true, status: true, capturedEmail: true, offlineCode: true, campaignId: true, createdAt: true, paidAt: true },
  })

  const totalClicks = conversions.filter((c) => !c.capturedEmail && !c.offlineCode).length
  const totalEmails = conversions.filter((c) => !!c.capturedEmail).length
  const totalWalkIns = conversions.filter((c) => !!c.offlineCode).length

  // estimated earnings
  const owedByCampaign = new Map<string, number>()
  for (const c of conversions.filter((c) => c.status === "verified")) {
    const link = links.find((l) => l.campaignId === c.campaignId)
    if (link) owedByCampaign.set(c.campaignId, (owedByCampaign.get(c.campaignId) || 0) + link.campaign.rewardAmount)
  }
  const totalOwed = Array.from(owedByCampaign.values()).reduce((a, b) => a + b, 0)

  const payouts = await db.payout.findMany({
    where: { affiliateId: user.id },
    select: { amount: true },
  })
  const totalPaid = payouts.reduce((a, b) => a + b.amount, 0)

  return NextResponse.json({
    role: user.role,
    links,
    stats: {
      totalLinks: links.length,
      totalClicks,
      totalEmails,
      totalWalkIns,
      totalConversions: conversions.length,
      totalOwed,
      totalPaid,
    },
    conversions,
  })
}
