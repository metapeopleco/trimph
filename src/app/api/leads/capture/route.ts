import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST — capture an email lead before/after redirection
// body: { conversionId?, campaignId, affiliateId?, email }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversionId, campaignId, affiliateId, email } = body

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 })
    }
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required." }, { status: 400 })
    }

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

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

    const conversion = await db.conversion.create({
      data: {
        campaignId,
        affiliateId: affiliateId || null,
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
