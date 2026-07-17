import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST — register a verified human click
// body: { campaignId, affiliateId, slug, verified }
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

    // Resolve tracking link if slug provided — the slug is the source of truth
    // for the affiliate (it was created via the authenticated take-deal flow).
    let trackingLink = null
    if (slug) {
      trackingLink = await db.trackingLink.findUnique({ where: { uniqueSlug: slug } })
    }

    // Determine the REAL affiliate ID:
    // 1. If a tracking link exists (from slug), use its affiliateId (always valid).
    // 2. Else, validate the `aff` param against the User table — only count if it's a real affiliate.
    let realAffiliateId: string | null = null
    if (trackingLink) {
      realAffiliateId = trackingLink.affiliateId
    } else if (affiliateId) {
      const affUser = await db.user.findUnique({
        where: { id: affiliateId },
        select: { id: true, role: true },
      })
      if (affUser && affUser.role === "affiliate") {
        realAffiliateId = affUser.id
      }
    }

    // Get IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0"

    // Deduplication: don't count a click from the same IP for the same campaign
    // within the last 10 minutes (prevents back-button / refresh double counting).
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recent = await db.conversion.findFirst({
      where: {
        campaignId,
        visitorIp: ip,
        createdAt: { gte: tenMinAgo },
      },
      select: { id: true, affiliateId: true, capturedEmail: true, offlineCode: true },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      // Return the existing conversion instead of creating a duplicate
      return NextResponse.json({
        ok: true,
        conversionId: recent.id,
        deduplicated: true,
      })
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

    const conversion = await db.conversion.create({
      data: {
        campaignId,
        trackingLinkId: trackingLink?.id || null,
        affiliateId: realAffiliateId,
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
