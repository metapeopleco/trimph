import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser, requireRole, genSlug } from "@/lib/session"

// POST — affiliate takes a deal, generating a tracking link
export async function POST(req: Request) {
  const { user, error } = await requireRole("affiliate")
  if (!user) return NextResponse.json({ error }, { status: 401 })

  try {
    const { campaignId } = await req.json()
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 })

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign || !campaign.isActive) {
      return NextResponse.json({ error: "Campaign not available." }, { status: 404 })
    }

    // If seeded campaign, we still create the link but the client shows a toast.
    // Check if affiliate already has a link for this campaign
    let link = await db.trackingLink.findFirst({
      where: { campaignId, affiliateId: user.id },
    })
    if (!link) {
      let slug = genSlug(8)
      // ensure uniqueness
      while (await db.trackingLink.findUnique({ where: { uniqueSlug: slug } })) {
        slug = genSlug(8)
      }
      link = await db.trackingLink.create({
        data: { campaignId, affiliateId: user.id, uniqueSlug: slug },
      })
    }

    // Ensure a group chat room exists for this campaign
    let room = await db.chatRoom.findFirst({ where: { campaignId } })
    if (!room) {
      room = await db.chatRoom.create({
        data: {
          campaignId,
          name: `${campaign.title} — Discussion`,
        },
      })
    }
    // add affiliate as member if not already
    const member = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
    })
    if (!member) {
      await db.chatRoomMember.create({ data: { roomId: room.id, userId: user.id } })
    }

    // Relative tracking URL — the frontend prepends the origin at display time.
    // This keeps the stored/served URL portable across domains.
    const trackUrl = `/c/${campaign.id}?aff=${user.id}&s=${link.uniqueSlug}`

    return NextResponse.json({
      link,
      campaign: { id: campaign.id, title: campaign.title, isSeeded: campaign.isSeeded },
      trackUrl,
      roomId: room.id,
    })
  } catch (e: any) {
    console.error("create link error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

// GET — list affiliate's tracking links
export async function GET() {
  const { user, error } = await requireRole("affiliate")
  if (!user) return NextResponse.json({ error }, { status: 401 })

  const links = await db.trackingLink.findMany({
    where: { affiliateId: user.id },
    include: {
      campaign: {
        include: { vendor: { select: { name: true, email: true, isOnline: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const withUrls = links.map((l) => ({
    ...l,
    trackUrl: `/c/${l.campaignId}?aff=${user.id}&s=${l.uniqueSlug}`,
  }))

  return NextResponse.json({ links: withUrls })
}
