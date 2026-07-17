import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser, requireRole } from "@/lib/session"

// GET — single campaign with details (vendor sees codes + conversions)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      vendor: { select: { name: true, email: true, isOnline: true } },
      takeOneCodes: { orderBy: { createdAt: "asc" } },
      conversions: {
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: { select: { id: true, name: true, email: true, city: true } },
        },
        take: 1000,
      },
      trackingLinks: {
        include: { affiliate: { select: { id: true, name: true, email: true, city: true } } },
      },
    },
  })

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only the vendor or an affiliate with a link can view full detail
  const isOwner = campaign.vendorId === user.id
  if (!isOwner && user.role === "affiliate") {
    // affiliates get a limited view
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        rewardType: campaign.rewardType,
        rewardAmount: campaign.rewardAmount,
        city: campaign.city,
        category: campaign.category,
        vendor: campaign.vendor,
        isSeeded: campaign.isSeeded,
      },
    })
  }
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json({ campaign })
}

// PATCH — disabled: campaigns are immutable once published.
// Vendors cannot edit or delete a campaign after it goes live, to protect
// affiliates who have already taken the deal and generated tracking links.
export async function PATCH() {
  return NextResponse.json(
    { error: "Campaigns cannot be edited once published. This protects affiliates who have already taken the deal." },
    { status: 403 }
  )
}

// DELETE — disabled: campaigns are immutable once published.
export async function DELETE() {
  return NextResponse.json(
    { error: "Campaigns cannot be deleted once published. This protects affiliates who have already taken the deal." },
    { status: 403 }
  )
}
