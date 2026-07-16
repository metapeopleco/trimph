import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST — capture an email lead before/after redirection
// body: { conversionId?, campaignId, affiliateId?, slug?, email }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversionId, campaignId, affiliateId, slug, email } = body

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 })
    }
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required." }, { status: 400 })
    }

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    // Resolve the real affiliate ID via tracking link slug (source of truth),
    // or validate the affiliateId param against the User table.
    let realAffiliateId: string | null = null
    let trackingLinkId: string | null = null
    if (slug) {
      const tl = await db.trackingLink.findUnique({ where: { uniqueSlug: slug } })
      if (tl) {
        realAffiliateId = tl.affiliateId
        trackingLinkId = tl.id
      }
    } else if (affiliateId) {
      const affUser = await db.user.findUnique({
        where: { id: affiliateId },
        select: { id: true, role: true },
      })
      if (affUser && affUser.role === "affiliate") {
        realAffiliateId = affUser.id
      }
    }

    // Enforce maxUses
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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0"

    if (conversionId) {
      // update existing click conversion with the email
      const updated = await db.conversion.update({
        where: { id: conversionId },
        data: { capturedEmail: email.toLowerCase() },
      })
      return NextResponse.json({ ok: true, conversionId: updated.id })
    }

    // Deduplication: don't create a new email lead from the same IP+campaign within 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recent = await db.conversion.findFirst({
      where: {
        campaignId,
        visitorIp: ip,
        createdAt: { gte: tenMinAgo },
      },
      select: { id: true },
    })
    if (recent) {
      // Update the existing one with the email instead of creating a duplicate
      const updated = await db.conversion.update({
        where: { id: recent.id },
        data: { capturedEmail: email.toLowerCase() },
      })
      return NextResponse.json({ ok: true, conversionId: updated.id, deduplicated: true })
    }

    const conversion = await db.conversion.create({
      data: {
        campaignId,
        trackingLinkId,
        affiliateId: realAffiliateId,
        visitorIp: ip,
        capturedEmail: email.toLowerCase(),
        status: "verified",
      },
    })
    return NextResponse.json({ ok: true, conversionId: conversion.id })
  } catch (e: any) {
    console.error("lead capture error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
