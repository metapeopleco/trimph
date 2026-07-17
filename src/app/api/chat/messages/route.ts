import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

// GET — list messages for a room
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get("roomId")
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 })

  // ensure membership
  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId: user.id } },
  })
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const messages = await db.chatMessage.findMany({
    where: { roomId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 500,
  })

  return NextResponse.json({ messages })
}

// POST — create a message (also broadcast via socket.io, but persisted here for history)
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { roomId, content } = await req.json()
  if (!roomId || !content?.trim()) {
    return NextResponse.json({ error: "roomId and content required" }, { status: 400 })
  }

  const member = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId: user.id } },
  })
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const message = await db.chatMessage.create({
    data: { roomId, userId: user.id, content: content.trim().slice(0, 2000) },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })

  return NextResponse.json({ message })
}
