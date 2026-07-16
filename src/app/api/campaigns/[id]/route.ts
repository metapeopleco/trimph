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

// PATCH — toggle active / update
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["vendor_digital", "vendor_traditional"])
  if (!user) return NextResponse.json({ error }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const campaign = await db.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (campaign.vendorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const data: any = {}
  if (typeof body.isActive === "boolean") data.isActive = body.isActive
  if (typeof body.title === "string") data.title = body.title.trim()
  if (typeof body.description === "string") data.description = body.description.trim()
  if (body.maxUses != null) data.maxUses = Number(body.maxUses)

  const updated = await db.campaign.update({ where: { id }, data })
  return NextResponse.json({ campaign: updated })
}

// DELETE — delete campaign
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(["vendor_digital", "vendor_traditional"])
  if (!user) return NextResponse.json({ error }, { status: 401 })

  const { id } = await params
  const campaign = await db.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (campaign.vendorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // delete related
  await db.conversion.deleteMany({ where: { campaignId: id } })
  await db.takeOneCode.deleteMany({ where: { campaignId: id } })
  await db.trackingLink.deleteMany({ where: { campaignId: id } })
  await db.chatRoom.deleteMany({ where: { campaignId: id } })
  await db.campaign.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
