import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser, requireRole } from "@/lib/session"

// GET — list payouts for the current user (as vendor or affiliate)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const where =
    user.role === "affiliate"
      ? { affiliateId: user.id }
      : { vendorId: user.id }

  const payouts = await db.payout.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true, email: true } },
      affiliate: { select: { name: true, email: true, city: true } },
    },
    take: 500,
  })

  return NextResponse.json({ payouts })
}

// POST — vendor logs a payout (marks conversions as paid)
// body: { affiliateId, campaignId?, conversionIds: [], amount, note? }
export async function POST(req: Request) {
  const { user, error } = await requireRole(["vendor_digital", "vendor_traditional"])
  if (!user) return NextResponse.json({ error }, { status: 401 })

  try {
    const body = await req.json()
    const { affiliateId, campaignId, conversionIds, amount, note } = body
    if (!affiliateId || !amount || !Array.isArray(conversionIds)) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    const payout = await db.payout.create({
      data: {
        vendorId: user.id,
        affiliateId,
        campaignId: campaignId || null,
        amount: Number(amount),
        conversionIds: JSON.stringify(conversionIds),
        note: note?.trim() || null,
      },
    })

    // mark conversions as paid
    await db.conversion.updateMany({
      where: { id: { in: conversionIds } },
      data: { status: "paid", paidAt: new Date() },
    })

    return NextResponse.json({ payout })
  } catch (e: any) {
    console.error("payout error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
