import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

// GET — list chat rooms the current user is a member of
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const members = await db.chatRoomMember.findMany({
    where: { userId: user.id },
    include: {
      room: {
        include: {
          campaign: { select: { id: true, title: true, vendorId: true, vendor: { select: { name: true, email: true, isOnline: true } } } },
          members: { include: { user: { select: { id: true, name: true, email: true, role: true, isOnline: true } } } },
          _count: { select: { messages: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const rooms = members.map((m) => m.room)
  return NextResponse.json({ rooms })
}

// POST — join a room (by campaignId) or create one
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { campaignId } = await req.json()
  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 })

  let room = await db.chatRoom.findFirst({ where: { campaignId } })
  if (!room) {
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
    room = await db.chatRoom.create({
      data: { campaignId, name: `${campaign?.title ?? "Campaign"} — Discussion` },
    })
  }

  // ensure membership
  const existing = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: user.id } },
  })
  if (!existing) {
    await db.chatRoomMember.create({ data: { roomId: room.id, userId: user.id } })
  }

  // ensure vendor is also a member
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
  if (campaign) {
    const vMember = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: campaign.vendorId } },
    })
    if (!vMember) {
      await db.chatRoomMember.create({ data: { roomId: room.id, userId: campaign.vendorId } })
    }
  }

  return NextResponse.json({ room })
}
