import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST — register a verified human click
// body: { campaignId, affiliateId, slug, ip, verified }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { campaignId, affiliateId, slug, verified } = body

    if (!campaignId || !verified) {
      return NextResponse.json({ error: "Not verified" }, { status: 400 })
    }

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign || !campaign.isActive) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Resolve tracking link if slug provided
    let trackingLink = null
    if (slug) {
      trackingLink = await db.trackingLink.findUnique({ where: { uniqueSlug: slug } })
    }

    // Enforce maxUses on click-type conversions if set
    if (campaign.maxUses != null) {
      const used = await db.conversion.count({
        where: { campaignId, status: { in: ["verified", "paid"] } },
      })
      if (used >= campaign.maxUses) {
        return NextResponse.json(
          { error: "This campaign has reached its maximum redemptions.", exhausted: true },
          { status: 410 }
        )
      }
    }

    // Get IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0"

    const conversion = await db.conversion.create({
      data: {
        campaignId,
        trackingLinkId: trackingLink?.id || null,
        affiliateId: affiliateId || trackingLink?.affiliateId || null,
        visitorIp: ip,
        status: "verified",
      },
    })

    return NextResponse.json({ ok: true, conversionId: conversion.id })
  } catch (e: any) {
    console.error("click error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
